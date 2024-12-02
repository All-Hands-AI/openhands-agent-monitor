import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Build Script', () => {
  it('should include cache building in the build script', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    expect(packageJson.scripts.build).toContain('build:cache');
    expect(packageJson.scripts.build).toContain('vite build');
  });

  it('should have the build:cache script defined', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    expect(packageJson.scripts['build:cache']).toBeDefined();
    expect(packageJson.scripts['build:cache']).toContain('tsx scripts/build-cache.ts');
  });
});