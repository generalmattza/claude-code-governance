import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HookModule, HookProfile, HookSeverity, ProfileSeverity } from '@bitsummit/ccsec-core';
import { AuditLogger } from '@bitsummit/ccsec-core';

const HOOKS_DIST = fileURLToPath(new URL('../../../hooks/dist', import.meta.url));

export interface RunHookArgs {
  name: string;
  profile: HookProfile;
}

function resolveSeverity(severity: ProfileSeverity, profile: HookProfile): HookSeverity {
  return typeof severity === 'string' ? severity : severity[profile];
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8').trim();
}

export async function runHookCommand(args: RunHookArgs): Promise<void> {
  const raw = await readStdin();
  let ctx: Record<string, unknown> = {};
  if (raw) {
    try { ctx = JSON.parse(raw); }
    catch {
      process.stderr.write('ccsec run-hook: invalid JSON on stdin\n');
      process.exit(1);
    }
  }

  const hookPath = join(HOOKS_DIST, args.name, 'index.js');
  let hookModule: HookModule;
  try {
    const m = await import(`file://${hookPath}`);
    hookModule = (m.default ?? m) as HookModule;
  } catch {
    process.stderr.write(`ccsec run-hook: hook '${args.name}' not found at ${hookPath}\n`);
    process.exit(1);
  }

  if (!hookModule.manifest.profiles.includes(args.profile)) process.exit(0);

  const toolName = (ctx.tool_name as string) ?? '';
  const toolInput = (ctx.tool_input as Record<string, unknown>) ?? {};
  const toolResponse = ctx.tool_response as Record<string, unknown> | undefined;

  const startMs = Date.now();
  const controller = new AbortController();
  const timeoutMs = hookModule.manifest.timeout_ms ?? 1500;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let decision: { decision: string; reason: string };
  try {
    decision = await Promise.race([
      hookModule.run({
        tool: toolName,
        input: toolInput,
        ...(toolResponse ? { response: toolResponse } : {}),
        env: process.env as Record<string, string>,
        paths: {
          home: process.env.HOME ?? '',
          ssh: `${process.env.HOME}/.ssh`,
          aws: `${process.env.HOME}/.aws`,
          tmp: '/tmp',
        },
        log: (msg: string) => process.stderr.write(msg + '\n'),
        abort: controller.signal,
      }),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('timeout')));
      }),
    ]);
  } catch {
    clearTimeout(timer);
    process.exit(0);
  }
  clearTimeout(timer);

  const durationMs = Date.now() - startMs;
  const logPath = process.env.CCSEC_AUDIT_LOG_PATH || `${process.env.HOME}/.claude/ccsec-audit.jsonl`;
  const logger = new AuditLogger(logPath);
  await logger.write({
    hook: args.name,
    tool: toolName,
    decision: decision.decision,
    reason: decision.reason,
    duration_ms: durationMs,
  }).catch(() => undefined);

  if (decision.decision === 'block') {
    const severity = resolveSeverity(hookModule.manifest.severity, args.profile);
    if (severity === 'block') {
      process.stderr.write(`[${args.name}] ${decision.reason}\n`);
      process.exit(2);
    }
    process.stderr.write(`[${args.name}] WARNING: ${decision.reason}\n`);
  }

  process.exit(0);
}
