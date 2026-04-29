import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorCommand } from '../src/commands/doctor.js';

let claudeDir: string;
beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ccsec-doctor-'));
  claudeDir = join(root, '.claude');
  await mkdir(claudeDir, { recursive: true });
});

describe('doctor command', () => {
  it('reports missing settings.json', async () => {
    const r = await doctorCommand({ claudeDir });
    expect(r.findings.some(f => f.code === 'missing_settings')).toBe(true);
  });
  it('reports stale lockfile when settings.json hash drifts', async () => {
    await writeFile(join(claudeDir, 'settings.json'), '{}');
    await writeFile(join(claudeDir, '.ccsec-lock.json'), JSON.stringify({
      profile: 'baseline', ccsec_version: '0.1.0-alpha.0',
      applied_at: '2026-01-01T00:00:00Z', settings_sha256: 'deadbeef',
    }));
    const r = await doctorCommand({ claudeDir });
    expect(r.findings.some(f => f.code === 'lockfile_drift')).toBe(true);
  });
  it('returns ok=true when matched', async () => {
    const settings = '{}\n';
    const { createHash } = await import('node:crypto');
    const sha = createHash('sha256').update(settings).digest('hex');
    await writeFile(join(claudeDir, 'settings.json'), settings);
    await writeFile(join(claudeDir, '.ccsec-lock.json'), JSON.stringify({
      profile: 'baseline', ccsec_version: '0.1.0-alpha.0',
      applied_at: '2026-01-01T00:00:00Z', settings_sha256: sha,
    }));
    const r = await doctorCommand({ claudeDir });
    expect(r.ok).toBe(true);
  });
});
