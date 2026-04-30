# @bitsummit/ccsec-rules

CLAUDE.md hardening templates per profile for `claude-code-security` (BITSUMMIT Hardening). Behavioral rules that complement the runtime hooks.

## Install

Consumed internally by `@bitsummit/ccsec-cli` via pnpm workspaces. End users get these templates via the umbrella package and `ccsec apply`.

To depend on this package from another workspace package:

```
"dependencies": {
  "@bitsummit/ccsec-rules": "workspace:*"
}
```

## What it ships

Behavioral CLAUDE.md templates that Claude Code reads at session start. These complement runtime hooks: hooks block at the tool boundary, rules guide Claude's behavior before a tool call is even attempted.

```
templates/
  baseline.md      # solo dev; warns about risky patterns
  strict.md        # team / shared infra; tighter prose, blocks more
  regulated.md     # regulated environment; tightest prose
  snippets/        # reusable rule fragments composed into the per-profile templates
```

## Why rules and not just hooks

Hooks are deterministic detection at the tool boundary. They cannot prevent Claude from *trying* a risky operation; they only block it when it happens. Behavioral rules in CLAUDE.md tell Claude what *not* to attempt. The two layers are complementary:

- A hook catches `rm -rf /` if Claude tries it.
- A rule discourages Claude from trying `rm -rf /` in the first place.

ADR-0005 documents why rules ship as markdown templates rather than executable code.

## Customizing

Adopters who want extended customization (organization-specific rules, compliance regime mapping, custom behavioral patterns) can engage BITSUMMIT for a paid governance engagement. See [`docs/bitsummit-security-engagement.md`](../../docs/bitsummit-security-engagement.md).

## License

MIT. See the repository root [LICENSE](../../LICENSE).
