export interface SecretPattern {
  label: string;
  regex: RegExp;
}

export interface SecretHit {
  label: string;
  redacted: string;
  index: number;
}

// The patterns below are an opinionated starting set covering common cloud,
// SaaS, and infra credentials. They are examples — prune entries your org
// doesn't use (to reduce scan cost and false positives) and add any
// org-specific token formats. Each removal also requires deleting the
// corresponding test in tests/secret-patterns.test.ts.
export const SECRET_PATTERNS: SecretPattern[] = [
  { label: 'aws_access_key_id', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: 'github_pat', regex: /\bghp_[A-Za-z0-9]{36}\b/g },
  { label: 'github_token', regex: /\b(?:ghs|gho|ghu|ghr)_[A-Za-z0-9]{36}\b/g },
  { label: 'github_pat_finegrained', regex: /\bgithub_pat_[A-Za-z0-9_]{70,}\b/g },
  { label: 'gitlab_pat', regex: /\bglpat-[A-Za-z0-9_-]{20,}\b/g },
  { label: 'stripe_secret_key', regex: /\bsk_(?:live|test)_[A-Za-z0-9]{24,}\b/g },
  { label: 'private_key_block', regex: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g },
  { label: 'slack_token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { label: 'slack_webhook_url', regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{20,}/g },
  { label: 'google_api_key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { label: 'anthropic_api_key', regex: /\bsk-ant-[A-Za-z0-9_-]{80,}\b/g },
  { label: 'openai_api_key', regex: /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}T3BlbkFJ[A-Za-z0-9_-]{20,}\b/g },
  { label: 'npm_token', regex: /\bnpm_[A-Za-z0-9]{36}\b/g },
  { label: 'huggingface_token', regex: /\bhf_[A-Za-z0-9]{30,}\b/g },
  { label: 'digitalocean_pat', regex: /\bdop_v1_[a-f0-9]{64}\b/g },
  { label: 'sendgrid_api_key', regex: /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{40,}\b/g },
  { label: 'mailgun_api_key', regex: /\bkey-[a-f0-9]{32}\b/g },
  { label: 'atlassian_api_token', regex: /\bATATT3[A-Za-z0-9_-]{180,}\b/g },
  { label: 'aws_session_token', regex: /\bASIA[0-9A-Z]{16}\b/g },
  { label: 'jwt', regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { label: 'gcp_service_account_json', regex: /"type"\s*:\s*"service_account"/g },
  { label: 'db_connection_string_with_credentials', regex: /\b(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|mariadb|redis|rediss|amqps?):\/\/[^\s:@/]+:[^\s@/]+@[^\s/?#]+/g },
  { label: 'vault_token', regex: /\bhvs\.[A-Za-z0-9_-]{90,}\b/g },
  { label: 'terraform_cloud_token', regex: /\b[A-Za-z0-9]{14}\.atlasv1\.[A-Za-z0-9]{60,70}\b/g },
  { label: 'azure_storage_account_key', regex: /AccountKey=[A-Za-z0-9+/=]{86,}/g },
];

function redact(v: string): string {
  if (v.length <= 4) return '*'.repeat(v.length);
  return v.slice(0, 4) + '*'.repeat(v.length - 4);
}

export function detectSecrets(input: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const { label, regex } of SECRET_PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(input)) !== null) {
      hits.push({ label, redacted: redact(m[0]), index: m.index });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}
