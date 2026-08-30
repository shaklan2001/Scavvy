import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('production package', () => {
  it('starts the TypeScript output path produced by the build', () => {
    const dockerfile = readFileSync(new URL('../../Dockerfile', import.meta.url), 'utf8');
    expect(existsSync(new URL('../../dist/src/server.js', import.meta.url))).toBe(true);
    expect(dockerfile).toContain('CMD ["node", "dist/src/server.js"]');
  });
});
