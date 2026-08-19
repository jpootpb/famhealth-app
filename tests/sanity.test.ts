import { describe, it, expect } from 'vitest';
import { Medication } from '../src/types';

describe('Sanity & Testing Harness Check', () => {
  it('should pass basic math assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify vitest environment is operational', () => {
    const appName = 'SaludFamiliar';
    expect(appName).toContain('Salud');
  });

  it('should support commercial name, active generic compound, and dosage strength on medications', () => {
    const forxiga: Medication = {
      id: 'med-forxiga-10',
      patientId: 'patient-1',
      name: 'Forxiga',
      activeIngredient: 'Dapagliflozina',
      dosageStrength: '10 mg',
      presentation: 'tablet',
      laboratory: 'AstraZeneca',
      indication: 'Diabetes Tipo 2',
      currentStock: 28,
      minimumStockAlert: 5,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1 }],
        startDate: '2026-08-01'
      }
    };

    expect(forxiga.name).toBe('Forxiga');
    expect(forxiga.activeIngredient).toBe('Dapagliflozina');
    expect(forxiga.dosageStrength).toBe('10 mg');
    expect(forxiga.laboratory).toBe('AstraZeneca');
  });
});

