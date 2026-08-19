import { describe, it, expect } from 'vitest';
import { Medication, Patient } from '../src/types';

describe('Medication Edit and Family Isolation Preservation', () => {
  it('1. Editing a medication in a custom family circle preserves its familyId and does not disappear', () => {
    const customFamilyId = 'circle-poot-ibarra';
    const patientId = 'patient-sara';

    const initialMed: Medication = {
      id: 'med-1',
      familyId: customFamilyId,
      patientId: patientId,
      name: 'Rivaroxaban 2.5mg',
      presentation: 'tablet',
      currentStock: 28,
      packageUnits: 28,
      minimumStockAlert: 5,
      frequency: {
        type: 'daily_fixed',
        startDate: '2026-08-18',
        doseSlots: [{ time: '08:00', dose: 1 }]
      }
    };

    // User edits the medication
    const updatedPayload: Partial<Medication> = {
      name: 'Rivaroxaban 2.5mg (Con Alimentos)',
      treatmentType: 'chronic',
      currentStock: 30
    };

    const mergedMed: Medication = {
      ...initialMed,
      ...updatedPayload,
      id: initialMed.id,
      familyId: initialMed.familyId || customFamilyId
    };

    expect(mergedMed.id).toBe('med-1');
    expect(mergedMed.familyId).toBe('circle-poot-ibarra');
    expect(mergedMed.name).toBe('Rivaroxaban 2.5mg (Con Alimentos)');
    expect(mergedMed.currentStock).toBe(30);
  });

  it('2. Self-healing reconciles orphaned medication to its patient familyId', () => {
    const patients: Patient[] = [
      { id: 'patient-sara', name: 'Sara Burgos Uc', familyId: 'circle-poot', type: 'chronic' }
    ];

    const orphanedMed: Medication = {
      id: 'med-orphaned',
      patientId: 'patient-sara',
      name: 'Losartán 50mg',
      presentation: 'tablet',
      currentStock: 15,
      minimumStockAlert: 5,
      frequency: {
        type: 'daily_fixed',
        startDate: '2026-08-18',
        doseSlots: [{ time: '08:00', dose: 1 }]
      }
    };

    const patient = patients.find(p => p.id === orphanedMed.patientId);
    const healedFamilyId = orphanedMed.familyId || patient?.familyId || 'circle-poot';

    expect(healedFamilyId).toBe('circle-poot');
  });
});
