import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runHooks } from '../src/runner.js';
import type { HookModule } from '../src/types.js';

const allowHook: HookModule = {
  manifest: { name: 'allow-all', event: 'PreToolUse', matchers: ['Bash'], threat: 'T-999-test', profiles: ['baseline'], severity: 'log', timeout_ms: 1000 },
  run: async () => ({ decision: 'allow', reason: 'ok' }),
};
const blockHook: HookModule = {
  manifest: { name: 'block-all', event: 'PreToolUse', matchers: ['Bash'], threat: 'T-001-secret-leak', profiles: ['baseline'], severity: 'block', timeout_ms: 1000 },
  run: async () => ({ decision: 'block', reason: 'denied' }),
};
const slowHook: HookModule = {
  manifest: { name: 'slow', event: 'PreToolUse', matchers: ['Bash'], threat: 'T-016-hook-dos', profiles: ['baseline'], severity: 'log', timeout_ms: 100 },
  run: () => new Promise(r => setTimeout(() => r({ decision: 'allow', reason: 'ok' }), 500)),
};
const wrongMatcher: HookModule = { ...allowHook, manifest: { ...allowHook.manifest, name: 'edit-only', matchers: ['Edit'] } };

const profileSeverityHook: HookModule = {
  manifest: {
    name: 'profile-severity',
    event: 'PreToolUse',
    matchers: ['Bash'],
    threat: 'T-002-profile-severity',
    profiles: ['baseline', 'strict', 'regulated'],
    severity: { baseline: 'warn', strict: 'block', regulated: 'block' },
    timeout_ms: 1000,
  },
  run: async () => ({ decision: 'block', reason: 'profile-severity-trigger' }),
};

const wildcardHook: HookModule = {
  manifest: {
    name: 'wildcard-mcp',
    event: 'PreToolUse',
    matchers: ['mcp__*'],
    threat: 'T-003-mcp-wildcard',
    profiles: ['baseline'],
    severity: 'block',
    timeout_ms: 1000,
  },
  run: async () => ({ decision: 'block', reason: 'mcp blocked' }),
};

const postUseHook: HookModule = {
  manifest: {
    name: 'post-use-leak',
    event: 'PostToolUse',
    matchers: ['Bash'],
    threat: 'T-004-leak',
    profiles: ['baseline'],
    severity: 'block',
    timeout_ms: 1000,
  },
  run: async (ctx) => {
    const stdout = ctx.response?.stdout ?? '';
    if (typeof stdout === 'string' && stdout.includes('LEAKED')) {
      return { decision: 'block', reason: 'leak detected in stdout' };
    }
    return { decision: 'allow', reason: 'clean' };
  },
};

let auditPath: string;
beforeEach(async () => {
  auditPath = join(await mkdtemp(join(tmpdir(), 'ccsec-runner-')), 'audit.jsonl');
});

describe('runHooks', () => {
  it('aggregate allow when all hooks allow', async () => {
    const r = await runHooks({ hooks: [allowHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.decision).toBe('allow');
  });
  it('block if any hook blocks', async () => {
    const r = await runHooks({ hooks: [allowHook, blockHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.decision).toBe('block');
    expect(r.blockedBy).toBe('block-all');
  });
  it('skips hooks whose matcher does not match', async () => {
    const r = await runHooks({ hooks: [wrongMatcher], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.invocations).toHaveLength(0);
  });
  it('skips hooks not in active profile', async () => {
    const r = await runHooks({ hooks: [blockHook], profile: 'strict', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.decision).toBe('allow');
  });
  it('aborts hook that exceeds timeout_ms', async () => {
    const r = await runHooks({ hooks: [slowHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.invocations[0]?.outcome).toBe('timeout');
  });
  it('writes one audit record per invocation', async () => {
    await runHooks({ hooks: [allowHook, blockHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    const lines = (await readFile(auditPath, 'utf8')).trim().split('\n');
    expect(lines).toHaveLength(2);
  });
  it('continues running remaining hooks after a block', async () => {
    const r = await runHooks({ hooks: [blockHook, allowHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.invocations).toHaveLength(2);
  });
  it('per-profile severity: block under baseline becomes warn', async () => {
    const r = await runHooks({ hooks: [profileSeverityHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.decision).toBe('warn');
    expect(r.invocations[0]?.outcome).toBe('warn');
  });
  it('per-profile severity: block stays block under strict', async () => {
    const r = await runHooks({ hooks: [profileSeverityHook], profile: 'strict', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.decision).toBe('block');
    expect(r.blockedBy).toBe('profile-severity');
    expect(r.invocations[0]?.outcome).toBe('block');
  });
  it('wildcard matcher mcp__* matches mcp__server__exec', async () => {
    const r = await runHooks({ hooks: [wildcardHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'mcp__server__exec', input: {}, event: 'PreToolUse' });
    expect(r.decision).toBe('block');
    expect(r.invocations).toHaveLength(1);
  });
  it('wildcard matcher mcp__* does NOT match Bash', async () => {
    const r = await runHooks({ hooks: [wildcardHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PreToolUse' });
    expect(r.invocations).toHaveLength(0);
  });
  it('PostToolUse hook reads ctx.response.stdout and blocks on LEAKED', async () => {
    const r = await runHooks({ hooks: [postUseHook], profile: 'baseline', auditLogPath: auditPath },
      { tool: 'Bash', input: {}, event: 'PostToolUse', response: { stdout: 'output: LEAKED secret' } });
    expect(r.decision).toBe('block');
    expect(r.blockedBy).toBe('post-use-leak');
  });
});
