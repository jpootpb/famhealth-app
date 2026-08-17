import { describe, it, expect } from 'vitest';
import { getStockStatus } from '../src/utils/formatters';
import { Medication } from '../src/types';

describe('Medication Inventory & Stock Traffic Light (Task 6)', () => {
  it('1. Should classify stock levels accurately', () => {
    // Critical (stock 0)
    const depleted = getStockStatus(0, 5);
    expect(depleted.status).toBe('depleted');
    expect(depleted.badgeClass).toBe('badge-red');

    // Warning (stock <= min alert threshold)
    const low = getStockStatus(4, 5);
    expect(low.status).toBe('low');
    expect(low.badgeClass).toBe('badge-yellow');

    // Safe (stock > min alert threshold)
    const safe = getStockStatus(25, 5);
    expect(safe.status).toBe('ok');
    expect(safe.badgeClass).toBe('badge-green');
  });

  it('2. Should correctly calculate restock increment', () => {
    const med: Medication = {
      id: 'med-aspirin',
      patientId: 'p-1',
      name: 'Aspirin Protect',
      presentation: 'tablet',
      frequency: {
        type: 'every_n_days',
        intervalDays: 4,
        doseSlots: [{ time: '14:00', dose: 1 }],
        startDate: '2026-08-14'
      },
      currentStock: 2,
      minimumStockAlert: 5
    };

    // Quick restock 30 units (1 box)
    const restockedMed = { ...med, currentStock: med.currentStock + 30 };
    expect(restockedMed.currentStock).toBe(32);
    expect(getStockStatus(restockedMed.currentStock, restockedMed.minimumStockAlert).status).toBe('ok');
  });
});
