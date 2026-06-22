#!/usr/bin/env node
// Stop hook: when the turn touched Python, TS/JS, or Lua files, run typecheck + tests
// once before Claude finishes. Exit 0 = pass or nothing to do. Exit 2 = failures;
// Claude keeps working and sees stderr.
//
// Escape hatches:
//   - stop_hook_active guard prevents infinite loops (required; do not remove)
//   - CLAUDE_SKIP_STOP_TESTS=1 disables this hook entirely
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

// Loop guard: if we're already continuing because this hook blocked once, let Claude stop.
if (payload?.stop_hook_active === true) process.exit(0);
if (process.env.CLAUDE_SKIP_STOP_TESTS === "1") process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const isWin = process.platform === "win32";
const run = (cmd) => spawnSync(cmd, { shell: true, encoding: "utf8", cwd: root });
const has = (bin) => run(isWin ? `where ${bin}` : `command -v ${bin}`).status === 0;
const exists = (rel) => existsSync(join(root, rel));
const isDir = (rel) => {
  try {
    return statSync(join(root, rel)).isDirectory();
  } catch {
    return false;
  }
};
const dirHas = (re) => {
  try {
    return readdirSync(root).some((f) => re.test(f));
  } catch {
    return false;
  }
};

if (run("git rev-parse --is-inside-work-tree").status !== 0) process.exit(0);

const changed = [
  ...new Set(
    [
      ...(run("git diff --name-only HEAD --").stdout || "").split(/\r?\n/),
      ...(run("git ls-files --others --exclude-standard").stdout || "").split(/\r?\n/),
    ]
      .map((s) => s.trim())
      .filter(Boolean),
  ),
];
if (!changed.length) process.exit(0);

const py = changed.filter((f) => /\.py$/.test(f));
const ts = changed.filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f));
const lua = changed.filter((f) => /\.lua$/.test(f));
if (!py.length && !ts.length && !lua.length) process.exit(0);

const TAIL_LINES = 60;
let fail = "";
const note = (label, r) => {
  const out = (r.stdout || "") + (r.stderr || "");
  const tail = out.split(/\r?\n/).slice(-TAIL_LINES).join("\n");
  fail += `── ${label} ──\n${tail}\n`;
};

// ── Python: pytest ─────────────────────────────────────────────────────────────
if (py.length && exists("pyproject.toml")) {
  let pytest = "";
  if (has("uv") && run("uv run --no-sync pytest --version").status === 0)
    pytest = "uv run --no-sync pytest";
  else if (has("pytest")) pytest = "pytest";
  if (pytest) {
    const r = run(`${pytest} -q -x`);
    if (r.status !== 0) note("pytest", r);
  }
}

// ── TypeScript/JavaScript: tsc --noEmit, then vitest ──────────────────────────
if (ts.length && exists("package.json")) {
  let runner = "";
  if (exists("pnpm-lock.yaml") && has("pnpm")) runner = "pnpm exec";
  else if (has("npx")) runner = "npx --no-install";
  if (runner) {
    if (dirHas(/^tsconfig.*\.json$/)) {
      const r = run(`${runner} tsc --noEmit`);
      if (r.status !== 0) note("tsc --noEmit", r);
    }
    const pkgRaw = (() => {
      try {
        return readFileSync(join(root, "package.json"), "utf8");
      } catch {
        return "";
      }
    })();
    let pkg = {};
    try {
      pkg = JSON.parse(pkgRaw || "{}");
    } catch {
      /* ignore */
    }
    if (dirHas(/^vitest\.config\./) || /"vitest"/.test(pkgRaw)) {
      const r = run(`${runner} vitest run --reporter=dot`);
      if (r.status !== 0) note("vitest", r);
    } else {
      const testScript = pkg?.scripts?.test;
      if (testScript && !/no test specified/.test(testScript)) {
        const r = run("npm test --silent");
        if (r.status !== 0) note("npm test", r);
      }
    }
  }
}

// ── Lua: busted ────────────────────────────────────────────────────────────────
if (lua.length && has("busted")) {
  if (exists(".busted") || dirHas(/\.rockspec$/) || isDir("spec")) {
    const r = run("busted -o plainTerminal");
    if (r.status !== 0) note("busted", r);
  }
}

if (fail) {
  process.stderr.write(`Typecheck/tests failed for code changed this session. Fix before finishing:\n${fail}`);
  process.exit(2);
}
process.exit(0);
