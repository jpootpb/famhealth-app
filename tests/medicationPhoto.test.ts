import { describe, it, expect } from 'vitest';
import { Medication } from '../src/types';

describe('Medication Visual Box Photo & Brand Identification (TDD)', () => {
  it('1. Should store medication with image URL and laboratory brand', () => {
    const med: Medication = {
      id: 'med-janumet',
      patientId: 'patient-grandfather',
      name: 'Sitagliptin / Metformin (50/500mg)',
      presentation: 'tablet',
      laboratory: 'MSD / Janumet (Original Brand)',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1 }],
        startDate: '2026-01-01'
      },
      currentStock: 28,
      minimumStockAlert: 6
    };

    expect(med.imageUrl).toBeDefined();
    expect(med.imageUrl).toContain('data:image/png');
    expect(med.laboratory).toBe('MSD / Janumet (Original Brand)');
  });

  it('2. Should allow optional image for generic medications without photo', () => {
    const genericMed: Medication = {
      id: 'med-aspirin',
      patientId: 'patient-grandfather',
      name: 'Aspirin Protect',
      presentation: 'tablet',
      frequency: {
        type: 'every_n_days',
        intervalDays: 4,
        doseSlots: [{ time: '14:00', dose: 1 }],
        startDate: '2026-08-14'
      },
      currentStock: 18,
      minimumStockAlert: 5
    };

    expect(genericMed.imageUrl).toBeUndefined();
    expect(genericMed.laboratory).toBeUndefined();
  });
});
