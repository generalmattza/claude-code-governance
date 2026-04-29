import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { TargetOS } from '@bitsummit/ccsec-core';
import { compileProfile } from '../compiler.js';

export interface CompileCommandArgs {
  settingsRoot: string;
  profile: 'baseline' | 'strict' | 'regulated';
  out: string;
  target: 'managed' | 'user';
  os: TargetOS;
  env?: Readonly<Record<string, string>>;
}

export async function compileCommand(args: CompileCommandArgs): Promise<void> {
  const compiled = await compileProfile({
    settingsRoot: args.settingsRoot,
    profile: args.profile,
    os: args.os,
    ...(args.env !== undefined ? { env: args.env } : {}),
    stripThreatField: args.target === 'managed',
  });
  await mkdir(dirname(args.out), { recursive: true });
  await writeFile(args.out, JSON.stringify(compiled, null, 2) + '\n', 'utf8');
}
