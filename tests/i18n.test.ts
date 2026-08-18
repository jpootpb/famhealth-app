import { describe, it, expect } from 'vitest';
import { translations } from '../src/i18n/translations';

describe('Bilingual Internationalization (i18n) Engine', () => {
  it('1. Should have matching translation keys in both Spanish and English', () => {
    const esKeys = Object.keys(translations.es).sort();
    const enKeys = Object.keys(translations.en).sort();

    expect(esKeys.length).toBeGreaterThan(30);
    expect(esKeys).toEqual(enKeys);
  });

  it('2. Should render correct translations in Spanish', () => {
    expect(translations.es.tabTimeline).toBe('Cronograma Diario');
    expect(translations.es.tabMedications).toBe('Botiquín y Stock');
    expect(translations.es.enableAlerts).toBe('Activar Alertas');
  });

  it('3. Should render correct translations in English', () => {
    expect(translations.en.tabTimeline).toBe('Daily Timeline');
    expect(translations.en.tabMedications).toBe('Medications & Stock');
    expect(translations.en.enableAlerts).toBe('Enable Alerts');
  });
});
