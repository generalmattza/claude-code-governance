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

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
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
    if (k === 'permissions' || k === 'hooks') continue;
    const sv = source[k];
    const tv = target[k];
    if (isPlainObject(sv) && isPlainObject(tv)) {
      // Deep-merge plain objects so extends fragments can each contribute
      // siblings into the same top-level key (audit.log_path,
      // audit.egress_allowlist, audit.verify_on_session_start).
      target[k] = { ...tv, ...sv };
    } else if (!(k in target)) {
      target[k] = sv;
    }
  }
}

// Apply overrides to non-permission/non-hook top-level keys.
// Sub-keys explicitly set by overrides REPLACE the merged extends value
// (so strict/regulated can tighten audit.egress_allowlist), while
// sub-keys not mentioned by the override are preserved (so audit.log_path
// from base.json survives even when overrides.audit only sets
// egress_allowlist).
function applyTopLevelOverrides(target: SettingsFragment, overrides: SettingsFragment): void {
  for (const k of Object.keys(overrides)) {
    if (k === 'permissions' || k === 'hooks') continue;
    const ov = overrides[k];
    const tv = target[k];
    if (isPlainObject(ov) && isPlainObject(tv)) {
      target[k] = { ...tv, ...ov };
    } else {
      target[k] = ov;
    }
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
  if (profile.overrides) {
    const overrides = profile.overrides as SettingsFragment;
    // permissions and hooks accumulate (defense-in-depth): a profile can add
    // additional denies / hook references on top of extends fragments.
    mergeFragments(merged, overrides);
    // Other top-level keys (audit, schema, etc.) get a shallow REPLACE
    // at the sub-key level: explicitly set sub-keys win, untouched
    // sub-keys (like audit.log_path from base.json) survive. This lets
    // strict and regulated tighten audit.egress_allowlist past what the
    // network-egress overlay defines without forcing them to restate
    // audit.log_path or audit.verify_on_session_start.
    applyTopLevelOverrides(merged, overrides);
  }

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
