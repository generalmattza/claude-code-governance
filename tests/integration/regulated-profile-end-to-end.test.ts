import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runHooks } from '@bitsummit/ccsec-core';
import { ALL_HOOKS } from './_all-hooks.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('integration: regulated-profile-end-to-end', () => {
  beforeAll(() => {
    process.env.HOME = '/Users/x';
  });
  let auditPath: string;
  beforeEach(async () => {
    auditPath = join(await mkdtemp(join(tmpdir(), 'ccsec-int-')), 'audit.jsonl');
  });

  it('regulated profile escalates dotfile to block; full attack chain blocked end-to-end', async () => {
    const fx = JSON.parse(
      await readFile(join(here, 'transcripts', 'regulated-profile-end-to-end.json'), 'utf8'),
    );
    for (let i = 0; i < fx.events.length; i++) {
      const ev = fx.events[i];
      const exp = fx.expected[i];
      const result = await runHooks(
        { hooks: ALL_HOOKS, profile: 'regulated', auditLogPath: auditPath },
        { tool: ev.tool, event: ev.event, input: ev.input, response: ev.response },
      );
      expect(result.decision, `event ${i}`).toBe(exp.decision);
      if (exp.blockedBy) expect(result.blockedBy).toBe(exp.blockedBy);
    }
  });

  it('baseline returns warn for the dotfile event (proving regulated escalates)', async () => {
    const fx = JSON.parse(
      await readFile(join(here, 'transcripts', 'regulated-profile-end-to-end.json'), 'utf8'),
    );
    const ev = fx.events[2]; // dotfile edit
    const baselineResult = await runHooks(
      { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
      { tool: ev.tool, event: ev.event, input: ev.input },
    );
    expect(baselineResult.decision).toBe('warn');
    const regulatedResult = await runHooks(
      { hooks: ALL_HOOKS, profile: 'regulated', auditLogPath: auditPath },
      { tool: ev.tool, event: ev.event, input: ev.input },
    );
    expect(regulatedResult.decision).toBe('block');
    expect(regulatedResult.blockedBy).toBe('dotfile-guard');
  });
});
