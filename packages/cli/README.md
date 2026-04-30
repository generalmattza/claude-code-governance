# @bitsummit/ccsec-cli

The `ccsec` command-line interface for `claude-code-security` (BITSUMMIT Hardening). Compiles profiles, applies them to a Claude Code installation, and verifies the result.

## Install

End users typically install the umbrella package, which exposes `ccsec`:

```
npm i -g @bitsummit/claude-code-security
```

To depend on this package directly from another workspace package:

```
"dependencies": {
  "@bitsummit/ccsec-cli": "workspace:*"
}
```

The CLI binary is `bin/ccsec.js`.

## Commands

### `ccsec apply --profile <name>`

Compile and install a profile into the current user's `~/.claude/` directory. The user-mode default for individual developers.

```
ccsec apply --profile baseline
ccsec apply --profile strict
ccsec apply --profile regulated
```

### `ccsec compile`

Compile a profile to a JSON file without installing. Used by IT admins building managed deployments.

```
ccsec compile \
  --profile regulated \
  --target managed \
  --os macos \
  --out /tmp/managed-settings.json
```

Flags:

- `--profile <name>` - one of `baseline`, `strict`, `regulated`.
- `--target <user|managed>` - `user` writes to `~/.claude/`-shaped paths; `managed` writes to OS-specific managed paths (`/Library/Application Support/...` on macOS, `C:\ProgramData\...` on Windows, `/etc/ClaudeCode/` on Linux).
- `--os <macos|windows|linux>` - target OS for path tokens. Defaults to current OS.
- `--out <path>` - output file. Defaults to stdout if omitted.
- `--settings-root <path>` - override the settings package root for development.

### `ccsec doctor`

Diagnose the current installation. Reports profile in use, hook count, audit log path, and any obvious misconfiguration.

```
ccsec doctor
```

Exit codes: `0` healthy, `1` warning (config inconsistency that does not break enforcement), `2` error (config that breaks enforcement).

## Profile reference

See `docs/settings-reference.md` for the full settings schema and `docs/coverage-matrix.md` for hook-to-profile mapping.

## Tests

```
pnpm --filter @bitsummit/ccsec-cli test
```

## License

MIT. See the repository root [LICENSE](../../LICENSE).
