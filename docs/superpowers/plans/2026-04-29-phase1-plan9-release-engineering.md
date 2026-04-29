# Plan 9 - Release Engineering + v0.9.0-rc.1

> Status: 2026-04-29. Phase 1, Plan 9 of 10.

## Predecessor

`v0.8.0-rc.0` shipped Track 1-5 documentation, hook-doc + coverage-matrix auto-generators (26 hook pages, 313 tests, coverage above 90 percent).

## Tasks

1. **Spec + plan docs.** Create this file plus `docs/superpowers/specs/2026-04-29-plan9-release-engineering.md`.
2. **SBOM generation.** Add `@cyclonedx/cyclonedx-npm` step to `.github/workflows/release.yml`; emit `sbom.cyclonedx.json` and attach via `softprops/action-gh-release@v2`.
3. **GHSA pipeline scaffolding + release runbook.** Update `SECURITY.md` (disclosure timeline, hall of thanks placeholder, PGP placeholder, GHSA URL). Create `docs/release-engineering.md` covering pre-release gates, tagging, provenance + signing, post-release verification, advisory pipeline, backports.
4. **Node SEA build templates.** Create `scripts/build-sea.sh` (esbuild bundle, SEA blob, postject inject). Add `sea-build` matrix job to `release.yml` (macos-14 / macos-13 / ubuntu-latest / windows-latest).
5. **Provenance + signed manifest.** Add `shasum -a 256 ccsec-* > SHA256SUMS` step; include in release upload set. Document where PGP signing of the manifest will hook in once the key is provisioned.
6. **GHSA template.** Create `.github/security-advisory-template.md` and `.github/SECURITY.yml` placeholder.
7. **CHANGELOG + tag.** Add `[0.9.0-rc.1] - 2026-04-29`. Run gates. Tag `v0.9.0-rc.1`. Push. Create GitHub prerelease.

## Acceptance

- SBOM, SEA binaries, SHA256SUMS all uploaded by `release.yml`.
- `SECURITY.md` has explicit triage SLAs + GHSA pointer.
- `docs/release-engineering.md` is the canonical runbook.
- `.github/security-advisory-template.md` exists.
- `[0.9.0-rc.1]` CHANGELOG entry exists.
- 313 Plan 1-8 tests still pass.
- Tag `v0.9.0-rc.1` pushed; GitHub prerelease created.

## Risk + Mitigations

- **Risk**: SEA matrix build fails on Windows due to postject behavior or path quoting. **Mitigation**: build script uses POSIX `bash`; on Windows the matrix runner supplies bash via Git for Windows. If the runner fails, the failure is isolated and other platforms still produce binaries. Fix-forward in a patch RC.
- **Risk**: `npx @cyclonedx/cyclonedx-npm` introduces a deferred dep with a wide tree. **Mitigation**: pin to a specific minor (`@cyclonedx/cyclonedx-npm@2`) in CI invocation; not a project-wide devDep so it does not bloat installs for contributors.
- **Risk**: Maintainer cannot finalize signing inside the rc.1 cycle. **Mitigation**: Plan 9 explicitly ships infrastructure only; unsigned binaries are still produced and attached. Signing slots are documented in `docs/release-engineering.md` as the next maintainer-action gate.

## Forward Note

Plan 10 is pilot validation: deploy to two BITSUMMIT engineers, capture telemetry against the documented threats, write a `docs/pilot-results.md`, and graduate to `v1.0.0`.
