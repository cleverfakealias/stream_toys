#!/usr/bin/env node
// PreToolUse hook (Write|Edit): blocks the agent from writing to secret/credential
// files and from modifying its own policy files (settings, hooks, MCP config, git
// internals). Mirrors the permission deny rules because hook enforcement is the
// reliable layer.
// Exit 0 = allow. Exit 2 = block; stderr explains why to Claude.
import { readFileSync } from "node:fs";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0); // fail open: never block the user on a parse error
}

// Normalize backslashes so the patterns match identically on Windows paths.
const filePath = String(payload?.tool_input?.file_path ?? "").replace(/\\/g, "/");
if (!filePath) process.exit(0);

// Templates with placeholder values are fine.
if (/\.env\.(example|template|sample)$/.test(filePath)) process.exit(0);

const blocked = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\./,
  /(^|\/)\.envrc$/,
  /(^|\/)\.dev\.vars/,
  /(^|\/)secrets?\./,
  /\.pem$/,
  /\.key$/,
  /\.p12$/,
  /\.pfx$/,
  /(^|\/)id_(rsa|ed25519)/,
  /(^|\/)\.npmrc$/,
  /(^|\/)\.pypirc$/,
  /(^|\/)\.terraformrc$/,
  /(^|\/)\.netrc$/,
  /gha-creds-.*\.json$/,
  /(^|\/)\.claude\/settings(\.local)?\.json$/,
  /(^|\/)\.claude\/hooks\//,
  /(^|\/)\.mcp\.json$/,
  /(^|\/)\.git\//,
];

for (const re of blocked) {
  if (re.test(filePath)) {
    process.stderr.write(
      `blocked: writes to secret/credential files are not permitted (hook: block-secret-writes.mjs).\n` +
        `file: ${filePath}  (matched: ${re.source})\n` +
        `If a template is needed, write .env.example with placeholder values instead.\n` +
        `Policy files (.claude/settings*, hooks, .mcp.json, .git internals) are changed by the user, not the agent.\n`,
    );
    process.exit(2);
  }
}
process.exit(0);
