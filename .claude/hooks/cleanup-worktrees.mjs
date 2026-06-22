#!/usr/bin/env node
// SessionStart + Stop hook: keep git worktrees from piling up — without losing work.
//
// Policy: a worktree under the managed dir is transient scratch. When we're done,
// its work belongs on a *branch* so it can be resumed later, and the worktree
// itself should go away. So for each managed worktree this hook:
//   1. If it has uncommitted/untracked changes, commits them onto its branch as a
//      WIP commit. Secret files (.env, keys, .npmrc, …) are never committed, even
//      if the branch lacks a .gitignore for them. A detached worktree first gets a
//      rescue branch so the commit has a home.
//   2. Removes the worktree. The branch persists in the main repo for later:
//        git worktree add .claude/worktrees/<name> <branch>
//      (and `git reset --soft HEAD~1` there if you want to un-WIP the commit).
//   3. Prunes stale registrations and deletes empty leftover dirs.
//
// It is housekeeping: it always exits 0 and never blocks the session.
//
// Escape hatches (env vars):
//   - CLAUDE_SKIP_WORKTREE_CLEANUP=1   disable this hook entirely
//   - CLAUDE_WORKTREE_NO_AUTOCOMMIT=1  don't commit; keep dirty worktrees and just
//                                      report them (old conservative behavior).
//                                      Clean worktrees already on a branch are still removed.
//   - CLAUDE_WORKTREE_DIR=<relpath>    override the managed dir (default .claude/worktrees)
import { existsSync, readdirSync, rmdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

if (process.env.CLAUDE_SKIP_WORKTREE_CLEANUP === "1") process.exit(0);
const AUTOCOMMIT = process.env.CLAUDE_WORKTREE_NO_AUTOCOMMIT !== "1";

const isWin = process.platform === "win32";
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd) => spawnSync(cmd, { shell: true, encoding: "utf8", cwd: root });
const q = (s) =>
  isWin ? `"${String(s).replace(/"/g, '""')}"` : `'${String(s).replace(/'/g, `'\\''`)}'`;
const norm = (s) => String(s).replace(/\\/g, "/");

// Files we must never auto-commit, mirroring the repo's secret-deny policy.
const SECRET_RE =
  /(^|\/)(\.env(\..*)?|\.envrc|\.dev\.vars.*|\.npmrc|\.pypirc|id_rsa.*|id_ed25519.*|[^/]*\.pem|[^/]*\.key)$/i;
const pathOf = (porcelainLine) => porcelainLine.slice(3).replace(/^.*? -> /, "").trim();

if (run(isWin ? "where git" : "command -v git").status !== 0) process.exit(0);
if (run("git rev-parse --is-inside-work-tree").status !== 0) process.exit(0);

const mainRoot = norm(run("git rev-parse --show-toplevel").stdout?.trim() || "");
if (!mainRoot) process.exit(0);

const managedRel = process.env.CLAUDE_WORKTREE_DIR || ".claude/worktrees";
const managedAbs = norm(join(mainRoot, managedRel));

// Commit identity: only inject a fallback when the user hasn't configured one.
const haveEmail = (run("git config user.email").stdout || "").trim().length > 0;
const ident = haveEmail
  ? ""
  : ` -c ${q("user.name=claude-cleanup")} -c ${q("user.email=claude-cleanup@local")}`;

// -- 1. drop stale administrative entries (dirs already gone) ------------------
run("git worktree prune");

// -- 2. walk live worktrees; only touch ones under the managed dir -------------
const preserved = []; // { name, branch } — work committed to a branch, worktree removed
const removed = []; // clean worktrees removed (nothing new to preserve)
const kept = []; // left in place (autocommit disabled, or removal blocked)
let report = "";
let wt = { path: "", head: "", branch: "" };

const shortRef = (ref) => String(ref).replace(/^refs\/heads\//, "");
const porcelain = (p) =>
  (run(`git -C ${q(p)} status --porcelain`).stdout || "").split(/\r?\n/).filter(Boolean);

const flush = () => {
  const wtPath = wt.path;
  if (!wtPath) return;
  const wtNorm = norm(wtPath);
  if (!`${wtNorm}/`.startsWith(`${managedAbs}/`)) return; // managed dir only
  if (wtNorm === mainRoot) return;
  if (!existsSync(wtPath)) return;

  const name = basename(wtNorm);
  let branch = wt.branch ? shortRef(wt.branch) : "";
  let committed = false;
  let secretLeftover = false;

  let lines = porcelain(wtPath);

  if (lines.length > 0) {
    if (!AUTOCOMMIT) {
      kept.push(wtPath);
      report += `  kept ${name} — ${lines.length} uncommitted/untracked (autocommit disabled)\n`;
      return;
    }
    if (!branch) {
      const sha = (run(`git -C ${q(wtPath)} rev-parse --short HEAD`).stdout || "").trim();
      const rescue = `claude/wip-${name}-${sha || Date.now().toString(36)}`;
      if (run(`git -C ${q(wtPath)} switch -c ${q(rescue)}`).status === 0) branch = rescue;
    }
    run(`git -C ${q(wtPath)} add -A`);
    // Unstage any secret files that slipped in (branch may lack a .gitignore).
    const staged = (run(`git -C ${q(wtPath)} diff --cached --name-only`).stdout || "")
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((p) => SECRET_RE.test(p));
    if (staged.length) run(`git -C ${q(wtPath)} reset -q -- ${staged.map(q).join(" ")}`);

    const msg = `chore(wip): auto-preserve worktree ${name} on session end [skip ci]`;
    committed = run(`git${ident} -C ${q(wtPath)} commit --no-verify -m ${q(msg)}`).status === 0;

    // What still remains? Anything non-secret means real uncommitted work — keep it.
    lines = porcelain(wtPath);
    const nonSecret = lines.filter((l) => !SECRET_RE.test(pathOf(l)));
    if (nonSecret.length > 0) {
      kept.push(wtPath);
      report += `  kept ${name} — ${nonSecret.length} change(s) could not be committed\n`;
      return;
    }
    secretLeftover = lines.length > 0; // only secrets/ignored remain (will be discarded)
  }

  // Tree has no real work left. Confirm the HEAD is preserved on a branch.
  if (!branch) {
    const reachable = (
      (run(`git branch --format=%(refname) --contains ${wt.head}`).stdout || "") +
      (run(`git branch -r --contains ${wt.head}`).stdout || "")
    )
      .split(/\r?\n/)
      .filter(Boolean).length;
    if (reachable === 0) {
      kept.push(wtPath);
      report += `  kept ${name} — detached HEAD not on any branch\n`;
      return;
    }
  }

  const force = secretLeftover ? "--force " : "";
  if (run(`git worktree remove ${force}${q(wtPath)}`).status === 0) {
    if (committed && branch) preserved.push({ name, branch });
    else removed.push(name);
  } else {
    kept.push(wtPath);
    report += `  kept ${name} — could not remove worktree\n`;
  }
};

for (const line of (run("git worktree list --porcelain").stdout || "").split(/\r?\n/)) {
  if (line.startsWith("worktree ")) {
    flush();
    wt = { path: line.slice("worktree ".length), head: "", branch: "" };
  } else if (line.startsWith("HEAD ")) {
    wt.head = line.slice("HEAD ".length);
  } else if (line.startsWith("branch ")) {
    wt.branch = line.slice("branch ".length);
  } else if (line === "") {
    flush();
    wt = { path: "", head: "", branch: "" };
  }
}
flush();

// -- 3. prune again (for removals above) + delete empty orphan dirs ------------
run("git worktree prune");
if (existsSync(managedAbs)) {
  try {
    for (const entry of readdirSync(managedAbs)) {
      const p = join(managedAbs, entry);
      try {
        if (statSync(p).isDirectory() && readdirSync(p).length === 0) rmdirSync(p);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

// -- 4. report to the transcript (informational; never blocks) -----------------
if (preserved.length || removed.length || report) {
  let msg = "";
  if (preserved.length) {
    msg += `worktree cleanup: preserved ${preserved.length} worktree(s) to their branch and removed them:\n`;
    for (const { name, branch } of preserved)
      msg += `  ${name} → ${branch}  (resume: git worktree add ${managedRel}/${name} ${branch})\n`;
  }
  if (removed.length)
    msg += `worktree cleanup: removed ${removed.length} clean worktree(s): ${removed.join(", ")}\n`;
  if (report) msg += `worktree cleanup: kept ${kept.length} needing manual attention:\n${report}`;
  process.stderr.write(msg);
}
process.exit(0);
