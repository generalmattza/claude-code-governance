# BITSUMMIT Security Governance Engagement

A template the IT or security lead at an adopting organization can use to engage **BITSUMMIT** for a paid extended-security-governance engagement on top of the open-source `claude-code-security` project. BITSUMMIT publishes and maintains the project; this document is the entry point for organizations that want more than the open-source profiles cover out of the box.

This is a paid services engagement, not an independent third-party security audit. BITSUMMIT brings the project's defaults to a known-good fit for the adopter's environment, integrates the audit log into the adopter's incident-response stack, and stays on call for tuning over the engagement window.

## Who this is for

- Adopters running the `regulated` profile against a fleet larger than ~25 endpoints.
- Adopters in regulated sectors (healthcare, legal, public sector, financial services) who need policy mapping to a specific compliance regime (PIPEDA, HIPAA, GDPR, SOC 2, sector-specific).
- Adopters who want their audit log integrated into a SIEM (Splunk, Elastic, Microsoft Sentinel, custom JSONL pipeline) rather than analyzed manually.
- Adopters who want a documented incident-response runbook keyed to their on-call rotation, not just the project's generic template.

If you are running a `baseline` profile on a small dev team and the OSS docs cover what you need, you do not need this engagement. Continue with the project's free hardening reference.

## Project context

`claude-code-security` (also distributed as `@bitsummit/claude-code-security` on npm and as the BITSUMMIT Hardening plugin) is an open-source hardening reference for Anthropic's Claude Code CLI. It ships 26 PreToolUse / PostToolUse / SubagentStart / SubagentStop hooks, three layered settings profiles (`baseline`, `strict`, `regulated`), behavioral CLAUDE.md rules, and OS-specific MDM deployment installers (macOS Jamf, Windows Intune, Linux Ansible / .deb / .rpm). Source: `https://github.com/Bitsummit-Corp/claude-code-governance`.

The project's defaults are deliberately middle-of-the-road. Tight enough that a regulated org can deploy `regulated` without major customization; loose enough that a security-conscious dev team can deploy `baseline` without daily friction. An adopter who wants a posture beyond middle-of-the-road needs the customization this engagement provides.

## Engagement scope

BITSUMMIT delivers the following over the engagement window:

1. **Custom-profile compilation.** A profile derived from `regulated` and tuned to the adopter's environment: per-OS path tokens, audit log destination, agent allowlist seeded with the adopter's permitted subagents, deny-pattern overlay tailored to the adopter's threat model.
2. **Threat model extension.** The project's threat model (`docs/threat-model.md`) extended to cover industry-specific concerns. Mapping to the adopter's compliance regime where applicable.
3. **Audit log integration.** SIEM forwarding (Splunk HEC, Elastic Common Schema, Microsoft Sentinel, or custom JSONL pipeline). Hash-chain monitoring and tamper alerts wired into the adopter's existing alerting stack.
4. **Incident-response runbook.** Adopter-specific version of the project's incident-drill template, integrated with the adopter's on-call rotation and escalation path.
5. **MDM deployment assistance.** Jamf / Intune / Ansible deployment tailored to the adopter's MDM posture, including Configuration Profile authoring, group targeting, rollback path documentation, and tamper-detection scheduling.
6. **Standing channel.** A direct channel (Slack Connect, dedicated email, or named MS Teams shared channel) for friction reports and tuning requests through the engagement window.
7. **Training session.** A 90-minute session for the adopter's IT and security team covering the deployed profile, the audit log format, and the rollback path.

Optional add-ons, priced separately:

- Quarterly profile retune, post-engagement.
- Quarterly internal incident drill, run on the adopter's fleet.
- Custom hook development. Additions to `packages/hooks/` are proposed upstream first; if the adopter needs the hook before upstream merges, BITSUMMIT can deliver a private overlay.

## Out of scope

1. **Independent third-party security audit of the project.** BITSUMMIT cannot provide that since BITSUMMIT publishes the project; an audit by the publisher is not independent. If the adopter requires an independent audit, BITSUMMIT can recommend an outside firm and coordinate the engagement.
2. **Bugs in Claude Code itself.** Anthropic's CLI is upstream of this project; defects there are reported to Anthropic.
3. **OS-level security primitives.** macOS TCC, Windows DAC ACLs, Linux DAC / AppArmor / SELinux are assumed to function. The engagement does not test for kernel privilege escalation.
4. **Third-party hooks installed alongside this project.** Hooks shipped by other vendors are out of scope.
5. **Supply-chain audit of upstream npm packages.** SBOM is shipped with each release (CycloneDX); a deep CVE audit of every transitive dependency is a separate engagement.

## Deliverables

1. **Compiled profile** as a versioned `settings.json` overlay, deployable via the adopter's MDM.
2. **Threat model addendum** as a markdown document, attached to the adopter's internal security register.
3. **SIEM integration runbook** describing how the audit log feeds into the adopter's stack, with example queries and alerting rules.
4. **Incident-response runbook** keyed to the adopter's on-call rotation.
5. **Training session recording** for the adopter's onboarding library.
6. **Engagement final report** summarizing what shipped, what was deferred, and recommendations for the next engagement window.

## Timeline

A standard engagement runs four to eight weeks depending on fleet size and SIEM integration depth. Indicative phases:

- **Week 1.** Kickoff, posture assessment, profile draft.
- **Weeks 2-3.** Profile compilation, MDM deployment to a pilot subset, friction-log monitoring.
- **Weeks 3-5.** SIEM integration, threat model addendum, incident-response runbook drafting.
- **Weeks 5-7.** Fleet-wide rollout, training session, final tuning.
- **Week 8.** Engagement final report and signoff.

Engagements that do not need SIEM integration or that target a small fleet often complete in four weeks.

## Pricing

Pricing depends on fleet size, OS mix, MDM complexity, SIEM integration depth, and compliance regime. BITSUMMIT scopes each engagement to a fixed-fee SOW after a 30-minute discovery call. Contact `security@bitsummit.com` to schedule.

## Submission

To start a scoping conversation, email `security@bitsummit.com` with:

1. Approximate fleet size and OS mix.
2. MDM in use (Jamf, Intune, Ansible, other, none).
3. Compliance regime, if any.
4. SIEM in use, if any.
5. Earliest start date.
6. Internal lead name and role.

BITSUMMIT acknowledges within two business days and proposes a discovery call within five.

## Note for downstream maintainers

If you maintain a fork or downstream distribution of `claude-code-security` and offer your own paid services on top of it, this template is for your downstream adopters, not for you. Use it as a starting point for your own services template if helpful.
