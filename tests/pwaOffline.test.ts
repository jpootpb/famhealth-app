import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest & Offline Service Worker (Task 12)', () => {
  it('1. Should validate Web App Manifest configuration', () => {
    const manifestPath = path.resolve(__dirname, '../public/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBe('FamHealth - Family Health & Medication Hub');
    expect(manifest.short_name).toBe('FamHealth');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0284c7');
    expect(manifest.background_color).toBe('#f8fafc');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('2. Should validate Service Worker script existence and cache strategy', () => {
    const swPath = path.resolve(__dirname, '../public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('CACHE_NAME');
    expect(swContent).toContain('famhealth-cache-v1');
    expect(swContent).toContain('self.addEventListener');
    expect(swContent).toContain('caches.open');
  });
});
