# Plan - Phase 1, Plan 10 - Pilot Validation

> Date: 2026-04-29. Final plan of Phase 1. Predecessor: `v0.9.0-rc.1`.

## Documentation-only plan

This plan is **documentation-only**. It cannot be fully shipped autonomously because:

1. Pilot validation requires a real client engagement (multi-week, on real fleets, with humans).
2. External security review requires hiring a paid security firm.

What Claude Code ships here is the runbook + RFP template + pilot templates + readiness checklist. The maintainer ships `v1.0.0` after the user-action items in `docs/v1.0.0-readiness.md` complete.

## Steps

### 1. Specs + plan

- `docs/superpowers/specs/2026-04-29-plan10-pilot-validation.md` (companion spec).
- `docs/superpowers/plans/2026-04-29-phase1-plan10-pilot-validation.md` (this file).

### 2. Pilot runbook

`docs/pilot-validation.md`:

- Why a pilot (real-world deployment validation; an outside operator walks the MDM doc; external security signoff).
- Candidate pilot client profiles (regulated municipal / law-enforcement Windows-heavy, regulated forensics / public-safety mixed fleet, federally-regulated Mac-heavy research org, plus opportunistic). Specific names tracked privately.
- Pilot criteria (≥5 devs, regulated industry preferred, MDM admin available, 4-6 week window, structured feedback).
- Four-phase rollout (kickoff, rollout, hardening, signoff) with weekly checkpoints.
- v1.0.0 readiness checklist.
- Friction-log template inline.
- Internal incident drill template inline.
- Pointer to the BITSUMMIT extended-security-governance engagement template.

### 3. BITSUMMIT security engagement template

`docs/bitsummit-security-engagement.md` (originally shipped as `docs/external-security-review-rfp.md` and reframed in `[Unreleased]`):

- Project overview.
- Who the engagement is for (adopters running `regulated`, regulated sectors, SIEM integration, custom incident-response runbook).
- Engagement scope (custom-profile compilation, threat-model extension, audit-log SIEM integration, incident-response runbook, MDM deployment, standing channel, training).
- Out of scope (the engagement is paid services, not an independent third-party audit; Claude Code itself; OS-level primitives; third-party hooks; supply-chain audit).
- Deliverables (compiled profile, threat-model addendum, SIEM runbook, incident-response runbook, training session, final report).
- Timeline (4-8 weeks).
- Pricing (scoped per engagement; contact for quote).
- Submission via `security@bitsummit.com`.

### 4. Pilot templates

`docs/pilot-templates/`:

- `agreement.md`: pilot agreement template + counsel disclaimer.
- `friction-log.md`: running friction log table.
- `incident-drill.md`: 5 simulated bypass attempts the pilot lead runs.
- `final-report.md`: pilot signoff template.

### 5. README updates

- Status banner: "Plan 9 of 10 shipped (`v0.9.0-rc.2`). Plan 10 is user-action: pilot validation. v1.0.0 ships when the maintainer completes Plan 10."
- "v1.0.0 path" section near the top, linking `docs/pilot-validation.md` and `docs/v1.0.0-readiness.md`. (The `docs/external-security-review-rfp.md` link in earlier drafts was replaced by `docs/bitsummit-security-engagement.md` and is no longer a v1.0.0 gate.)

### 6. v1.0.0 readiness summary

`docs/v1.0.0-readiness.md`: one-page summary of remaining user-action items.

### 7. CHANGELOG + tag

Add `[0.9.0-rc.2] - 2026-04-29` entry. Tag `v0.9.0-rc.2`. Push. GitHub release.

**Do NOT tag `v1.0.0`.** That tag belongs to the maintainer.

## Acceptance

- All 313 Plan 1-9 tests still pass.
- Seven new doc files created.
- README updated with the v1.0.0 path.
- CHANGELOG entry written.
- Tag `v0.9.0-rc.2` published.

## Out of Scope

- Running the pilot.
- Hiring the security reviewer.
- Provisioning release secrets.
- Tagging `v1.0.0`.
