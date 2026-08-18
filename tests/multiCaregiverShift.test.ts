import { describe, it, expect } from 'vitest';
import { FamilyMember, DoseLog, Patient, Medication, DoseSlot } from '../src/types';
import { getCaregiversForShift, buildDoseTakenWhatsAppMessage } from '../src/lib/whatsapp';

describe('Multi-Caregiver Co-Presence & Shift Sharing (TDD)', () => {
  const familyMembers: FamilyMember[] = [
    {
      id: 'fam-carlos',
      name: 'Carlos Poot',
      shift: 'night',
      isActive: true,
      splitPercentage: 33.3
    },
    {
      id: 'fam-lucia',
      name: 'Lucia Poot',
      shift: 'night',
      isActive: true,
      splitPercentage: 33.3
    },
    {
      id: 'fam-jorge',
      name: 'Jorge Poot',
      shift: 'night',
      isActive: true,
      splitPercentage: 33.3
    },
    {
      id: 'fam-ana',
      name: 'Ana Poot',
      shift: 'morning',
      isActive: true,
      splitPercentage: 0
    }
  ];

  it('1. Should return all caregivers assigned to the night shift (2 or 3 co-present caregivers)', () => {
    const nightCaregivers = getCaregiversForShift(familyMembers, 'night');
    expect(nightCaregivers.length).toBe(3);
    expect(nightCaregivers.map(c => c.name)).toEqual(['Carlos Poot', 'Lucia Poot', 'Jorge Poot']);
  });

  it('2. Should record exact sibling who administered the dose even in shared shift', () => {
    const patient: Patient = { id: 'p-1', name: 'Don Manuel Poot', type: 'chronic' };
    const medication: Medication = {
      id: 'm-1',
      patientId: 'p-1',
      name: 'Metformina 500mg',
      presentation: 'tablet',
      currentStock: 20,
      minimumStockAlert: 5,
      frequency: { type: 'daily_fixed', doseSlots: [{ time: '20:00', dose: 1 }], startDate: '2026-01-01' }
    };
    const slot: DoseSlot = { time: '20:00', dose: 1 };

    // Lucia gave the dose tonight
    const msg = buildDoseTakenWhatsAppMessage(patient, medication, slot, 'Lucia Poot');
    expect(msg).toContain('Lucia Poot');
    expect(msg).toContain('Metformina 500mg');
  });
});
