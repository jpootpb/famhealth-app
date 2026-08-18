import { describe, it, expect } from 'vitest';
import { generateFamilyInviteCode, filterFamilyData } from '../src/utils/familyEngine';
import { FamilyCircle, Patient, Medication } from '../src/types';

describe('Multi-Tenancy Family Circles & Data Partitioning (TDD)', () => {
  it('1. Should generate clean uppercase 6-8 char invite codes', () => {
    const code1 = generateFamilyInviteCode('Familia Poot');
    const code2 = generateFamilyInviteCode('Gomez Family');

    expect(code1).toMatch(/^[A-Z]{3,4}-[0-9]{4}$/);
    expect(code2).toMatch(/^[A-Z]{3,4}-[0-9]{4}$/);
  });

  it('2. Should strictly isolate data between distinct family circles', () => {
    const familyA: FamilyCircle = { id: 'fam-poot', name: 'Familia Poot', inviteCode: 'POOT-1234', createdAt: '2026-08-17' };
    const familyB: FamilyCircle = { id: 'fam-gomez', name: 'Familia Gomez (In-laws)', inviteCode: 'GOME-5678', createdAt: '2026-08-17' };

    const allPatients: Patient[] = [
      { id: 'p-1', familyId: 'fam-poot', name: 'Don Manuel Poot', type: 'chronic' },
      { id: 'p-2', familyId: 'fam-gomez', name: 'Doña Rosa Gomez', type: 'chronic' }
    ];

    const allMedications: Medication[] = [
      { id: 'm-1', familyId: 'fam-poot', patientId: 'p-1', name: 'Metformin', presentation: 'tablet', frequency: { type: 'daily_fixed', doseSlots: [{ time: '08:00', dose: 1 }], startDate: '2026-01-01' }, currentStock: 20, minimumStockAlert: 5 },
      { id: 'm-2', familyId: 'fam-gomez', patientId: 'p-2', name: 'Losartan', presentation: 'tablet', frequency: { type: 'daily_fixed', doseSlots: [{ time: '09:00', dose: 1 }], startDate: '2026-01-01' }, currentStock: 30, minimumStockAlert: 5 }
    ];

    // Filter for Family A (Poot)
    const pootPatients = filterFamilyData(allPatients, familyA.id);
    const pootMeds = filterFamilyData(allMedications, familyA.id);

    expect(pootPatients.length).toBe(1);
    expect(pootPatients[0].name).toBe('Don Manuel Poot');
    expect(pootMeds.length).toBe(1);
    expect(pootMeds[0].name).toBe('Metformin');

    // Filter for Family B (Gomez)
    const gomezPatients = filterFamilyData(allPatients, familyB.id);
    const gomezMeds = filterFamilyData(allMedications, familyB.id);

    expect(gomezPatients.length).toBe(1);
    expect(gomezPatients[0].name).toBe('Doña Rosa Gomez');
    expect(gomezMeds.length).toBe(1);
    expect(gomezMeds[0].name).toBe('Losartan');
  });

  it('3. Should join an existing family circle matching invite code', () => {
    const circles: FamilyCircle[] = [
      { id: 'fam-1', name: 'Familia Poot', inviteCode: 'POOT-7890', createdAt: '2026-08-17' },
      { id: 'fam-2', name: 'Familia Perez', inviteCode: 'PERE-4321', createdAt: '2026-08-17' }
    ];

    const enteredCode = 'poot-7890'; // Case insensitive
    const found = circles.find(c => c.inviteCode.toUpperCase() === enteredCode.trim().toUpperCase());

    expect(found).toBeDefined();
    expect(found?.name).toBe('Familia Poot');
  });
});
