// Shared all-hooks import for integration tests. Imports every hook
// from the built dist/ output so the tests exercise the same code path
// the runtime distributable uses.
import secretGuard from '@bitsummit/ccsec-hooks/dist/secret-guard/index.js';
import secretLeakDetector from '@bitsummit/ccsec-hooks/dist/secret-leak-detector/index.js';
import keychainGuard from '@bitsummit/ccsec-hooks/dist/keychain-guard/index.js';
import mcpSecretGuard from '@bitsummit/ccsec-hooks/dist/mcp-secret-guard/index.js';
import destructiveFsGuard from '@bitsummit/ccsec-hooks/dist/destructive-fs-guard/index.js';
import gitDestructiveGuard from '@bitsummit/ccsec-hooks/dist/git-destructive-guard/index.js';
import sensitivePathsGuard from '@bitsummit/ccsec-hooks/dist/sensitive-paths-guard/index.js';
import dotfileGuard from '@bitsummit/ccsec-hooks/dist/dotfile-guard/index.js';
import bashStructuralGuard from '@bitsummit/ccsec-hooks/dist/bash-structural-guard/index.js';
import pipeToShellGuard from '@bitsummit/ccsec-hooks/dist/pipe-to-shell-guard/index.js';
import branchProtectionGuard from '@bitsummit/ccsec-hooks/dist/branch-protection-guard/index.js';
import commitAmendPushedGuard from '@bitsummit/ccsec-hooks/dist/commit-amend-pushed-guard/index.js';
import submoduleInjectionGuard from '@bitsummit/ccsec-hooks/dist/submodule-injection-guard/index.js';
import gitHistoryRewriteGuard from '@bitsummit/ccsec-hooks/dist/git-history-rewrite-guard/index.js';
import webfetchEgressGuard from '@bitsummit/ccsec-hooks/dist/webfetch-egress-guard/index.js';
import bashEgressGuard from '@bitsummit/ccsec-hooks/dist/bash-egress-guard/index.js';
import auditTamperDetector from '@bitsummit/ccsec-hooks/dist/audit-tamper-detector/index.js';
import auditSessionSummary from '@bitsummit/ccsec-hooks/dist/audit-session-summary/index.js';
import behavioralRuleEnforcer from '@bitsummit/ccsec-hooks/dist/behavioral-rule-enforcer/index.js';
import claudeMdValidator from '@bitsummit/ccsec-hooks/dist/claude-md-validator/index.js';
import untrustedContentTagger from '@bitsummit/ccsec-hooks/dist/untrusted-content-tagger/index.js';
import disableAllHooksDetector from '@bitsummit/ccsec-hooks/dist/disable-all-hooks-detector/index.js';
import localSettingsPrecedenceChecker from '@bitsummit/ccsec-hooks/dist/local-settings-precedence-checker/index.js';
import subagentSpawnGuard from '@bitsummit/ccsec-hooks/dist/subagent-spawn-guard/index.js';
import taskToolInputGuard from '@bitsummit/ccsec-hooks/dist/task-tool-input-guard/index.js';
import agentAllowlistEnforcer from '@bitsummit/ccsec-hooks/dist/agent-allowlist-enforcer/index.js';

export const ALL_HOOKS = [
  secretGuard,
  secretLeakDetector,
  keychainGuard,
  mcpSecretGuard,
  destructiveFsGuard,
  gitDestructiveGuard,
  sensitivePathsGuard,
  dotfileGuard,
  bashStructuralGuard,
  pipeToShellGuard,
  branchProtectionGuard,
  commitAmendPushedGuard,
  submoduleInjectionGuard,
  gitHistoryRewriteGuard,
  webfetchEgressGuard,
  bashEgressGuard,
  auditTamperDetector,
  auditSessionSummary,
  behavioralRuleEnforcer,
  claudeMdValidator,
  untrustedContentTagger,
  disableAllHooksDetector,
  localSettingsPrecedenceChecker,
  subagentSpawnGuard,
  taskToolInputGuard,
  agentAllowlistEnforcer,
];
