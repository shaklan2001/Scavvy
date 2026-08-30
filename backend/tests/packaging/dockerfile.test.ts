import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('production package', () => {
  it('starts the output path declared by the TypeScript build configuration', () => {
    const dockerfile = readFileSync(new URL('../../Dockerfile', import.meta.url), 'utf8');
    const tsconfig = JSON.parse(readFileSync(new URL('../../tsconfig.json', import.meta.url), 'utf8')) as {
      compilerOptions: { outDir?: string; rootDir?: string };
    };
    expect(tsconfig.compilerOptions).toMatchObject({ rootDir: '.', outDir: 'dist' });
    expect(dockerfile).toContain('CMD ["node", "dist/src/server.js"]');
  });
});
