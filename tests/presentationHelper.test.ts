import { describe, it, expect } from 'vitest';
import { getPresentationConfig } from '../src/utils/presentationHelper';

describe('Medication Presentation Configurations', () => {
  it('1. Gotas (drops) uses manual bottle and specific drop labels', () => {
    const config = getPresentationConfig('drops', 'es');
    expect(config.defaultTrackingMode).toBe('manual_bottle');
    expect(config.label).toContain('Gotas Oftálmicas');
    expect(config.bottleCountLabel).toContain('Frascos / Goteros');
    expect(config.doseOptions.some(d => d.label.includes('gota'))).toBe(true);
  });

  it('2. Sobres (sachet) uses pieces and specific sachet labels', () => {
    const config = getPresentationConfig('sachet', 'es');
    expect(config.defaultTrackingMode).toBe('pieces');
    expect(config.label).toContain('Sobre');
    expect(config.stockCountLabel).toContain('Sobres en Existencia');
    expect(config.unitsPerBoxLabel).toContain('Sobres por Caja');
    expect(config.doseOptions.some(d => d.label.includes('sobre'))).toBe(true);
  });

  it('3. Jarabes (syrup) uses manual bottle and ml dose options', () => {
    const config = getPresentationConfig('syrup', 'es');
    expect(config.defaultTrackingMode).toBe('manual_bottle');
    expect(config.label).toContain('Jarabe');
    expect(config.bottleCountLabel).toContain('Frascos de Jarabe');
    expect(config.doseOptions.some(d => d.label.includes('ml'))).toBe(true);
  });

  it('4. Cápsulas, Pomadas and Inyectables have dedicated metadata', () => {
    const cream = getPresentationConfig('cream', 'es');
    expect(cream.bottleCountLabel).toContain('Tubos / Pomadas');

    const injection = getPresentationConfig('injection', 'es');
    expect(injection.stockCountLabel).toContain('Ampolletas');

    const capsule = getPresentationConfig('capsule', 'es');
    expect(capsule.stockCountLabel).toContain('Cápsulas en Existencia');
  });
});
