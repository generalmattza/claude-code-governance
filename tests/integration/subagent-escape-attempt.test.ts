import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runHooks } from '@bitsummit/ccsec-core';
import { ALL_HOOKS } from './_all-hooks.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('integration: subagent-escape-attempt', () => {
  beforeAll(() => {
    process.env.HOME = '/Users/x';
  });
  let auditPath: string;
  beforeEach(async () => {
    auditPath = join(await mkdtemp(join(tmpdir(), 'ccsec-int-')), 'audit.jsonl');
  });

  it('baseline: Task injection blocks; subagent spawn warns; allowlisted spawn passes', async () => {
    const fx = JSON.parse(
      await readFile(join(here, 'transcripts', 'subagent-escape-attempt.json'), 'utf8'),
    );
    const env = { CCSEC_AGENT_ALLOWLIST: 'approved-agent,trusted-agent' };
    const expected = fx.expected_baseline as Array<{ decision: string; blockedBy?: string }>;
    for (let i = 0; i < fx.events.length; i++) {
      const ev = fx.events[i];
      const exp = expected[i];
      const result = await runHooks(
        { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
        { tool: ev.tool, event: ev.event, input: ev.input, env },
      );
      expect(result.decision, `event ${i}`).toBe(exp.decision);
      if (exp.blockedBy) expect(result.blockedBy).toBe(exp.blockedBy);
    }
  });

  it('regulated: subagent spawn blocks for non-allowlisted types', async () => {
    const fx = JSON.parse(
      await readFile(join(here, 'transcripts', 'subagent-escape-attempt.json'), 'utf8'),
    );
    const env = { CCSEC_AGENT_ALLOWLIST: 'approved-agent,trusted-agent' };
    const expected = fx.expected_regulated as Array<{ decision: string; blockedBy?: string }>;
    for (let i = 0; i < fx.events.length; i++) {
      const ev = fx.events[i];
      const exp = expected[i];
      const result = await runHooks(
        { hooks: ALL_HOOKS, profile: 'regulated', auditLogPath: auditPath },
        { tool: ev.tool, event: ev.event, input: ev.input, env },
      );
      expect(result.decision, `event ${i}`).toBe(exp.decision);
      if (exp.blockedBy) expect(result.blockedBy).toBe(exp.blockedBy);
    }
  });

  it('agent-allowlist-enforcer logs allowlisted agents and audits non-allowlisted on baseline', async () => {
    const fx = JSON.parse(
      await readFile(join(here, 'transcripts', 'subagent-escape-attempt.json'), 'utf8'),
    );
    const env = { CCSEC_AGENT_ALLOWLIST: 'approved-agent' };
    const ev = fx.events[1]; // SubagentStart with evil-agent
    const result = await runHooks(
      { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
      { tool: ev.tool, event: ev.event, input: ev.input, env },
    );
    const enforcer = result.invocations.find((i) => i.hook === 'agent-allowlist-enforcer');
    expect(enforcer).toBeDefined();
    // Severity is log on baseline -> outcome rendered as 'allow'.
    expect(enforcer?.outcome).toBe('allow');
    expect(enforcer?.reason).toMatch(/not in allowlist/);
  });
});
