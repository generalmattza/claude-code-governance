import { describe, it, expect, beforeEach } from 'vitest';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runHooks } from '@bitsummit/ccsec-core';
import secretGuard from '@bitsummit/ccsec-hooks/dist/secret-guard/index.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('integration: secret-leak-attempt transcript', () => {
  let auditPath: string;
  beforeEach(async () => {
    auditPath = join(await mkdtemp(join(tmpdir(), 'ccsec-int-')), 'audit.jsonl');
  });

  it('replay matches expected decisions', async () => {
    const fixture = JSON.parse(await readFile(join(here, 'transcripts', 'secret-leak-attempt.json'), 'utf8'));
    for (let i = 0; i < fixture.events.length; i++) {
      const ev = fixture.events[i];
      const exp = fixture.expected[i];
      const result = await runHooks(
        { hooks: [secretGuard], profile: 'baseline', auditLogPath: auditPath },
        { tool: ev.tool, event: ev.event, input: ev.input },
      );
      expect(result.decision, `event ${i}`).toBe(exp.decision);
      if (exp.blockedBy) expect(result.blockedBy).toBe(exp.blockedBy);
    }
  });
});
