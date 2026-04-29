import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runHooks } from '@bitsummit/ccsec-core';
import secretGuard from '@bitsummit/ccsec-hooks/dist/secret-guard/index.js';
import secretLeakDetector from '@bitsummit/ccsec-hooks/dist/secret-leak-detector/index.js';
import keychainGuard from '@bitsummit/ccsec-hooks/dist/keychain-guard/index.js';
import mcpSecretGuard from '@bitsummit/ccsec-hooks/dist/mcp-secret-guard/index.js';
import destructiveFsGuard from '@bitsummit/ccsec-hooks/dist/destructive-fs-guard/index.js';
import gitDestructiveGuard from '@bitsummit/ccsec-hooks/dist/git-destructive-guard/index.js';
import sensitivePathsGuard from '@bitsummit/ccsec-hooks/dist/sensitive-paths-guard/index.js';
import dotfileGuard from '@bitsummit/ccsec-hooks/dist/dotfile-guard/index.js';
import bashStructuralGuard from '@bitsummit/ccsec-hooks/dist/bash-structural-guard/index.js';
import pipeToShellGuard from '@bitsummit/ccsec-hooks/dist/pipe-to-shell-guard/index.js';
import branchProtectionGuard from '@bitsummit/ccsec-hooks/dist/branch-protection-guard/index.js';
import commitAmendPushedGuard from '@bitsummit/ccsec-hooks/dist/commit-amend-pushed-guard/index.js';
import submoduleInjectionGuard from '@bitsummit/ccsec-hooks/dist/submodule-injection-guard/index.js';
import gitHistoryRewriteGuard from '@bitsummit/ccsec-hooks/dist/git-history-rewrite-guard/index.js';
import webfetchEgressGuard from '@bitsummit/ccsec-hooks/dist/webfetch-egress-guard/index.js';
import bashEgressGuard from '@bitsummit/ccsec-hooks/dist/bash-egress-guard/index.js';
import auditTamperDetector from '@bitsummit/ccsec-hooks/dist/audit-tamper-detector/index.js';
import auditSessionSummary from '@bitsummit/ccsec-hooks/dist/audit-session-summary/index.js';

const ALL_HOOKS = [
  secretGuard, secretLeakDetector, keychainGuard, mcpSecretGuard,
  destructiveFsGuard, gitDestructiveGuard, sensitivePathsGuard, dotfileGuard,
  bashStructuralGuard, pipeToShellGuard, branchProtectionGuard,
  commitAmendPushedGuard, submoduleInjectionGuard, gitHistoryRewriteGuard,
  webfetchEgressGuard, bashEgressGuard, auditTamperDetector, auditSessionSummary,
];

const here = dirname(fileURLToPath(import.meta.url));

describe('integration: audit-tamper-attempt', () => {
  beforeAll(() => {
    process.env.HOME = '/Users/x';
  });
  let auditPath: string;
  beforeEach(async () => {
    auditPath = join(await mkdtemp(join(tmpdir(), 'ccsec-int-')), 'audit.jsonl');
  });

  it('replay matches expected with mid-stream tamper', async () => {
    const fx = JSON.parse(await readFile(join(here, 'transcripts', 'audit-tamper-attempt.json'), 'utf8'));

    // Event 0: PostToolUse with intact log -> audit-tamper-detector verifies clean
    // Pre-seed the audit log with one valid record by running a no-op invocation
    // path: write a single seed record using the runner so the chain has data.
    // (Using runHooks with a Bash PostToolUse runs audit-tamper-detector itself,
    // which will see an empty log on first run and return ok with 0 records.)
    const env = { CCSEC_AUDIT_LOG_PATH: auditPath };
    const ev0 = fx.events[0];
    const r0 = await runHooks(
      { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
      { tool: ev0.tool, event: ev0.event, input: ev0.input, response: ev0.response, env },
    );
    expect(r0.decision, 'event 0').toBe(fx.expected[0].decision);

    // Tamper: corrupt the audit log between events. Replace the file with a
    // line whose prev_hash is wrong, so verify() reports broken chain.
    const tampered = JSON.stringify({
      ts: '2026-04-29T00:00:00.000Z',
      hook: 'audit-tamper-detector',
      tool: 'Bash',
      decision: 'allow',
      reason: 'tampered',
      duration_ms: 0,
      prev_hash: 'deadbeef'.repeat(8),
      hash: 'cafebabe'.repeat(8),
    });
    await writeFile(auditPath, tampered + '\n', 'utf8');

    // Event 1: PostToolUse should now flag tamper -> warn under baseline
    const ev1 = fx.events[1];
    const r1 = await runHooks(
      { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
      { tool: ev1.tool, event: ev1.event, input: ev1.input, response: ev1.response, env },
    );
    expect(r1.decision, 'event 1').toBe(fx.expected[1].decision);
    // Confirm that the detector specifically saw the tamper
    const detectorInvocation = r1.invocations.find((inv) => inv.hook === 'audit-tamper-detector');
    expect(detectorInvocation?.outcome).toBe('warn');
    expect(detectorInvocation?.reason).toMatch(/tampering detected/);
  });
});
