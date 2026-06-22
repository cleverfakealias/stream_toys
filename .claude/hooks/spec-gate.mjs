#!/usr/bin/env node
// UserPromptSubmit hook (Zenn mode): when a prompt looks like implementation work
// and no active spec exists, inject a firm "spec-first" nudge as context. It NEVER
// hard-blocks (never exits 2) — questions, short prompts, opt-out phrases, and
// existing specs all pass through silently. Disable with CLAUDE_SKIP_SPEC_GATE=1.
//
// Contract: for UserPromptSubmit, stdout on exit 0 is added to the conversation as
// context Claude can see. Exit 2 would erase the prompt; we deliberately avoid that.
// https://code.claude.com/docs/en/hooks
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

if (process.env.CLAUDE_SKIP_SPEC_GATE === "1") process.exit(0);

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0); // malformed input: fail open, never block the user
}

const prompt = String(payload?.prompt ?? "").trim();
const cwd = String(payload?.cwd ?? process.cwd());
if (!prompt) process.exit(0);

const lower = prompt.toLowerCase();

// Explicit escape hatches — the user is opting out of ceremony.
const OPT_OUT = ["no spec", "skip spec", "without a spec", "quick fix", "just answer", "no plan"];
if (OPT_OUT.some((p) => lower.includes(p))) process.exit(0);

// The prompt is itself spec/planning work — don't gate it.
const ALREADY_PLANNING = [
  "write a spec",
  "write the spec",
  "draft a spec",
  "specification",
  "let's plan",
  "lets plan",
  "test scenario",
  "test plan",
  "acceptance criteria",
  "/spec",
  "/zenn",
];
if (ALREADY_PLANNING.some((p) => lower.includes(p))) process.exit(0);

// Verbs / phrases that signal "we're about to change the codebase."
const IMPL_SIGNALS = [
  /\b(build|implement|create|add|write|code|develop|scaffold)\b/,
  /\b(fix|patch|debug|resolve|repair)\b/,
  /\b(refactor|rewrite|restructure|migrate|port)\b/,
  /\b(add (a|an|the) (feature|endpoint|route|component|function|class|module))\b/,
  /\b(set up|wire up|integrate|connect)\b/,
];
// Signals that this is a question / read-only / exploration.
const READONLY_SIGNALS = [
  /^\s*(what|why|how|when|where|who|which|is|are|can|could|should|does|do|explain|describe|summarize|review|read|show|list|find|search|tell me)\b/,
  /\?\s*$/,
];

const looksImpl = IMPL_SIGNALS.some((re) => re.test(lower));
const looksReadonly = READONLY_SIGNALS.some((re) => re.test(lower));
const wordCount = lower.split(/\s+/).filter(Boolean).length;
if (!looksImpl || looksReadonly || wordCount < 4) process.exit(0);

// Look for an active spec near cwd. Any markdown under specs/ or spec/ counts; in
// other locations the filename must look spec-like.
const SPEC_DIRS = ["specs", "spec", "docs/specs", ".claude/specs"];
const SPEC_HINT = /(spec|specification|design|rfc|adr)/i;
function hasActiveSpec(root) {
  for (const dir of SPEC_DIRS) {
    const full = join(root, dir);
    if (!existsSync(full)) continue;
    try {
      for (const e of readdirSync(full)) {
        if (e.endsWith(".md") && (dir === "specs" || dir === "spec" || SPEC_HINT.test(e))) return true;
      }
    } catch {
      /* ignore unreadable dirs */
    }
  }
  for (const f of ["SPEC.md", "CURRENT_SPEC.md", "spec.md"]) {
    if (existsSync(join(root, f))) return true;
  }
  return false;
}
if (hasActiveSpec(cwd)) process.exit(0);

// Phrased as factual project context (not an out-of-band command) so it reads as
// information rather than tripping prompt-injection defenses.
process.stdout.write(
  `[Zenn mode gate]
This repo uses Zenn mode — intent-driven development. The request looks like implementation work, and no active spec was found under specs/, spec/, docs/specs/, or a root SPEC.md.

Before writing or modifying code, the expected workflow is:
1. Elicit intent — ask the clarifying questions that genuinely reduce ambiguity (scope, inputs/outputs, edge cases, constraints, non-goals).
2. Capture intent and expand it into a blueprint. Use a single specs/<slug>.md for small work, or the four-file set (requirements.md, plan.md, tasks.md, status.md) under specs/<slug>/ for big work.
3. Derive an ordered task checklist and a test strategy.
4. Get explicit approval, then execute against the tasks, updating status and verifying against acceptance criteria.

If the user signalled a deliberate quick fix or exploration, proceed normally. Otherwise begin with step 1. The zenn-mode skill describes the full methodology; /zenn invokes it explicitly.
`,
);
process.exit(0);
