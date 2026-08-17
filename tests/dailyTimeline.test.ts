import { describe, it, expect } from 'vitest';
import { Medication, DoseLog } from '../src/types';
import { getDailyDoseSlots } from '../src/utils/frequencyEngine';

describe('Daily Medication Timeline Logic (Task 5)', () => {
  const patientMedications: Medication[] = [
    {
      id: 'med-metformin',
      patientId: 'patient-grandfather',
      name: 'Metformin / Sitagliptin',
      presentation: 'tablet',
      frequency: {
        type: 'daily_fixed',
        doseSlots: [
          { time: '08:00', dose: 1 },
          { time: '20:00', dose: 0.5 }
        ],
        startDate: '2026-01-01'
      },
      currentStock: 20,
      minimumStockAlert: 5
    },
    {
      id: 'med-rivaroxaban',
      patientId: 'patient-grandfather',
      name: 'Rivaroxaban',
      presentation: 'tablet',
      frequency: {
        type: 'alternate_days',
        doseSlots: [{ time: '13:00', dose: 1 }],
        startDate: '2026-08-16'
      },
      currentStock: 10,
      minimumStockAlert: 3
    }
  ];

  it('1. Should compute due doses for a given date correctly', () => {
    // 2026-08-17 is 1 day after start date (odd day, so rivaroxaban is NOT due)
    const dateAug17 = new Date(2026, 7, 17, 10, 0, 0);
    const aug17Slots: Array<{ medId: string; time: string; dose: number }> = [];

    patientMedications.forEach(med => {
      const slots = getDailyDoseSlots(med, dateAug17);
      slots.forEach(s => aug17Slots.push({ medId: med.id, time: s.time, dose: s.dose }));
    });

    expect(aug17Slots.length).toBe(2); // Metformin morning (08:00) & evening (20:00)
    expect(aug17Slots[0].dose).toBe(1);
    expect(aug17Slots[1].dose).toBe(0.5);

    // 2026-08-18 (even day, both metformin and rivaroxaban are due)
    const dateAug18 = new Date(2026, 7, 18, 10, 0, 0);
    const aug18Slots: Array<{ medId: string; time: string; dose: number }> = [];

    patientMedications.forEach(med => {
      const slots = getDailyDoseSlots(med, dateAug18);
      slots.forEach(s => aug18Slots.push({ medId: med.id, time: s.time, dose: s.dose }));
    });

    expect(aug18Slots.length).toBe(3); // 08:00 Metformin, 13:00 Rivaroxaban, 20:00 Metformin
  });

  it('2. Should compute compliance progress accurately', () => {
    const totalDoses = 4;
    const doseLogs: DoseLog[] = [
      { id: '1', medicationId: 'med-1', patientId: 'p-1', date: '2026-08-17', scheduledTime: '08:00', dose: 1, taken: true },
      { id: '2', medicationId: 'med-2', patientId: 'p-1', date: '2026-08-17', scheduledTime: '13:00', dose: 1, taken: true }
    ];

    const takenCount = doseLogs.filter(l => l.taken).length;
    const progressPercent = Math.round((takenCount / totalDoses) * 100);

    expect(takenCount).toBe(2);
    expect(progressPercent).toBe(50);
  });
});
