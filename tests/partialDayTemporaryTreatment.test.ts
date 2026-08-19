import { describe, it, expect } from 'vitest';
import {
  calculateTemporaryTreatmentSchedule,
  getDailyDoseSlots
} from '../src/utils/frequencyEngine';
import { Medication } from '../src/types';

describe('Partial First Day & Temporary Treatment Schedules', () => {
  const threeTimesDailySlots = [
    { time: '08:00', dose: 1, instruction: 'Desayuno' },
    { time: '14:00', dose: 1, instruction: 'Comida / Almuerzo' },
    { time: '20:00', dose: 1, instruction: 'Cena' }
  ];

  it('1. Mid-day start (14:00) on 7-day treatment (21 doses) extends to Day 8 morning to complete all doses', () => {
    const schedule = calculateTemporaryTreatmentSchedule({
      startDate: '2026-08-18',
      durationDays: 7, // 7 days x 3 doses/day = 21 doses
      doseSlots: threeTimesDailySlots,
      startFirstDoseTime: '14:00',
      lang: 'es'
    });

    expect(schedule.totalPrescribedDoses).toBe(21);
    expect(schedule.startDate).toBe('2026-08-18');
    expect(schedule.startFirstDoseTime).toBe('14:00');
    // Day 1 takes 2 doses (14:00, 20:00).
    // Days 2..7 take 6 * 3 = 18 doses (total 20 doses).
    // Day 8 takes remaining 1 dose (08:00 Desayuno).
    expect(schedule.endDate).toBe('2026-08-25');
    expect(schedule.endDoseTime).toBe('08:00');
  });

  it('2. getDailyDoseSlots excludes morning doses prior to startFirstDoseTime on Day 1', () => {
    const med: Medication = {
      id: 'med-antibiotic',
      patientId: 'patient-sara',
      name: 'Amoxicilina 500mg',
      presentation: 'tablet',
      currentStock: 21,
      minimumStockAlert: 0,
      treatmentType: 'temporary',
      frequency: {
        type: 'temporary_hourly',
        startDate: '2026-08-18',
        endDate: '2026-08-25',
        startFirstDoseTime: '14:00',
        endDoseTime: '08:00',
        totalPrescribedDoses: 21,
        doseSlots: threeTimesDailySlots
      }
    };

    // On start date (2026-08-18), only 14:00 and 20:00 should be due
    const day1Slots = getDailyDoseSlots(med, new Date(2026, 7, 18));
    expect(day1Slots.length).toBe(2);
    expect(day1Slots.map(s => s.time)).toEqual(['14:00', '20:00']);

    // On mid-treatment date (2026-08-19), all 3 doses are due
    const day2Slots = getDailyDoseSlots(med, new Date(2026, 7, 19));
    expect(day2Slots.length).toBe(3);
    expect(day2Slots.map(s => s.time)).toEqual(['08:00', '14:00', '20:00']);

    // On end date (2026-08-25), only the morning 08:00 dose is due
    const lastDaySlots = getDailyDoseSlots(med, new Date(2026, 7, 25));
    expect(lastDaySlots.length).toBe(1);
    expect(lastDaySlots[0].time).toBe('08:00');
  });
});
