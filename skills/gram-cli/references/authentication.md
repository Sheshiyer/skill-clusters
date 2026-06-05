# Gram CLI Authentication Reference

## Auth Hierarchy

1. Environment variables:
   - `INSTAGRAM_SESSIONID`
   - `INSTAGRAM_CSRFTOKEN`
   - `INSTAGRAM_DS_USER_ID` (or `INSTAGRAM_USER_ID`)
2. Config file:
   - `~/.config/glam/config.json5`
   - legacy fallback: `~/.config/gram/config.json5`
3. Browser extraction via `glam login` from Chrome/Firefox profiles

## Browser Cookie Extraction

Use one browser source flag:

- `--chrome-profile <name>`
- `--firefox-profile <name>`

Optional:

- `--no-lock` for locked cookie databases
- `--save` to persist tokens/cookies
- `--print-env` to emit shell exports (sensitive)

## Security Notes

- Do not print or paste credentials unless user explicitly requests.
- Prefer saved config with restrictive permissions.
- Run `glam check` after auth updates.
