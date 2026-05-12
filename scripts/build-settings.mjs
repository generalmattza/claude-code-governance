#!/usr/bin/env node
/**
 * build-settings.mjs - Regenerate packages/settings/compiled/*.json.
 *
 * Emits one file per (profile, OS) pair as <profile>.<os>.json, with HOME /
 * USERPROFILE pinned to a stable `USER` placeholder so the artifacts are
 * deterministic across contributors' machines. The checked-in files are the
 * tamper-evidence surface that PR reviewers diff to see the effective deny
 * policy; they are NOT consumed at runtime (ccsec apply re-runs the compiler
 * against the live home directory).
 *
 * Requires @bitsummit/ccsec-cli to be built first (consumes dist/compiler.js).
 * The `build:settings` npm script chains the build.
 *
 * Usage: node scripts/build-settings.mjs
 */

import { writeFile, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { compileProfile } from '../packages/cli/dist/compiler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SETTINGS_ROOT = join(REPO_ROOT, 'packages/settings');
const OUT_DIR = join(SETTINGS_ROOT, 'compiled');

const PROFILES = ['baseline', 'strict', 'regulated'];
const TARGETS = [
  { os: 'macos',   env: { HOME: '/Users/USER' } },
  { os: 'linux',   env: { HOME: '/home/USER' } },
  { os: 'windows', env: { USERPROFILE: 'C:\\Users\\USER' } },
];

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

for (const profile of PROFILES) {
  for (const { os, env } of TARGETS) {
    const compiled = await compileProfile({
      settingsRoot: SETTINGS_ROOT,
      profile,
      os,
      env,
      stripThreatField: false,
    });
    const outPath = join(OUT_DIR, `${profile}.${os}.json`);
    await writeFile(outPath, JSON.stringify(compiled, null, 2) + '\n', 'utf8');
    console.log(`wrote compiled/${profile}.${os}.json`);
  }
}
