# Owners

This file documents who maintains `claude-code-security` and how the project is governed. The intent is transparency: anyone evaluating whether to depend on this project should be able to see who decides what ships, who responds to vulnerabilities, and how that set changes over time.

## Current maintainers

| GitHub | Role | Areas |
| --- | --- | --- |
| [@bit-haseebminhas](https://github.com/bit-haseebminhas) | Lead maintainer | Architecture, releases, threat model, security disclosures. |

The project is published by [BITSUMMIT-Corp](https://github.com/Bitsummit-Corp). BITSUMMIT-Corp is the GitHub organization; the maintainers above act in their personal capacity within it.

## Contact channels

| Purpose | Channel |
| --- | --- |
| Security vulnerabilities | [`SECURITY.md`](./SECURITY.md) - GitHub Security Advisories preferred; `security@bitsummit.com` as backup. |
| Code of conduct reports | `conduct@bitsummit.com`. |
| General questions, bugs, features | [GitHub Issues](https://github.com/Bitsummit-Corp/claude-code-governance/issues). |
| Extended security governance engagement | See [`docs/bitsummit-security-engagement.md`](./docs/bitsummit-security-engagement.md). |

## Decision rights

The lead maintainer decides:

- What ships in a release and on what schedule.
- Which threats enter the threat model.
- Which hooks land in which profile.
- Disclosure timing for security advisories.
- Branch protections, secrets, and CI configuration.

Everyone (maintainers and contributors) follows the same [`CONTRIBUTING.md`](./CONTRIBUTING.md) PR workflow. Maintainers may merge their own PRs after review by another maintainer when more than one is active. With a single maintainer (the current state), high-impact PRs sit for at least 24 hours after open before merge to give the community time to comment.

## Becoming a maintainer

This is a small project. Maintainership is offered, not requested, and it is not granted lightly. Path to maintainer:

1. Land at least three substantive PRs over a window of at least three months.
2. Demonstrate quality judgment in PR reviews, issue triage, or threat-model discussion.
3. Be willing to commit to the response-time expectations below.
4. The lead maintainer extends an invitation. The candidate accepts in writing in an issue or pull request.

Maintainers are added to this file in the same PR that grants them write access on the GitHub repo.

## Response-time expectations

Maintainers commit to:

- **Security advisories.** Acknowledgement within 72 hours per `SECURITY.md`.
- **Issues.** Triage within 7 days. "Triage" means a label, a question, or a closed-with-explanation, not a fix.
- **Pull requests.** Initial response within 7 days. Larger PRs may take longer to fully review; the maintainer will say so explicitly.

Maintainers who consistently miss the SLA without saying so are stepped down to emeritus status (see below).

## Stepping down

Any maintainer may step down at any time by opening a PR removing themselves from this file. The PR is merged without further review. Stepping down is normal and expected; the contributor's history is unaffected.

## Emeritus

Maintainers who have stepped down or who no longer actively review are listed here as "emeritus". They retain credit for past work and may be invited to weigh in on threat-model discussions, but they no longer have decision rights or the response-time obligation.

| GitHub | Active period |
| --- | --- |
| _none yet_ | _-_ |

## Conflict resolution

The lead maintainer breaks ties on technical disagreements. If multiple maintainers exist and the lead is conflicted on a specific decision, the next-most-senior maintainer (by tenure on this file) breaks the tie. Disagreements that cannot be resolved this way go to a public issue for community input; the maintainers reach a decision and document it in an ADR.

Code-of-conduct disputes are handled per [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md), not here.

## Changes to this file

Changes are PRs against `main`. The lead maintainer must approve. Adding a new maintainer requires an explicit acceptance comment from that person on the PR.
