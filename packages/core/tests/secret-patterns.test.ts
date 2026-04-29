import { describe, it, expect } from 'vitest';
import { detectSecrets, SECRET_PATTERNS } from '../src/secret-patterns.js';

describe('detectSecrets', () => {
  it('detects AWS access key id', () => {
    const hits = detectSecrets('AKIAIOSFODNN7EXAMPLE');
    expect(hits[0]?.label).toBe('aws_access_key_id');
  });
  it('detects GitHub PAT (classic)', () => {
    expect(detectSecrets('ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789')[0]?.label).toBe('github_pat');
  });
  it('detects Stripe live key', () => {
    expect(detectSecrets('sk_live_' + 'a'.repeat(24))[0]?.label).toBe('stripe_secret_key');
  });
  it('detects PEM private key blocks', () => {
    expect(detectSecrets('-----BEGIN RSA PRIVATE KEY-----\nM\n-----END RSA PRIVATE KEY-----')[0]?.label).toBe('private_key_block');
  });
  it('detects Slack tokens', () => {
    expect(detectSecrets('xoxb-1234567890-1234567890-abcdefghij')[0]?.label).toBe('slack_token');
  });
  it('returns empty for benign text', () => {
    expect(detectSecrets('hello world')).toEqual([]);
  });
  it('redacts the matched value', () => {
    expect(detectSecrets('AKIAIOSFODNN7EXAMPLE')[0]?.redacted).toBe('AKIA****************');
  });
  it('exports a non-empty SECRET_PATTERNS list', () => {
    expect(SECRET_PATTERNS.length).toBeGreaterThanOrEqual(6);
  });
});
