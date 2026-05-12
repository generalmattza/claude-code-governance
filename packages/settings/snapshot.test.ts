import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compileProfile } from '../cli/src/compiler.js';
import type { TargetOS } from '@bitsummit/ccsec-core';

const here = dirname(fileURLToPath(import.meta.url));

const PROFILES = ['baseline', 'strict', 'regulated'] as const;
const TARGETS: ReadonlyArray<{ os: TargetOS; env: Record<string, string> }> = [
  { os: 'macos',   env: { HOME: '/Users/USER' } },
  { os: 'linux',   env: { HOME: '/home/USER' } },
  { os: 'windows', env: { USERPROFILE: 'C:\\Users\\USER' } },
];

describe('settings/compiled artifacts match the compiler', () => {
  for (const profile of PROFILES) {
    for (const { os, env } of TARGETS) {
      it(`${profile}.${os}.json matches compileProfile output`, async () => {
        const compiled = await compileProfile({
          settingsRoot: here,
          profile,
          os,
          env,
          stripThreatField: false,
        });
        const onDisk = JSON.parse(
          await readFile(join(here, 'compiled', `${profile}.${os}.json`), 'utf8'),
        );
        expect(onDisk).toEqual(compiled);
      });
    }
  }
});
