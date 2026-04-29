import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileProfile } from '../src/compiler.js';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ccsec-comp-'));
  await mkdir(join(root, 'overlays'), { recursive: true });
  await mkdir(join(root, 'profiles'), { recursive: true });
  await writeFile(join(root, 'base.json'), JSON.stringify({ schema: 1, permissions: { deny: [] }, hooks: {} }));
  await writeFile(join(root, 'overlays', 'secrets.json'), JSON.stringify({
    permissions: { deny: [{ pattern: 'Bash(printenv *)', threat: 'T-001-secret-leak' }] },
    hooks: { PreToolUse: [{ name: 'secret-guard' }] },
  }));
  await writeFile(join(root, 'profiles', 'baseline.json'), JSON.stringify({ extends: ['base', 'overlays/secrets'], overrides: {} }));
});

describe('compileProfile', () => {
  it('produces a flat settings.json from base + overlay', async () => {
    const out = await compileProfile({ settingsRoot: root, profile: 'baseline', os: 'macos' });
    expect(out.permissions.deny).toHaveLength(1);
    expect(out.hooks.PreToolUse[0].name).toBe('secret-guard');
  });
  it('strips threat field when stripThreatField=true', async () => {
    const out = await compileProfile({ settingsRoot: root, profile: 'baseline', os: 'macos', stripThreatField: true });
    expect(out.permissions.deny[0].threat).toBeUndefined();
  });
  it('resolves path tokens against target OS', async () => {
    await writeFile(join(root, 'overlays', 'paths.json'), JSON.stringify({
      permissions: { deny: [{ pattern: 'Read(${HOME}/.ssh/**)', threat: 'T-003-credential-exfil' }] },
      hooks: {},
    }));
    await writeFile(join(root, 'profiles', 'baseline.json'), JSON.stringify({ extends: ['base', 'overlays/secrets', 'overlays/paths'], overrides: {} }));
    const out = await compileProfile({ settingsRoot: root, profile: 'baseline', os: 'macos', env: { HOME: '/Users/x' } });
    expect(out.permissions.deny.find((d: { pattern: string }) => d.pattern.includes('/Users/x/.ssh'))).toBeTruthy();
  });
  it('throws on unknown profile', async () => {
    await expect(compileProfile({ settingsRoot: root, profile: 'nonexistent' as never, os: 'macos' })).rejects.toThrow();
  });
  it('respects overrides block', async () => {
    await writeFile(join(root, 'profiles', 'baseline.json'), JSON.stringify({
      extends: ['base', 'overlays/secrets'],
      overrides: { permissions: { allow: ['Bash(ls *)'] } },
    }));
    const out = await compileProfile({ settingsRoot: root, profile: 'baseline', os: 'macos' });
    expect(out.permissions.allow).toContain('Bash(ls *)');
  });
  it('propagates audit from extends overlays', async () => {
    await writeFile(join(root, 'overlays', 'audit.json'), JSON.stringify({
      audit: { egress_allowlist: ['github.com', 'pypi.org'] },
      hooks: {},
    }));
    await writeFile(join(root, 'profiles', 'baseline.json'), JSON.stringify({
      extends: ['base', 'overlays/audit'],
      overrides: {},
    }));
    const out = await compileProfile({ settingsRoot: root, profile: 'baseline', os: 'macos' });
    expect(out.audit).toEqual({ egress_allowlist: ['github.com', 'pypi.org'] });
  });
  it('overrides.audit REPLACES audit sub-keys but preserves untouched siblings', async () => {
    await writeFile(join(root, 'base.json'), JSON.stringify({
      schema: 1,
      permissions: { deny: [] },
      hooks: {},
      audit: { log_path: '/tmp/x.jsonl' },
    }));
    await writeFile(join(root, 'overlays', 'audit.json'), JSON.stringify({
      audit: { egress_allowlist: ['a.example', 'b.example', 'c.example'] },
      hooks: {},
    }));
    await writeFile(join(root, 'profiles', 'strict.json'), JSON.stringify({
      extends: ['base', 'overlays/audit'],
      overrides: { audit: { egress_allowlist: ['a.example'] } },
    }));
    const out = await compileProfile({ settingsRoot: root, profile: 'strict', os: 'macos' });
    // egress_allowlist replaced by override
    expect((out.audit as { egress_allowlist: string[] }).egress_allowlist).toEqual(['a.example']);
    // log_path from base.json preserved (override didn't touch it)
    expect((out.audit as { log_path: string }).log_path).toBe('/tmp/x.jsonl');
  });
  it('extends fragments deep-merge into top-level objects', async () => {
    await writeFile(join(root, 'base.json'), JSON.stringify({
      schema: 1,
      permissions: { deny: [] },
      hooks: {},
      audit: { log_path: '/tmp/x.jsonl' },
    }));
    await writeFile(join(root, 'overlays', 'audit.json'), JSON.stringify({
      audit: { verify_on_session_start: true },
      hooks: {},
    }));
    await writeFile(join(root, 'overlays', 'egress.json'), JSON.stringify({
      audit: { egress_allowlist: ['github.com'] },
      hooks: {},
    }));
    await writeFile(join(root, 'profiles', 'baseline.json'), JSON.stringify({
      extends: ['base', 'overlays/audit', 'overlays/egress'],
      overrides: {},
    }));
    const out = await compileProfile({ settingsRoot: root, profile: 'baseline', os: 'macos' });
    expect(out.audit).toEqual({
      log_path: '/tmp/x.jsonl',
      verify_on_session_start: true,
      egress_allowlist: ['github.com'],
    });
  });
});
