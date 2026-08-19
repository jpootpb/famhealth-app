import { describe, it, expect } from 'vitest';
import {
  exportFamilySyncPayload,
  parseAndValidateFamilySyncPayload
} from '../src/lib/cloudSyncEngine';
import { FamilyCircle, Patient, Medication } from '../src/types';

describe('Cloud Sync & Family Backup Engine', () => {
  const familyCircle: FamilyCircle = {
    id: 'circle-poot-ibarra',
    name: 'Familia Poot Ibarra',
    inviteCode: 'IBARRA-2026',
    createdAt: '2026-08-18'
  };

  const patient: Patient = {
    id: 'patient-mama',
    familyId: 'circle-poot-ibarra',
    name: 'Sara Burgos',
    type: 'chronic'
  };

  const medication: Medication = {
    id: 'med-losartan',
    patientId: 'patient-mama',
    familyId: 'circle-poot-ibarra',
    name: 'Losartán 50mg',
    presentation: 'tablet',
    currentStock: 30,
    minimumStockAlert: 5,
    treatmentType: 'chronic',
    frequency: { type: 'fixed_slots', doseSlots: [{ time: '08:00', dose: 1 }] }
  };

  it('1. Exports family data into valid JSON payload isolating only the target family', () => {
    const jsonStr = exportFamilySyncPayload({
      familyCircle,
      patients: [patient],
      medications: [medication],
      doseLogs: [],
      vitals: [],
      expenses: [],
      appointments: [],
      studies: []
    });

    expect(typeof jsonStr).toBe('string');
    const result = parseAndValidateFamilySyncPayload(jsonStr);
    expect(result.success).toBe(true);
    expect(result.payload?.familyId).toBe('circle-poot-ibarra');
    expect(result.payload?.patients.length).toBe(1);
    expect(result.payload?.medications.length).toBe(1);
  });

  it('2. Rejects corrupted or invalid JSON', () => {
    const result = parseAndValidateFamilySyncPayload('invalid-json');
    expect(result.success).toBe(false);
  });
});
