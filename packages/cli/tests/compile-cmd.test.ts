import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileCommand } from '../src/commands/compile.js';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ccsec-cli-comp-'));
  await mkdir(join(root, 'settings/overlays'), { recursive: true });
  await mkdir(join(root, 'settings/profiles'), { recursive: true });
  await writeFile(join(root, 'settings/base.json'), JSON.stringify({ schema: 1, permissions: { deny: [] }, hooks: {} }));
  await writeFile(join(root, 'settings/overlays/secrets.json'), JSON.stringify({
    permissions: { deny: [{ pattern: 'Bash(env)', threat: 'T-001-secret-leak' }] },
    hooks: { PreToolUse: [{ name: 'secret-guard' }] },
  }));
  await writeFile(join(root, 'settings/profiles/baseline.json'), JSON.stringify({ extends: ['base', 'overlays/secrets'], overrides: {} }));
});

describe('compile command', () => {
  it('writes compiled settings.json to --out', async () => {
    const outPath = join(root, 'compiled.json');
    await compileCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', out: outPath, target: 'managed', os: 'macos', env: { HOME: '/Users/x' } });
    const compiled = JSON.parse(await readFile(outPath, 'utf8'));
    expect(compiled.permissions.deny[0].pattern).toBe('Bash(env)');
    expect(compiled.permissions.deny[0].threat).toBeUndefined();
  });
  it('keeps threat field when --target user', async () => {
    const outPath = join(root, 'compiled-user.json');
    await compileCommand({ settingsRoot: join(root, 'settings'), profile: 'baseline', out: outPath, target: 'user', os: 'macos', env: { HOME: '/Users/x' } });
    const compiled = JSON.parse(await readFile(outPath, 'utf8'));
    expect(compiled.permissions.deny[0].threat).toBe('T-001-secret-leak');
  });
});
