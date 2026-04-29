export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'UserPromptSubmit'
  | 'SessionStart'
  | 'SubagentStart'
  | 'SubagentStop';

export type HookSeverity = 'block' | 'warn' | 'log';
export type HookProfile = 'baseline' | 'strict' | 'regulated';
export type HookDecisionKind = 'allow' | 'block' | 'warn';
export type ProfileSeverity = HookSeverity | Record<HookProfile, HookSeverity>;

export interface HookManifest {
  name: string;
  event: HookEvent;
  matchers: string[];
  threat: string;
  profiles: HookProfile[];
  severity: ProfileSeverity;
  timeout_ms: number;
}

export interface HookContext {
  tool: string;
  input: Record<string, unknown>;
  response?: { stdout?: string; stderr?: string; output?: unknown; [k: string]: unknown };
  env: Readonly<Record<string, string>>;
  paths: { home: string; ssh: string; aws: string; tmp: string };
  log: (msg: string) => void;
  abort: AbortSignal;
}

export interface HookDecision {
  decision: HookDecisionKind;
  reason: string;
  evidence?: Record<string, unknown>;
}

export interface HookModule {
  manifest: HookManifest;
  run: (ctx: HookContext) => Promise<HookDecision>;
}
