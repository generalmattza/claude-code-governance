import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyCommand } from '../src/commands/apply.js';

let root: string;
let claudeDir: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ccsec-cli-apply-'));
  claudeDir = join(root, '.claude');
  await mkdir(join(root, 'settings/overlays'), { recursive: true });
  await mkdir(join(root, 'settings/profiles'), { recursive: true });
  await writeFile(join(root, 'settings/base.json'), JSON.stringify({ schema: 1, permissions: { deny: [] }, hooks: {} }));
  await writeFile(join(root, 'settings/overlays/secrets.json'), JSON.stringify({
    permissions: { deny: [{ pattern: 'Bash(env)', threat: 'T-001-secret-leak' }] }, hooks: {},
  }));
  await writeFile(join(root, 'settings/profiles/baseline.json'), JSON.stringify({ extends: ['base', 'overlays/secrets'], overrides: {} }));
});

describe('apply command', () => {
  it('writes settings.json + lockfile', async () => {
    await applyCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', claudeDir, os: 'macos', env: { HOME: '/Users/x' }, dryRun: false });
    const settings = JSON.parse(await readFile(join(claudeDir, 'settings.json'), 'utf8'));
    const lock = JSON.parse(await readFile(join(claudeDir, '.ccsec-lock.json'), 'utf8'));
    expect(settings.permissions.deny[0].pattern).toBe('Bash(env)');
    expect(lock.profile).toBe('baseline');
  });
  it('does not write when dryRun=true', async () => {
    await applyCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', claudeDir, os: 'macos', env: { HOME: '/Users/x' }, dryRun: true });
    await expect(stat(join(claudeDir, 'settings.json'))).rejects.toThrow();
  });
  it('refuses to clobber a user-modified settings.json', async () => {
    await applyCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', claudeDir, os: 'macos', env: { HOME: '/Users/x' }, dryRun: false });
    await writeFile(join(claudeDir, 'settings.json'), '{ "permissions": { "deny": [] } }');
    await expect(applyCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', claudeDir, os: 'macos', env: { HOME: '/Users/x' }, dryRun: false })).rejects.toThrow(/modified/);
  });
  it('force=true overrides the user-modification clobber guard', async () => {
    await applyCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', claudeDir, os: 'macos', env: { HOME: '/Users/x' }, dryRun: false });
    await writeFile(join(claudeDir, 'settings.json'), '{ "permissions": { "deny": [] } }');
    const r = await applyCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', claudeDir, os: 'macos', env: { HOME: '/Users/x' }, dryRun: false, force: true });
    expect(r.wrote).toBe(true);
    const settings = JSON.parse(await readFile(join(claudeDir, 'settings.json'), 'utf8'));
    expect(settings.permissions.deny[0].pattern).toBe('Bash(env)');
  });
  it('installRules=true creates CLAUDE.md from the template', async () => {
    const rulesRoot = join(root, 'rules-templates');
    await mkdir(rulesRoot, { recursive: true });
    await writeFile(join(rulesRoot, 'baseline.md'), '# Baseline rules\n- never echo secrets\n');
    const r = await applyCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', claudeDir, os: 'macos', env: { HOME: '/Users/x' }, dryRun: false, installRules: true, rulesRoot });
    expect(r.wrote).toBe(true);
    expect(r.rulesInstalled).toBe(true);
    const claudeMd = await readFile(join(claudeDir, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('# Baseline rules');
  });
  it('installRules=true does not overwrite an existing CLAUDE.md', async () => {
    const rulesRoot = join(root, 'rules-templates');
    await mkdir(rulesRoot, { recursive: true });
    await writeFile(join(rulesRoot, 'baseline.md'), '# Baseline rules\n- never echo secrets\n');
    await mkdir(claudeDir, { recursive: true });
    await writeFile(join(claudeDir, 'CLAUDE.md'), '# user content\nkeep me\n');
    const r = await applyCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', claudeDir, os: 'macos', env: { HOME: '/Users/x' }, dryRun: false, installRules: true, rulesRoot });
    expect(r.wrote).toBe(true);
    expect(r.rulesInstalled).toBe(false);
    const claudeMd = await readFile(join(claudeDir, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toBe('# user content\nkeep me\n');
  });
});
