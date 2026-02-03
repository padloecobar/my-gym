# UI Inventory (Snapshot)

Legacy classes still appear as aliases (kept for backward compatibility):
- `.button`, `.btn`, `.icon-button`
- `.card`, `.card__*`
- `.input`, `.select`, `.textarea`
- `.pill`, `.chip`, `.badge`
- `.list-row`, `.set-row`
- `.bottom-nav`, `.header-bar`, `.runner-header`, `.sheet__*`, `.snackbar`

Current mapping (authoritative hooks):
- `.button` → `ui-button` + `data-variant`/`data-size`
- `.icon-button` → `ui-icon-button`
- `.card` → `ui-card` + `data-surface`
- `.list-row` / `.set-row` → `ui-row`
- `.pill` → `ui-pill` (`data-tone="strong"` when emphasized)
- `.chip` → `ui-chip` (`data-state`)
- `.badge` → `ui-badge`
- `.input/.select/.textarea` → `ui-input/ui-select/ui-textarea`
- `.bottom-nav` → `ui-nav`
- `.header-bar/.runner-header` → `ui-header`
- `.sheet` → `ui-sheet`
- `.snackbar` → `ui-snackbar`

See `DESIGN_SYSTEM_CONTRACT.md` for deprecation policy and composition rules.

