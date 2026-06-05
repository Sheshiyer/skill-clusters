# Gram CLI Setup Notes

Project path:

- `/Volumes/madara/2026/twc-vault/01-Projects/gram-cli`

## Fresh install (recommended)

```bash
cd /Volumes/madara/2026/twc-vault/01-Projects/gram-cli
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Validate entrypoints

```bash
bash scripts/run-glam.sh --help
bash scripts/run-glam.sh --version
```

Deterministic default path used by the wrapper:

- `/Volumes/madara/2026/twc-vault/01-Projects/gram-cli/.venv-codex/bin/glam`

Optional override:

```bash
export GRAM_CLI_BIN=/custom/path/to/glam
```

## Common failure

If you see `ModuleNotFoundError: No module named 'gram'` from `gram`/`glam`, the entrypoint likely points to an old interpreter path.

Fix by reinstalling in the active environment:

```bash
cd /Volumes/madara/2026/twc-vault/01-Projects/gram-cli
source .venv/bin/activate
pip install -e .
```
