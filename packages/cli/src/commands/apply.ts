import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { TargetOS } from '@bitsummit/ccsec-core';
import { compileProfile } from '../compiler.js';

export interface ApplyCommandArgs {
  settingsRoot: string;
  profile: 'baseline' | 'strict' | 'regulated';
  claudeDir: string;
  os: TargetOS;
  env?: Readonly<Record<string, string>>;
  dryRun: boolean;
}

interface Lockfile { profile: string; ccsec_version: string; applied_at: string; settings_sha256: string; }
const VERSION = '0.1.0-alpha.0';
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function applyCommand(args: ApplyCommandArgs): Promise<{ wrote: boolean }> {
  const compiled = await compileProfile({
    settingsRoot: args.settingsRoot,
    profile: args.profile,
    os: args.os,
    ...(args.env !== undefined ? { env: args.env } : {}),
    stripThreatField: false,
  });
  const settingsPath = join(args.claudeDir, 'settings.json');
  const lockPath = join(args.claudeDir, '.ccsec-lock.json');

  try {
    const lock = JSON.parse(await readFile(lockPath, 'utf8')) as Lockfile;
    const existing = await readFile(settingsPath, 'utf8');
    if (sha256(existing) !== lock.settings_sha256) {
      throw new Error(`existing ${settingsPath} has been modified since last apply; refusing to clobber.`);
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }

  if (args.dryRun) return { wrote: false };

  await mkdir(args.claudeDir, { recursive: true });
  const body = JSON.stringify(compiled, null, 2) + '\n';
  await writeFile(settingsPath, body, 'utf8');
  const lock: Lockfile = { profile: args.profile, ccsec_version: VERSION, applied_at: new Date().toISOString(), settings_sha256: sha256(body) };
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
  return { wrote: true };
}
