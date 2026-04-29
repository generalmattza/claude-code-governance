# Pilot Friction Log

The pilot lead maintains this log for the duration of the pilot. Every friction point is captured even if minor. An empty friction log is suspicious.

## Severity definitions

- **P0 - Block release.** Pilot dev cannot do their job. Profile must change before `v1.0.0`.
- **P1 - Block release.** Pilot dev has a workaround but it costs ≥5 minutes per occurrence. Document or fix.
- **P2 - Track, do not block.** Cosmetic, infrequent, or self-healing.

## Status values

- **Open** - Captured, not yet triaged.
- **Triaged** - Severity assigned, owner assigned.
- **In progress** - Owner is working on it.
- **Resolved - profile** - Fixed via settings change rolled out via MDM.
- **Resolved - docs** - Fixed via documentation update; no settings change needed.
- **Resolved - upstream** - Fixed in `claude-code-security` source; needs new release to land.
- **Deferred to v1.1** - Real friction but not a v1.0.0 blocker.
- **Drill - detected** - Internal incident drill, intended friction, hook fired correctly.
- **Drill - missed** - Internal incident drill, hook did NOT fire. Always P0.

## Log

| # | Date | Pilot dev | Endpoint | Profile | Hook | What broke | False positive? | Severity | Status | Resolution | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | YYYY-MM-DD | initials | hostname | regulated | hook-name | one-line description | yes/no/N/A | P0/P1/P2 | Open | how it was resolved | links to audit log entry |
| 2 | | | | | | | | | | | |
| 3 | | | | | | | | | | | |
| 4 | | | | | | | | | | | |
| 5 | | | | | | | | | | | |

Add rows as friction is captured. Do not delete rows even after resolution; the audit trail of what broke is the point.

## Weekly summary

Filled by the pilot lead in each weekly check-in.

### Week 1 (kickoff)
- Test endpoints deployed: ___ / ___
- Friction items opened: ___
- P0 / P1 / P2 split: ___ / ___ / ___
- Notes: ___

### Week 2 (rollout)
- Pilot endpoints active: ___ / ___
- Friction items opened: ___
- Friction items resolved: ___
- P0 / P1 / P2 open: ___ / ___ / ___
- Notes: ___

### Week 3 (rollout)
- Pilot endpoints active: ___ / ___
- Friction items opened: ___
- Friction items resolved: ___
- P0 / P1 / P2 open: ___ / ___ / ___
- Notes: ___

### Week 4 (hardening)
- Drills run: ___ / 5
- Drills detected: ___ / 5
- Profile changes rolled out: ___
- Doc updates submitted: ___
- Notes: ___

### Week 5 (hardening)
- Tamper-detection hourly run for ___ days
- Tamper-detection fired correctly: yes / no
- P0 / P1 closure rate this week: ___
- Notes: ___

### Week 6 (signoff)
- All P0 closed: yes / no
- All P1 closed or deferred to v1.1 with maintainer agreement: yes / no
- Final report drafted: yes / no
- Case study reviewed by client comms: yes / no
- Notes: ___

## Aggregates for v1.0.0 readiness

To be filled at end of pilot:

- Total friction items captured: ___
- P0 captured: ___ / closed: ___
- P1 captured: ___ / closed: ___ / deferred: ___
- P2 captured: ___ / closed: ___ / deferred: ___
- False positive rate (FP / total non-drill): ___%
- Drill detection rate: ___ / 5

If P0 closed < P0 captured, **do not ship v1.0.0**.
