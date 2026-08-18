import { describe, it, expect } from 'vitest';
import { Medication, Patient, DoseLog, FamilyMember } from '../src/types';
import {
  findOverdueUncheckedDoses,
  buildOverdueDoseVerificationMessage
} from '../src/utils/caregiverOverdueEngine';

describe('Caregiver Overdue Dose Verification & Safety Check-in (TDD)', () => {
  const patientPapa: Patient = {
    id: 'patient-grandfather',
    name: 'Don Manuel Poot (Papá)',
    age: 78,
    type: 'chronic'
  };

  const patientMama: Patient = {
    id: 'patient-maria',
    name: 'Doña María Poot (Mamá)',
    age: 74,
    type: 'temporary'
  };

  const caregivers: FamilyMember[] = [
    {
      id: 'fam-1',
      name: 'Lucía Poot (Cuidadora Mañana)',
      relationship: 'Hija / Cuidadora',
      phone: '5219991234567',
      shift: 'morning',
      splitPercentage: 50,
      isActive: true
    }
  ];

  const medications: Medication[] = [
    {
      id: 'med-metformin',
      patientId: 'patient-grandfather',
      name: 'Metformina 500mg',
      presentation: 'tablet',
      currentStock: 20,
      minimumStockAlert: 5,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1, instruction: 'Con el desayuno' }],
        startDate: '2026-01-01'
      }
    },
    {
      id: 'med-cipro',
      patientId: 'patient-maria',
      name: 'Ciprofloxacino 500mg',
      presentation: 'tablet',
      currentStock: 10,
      minimumStockAlert: 2,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1, instruction: 'Con agua' }],
        startDate: '2026-08-15'
      }
    }
  ];

  // At 08:35 AM, Metformina was NOT checked in doseLogs, but Ciprofloxacino was taken
  const doseLogs: DoseLog[] = [
    {
      id: 'log-1',
      medicationId: 'med-cipro',
      patientId: 'patient-maria',
      date: '2026-08-18',
      scheduledTime: '08:00',
      taken: true,
      administeredBy: 'Lucía Poot'
    }
  ];

  it('1. Should detect overdue unchecked doses when current time is past scheduled time', () => {
    // Current time: 08:35 AM on 2026-08-18
    const currentTime = new Date(2026, 7, 18, 8, 35);

    const overdueList = findOverdueUncheckedDoses({
      patients: [patientPapa, patientMama],
      medications,
      doseLogs,
      currentDateTime: currentTime
    });

    expect(overdueList.length).toBe(1);
    expect(overdueList[0].medicationName).toBe('Metformina 500mg');
    expect(overdueList[0].patientName).toBe('Don Manuel Poot (Papá)');
    expect(overdueList[0].scheduledTime).toBe('08:00');
    expect(overdueList[0].minutesOverdue).toBe(35);
  });

  it('2. Should not flag doses that are already marked as taken or in the future', () => {
    // Current time: 07:45 AM (before 08:00)
    const earlyMorning = new Date(2026, 7, 18, 7, 45);

    const overdueList = findOverdueUncheckedDoses({
      patients: [patientPapa, patientMama],
      medications,
      doseLogs,
      currentDateTime: earlyMorning
    });

    expect(overdueList.length).toBe(0);
  });

  it('3. Should build an empathetic WhatsApp verification message to ask caregivers if the dose was given or is pending', () => {
    const overdueItem = {
      patientName: 'Don Manuel Poot (Papá)',
      medicationName: 'Metformina 500mg',
      dose: 1,
      presentation: 'tablet',
      scheduledTime: '08:00',
      instruction: 'Con el desayuno',
      minutesOverdue: 35
    };

    const message = buildOverdueDoseVerificationMessage({
      overdueItem,
      caregiverName: 'Lucía Poot (Cuidadora Mañana)',
      currentDate: '2026-08-18'
    });

    expect(message).toContain('⚠️ *FamHealth - Alerta de Toma Pendiente de Verificación*');
    expect(message).toContain('Don Manuel Poot (Papá)');
    expect(message).toContain('Metformina 500mg');
    expect(message).toContain('08:00');
    expect(message).toContain('¿Ya se le administró el medicamento y solo faltó marcarlo en la app?');
    expect(message).toContain('¿O sigue pendiente de darse?');
    expect(message).toContain('Lucía Poot');
  });
});
