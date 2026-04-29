# ADR-0005: `@bitsummit/ccsec-rules` Ships Markdown Templates, Not Executable Rule Code

## Status
Accepted (2026-04-29).

## Context

`@bitsummit/ccsec-rules` was introduced in Plan 5 (see `docs/superpowers/plans/2026-04-29-phase1-plan5-hooks-cat-8-10.md`) to ship CLAUDE.md hardening templates per profile (baseline, strict, regulated) plus reusable snippets (no-eval, no-curl-pipe-shell, no-force-push).

Two implementation options were on the table:

1. **Markdown templates.** The package ships `.md` files. `ccsec apply --rules` reads the chosen profile's template, optionally merges with reusable snippets, and writes a CLAUDE.md to the target project.
2. **Executable rule code.** The package ships JavaScript rule modules with a `validate(claudeMd: string): RuleResult[]` interface. Each rule encodes a behavioral check; the runtime evaluates them on every prompt or session start. CLAUDE.md becomes a derived artifact from rule metadata rather than the canonical source.

## Decision

Ship **markdown templates**. Defer executable-rule code to a future plan if demand emerges.

## Rationale

1. **CLAUDE.md is the contract.** Claude Code reads CLAUDE.md as a behavioral guide for the model. The rules in question (no-eval, no-curl-pipe-shell, no-force-push) ARE behavioral, evaluated by the model at prompt time, not by a runtime evaluator. Ship the contract directly.

2. **Auditability.** Markdown templates are reviewable by every security team without needing to read JavaScript. ADR-0003 commits this project to a "reference, not a product" stance; that stance falls apart if half the rules are opaque code.

3. **No runtime cost.** Executable rules require a hook that runs on every prompt to re-evaluate the rule set. We already pay timing budget for the hook surface (26 hooks, 1500-2000 ms each). Adding a per-prompt rule-evaluator hook compounds that.

4. **Behavioral hooks already cover the runtime layer.** `behavioral-rule-enforcer` (Plan 5) reads behavioral rules from CLAUDE.md and audits when the model's actions deviate. It does NOT need the rules in code form; it parses the markdown.

5. **Forking-friendliness.** A user who wants to customize the regulated template can copy `regulated.md`, edit it, and point `--rules-template-path` at their copy. This is impossible if the rules live in compiled code without a templating layer on top.

## Consequences

- `@bitsummit/ccsec-rules` is a small package: three full templates, a handful of snippets, and a tiny resolver in `packages/cli/src/rules-installer.ts`.
- The rules package can be vendored (copy-pasted into a private repo) without taking on a runtime dependency. This matters for air-gapped regulated environments.
- A user with an existing CLAUDE.md who runs `ccsec apply --rules` gets a friendly merge, not a wholesale overwrite. The merge logic lives in the CLI, not in the rules package.
- Future rule-engine work (e.g., per-prompt pattern evaluators) can ship as a separate package (`@bitsummit/ccsec-rule-engine` or similar) without disturbing the templates.

## Alternatives Considered

- **Hybrid (templates + a tiny embedded evaluator).** Rejected: doubles the surface area without doubling the value. The hook layer is the right place for runtime evaluation.
- **Templates plus a JSON schema for machine-readable rule metadata.** Deferred: useful for auto-generating compliance reports, but not needed for v1.0. Reconsider if a downstream consumer asks for it.
- **Templates only, no reusable snippets.** Rejected: forces every profile to repeat the same "do not eval" / "do not curl-pipe-shell" boilerplate. The snippet layer is small enough to be worth maintaining.

## Revisit triggers

- A downstream consumer ships a CLAUDE.md rule that the markdown template cannot express (e.g., a rule conditioned on the user's role from an external identity provider). This may justify a structured rule format.
- The behavioral-rule-enforcer hook surface grows beyond the four canonical rules and we need a registry layer.
