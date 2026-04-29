export interface SecretPattern {
  label: string;
  regex: RegExp;
}

export interface SecretHit {
  label: string;
  redacted: string;
  index: number;
}

export const SECRET_PATTERNS: SecretPattern[] = [
  { label: 'aws_access_key_id', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: 'github_pat', regex: /\bghp_[A-Za-z0-9]{36}\b/g },
  { label: 'github_pat_finegrained', regex: /\bgithub_pat_[A-Za-z0-9_]{70,}\b/g },
  { label: 'stripe_secret_key', regex: /\bsk_(?:live|test)_[A-Za-z0-9]{24,}\b/g },
  { label: 'private_key_block', regex: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g },
  { label: 'slack_token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { label: 'google_api_key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
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
