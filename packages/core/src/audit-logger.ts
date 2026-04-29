import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

export interface AuditInput {
  hook: string;
  tool: string;
  decision: string;
  reason: string;
  duration_ms: number;
  evidence_digest?: string;
  _ts?: string;
}

export interface AuditRecord extends AuditInput {
  ts: string;
  prev_hash?: string;
  hash: string;
}

function hashRecord(record: Omit<AuditRecord, 'hash'>): string {
  return createHash('sha256').update(JSON.stringify(record)).digest('hex');
}

export class AuditLogger {
  private prevHash: string | undefined;
  constructor(private readonly path: string) {}

  async write(input: AuditInput): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    if (this.prevHash === undefined) this.prevHash = await this.loadLastHash();
    const ts = input._ts ?? new Date().toISOString();
    const { _ts, ...rest } = input;
    const base: Omit<AuditRecord, 'hash'> = {
      ...rest,
      ts,
      ...(this.prevHash !== undefined ? { prev_hash: this.prevHash } : {}),
    };
    const hash = hashRecord(base);
    this.prevHash = hash;
    await appendFile(this.path, JSON.stringify({ ...base, hash }) + '\n', 'utf8');
  }

  private async loadLastHash(): Promise<string | undefined> {
    try {
      const lines = (await readFile(this.path, 'utf8')).trim().split('\n').filter(Boolean);
      const last = lines[lines.length - 1];
      return last ? JSON.parse(last).hash : undefined;
    } catch {
      return undefined;
    }
  }

  static async verify(path: string): Promise<{ ok: boolean; records: number; brokenAt?: number }> {
    const lines = (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean);
    let prev: string | undefined;
    for (let i = 0; i < lines.length; i++) {
      const r = JSON.parse(lines[i]!) as AuditRecord;
      if (r.prev_hash !== prev) return { ok: false, records: lines.length, brokenAt: i };
      const { hash, ...rest } = r;
      if (hashRecord(rest) !== hash) return { ok: false, records: lines.length, brokenAt: i };
      prev = hash;
    }
    return { ok: true, records: lines.length };
  }
}
