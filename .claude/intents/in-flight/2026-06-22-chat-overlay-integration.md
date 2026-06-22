---
id: 2026-06-22-chat-overlay-integration
owner: Zenn
created: 2026-06-22
---

# Ship the 3D Twitch chat overlay and AI-bot bridge

## Goal

A working `/chat` overlay route that renders live Twitch chat as 3D animated messages and bridges to the standalone AI bot over a WebSocket.

## Current state

In progress on branch `feature/stream-ai-bot`, all WIP under `stream-overlay/` and currently uncommitted. `ChatScene` (R3F), `configChat`, URL config, the Twitch connection, three animation styles (float/burst/assemble), and quality tiers exist. Blocker: `ChatScene.tsx` imports `useBotOverlayBridge()` which is not yet implemented in `overlayBridge.ts`, and the scene is not wired into the router.

## Success criteria

- [ ] `ChatScene` is mounted at `/chat`; `/` keeps its existing default.
- [ ] `useBotOverlayBridge()` is implemented (WebSocket to the bot, reconnect + graceful fallback).
- [ ] All three message styles (float/burst/assemble) render without errors.
- [ ] Chat connects to a live channel via `?channel=...`; quality tiers (low/med/high) work end-to-end.
- [ ] `npm run build` passes with no TypeScript errors; all WIP committed coherently.

## Scope

- `src/pages/ChatScene.tsx`, `src/engine/{configChat,overlayBridge}.ts`.
- `src/hooks/{useChatParams,useFontUrl}.ts`, `src/modules/chat/*`.
- `src/App.tsx` — add the `/chat` route.
- `config/{channels,users}.yaml`, `.env.example`.

## Out of scope

- The standalone `twitch-bot` service itself (assumed running; bot owns command parsing + LLM).
- Emotes/badges/clips/raid notifications — follow-up intent.
- Performance work beyond the existing three quality tiers.

## Plan

1. Implement `useBotOverlayBridge()` (WebSocket to `VITE_BOT_WS_URL`, push bot messages into the chat store, reconnect).
2. Add the `/chat` route in `App.tsx`.
3. Move Twitch OAuth out of `tokens.json` into env (`.env`, gitignored); read from env in the connection. **Do not commit `tokens.json` — it holds real tokens.**
4. `npm run build` + `npm run dev` smoke (`/chat?channel=…`), then commit the WIP in logical chunks.

## Risks / open questions

- **Secret in the tree:** `tokens.json` contains real Twitch OAuth — it must not be committed; relocate to env before the first commit.
- Bot endpoint: code assumes `ws://localhost:8080` — confirm/make it env-configurable.
- Message rate-limit is configured per tier but not yet enforced in the render layer.

## Linked

- Related: `done/2026-05-14-extract-bot-as-standalone.md`
- PRs:
