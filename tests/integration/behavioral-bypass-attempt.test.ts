import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runHooks } from '@bitsummit/ccsec-core';
import { ALL_HOOKS } from './_all-hooks.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('integration: behavioral-bypass-attempt', () => {
  beforeAll(() => {
    process.env.HOME = '/Users/x';
  });
  let auditPath: string;
  beforeEach(async () => {
    auditPath = join(await mkdtemp(join(tmpdir(), 'ccsec-int-')), 'audit.jsonl');
  });

  it('logs behavioral and untrusted-content events without blocking', async () => {
    const fx = JSON.parse(
      await readFile(join(here, 'transcripts', 'behavioral-bypass-attempt.json'), 'utf8'),
    );
    for (let i = 0; i < fx.events.length; i++) {
      const ev = fx.events[i];
      const exp = fx.expected[i];
      const result = await runHooks(
        { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
        { tool: ev.tool, event: ev.event, input: ev.input, response: ev.response },
      );
      expect(result.decision, `event ${i}`).toBe(exp.decision);
    }
  });

  it('the prompt-injection event is recorded in the audit log via behavioral-rule-enforcer', async () => {
    const fx = JSON.parse(
      await readFile(join(here, 'transcripts', 'behavioral-bypass-attempt.json'), 'utf8'),
    );
    const ev = fx.events[0];
    const result = await runHooks(
      { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
      { tool: ev.tool, event: ev.event, input: ev.input },
    );
    const inv = result.invocations.find((i) => i.hook === 'behavioral-rule-enforcer');
    expect(inv).toBeDefined();
    expect(inv?.outcome).toBe('allow');
    expect(inv?.reason).toMatch(/risky pattern/);
  });

  it('untrusted-content-tagger flags WebFetch response markers', async () => {
    const fx = JSON.parse(
      await readFile(join(here, 'transcripts', 'behavioral-bypass-attempt.json'), 'utf8'),
    );
    const ev = fx.events[1];
    const result = await runHooks(
      { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
      { tool: ev.tool, event: ev.event, input: ev.input, response: ev.response },
    );
    const inv = result.invocations.find((i) => i.hook === 'untrusted-content-tagger');
    expect(inv).toBeDefined();
    expect(inv?.outcome).toBe('allow');
    expect(inv?.reason).toMatch(/injection marker/);
  });
});
