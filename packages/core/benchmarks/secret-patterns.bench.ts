// Throughput benchmarks for `detectSecrets`. Run with `npm run bench` from
// this package (or `npx vitest bench benchmarks` for watch mode). Results are
// printed to stdout: hz (ops/sec), min/max/mean, p75/p99/p995/p999, and RME.
// Not part of `npm test` — vitest's default include skips `*.bench.ts`.
//
// Cases cover three sizes of benign filler (1 KB / 64 KB / 512 KB) to surface
// per-call overhead vs. steady-state throughput, plus a 64 KB corpus salted
// with two real-looking secrets every 1 KB to measure the hit-path cost.
import { bench, describe } from 'vitest';
import { detectSecrets } from '../src/secret-patterns.js';

function makeCorpus(sizeBytes: number, secretEveryBytes = 0): string {
  const filler =
    'The quick brown fox jumps over the lazy dog. ' +
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
    '0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ\n';
  const secret = 'AKIAIOSFODNN7EXAMPLE ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789 ';
  let out = '';
  let sinceSecret = 0;
  while (out.length < sizeBytes) {
    out += filler;
    sinceSecret += filler.length;
    if (secretEveryBytes > 0 && sinceSecret >= secretEveryBytes) {
      out += secret;
      sinceSecret = 0;
    }
  }
  return out.slice(0, sizeBytes);
}

const benign1KB = makeCorpus(1 * 1024);
const benign64KB = makeCorpus(64 * 1024);
const benign512KB = makeCorpus(512 * 1024);
const peppered64KB = makeCorpus(64 * 1024, 1024);

describe('detectSecrets — benign text', () => {
  bench('1 KB', () => {
    detectSecrets(benign1KB);
  });
  bench('64 KB', () => {
    detectSecrets(benign64KB);
  });
  bench('512 KB', () => {
    detectSecrets(benign512KB);
  });
});

describe('detectSecrets — with hits', () => {
  bench('64 KB, secret every 1 KB', () => {
    detectSecrets(peppered64KB);
  });
});
