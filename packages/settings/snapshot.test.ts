import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

describe('settings/compiled snapshots', () => {
  it('baseline.json matches checked-in snapshot', async () => {
    const body = await readFile(join(here, 'compiled', 'baseline.json'), 'utf8');
    expect(body).toMatchSnapshot();
  });
});
