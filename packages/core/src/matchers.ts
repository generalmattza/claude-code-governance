export function matchesAny(tool: string, matchers: readonly string[]): boolean {
  for (const m of matchers) {
    if (m === '*') return true;
    if (m === tool) return true;
    if (m.endsWith('*') && !m.slice(0, -1).includes('*')) {
      const prefix = m.slice(0, -1);
      if (tool.startsWith(prefix)) return true;
    }
  }
  return false;
}
