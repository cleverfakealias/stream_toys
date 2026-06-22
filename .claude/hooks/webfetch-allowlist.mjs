#!/usr/bin/env node
// PreToolUse hook (WebFetch): allow fetches only to domains in
// .claude/hooks/allowed-domains.txt (one per line, # comments; subdomains of a
// listed domain are allowed). Fetched web content is the primary prompt-injection
// vector for coding agents — keep this list short and boring.
// Exit 0 = allow. Exit 2 = block. Fails CLOSED if the allowlist file is missing.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0); // fail open on a parse error; the allowlist below fails closed
}

const url = String(payload?.tool_input?.url ?? "");
if (!url) process.exit(0);

// scheme://host:port/path?query  ->  host (lowercased)
const host = url
  .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "")
  .replace(/[/:?].*$/, "")
  .toLowerCase();
if (!host) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const allowlist = join(root, ".claude", "hooks", "allowed-domains.txt");
if (!existsSync(allowlist)) {
  process.stderr.write(
    `blocked: WebFetch allowlist missing (${allowlist}). Create it with one domain per line.\n`,
  );
  process.exit(2);
}

for (let domain of readFileSync(allowlist, "utf8").split(/\r?\n/)) {
  domain = domain.replace(/\s/g, "").toLowerCase();
  if (!domain || domain.startsWith("#")) continue;
  if (host === domain || host.endsWith(`.${domain}`)) process.exit(0);
}

process.stderr.write(
  `blocked: '${host}' is not in the WebFetch domain allowlist (hook: webfetch-allowlist.mjs).\n` +
    `Fetched pages can carry prompt-injection payloads. If this domain is needed,\n` +
    `the user can add it to .claude/hooks/allowed-domains.txt.\n`,
);
process.exit(2);
