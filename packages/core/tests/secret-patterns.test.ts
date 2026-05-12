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
  it('detects AWS session token', () => {
    expect(detectSecrets('ASIAIOSFODNN7EXAMPLE')[0]?.label).toBe('aws_session_token');
  });
  it('detects JWTs', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    expect(detectSecrets(jwt)[0]?.label).toBe('jwt');
  });
  it('detects GCP service account JSON marker', () => {
    expect(detectSecrets('{ "type": "service_account", "project_id": "x" }')[0]?.label).toBe('gcp_service_account_json');
  });
  it('detects DB connection strings with embedded credentials', () => {
    const hits = detectSecrets('postgres://admin:hunter2@db.example.com:5432/app');
    expect(hits[0]?.label).toBe('db_connection_string_with_credentials');
  });
  it('does not flag credential-less DB connection strings', () => {
    const hits = detectSecrets('postgres://db.example.com:5432/app');
    expect(hits.find((h) => h.label === 'db_connection_string_with_credentials')).toBeUndefined();
  });
  it('detects Vault tokens', () => {
    expect(detectSecrets('hvs.' + 'a'.repeat(90))[0]?.label).toBe('vault_token');
  });
  it('detects Terraform Cloud tokens', () => {
    expect(detectSecrets('a'.repeat(14) + '.atlasv1.' + 'a'.repeat(60))[0]?.label).toBe('terraform_cloud_token');
  });
  it('detects Azure storage account keys', () => {
    expect(detectSecrets('AccountKey=' + 'a'.repeat(86) + '==')[0]?.label).toBe('azure_storage_account_key');
  });
});
