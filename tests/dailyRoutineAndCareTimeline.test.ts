import { describe, it, expect } from 'vitest';
import { Patient, RoutineLog } from '../src/types';
import { getPatientDailyRoutineSlots } from '../src/utils/dailyRoutineEngine';

describe('Patient Daily Care Routines (Meals, Bath, Wound Care & Exercise)', () => {
  const postOpPatient: Patient = {
    id: 'patient-postop-1',
    name: 'Doña María Poot',
    type: 'temporary',
    primaryDiagnosis: 'Cirugía Vascular de Miembro Inferior',
    dailyRoutines: {
      enabled: true,
      breakfastTime: '08:30',
      breakfastNotes: 'Dieta blanda, baja en sodio',
      bathTime: '10:00',
      bathNotes: 'Baño asistido, no mojar vendaje de pierna',
      woundCareTime: '10:30',
      woundCareNotes: 'Curación estéril con solución antiséptica y gasa estéril',
      lunchTime: '14:00',
      lunchNotes: 'Comida sin condimentos irritantes',
      exerciseTime: '17:00',
      exerciseNotes: 'Movilización pasiva y elevación de pierna 20 min',
      dinnerTime: '20:00',
      dinnerNotes: 'Cena ligera'
    }
  };

  it('1. Should extract all 6 configured daily routines ordered by time', () => {
    const today = new Date(2026, 7, 18);
    const slots = getPatientDailyRoutineSlots(postOpPatient, today, []);

    expect(slots.length).toBe(6);
    expect(slots[0].routineType).toBe('breakfast');
    expect(slots[0].time).toBe('08:30');
    expect(slots[0].icon).toBe('🍳');

    expect(slots[1].routineType).toBe('bath');
    expect(slots[1].time).toBe('10:00');
    expect(slots[1].notes).toContain('no mojar vendaje');

    expect(slots[2].routineType).toBe('wound_care');
    expect(slots[2].time).toBe('10:30');
    expect(slots[2].notes).toContain('Curación estéril');

    expect(slots[3].routineType).toBe('lunch');
    expect(slots[3].time).toBe('14:00');

    expect(slots[4].routineType).toBe('exercise');
    expect(slots[4].time).toBe('17:00');

    expect(slots[5].routineType).toBe('dinner');
    expect(slots[5].time).toBe('20:00');
  });

  it('2. Should recognize completed routines from routine logs with caregiver name', () => {
    const today = new Date(2026, 7, 18);
    const logs: RoutineLog[] = [
      {
        id: 'rlog-1',
        patientId: postOpPatient.id,
        date: '2026-08-18',
        routineType: 'breakfast',
        scheduledTime: '08:30',
        completed: true,
        completedBy: 'Lucía Poot'
      },
      {
        id: 'rlog-2',
        patientId: postOpPatient.id,
        date: '2026-08-18',
        routineType: 'wound_care',
        scheduledTime: '10:30',
        completed: true,
        completedBy: 'Enfermera Carmen'
      }
    ];

    const slots = getPatientDailyRoutineSlots(postOpPatient, today, logs);
    const breakfast = slots.find(s => s.routineType === 'breakfast');
    const woundCare = slots.find(s => s.routineType === 'wound_care');
    const bath = slots.find(s => s.routineType === 'bath');

    expect(breakfast?.isCompleted).toBe(true);
    expect(breakfast?.completedBy).toBe('Lucía Poot');

    expect(woundCare?.isCompleted).toBe(true);
    expect(woundCare?.completedBy).toBe('Enfermera Carmen');

    expect(bath?.isCompleted).toBe(false);
  });

  it('3. Should return empty array if daily routines are disabled or not configured', () => {
    const patientWithoutRoutines: Patient = {
      id: 'patient-no-routines',
      name: 'José Manuel',
      type: 'preventive'
    };

    const slots = getPatientDailyRoutineSlots(patientWithoutRoutines, new Date(), []);
    expect(slots).toEqual([]);
  });
});
