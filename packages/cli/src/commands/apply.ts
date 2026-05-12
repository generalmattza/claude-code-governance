import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import type { TargetOS, HookProfile } from '@bitsummit/ccsec-core';
import { compileProfile } from '../compiler.js';

export interface ApplyCommandArgs {
  settingsRoot: string;
  profile: 'baseline' | 'strict' | 'regulated';
  claudeDir: string;
  os: TargetOS;
  env?: Readonly<Record<string, string>>;
  dryRun: boolean;
  force?: boolean;
  installRules?: boolean;
  rulesRoot?: string;
  /** Override the ccsec bin path used in hook commands (defaults to this package's bin/ccsec.js). */
  ccsecBin?: string;
  /** Override the hooks dist path (defaults to packages/hooks/dist relative to this file). */
  hooksDistPath?: string;
}

const DEFAULT_HOOKS_DIST = fileURLToPath(new URL('../../../hooks/dist', import.meta.url));
const DEFAULT_CCSEC_BIN = fileURLToPath(new URL('../../bin/ccsec.js', import.meta.url));

type ClaudeHookEntry = { type: 'command'; command: string };
type ClaudeHookGroup = { matcher: string; hooks: ClaudeHookEntry[] };

async function resolveHooks(
  hooks: Record<string, Array<{ name: string }>>,
  profile: HookProfile,
  hooksDistPath: string,
  ccsecBin: string,
): Promise<Record<string, ClaudeHookGroup[]>> {
  const result: Record<string, ClaudeHookGroup[]> = {};

  for (const [event, refs] of Object.entries(hooks)) {
    // Map matcher-key -> hook names, preserving order
    const byMatcher = new Map<string, string[]>();

    for (const ref of refs) {
      const modPath = join(hooksDistPath, ref.name, 'index.js');
      let manifest: { matchers: string[]; profiles: string[] };
      try {
        const m = await import(`file://${modPath}`);
        manifest = (m.manifest ?? m.default?.manifest) as typeof manifest;
        if (!manifest) continue;
      } catch {
        continue;
      }
      if (!manifest.profiles.includes(profile)) continue;

      // Claude Code matcher: "" means match-all, otherwise pipe-separated tool names
      const matcherKey = manifest.matchers.includes('*') ? '' : manifest.matchers.join('|');
      if (!byMatcher.has(matcherKey)) byMatcher.set(matcherKey, []);
      byMatcher.get(matcherKey)!.push(ref.name);
    }

    result[event] = [];
    for (const [matcher, names] of byMatcher) {
      result[event].push({
        matcher,
        hooks: names.map(name => ({
          type: 'command',
          command: `node ${ccsecBin} run-hook --name ${name} --profile ${profile}`,
        })),
      });
    }
  }

  return result;
}

interface Lockfile { profile: string; ccsec_version: string; applied_at: string; settings_sha256: string; }
const VERSION = '0.1.0-alpha.0';
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

const DEFAULT_RULES_ROOT = fileURLToPath(new URL('../../../rules/templates', import.meta.url));

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw e;
  }
}

export async function applyCommand(args: ApplyCommandArgs): Promise<{ wrote: boolean; rulesInstalled?: boolean }> {
  const compiled = await compileProfile({
    settingsRoot: args.settingsRoot,
    profile: args.profile,
    os: args.os,
    ...(args.env !== undefined ? { env: args.env } : {}),
    stripThreatField: false,
  });

  // Claude Code requires deny entries to be plain strings, not objects.
  // Extract the pattern and discard threat metadata before writing.
  if (compiled.permissions?.deny) {
    (compiled.permissions as Record<string, unknown>).deny =
      compiled.permissions.deny.map(d => d.pattern);
  }

  // Translate internal {name} hook refs to Claude Code {matcher, hooks:[{type,command}]} format
  if (compiled.hooks && Object.keys(compiled.hooks).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (compiled as any).hooks = await resolveHooks(
      compiled.hooks as Record<string, Array<{ name: string }>>,
      args.profile,
      args.hooksDistPath ?? DEFAULT_HOOKS_DIST,
      args.ccsecBin ?? DEFAULT_CCSEC_BIN,
    );
  }

  const settingsPath = join(args.claudeDir, 'settings.json');
  const lockPath = join(args.claudeDir, '.ccsec-lock.json');

  if (!args.force) {
    try {
      const lock = JSON.parse(await readFile(lockPath, 'utf8')) as Lockfile;
      const existing = await readFile(settingsPath, 'utf8');
      if (sha256(existing) !== lock.settings_sha256) {
        throw new Error(`existing ${settingsPath} has been modified since last apply; refusing to clobber.`);
      }
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }

  if (args.dryRun) return { wrote: false };

  await mkdir(args.claudeDir, { recursive: true });
  const body = JSON.stringify(compiled, null, 2) + '\n';
  await writeFile(settingsPath, body, 'utf8');
  const lock: Lockfile = { profile: args.profile, ccsec_version: VERSION, applied_at: new Date().toISOString(), settings_sha256: sha256(body) };
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');

  let rulesInstalled = false;
  if (args.installRules) {
    const rulesRoot = args.rulesRoot ?? DEFAULT_RULES_ROOT;
    const claudeMdPath = join(args.claudeDir, 'CLAUDE.md');
    if (!(await pathExists(claudeMdPath))) {
      const templatePath = join(rulesRoot, `${args.profile}.md`);
      const template = await readFile(templatePath, 'utf8');
      await writeFile(claudeMdPath, template, 'utf8');
      rulesInstalled = true;
    }
  }

  return { wrote: true, rulesInstalled };
}
