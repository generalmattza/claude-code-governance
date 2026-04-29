import { describe, it, expect } from 'vitest';
import { matchesAny } from '../src/matchers.js';

describe('matchesAny', () => {
  it('matches plain equality', () => {
    expect(matchesAny('Bash', ['Bash'])).toBe(true);
    expect(matchesAny('Edit', ['Bash'])).toBe(false);
  });
  it('matches wildcard *', () => {
    expect(matchesAny('AnyTool', ['*'])).toBe(true);
    expect(matchesAny('mcp__server__tool', ['*'])).toBe(true);
  });
  it('matches prefix wildcard', () => {
    expect(matchesAny('mcp__server__tool', ['mcp__*'])).toBe(true);
    expect(matchesAny('Bash', ['mcp__*'])).toBe(false);
  });
  it('matches when any matcher in the list matches', () => {
    expect(matchesAny('Bash', ['Edit', 'Bash', 'Read'])).toBe(true);
    expect(matchesAny('Write', ['Edit', 'Bash', 'Read'])).toBe(false);
  });
  it('returns false on empty matchers list', () => {
    expect(matchesAny('Bash', [])).toBe(false);
  });
  it("does not treat '*' inside the middle of a string as wildcard", () => {
    expect(matchesAny('foo*bar', ['foo*bar'])).toBe(true);
    expect(matchesAny('foobar', ['foo*bar'])).toBe(false);
  });
});
