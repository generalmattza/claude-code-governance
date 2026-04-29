import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runHooks } from '@bitsummit/ccsec-core';
import { ALL_HOOKS } from './_all-hooks.js';

describe('integration: mdm-bypass-attempt', () => {
  beforeAll(() => {
    process.env.HOME = '/Users/x';
  });
  let auditPath: string;
  let localSettingsPath: string;
  beforeEach(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ccsec-mdm-'));
    auditPath = join(dir, 'audit.jsonl');
    localSettingsPath = join(dir, 'settings.local.json');
    await writeFile(localSettingsPath, JSON.stringify({ disableAllHooks: true }), 'utf8');
  });

  it('baseline: disable-all-hooks-detector warns; precedence checker warns', async () => {
    const env = { CCSEC_LOCAL_SETTINGS_PATH: localSettingsPath };
    const result = await runHooks(
      { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
      { tool: 'session', event: 'SessionStart', input: {}, env },
    );
    expect(result.decision).toBe('warn');
    const detector = result.invocations.find((i) => i.hook === 'disable-all-hooks-detector');
    expect(detector?.outcome).toBe('warn');
    expect(detector?.reason).toMatch(/disableAllHooks/);
    const precedence = result.invocations.find(
      (i) => i.hook === 'local-settings-precedence-checker',
    );
    expect(precedence?.outcome).toBe('warn');
  });

  it('regulated: precedence checker upgrades to block, detector remains warn (passive per ADR-0003)', async () => {
    const env = { CCSEC_LOCAL_SETTINGS_PATH: localSettingsPath };
    const result = await runHooks(
      { hooks: ALL_HOOKS, profile: 'regulated', auditLogPath: auditPath },
      { tool: 'session', event: 'SessionStart', input: {}, env },
    );
    expect(result.decision).toBe('block');
    expect(result.blockedBy).toBe('local-settings-precedence-checker');
    const detector = result.invocations.find((i) => i.hook === 'disable-all-hooks-detector');
    expect(detector?.outcome).toBe('warn');
  });

  it('detector reports no issue when disableAllHooks is absent', async () => {
    const cleanPath = join(await mkdtemp(join(tmpdir(), 'ccsec-mdm-clean-')), 'settings.local.json');
    await writeFile(cleanPath, JSON.stringify({ theme: 'dark' }), 'utf8');
    const env = { CCSEC_LOCAL_SETTINGS_PATH: cleanPath };
    const result = await runHooks(
      { hooks: ALL_HOOKS, profile: 'baseline', auditLogPath: auditPath },
      { tool: 'session', event: 'SessionStart', input: {}, env },
    );
    const detector = result.invocations.find((i) => i.hook === 'disable-all-hooks-detector');
    expect(detector?.outcome).toBe('allow');
  });
});
