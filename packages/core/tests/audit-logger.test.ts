import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AuditLogger } from '../src/audit-logger.js';

describe('AuditLogger', () => {
  let path: string;
  beforeEach(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ccsec-audit-'));
    path = join(dir, 'audit.jsonl');
  });

  it('appends one JSONL record per write', async () => {
    const logger = new AuditLogger(path);
    await logger.write({ hook: 'a', tool: 'Bash', decision: 'block', reason: 'r', duration_ms: 1 });
    await logger.write({ hook: 'b', tool: 'Bash', decision: 'allow', reason: 'r', duration_ms: 1 });
    const lines = (await readFile(path, 'utf8')).trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('chains records via hash + prev_hash', async () => {
    const logger = new AuditLogger(path);
    await logger.write({ hook: 'a', tool: 'Bash', decision: 'allow', reason: 'r', duration_ms: 1 });
    await logger.write({ hook: 'b', tool: 'Bash', decision: 'allow', reason: 'r', duration_ms: 1 });
    const lines = (await readFile(path, 'utf8')).trim().split('\n');
    const r1 = JSON.parse(lines[0]!), r2 = JSON.parse(lines[1]!);
    expect(r2.prev_hash).toBe(r1.hash);
    expect(r1.prev_hash).toBeUndefined();
  });

  it('verifies an intact log', async () => {
    const logger = new AuditLogger(path);
    await logger.write({ hook: 'a', tool: 'Bash', decision: 'allow', reason: 'r', duration_ms: 1 });
    await logger.write({ hook: 'b', tool: 'Bash', decision: 'allow', reason: 'r', duration_ms: 1 });
    expect(await AuditLogger.verify(path)).toEqual({ ok: true, records: 2 });
  });

  it('detects tampering on verify', async () => {
    const logger = new AuditLogger(path);
    await logger.write({ hook: 'a', tool: 'Bash', decision: 'allow', reason: 'r', duration_ms: 1 });
    await logger.write({ hook: 'b', tool: 'Bash', decision: 'allow', reason: 'r', duration_ms: 1 });
    const tampered = (await readFile(path, 'utf8')).replace('"reason":"r"', '"reason":"X"');
    await writeFile(path, tampered);
    expect((await AuditLogger.verify(path)).ok).toBe(false);
  });
});
