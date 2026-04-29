import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveTokens, type TargetOS } from '@bitsummit/ccsec-core';

export interface CompileOptions {
  settingsRoot: string;
  profile: 'baseline' | 'strict' | 'regulated';
  os: TargetOS;
  env?: Readonly<Record<string, string>>;
  stripThreatField?: boolean;
}

interface ProfileFile { extends: string[]; overrides: Record<string, unknown>; }
interface SettingsFragment {
  permissions?: { deny?: Array<{ pattern: string; threat?: string }>; allow?: string[] };
  hooks?: Record<string, Array<{ name: string }>>;
  [k: string]: unknown;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

function mergeFragments(target: SettingsFragment, source: SettingsFragment): void {
  if (source.permissions?.deny) {
    target.permissions ??= {};
    target.permissions.deny ??= [];
    target.permissions.deny.push(...source.permissions.deny);
  }
  if (source.permissions?.allow) {
    target.permissions ??= {};
    target.permissions.allow ??= [];
    target.permissions.allow.push(...source.permissions.allow);
  }
  if (source.hooks) {
    target.hooks ??= {};
    for (const [event, list] of Object.entries(source.hooks)) {
      target.hooks[event] = (target.hooks[event] ?? []).concat(list);
    }
  }
  for (const k of Object.keys(source)) {
    if (k !== 'permissions' && k !== 'hooks' && !(k in target)) target[k] = source[k];
  }
}

export async function compileProfile(opts: CompileOptions): Promise<SettingsFragment> {
  const profilePath = join(opts.settingsRoot, 'profiles', `${opts.profile}.json`);
  let profile: ProfileFile;
  try { profile = await readJson<ProfileFile>(profilePath); }
  catch { throw new Error(`profile not found: ${opts.profile} at ${profilePath}`); }

  const merged: SettingsFragment = {};
  for (const ref of profile.extends) {
    const frag = await readJson<SettingsFragment>(join(opts.settingsRoot, `${ref}.json`));
    mergeFragments(merged, frag);
  }
  if (profile.overrides) mergeFragments(merged, profile.overrides as SettingsFragment);

  const env = opts.env ?? (process.env as Record<string, string>);
  if (merged.permissions?.deny) {
    merged.permissions.deny = merged.permissions.deny.map(d => ({ ...d, pattern: resolveTokens(d.pattern, opts.os, env) }));
  }
  if (merged.permissions?.allow) {
    merged.permissions.allow = merged.permissions.allow.map(p => resolveTokens(p, opts.os, env));
  }
  if (opts.stripThreatField && merged.permissions?.deny) {
    merged.permissions.deny = merged.permissions.deny.map(({ threat: _t, ...rest }) => rest);
  }
  return merged;
}
