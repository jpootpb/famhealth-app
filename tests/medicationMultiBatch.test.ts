import { describe, it, expect } from 'vitest';
import { Medication, MedicationBatch } from '../src/types';
import {
  ensureBatches,
  getActiveBatch,
  deductDoseFromBatches,
  finishActiveBoxOrBatch,
  switchActiveBatch,
  adjustBatchStockUnits,
  addNewBatchToMedication
} from '../src/utils/medicationBatchEngine';

describe('Multi-Batch, Multi-Laboratory & Box Level Inventory Management', () => {
  const baseMed: Medication = {
    id: 'med-rivaroxaban',
    patientId: 'patient-poot',
    name: 'Rivaroxabán 20mg',
    presentation: 'tablet',
    laboratory: 'Bayer (Xarelto)',
    imageUrl: 'data:image/png;base64,bayer-xarelto-box',
    currentStock: 2, // only 2 pills left of Bayer
    minimumStockAlert: 5,
    packageUnits: 28,
    frequency: {
      type: 'daily_fixed',
      doseSlots: [{ time: '13:00', dose: 1 }],
      startDate: '2026-08-01'
    },
    batches: [
      {
        id: 'batch-bayer',
        name: 'Lote Bayer Inicial',
        laboratory: 'Bayer (Xarelto)',
        boxesCount: 1,
        remainingBoxes: 1,
        unitsPerBox: 28,
        totalUnits: 28,
        remainingUnits: 2, // 2 pills remaining
        imageUrl: 'data:image/png;base64,bayer-xarelto-box',
        isCurrentActive: true,
        addedAt: '2026-08-01',
        expirationDate: '2026-12-31'
      },
      {
        id: 'batch-silanes-promo',
        name: 'Lote 3 Cajas Promo Silanes',
        laboratory: 'Silanes (Genérico)',
        boxesCount: 3,
        remainingBoxes: 3,
        unitsPerBox: 28,
        totalUnits: 84,
        remainingUnits: 84, // 3 full boxes in reserve
        imageUrl: 'data:image/png;base64,silanes-promo-box',
        isCurrentActive: false,
        addedAt: '2026-08-15',
        expirationDate: '2027-06-30'
      }
    ],
    activeBatchId: 'batch-bayer'
  };

  it('1. Should return the current active batch and its specific laboratory & photo', () => {
    const active = getActiveBatch(baseMed);
    expect(active).toBeDefined();
    expect(active?.laboratory).toBe('Bayer (Xarelto)');
    expect(active?.imageUrl).toBe('data:image/png;base64,bayer-xarelto-box');
    expect(active?.remainingUnits).toBe(2);
  });

  it('2. AUTOMATIC TRANSITION: Deducting doses should auto-transition to next reserve batch when active batch hits 0', () => {
    // First dose taken -> 1 pill left of Bayer
    const step1 = deductDoseFromBatches(baseMed, 1);
    expect(step1.transitioned).toBe(false);
    expect(step1.updatedMed.currentStock).toBe(85); // 1 bayer + 84 silanes
    expect(step1.updatedMed.laboratory).toBe('Bayer (Xarelto)');

    // Second dose taken -> 0 pills left of Bayer -> Auto-transitions to Silanes!
    const step2 = deductDoseFromBatches(step1.updatedMed, 1);
    expect(step2.transitioned).toBe(true);
    expect(step2.previousBatch?.id).toBe('batch-bayer');
    expect(step2.nextBatch?.id).toBe('batch-silanes-promo');
    expect(step2.updatedMed.activeBatchId).toBe('batch-silanes-promo');
    expect(step2.updatedMed.laboratory).toBe('Silanes (Genérico)');
    expect(step2.updatedMed.imageUrl).toBe('data:image/png;base64,silanes-promo-box');
    expect(step2.updatedMed.currentStock).toBe(84);
  });

  it('3. MANUAL TRANSITION: Caregiver can manually switch active batch to another laboratory anytime', () => {
    const switched = switchActiveBatch(baseMed, 'batch-silanes-promo');
    expect(switched.activeBatchId).toBe('batch-silanes-promo');
    expect(switched.laboratory).toBe('Silanes (Genérico)');
    expect(switched.imageUrl).toBe('data:image/png;base64,silanes-promo-box');

    // Switch back to Bayer
    const switchedBack = switchActiveBatch(switched, 'batch-bayer');
    expect(switchedBack.activeBatchId).toBe('batch-bayer');
    expect(switchedBack.laboratory).toBe('Bayer (Xarelto)');
  });

  it('4. MANUAL FINISH 1 BOX: Finishing 1 of 4 boxes of Isox should decrease remaining boxes to 3 and stay active', () => {
    const isoxMed: Medication = {
      id: 'med-isox',
      patientId: 'patient-poot',
      name: 'Isox 15D',
      presentation: 'capsule',
      currentStock: 8, // 4 boxes of 2 capsules
      minimumStockAlert: 2,
      packageUnits: 2,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1 }],
        startDate: '2026-08-01'
      },
      batches: [
        {
          id: 'batch-isox-4boxes',
          name: '4 Muestras de 2 cápsulas',
          laboratory: 'Asofarma',
          boxesCount: 4,
          remainingBoxes: 4,
          unitsPerBox: 2,
          totalUnits: 8,
          remainingUnits: 8,
          isCurrentActive: true,
          addedAt: '2026-08-10'
        }
      ],
      activeBatchId: 'batch-isox-4boxes'
    };

    // Finish 1 box manually
    const res = finishActiveBoxOrBatch(isoxMed, 'manual_box_finish');
    expect(res.remainingBoxesInBatch).toBe(3);
    expect(res.updatedMed.currentStock).toBe(6);
    expect(res.updatedMed.status).not.toBe('completed');
  });

  it('5. MANUAL INVENTORY ADJUSTMENT: Can adjust stock and record loss or damage (e.g. 2 boxes lost)', () => {
    const isoxMed: Medication = {
      id: 'med-isox',
      patientId: 'patient-poot',
      name: 'Isox 15D',
      presentation: 'capsule',
      currentStock: 8,
      minimumStockAlert: 2,
      packageUnits: 2,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1 }],
        startDate: '2026-08-01'
      },
      batches: [
        {
          id: 'batch-isox',
          boxesCount: 4,
          remainingBoxes: 4,
          unitsPerBox: 2,
          totalUnits: 8,
          remainingUnits: 8,
          isCurrentActive: true,
          addedAt: '2026-08-10'
        }
      ],
      activeBatchId: 'batch-isox'
    };

    // Adjust down to 2 boxes (4 units) due to loss
    const adjusted = adjustBatchStockUnits(isoxMed, 'batch-isox', 4, 'lost', 2);
    expect(adjusted.currentStock).toBe(4);
    expect(adjusted.batches?.[0].remainingBoxes).toBe(2);
    expect(adjusted.batches?.[0].remainingUnits).toBe(4);
  });

  it('6. ADD NEW BATCH / PROMOTION: Adding 3 boxes of new lab adds to reserve with its own photo and lab', () => {
    const medWithoutBatches: Medication = {
      id: 'med-aspirin',
      patientId: 'p-1',
      name: 'Aspirina Protect',
      presentation: 'tablet',
      laboratory: 'Bayer',
      currentStock: 10,
      minimumStockAlert: 5,
      frequency: {
        type: 'daily_fixed',
        doseSlots: [{ time: '08:00', dose: 1 }],
        startDate: '2026-08-01'
      }
    };

    const updated = addNewBatchToMedication(medWithoutBatches, {
      laboratory: 'Genérico Ahorro',
      boxesCount: 2,
      unitsPerBox: 30,
      cost: 150,
      imageUrl: 'data:image/png;base64,ahorro-photo',
      preferredStore: 'Farmacia del Ahorro',
      activateNow: false
    });

    expect(updated.batches?.length).toBe(2); // Initial synthesized batch + new batch
    expect(updated.currentStock).toBe(70); // 10 original + 60 new
    expect(updated.batches?.[1].laboratory).toBe('Genérico Ahorro');
    expect(updated.batches?.[1].remainingBoxes).toBe(2);
  });
});
