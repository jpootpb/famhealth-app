import { describe, it, expect } from 'vitest';
import { Medication, Patient, DoseLog } from '../src/types';
import {
  generateUnifiedCaregiverTimeline,
  CaregiverTimelineSlot
} from '../src/utils/multiPatientCaregiverEngine';

describe('Multi-Patient Caregiver & Self-Care Unified Engine (TDD)', () => {
  const patientJoseSelf: Patient = {
    id: 'patient-jose',
    name: 'José Manuel Poot (Mi Autocuidado)',
    age: 38,
    type: 'preventive',
    primaryDiagnosis: 'Prediabetes & Control Preventivo'
  };

  const patientPapa: Patient = {
    id: 'patient-grandfather',
    name: 'Don Manuel Poot (Papá)',
    age: 78,
    type: 'chronic',
    primaryDiagnosis: 'Diabetes Tipo 2 & Hipertensión'
  };

  const patientMama: Patient = {
    id: 'patient-maria',
    name: 'Doña María Poot (Mamá)',
    age: 74,
    type: 'temporary',
    primaryDiagnosis: 'Tratamiento Antibiótico & Cuidado General'
  };

  const allPatients = [patientJoseSelf, patientPapa, patientMama];

  const medications: Medication[] = [
    // José Manuel (Self-Care)
    {
      id: 'med-eyestil-jose',
      patientId: 'patient-jose',
      name: 'Eyestil Plus Gotas',
      presentation: 'drops',
      currentStock: 1,
      minimumStockAlert: 1,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1, instruction: '1 gota en cada ojo' }],
        startDate: '2026-08-01'
      }
    },
    // Don Manuel (Papá)
    {
      id: 'med-metformin-papa',
      patientId: 'patient-grandfather',
      name: 'Metformina 500mg',
      presentation: 'tablet',
      currentStock: 28,
      minimumStockAlert: 5,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [
          { time: '08:00', dose: 1, instruction: 'Con el desayuno' },
          { time: '20:00', dose: 1, instruction: 'Con la cena' }
        ],
        startDate: '2026-01-01'
      }
    },
    // Doña María (Mamá)
    {
      id: 'med-cipro-mama',
      patientId: 'patient-maria',
      name: 'Ciprofloxacino 500mg',
      presentation: 'tablet',
      currentStock: 10,
      minimumStockAlert: 2,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [
          { time: '08:00', dose: 1, instruction: 'Tomar con abundante agua' },
          { time: '20:00', dose: 1, instruction: 'Toma nocturna' }
        ],
        startDate: '2026-08-15'
      }
    }
  ];

  const doseLogs: DoseLog[] = [
    {
      id: 'log-1',
      medicationId: 'med-metformin-papa',
      patientId: 'patient-grandfather',
      date: '2026-08-18',
      scheduledTime: '08:00',
      taken: true,
      administeredBy: 'José Manuel Poot'
    }
  ];

  it('1. Should generate a unified morning/afternoon/night timeline combining father, mother and self-care', () => {
    const targetDate = new Date(2026, 7, 18);
    const unifiedTimeline = generateUnifiedCaregiverTimeline({
      patients: allPatients,
      medications,
      doseLogs,
      date: targetDate,
      selectedPatientId: 'all' // All patients for caregiver view
    });

    // 08:00 should contain 3 entries: Papá (Metformina), Mamá (Cipro), José (Eyestil)
    const morningSlots = unifiedTimeline.filter(s => s.time === '08:00');
    expect(morningSlots.length).toBe(3);

    const papaSlot = morningSlots.find(s => s.patientId === 'patient-grandfather');
    const mamaSlot = morningSlots.find(s => s.patientId === 'patient-maria');
    const selfSlot = morningSlots.find(s => s.patientId === 'patient-jose');

    expect(papaSlot?.patientName).toBe('Don Manuel Poot (Papá)');
    expect(papaSlot?.isTaken).toBe(true); // Recorded in logs
    expect(papaSlot?.administeredBy).toBe('José Manuel Poot');

    expect(mamaSlot?.patientName).toBe('Doña María Poot (Mamá)');
    expect(mamaSlot?.isTaken).toBe(false);

    expect(selfSlot?.patientName).toBe('José Manuel Poot (Mi Autocuidado)');
    expect(selfSlot?.isTaken).toBe(false);
  });

  it('2. Should allow filtering by individual patient when the caregiver wants to focus on only one person', () => {
    const targetDate = new Date(2026, 7, 18);
    const selfOnly = generateUnifiedCaregiverTimeline({
      patients: allPatients,
      medications,
      doseLogs,
      date: targetDate,
      selectedPatientId: 'patient-jose'
    });

    expect(selfOnly.length).toBe(1);
    expect(selfOnly[0].medicationName).toBe('Eyestil Plus Gotas');

    const mamaOnly = generateUnifiedCaregiverTimeline({
      patients: allPatients,
      medications,
      doseLogs,
      date: targetDate,
      selectedPatientId: 'patient-maria'
    });

    expect(mamaOnly.length).toBe(2); // 08:00 and 20:00
  });

  it('3. Should group doses into intuitive time-of-day buckets (Morning, Afternoon, Evening, Night) with patient tags', () => {
    const targetDate = new Date(2026, 7, 18);
    const timeline = generateUnifiedCaregiverTimeline({
      patients: allPatients,
      medications,
      doseLogs,
      date: targetDate,
      selectedPatientId: 'all'
    });

    const morningCount = timeline.filter(t => t.timeOfDay === 'morning').length;
    const eveningCount = timeline.filter(t => t.timeOfDay === 'night' || t.timeOfDay === 'evening').length;

    expect(morningCount).toBe(3); // 08:00 doses
    expect(eveningCount).toBe(2); // 20:00 doses
  });
});
