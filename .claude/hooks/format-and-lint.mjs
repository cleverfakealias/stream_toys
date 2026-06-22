#!/usr/bin/env node
// PostToolUse hook (Write|Edit): auto-format + lint the file Claude just touched.
// Exit 0 = clean (silent). Exit 2 = remaining problems; stderr is fed back to Claude.
//
// Python:     ruff format + ruff check --fix   (via uv when the project uses it)
// TS/JS/etc.: biome check --write              (eslint fallback if no biome config)
// Lua:        stylua, then selene or luacheck  (no Lua linter has autofix)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { spawnSync } from "node:child_process";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const filePath = String(payload?.tool_input?.file_path ?? "");
if (!filePath) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const abs = isAbsolute(filePath) ? filePath : join(root, filePath);
if (!existsSync(abs)) process.exit(0);

const isWin = process.platform === "win32";
// Quote a dynamic path for the platform shell (handles spaces; no metachar injection).
const q = (s) =>
  isWin ? `"${String(s).replace(/"/g, '""')}"` : `'${String(s).replace(/'/g, `'\\''`)}'`;
const run = (cmd) => spawnSync(cmd, { shell: true, encoding: "utf8", cwd: root });
const has = (bin) => run(isWin ? `where ${bin}` : `command -v ${bin}`).status === 0;
const exists = (rel) => existsSync(join(root, rel));
const dirHas = (re) => {
  try {
    return readdirSync(root).some((f) => re.test(f));
  } catch {
    return false;
  }
};

let errors = "";
const note = (label, r) => {
  errors += `── ${label} ──\n${(r.stdout || "") + (r.stderr || "")}\n`;
};

const ext = (abs.split(".").pop() || "").toLowerCase();
const file = q(abs);

if (ext === "py") {
  let ruff = "";
  if (
    (exists("pyproject.toml") || exists("uv.lock")) &&
    has("uv") &&
    run("uv run --no-sync ruff --version").status === 0
  ) {
    ruff = "uv run --no-sync ruff";
  } else if (has("ruff")) {
    ruff = "ruff";
  }
  if (ruff) {
    run(`${ruff} format --quiet ${file}`);
    const r = run(`${ruff} check --fix --output-format=concise ${file}`);
    if (r.status !== 0) note("ruff check (after autofix)", r);
  }
} else if (["ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "jsonc", "css"].includes(ext)) {
  let biome = "";
  if (exists("biome.json") || exists("biome.jsonc")) {
    if (exists("pnpm-lock.yaml") && has("pnpm")) biome = "pnpm exec biome";
    else if (has("npx") && run("npx --no-install biome --version").status === 0)
      biome = "npx --no-install biome";
    else if (has("biome")) biome = "biome";
  }
  if (biome) {
    const r = run(`${biome} check --write --reporter=summary ${file}`);
    if (r.status !== 0) note("biome check (after autofix)", r);
  } else if (
    ["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext) &&
    dirHas(/^(eslint\.config\.|\.eslintrc)/)
  ) {
    let eslint = "";
    if (exists("pnpm-lock.yaml") && has("pnpm")) eslint = "pnpm exec eslint";
    else if (has("npx")) eslint = "npx --no-install eslint";
    if (eslint) {
      const r = run(`${eslint} --fix ${file}`);
      if (r.status !== 0) note("eslint (after autofix)", r);
    }
  }
} else if (ext === "lua") {
  if (has("stylua")) run(`stylua ${file}`);
  if (exists("selene.toml") && has("selene")) {
    const r = run(`selene -q ${file}`);
    if (r.status !== 0) note("selene", r);
  } else if (has("luacheck")) {
    const r = run(`luacheck --formatter plain ${file}`);
    if (r.status !== 0) note("luacheck", r);
  }
}

if (errors) {
  process.stderr.write(`Auto-fix left unresolved issues in ${abs} — fix them:\n${errors}`);
  process.exit(2);
}
process.exit(0);
