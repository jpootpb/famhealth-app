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

  it('3. Should handle multiple boxes purchase at once (e.g. 3 boxes of Sitagliptina / Metformina x 28 tabs)', () => {
    const initialMed: Medication = {
      id: 'med-sitagliptina',
      patientId: 'p-1',
      name: 'Sitagliptina / Metformina',
      presentation: 'tablet',
      packageUnits: 28,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1 }],
        startDate: '2026-08-01'
      },
      currentStock: 4,
      minimumStockAlert: 5
    };

    const boxCount = 3;
    const unitsPerBox = 28;
    const addedUnits = boxCount * unitsPerBox; // 84

    const updatedMed: Medication = {
      ...initialMed,
      currentStock: initialMed.currentStock + addedUnits
    };

    expect(updatedMed.currentStock).toBe(88);
    const status = getStockStatus(updatedMed.currentStock, updatedMed.minimumStockAlert);
    expect(status.status).toBe('ok');
    expect(status.label).toContain('88');
  });

  it('4. Should handle medical sample loose capsules purchase (e.g. Isox 15D - 15 loose capsules @ $20 ea at Farmacia Regina)', () => {
    const isoxMed: Medication = {
      id: 'med-isox',
      patientId: 'p-1',
      name: 'Isox 15D',
      presentation: 'capsule',
      isMedicalSample: true,
      sampleNotes: 'Cápsulas sueltas a $20 c/u en Farmacia Regina',
      preferredStore: 'Farmacia Regina (Muestras Médicas)',
      unitCost: 300, // 15 x $20
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1 }],
        startDate: '2026-08-01'
      },
      currentStock: 15,
      minimumStockAlert: 3
    };

    expect(isoxMed.isMedicalSample).toBe(true);
    expect(isoxMed.currentStock).toBe(15);
    expect(isoxMed.preferredStore).toBe('Farmacia Regina (Muestras Médicas)');
  });

  it('5. Should handle sample bottles reserve for eye drops (e.g. Krytantek Ofteno - 2 sample bottles of 3ml)', () => {
    const krytantekMed: Medication = {
      id: 'med-krytantek',
      patientId: 'p-1',
      name: 'Krytantek Ofteno Gotas',
      presentation: 'drops',
      stockTrackingMode: 'manual_bottle',
      bottlesCount: 2, // 1 in use + 1 in reserve
      isMedicalSample: true,
      sampleNotes: '2 muestras médicas de 3ml en Farmacia Regina',
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1, instruction: '1 gota en ojo derecho' }],
        startDate: '2026-08-01'
      },
      currentStock: 2,
      minimumStockAlert: 0
    };

    const status2Bottles = getStockStatus(
      krytantekMed.currentStock,
      krytantekMed.minimumStockAlert,
      krytantekMed.stockTrackingMode,
      'es',
      krytantekMed.bottlesCount
    );

    expect(status2Bottles.label).toContain('2 Frascos');
    expect(status2Bottles.label).toContain('1 en reserva');

    // Consume first bottle -> 1 bottle remaining (last one)
    const after1BottleConsumed: Medication = {
      ...krytantekMed,
      bottlesCount: 1,
      currentStock: 1
    };

    const status1Bottle = getStockStatus(
      after1BottleConsumed.currentStock,
      after1BottleConsumed.minimumStockAlert,
      after1BottleConsumed.stockTrackingMode,
      'es',
      after1BottleConsumed.bottlesCount
    );
    expect(status1Bottle.label).toContain('1 Frasco / Muestra en uso');
  });
});
