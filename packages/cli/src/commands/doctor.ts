import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export interface DoctorArgs { claudeDir: string; }
export interface DoctorFinding {
  code: 'missing_settings' | 'missing_lockfile' | 'lockfile_drift' | 'invalid_lockfile';
  message: string;
}
export interface DoctorResult { ok: boolean; findings: DoctorFinding[]; }

export async function doctorCommand(args: DoctorArgs): Promise<DoctorResult> {
  const findings: DoctorFinding[] = [];
  const settingsPath = join(args.claudeDir, 'settings.json');
  const lockPath = join(args.claudeDir, '.ccsec-lock.json');

  let settingsBody: string | null = null;
  try { settingsBody = await readFile(settingsPath, 'utf8'); }
  catch { findings.push({ code: 'missing_settings', message: `${settingsPath} not found` }); }

  let lockBody: string | null = null;
  try { lockBody = await readFile(lockPath, 'utf8'); }
  catch { if (settingsBody) findings.push({ code: 'missing_lockfile', message: `${lockPath} not found` }); }

  if (settingsBody && lockBody) {
    try {
      const lock = JSON.parse(lockBody) as { settings_sha256: string };
      const sha = createHash('sha256').update(settingsBody).digest('hex');
      if (sha !== lock.settings_sha256) {
        findings.push({ code: 'lockfile_drift', message: 'settings.json hash differs from lockfile' });
      }
    } catch {
      findings.push({ code: 'invalid_lockfile', message: `${lockPath} is not valid JSON` });
    }
  }
  return { ok: findings.length === 0, findings };
}
