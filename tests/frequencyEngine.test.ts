import { describe, it, expect } from 'vitest';
import { isDoseDueToday, getDailyDoseSlots, parseDateOnly } from '../src/utils/frequencyEngine';
import { Medication } from '../src/types';

describe('Medication Frequency Engine', () => {
  it('1. Metformin - Variable daily doses (1 pill 8:00AM and 0.5 pill 8:00PM)', () => {
    const metformin: Medication = {
      id: 'med-1',
      patientId: 'pac-1',
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
    };

    const today = new Date(2026, 7, 17, 9, 0, 0);
    expect(isDoseDueToday(metformin.frequency, today)).toBe(true);

    const slots = getDailyDoseSlots(metformin, today);
    expect(slots.length).toBe(2);
    expect(slots[0].dose).toBe(1);
    expect(slots[1].dose).toBe(0.5);
  });

  it('2. Rivaroxaban - Alternate days (every other day)', () => {
    const rivaroxaban: Medication = {
      id: 'med-2',
      patientId: 'pac-1',
      name: 'Rivaroxaban',
      presentation: 'tablet',
      frequency: {
        type: 'alternate_days',
        doseSlots: [{ time: '13:00', dose: 1 }],
        startDate: '2026-08-16'
      },
      currentStock: 10,
      minimumStockAlert: 3
    };

    const day16 = parseDateOnly('2026-08-16');
    const day17 = parseDateOnly('2026-08-17');
    const day18 = parseDateOnly('2026-08-18');

    expect(isDoseDueToday(rivaroxaban.frequency, day16)).toBe(true);
    expect(isDoseDueToday(rivaroxaban.frequency, day17)).toBe(false);
    expect(isDoseDueToday(rivaroxaban.frequency, day18)).toBe(true);
  });


  it('3. Aspirin - Every 4 days', () => {
    const aspirin: Medication = {
      id: 'med-3',
      patientId: 'pac-1',
      name: 'Aspirin Protect',
      presentation: 'tablet',
      frequency: {
        type: 'every_n_days',
        intervalDays: 4,
        doseSlots: [{ time: '14:00', dose: 1 }],
        startDate: '2026-08-14'
      },
      currentStock: 15,
      minimumStockAlert: 3
    };

    const day14 = parseDateOnly('2026-08-14');
    const day15 = parseDateOnly('2026-08-15');
    const day16 = parseDateOnly('2026-08-16');
    const day17 = parseDateOnly('2026-08-17');
    const day18 = parseDateOnly('2026-08-18');

    expect(isDoseDueToday(aspirin.frequency, day14)).toBe(true);
    expect(isDoseDueToday(aspirin.frequency, day15)).toBe(false);
    expect(isDoseDueToday(aspirin.frequency, day16)).toBe(false);
    expect(isDoseDueToday(aspirin.frequency, day17)).toBe(false);
    expect(isDoseDueToday(aspirin.frequency, day18)).toBe(true);
  });

  it('4. Temporary Treatment - Antibiotic for 7 days', () => {
    const antibiotic: Medication = {
      id: 'med-4',
      patientId: 'pac-2',
      name: 'Ciprofloxacin',
      presentation: 'tablet',
      frequency: {
        type: 'temporary_hourly',
        intervalHours: 12,
        doseSlots: [
          { time: '08:00', dose: 1 },
          { time: '20:00', dose: 1 }
        ],
        startDate: '2026-08-15',
        endDate: '2026-08-22'
      },
      currentStock: 10,
      minimumStockAlert: 2
    };

    const during = parseDateOnly('2026-08-17');
    const after = parseDateOnly('2026-08-23');

    expect(isDoseDueToday(antibiotic.frequency, during)).toBe(true);
    expect(isDoseDueToday(antibiotic.frequency, after)).toBe(false);
  });
});
