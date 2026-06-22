---
name: lua-standards
description: Lua conventions for this repo — toolchain, style, testing, and security. Use when writing, reviewing, or refactoring Lua code, or setting up Lua project config (stylua.toml, selene.toml, .luarc.json, .busted, rockspecs).
user-invocable: true
---

# Lua standards (2026)

## Toolchain

- **StyLua 2.x** is the formatter: `stylua <file>` in place, `stylua --check .` in CI. Config in `.stylua.toml`.
- **selene** is the linter for new projects (`selene .`, config `selene.toml` with the right `std`, e.g. `lua54`). luacheck (`.luacheckrc`) is acceptable where already established — it's maintained but frozen. Neither has autofix; fix findings by hand.
- **Type checking** (advisory): lua-language-server headless — `lua-language-server --check . --checklevel=Warning`, config `.luarc.json`. Annotate public APIs with LuaLS annotations (`---@param`, `---@return`, `---@class`).
- **busted** for tests: specs in `spec/*_spec.lua`, run `busted` (config `.busted`).
- **LuaRocks** for dependencies (committed rockspec). Lux (`lx`, `lux.toml`) is a credible newer option but not yet the default.

## Style

- `local` everything. No new globals — selene/luacheck will flag them; don't silence the warning, fix it.
- Target the interpreter the project declares (5.1/LuaJIT vs 5.4 differ meaningfully: integer division, `goto`, bitops). Don't use features the floor doesn't have.
- Errors: return `nil, err` for expected failures; `error()` for programmer mistakes; wrap risky calls in `pcall` at boundaries only.
- Modules return a table; no `module()` (long deprecated), no side effects at require time.
- Prefer `ipairs`/`pairs` idioms; cache hot-path lookups in locals only when profiling justifies it.

## Testing

- One `describe` per unit, `it` names state behavior. Use `before_each` over shared mutable state.
- busted's `assert.are.same` for deep equality, `assert.has_error` for failure paths.

## Security

- Never `load`/`loadstring`/`dofile` on external data; if sandboxed config-as-Lua is truly needed, use a restricted env (`load(chunk, name, "t", env)`) and say so in review.
- `os.execute`/`io.popen` with interpolated strings are injection sinks — avoid; validate and quote if unavoidable.
- Pin rockspec dependency versions; review what a rock's `build` step executes before adding it.
