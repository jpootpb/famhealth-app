import { Medication, MedicationBatch } from '../types';

/**
 * Ensures a medication has a valid batches array.
 * If the medication has no batches, synthesizes an initial active batch from its top-level fields.
 */
export function ensureBatches(med: Medication): Medication {
  if (med.batches && med.batches.length > 0) {
    // If no activeBatchId set, ensure at least one non-finished batch is active
    if (!med.activeBatchId || !med.batches.some(b => b.id === med.activeBatchId)) {
      const firstAvailable = med.batches.find(b => b.remainingUnits > 0 && !b.finishedAt) || med.batches[0];
      return {
        ...med,
        activeBatchId: firstAvailable ? firstAvailable.id : undefined,
        batches: med.batches.map(b => ({
          ...b,
          isCurrentActive: firstAvailable ? b.id === firstAvailable.id : false
        }))
      };
    }
    return med;
  }

  // Synthesize initial batch from top-level medication data
  const isManual = med.stockTrackingMode === 'manual_bottle';
  const initialBoxes = isManual
    ? (med.bottlesCount || 1)
    : (med.packageUnits && med.currentStock ? Math.ceil(med.currentStock / med.packageUnits) : 1);

  const initialBatch: MedicationBatch = {
    id: `batch-${med.id}-init`,
    name: med.laboratory ? `Lote ${med.laboratory}` : 'Lote Inicial en Uso',
    laboratory: med.laboratory,
    boxesCount: initialBoxes,
    remainingBoxes: initialBoxes,
    unitsPerBox: med.packageUnits || (isManual ? 1 : 30),
    totalUnits: med.currentStock > 0 ? med.currentStock : (isManual ? (med.bottlesCount || 1) : 30),
    remainingUnits: med.currentStock,
    unitCost: med.unitCost,
    expirationDate: med.expirationDate,
    imageUrl: med.imageUrl,
    preferredStore: med.preferredStore,
    isMedicalSample: med.isMedicalSample,
    sampleNotes: med.sampleNotes,
    isCurrentActive: true,
    addedAt: new Date().toISOString().split('T')[0]
  };

  return {
    ...med,
    activeBatchId: initialBatch.id,
    batches: [initialBatch]
  };
}

/**
 * Gets the active batch being currently administered.
 */
export function getActiveBatch(med: Medication): MedicationBatch | undefined {
  const prepared = ensureBatches(med);
  if (!prepared.batches || prepared.batches.length === 0) return undefined;

  if (prepared.activeBatchId) {
    const found = prepared.batches.find(b => b.id === prepared.activeBatchId);
    if (found) return found;
  }

  return prepared.batches.find(b => b.isCurrentActive) || prepared.batches[0];
}

/**
 * Deducts dose units from the active batch and automatically transitions to the next reserve batch if depleted.
 */
export function deductDoseFromBatches(
  med: Medication,
  doseUnits: number = 1
): {
  updatedMed: Medication;
  transitioned: boolean;
  previousBatch?: MedicationBatch;
  nextBatch?: MedicationBatch;
} {
  const prepared = ensureBatches(med);
  let active = getActiveBatch(prepared);
  if (!active || !prepared.batches) {
    return { updatedMed: med, transitioned: false };
  }

  const isManual = prepared.stockTrackingMode === 'manual_bottle';
  const newUnits = isManual ? active.remainingUnits : Math.max(0, active.remainingUnits - doseUnits);
  let updatedBatches = prepared.batches.map(b => {
    if (b.id === active?.id) {
      const unitsPerBox = b.unitsPerBox || 30;
      const remainingBoxes = Math.max(0, Math.ceil(newUnits / unitsPerBox));
      return {
        ...b,
        remainingUnits: newUnits,
        remainingBoxes: isManual ? b.remainingBoxes : remainingBoxes,
        finishedAt: newUnits <= 0 ? new Date().toISOString().split('T')[0] : undefined,
        finishReason: newUnits <= 0 ? ('depleted' as const) : undefined
      };
    }
    return b;
  });

  // Calculate overall remaining stock across all batches
  const totalRemaining = updatedBatches.reduce((acc, b) => acc + Math.max(0, b.remainingUnits), 0);

  // Check if active batch just depleted and we need automatic transition to next batch
  let transitioned = false;
  let previousBatch: MedicationBatch | undefined = undefined;
  let nextBatch: MedicationBatch | undefined = undefined;

  if (!isManual && newUnits <= 0) {
    // Find next available batch with remaining units > 0 (FIFO by expiration or addedAt)
    const nextAvailable = updatedBatches
      .filter(b => b.id !== active?.id && b.remainingUnits > 0 && !b.finishedAt)
      .sort((a, b) => {
        if (a.expirationDate && b.expirationDate) {
          return a.expirationDate.localeCompare(b.expirationDate);
        }
        return a.addedAt.localeCompare(b.addedAt);
      })[0];

    if (nextAvailable) {
      transitioned = true;
      previousBatch = active;
      nextBatch = nextAvailable;

      updatedBatches = updatedBatches.map(b => ({
        ...b,
        isCurrentActive: b.id === nextAvailable.id
      }));

      return {
        updatedMed: {
          ...prepared,
          currentStock: totalRemaining,
          activeBatchId: nextAvailable.id,
          batches: updatedBatches,
          laboratory: nextAvailable.laboratory || prepared.laboratory,
          imageUrl: nextAvailable.imageUrl || prepared.imageUrl,
          preferredStore: nextAvailable.preferredStore || prepared.preferredStore,
          expirationDate: nextAvailable.expirationDate || prepared.expirationDate
        },
        transitioned: true,
        previousBatch,
        nextBatch
      };
    }
  }

  return {
    updatedMed: {
      ...prepared,
      currentStock: totalRemaining,
      batches: updatedBatches
    },
    transitioned: false
  };
}

/**
 * Manually finishes 1 box or finishes the entire current active batch.
 */
export function finishActiveBoxOrBatch(
  med: Medication,
  reason: 'depleted' | 'manual_box_finish' | 'expired' | 'damaged' | 'lost' = 'manual_box_finish',
  notes?: string
): {
  updatedMed: Medication;
  transitioned: boolean;
  nextBatch?: MedicationBatch;
  remainingBoxesInBatch: number;
} {
  const prepared = ensureBatches(med);
  const active = getActiveBatch(prepared);
  if (!active || !prepared.batches) {
    return { updatedMed: med, transitioned: false, remainingBoxesInBatch: 0 };
  }

  const isManual = prepared.stockTrackingMode === 'manual_bottle';
  const unitsPerBox = active.unitsPerBox || (isManual ? 1 : 30);
  const currentBoxes = active.remainingBoxes !== undefined ? active.remainingBoxes : Math.ceil(active.remainingUnits / unitsPerBox);

  // If active batch has multiple boxes in reserve, consume 1 box and stay on this batch
  if (currentBoxes > 1) {
    const newBoxes = currentBoxes - 1;
    const newUnits = isManual ? newBoxes : Math.max(0, active.remainingUnits - unitsPerBox);

    const updatedBatches = prepared.batches.map(b => {
      if (b.id === active.id) {
        return {
          ...b,
          remainingBoxes: newBoxes,
          remainingUnits: newUnits
        };
      }
      return b;
    });

    const totalRemaining = updatedBatches.reduce((acc, b) => acc + Math.max(0, b.remainingUnits), 0);

    return {
      updatedMed: {
        ...prepared,
        currentStock: totalRemaining,
        bottlesCount: isManual ? newBoxes : undefined,
        batches: updatedBatches
      },
      transitioned: false,
      remainingBoxesInBatch: newBoxes
    };
  }

  // It's the last box of this batch -> mark this batch as finished
  const finishedBatchId = active.id;
  let updatedBatches = prepared.batches.map(b => {
    if (b.id === finishedBatchId) {
      return {
        ...b,
        remainingBoxes: 0,
        remainingUnits: 0,
        finishedAt: new Date().toISOString().split('T')[0],
        finishReason: reason,
        notes: notes || b.notes
      };
    }
    return b;
  });

  // Look for next reserve batch
  const nextAvailable = updatedBatches
    .filter(b => b.id !== finishedBatchId && b.remainingUnits > 0 && !b.finishedAt)
    .sort((a, b) => {
      if (a.expirationDate && b.expirationDate) {
        return a.expirationDate.localeCompare(b.expirationDate);
      }
      return a.addedAt.localeCompare(b.addedAt);
    })[0];

  const totalRemaining = updatedBatches.reduce((acc, b) => acc + Math.max(0, b.remainingUnits), 0);

  if (nextAvailable) {
    updatedBatches = updatedBatches.map(b => ({
      ...b,
      isCurrentActive: b.id === nextAvailable.id
    }));

    return {
      updatedMed: {
        ...prepared,
        currentStock: totalRemaining,
        bottlesCount: isManual ? nextAvailable.remainingBoxes : undefined,
        activeBatchId: nextAvailable.id,
        batches: updatedBatches,
        laboratory: nextAvailable.laboratory || prepared.laboratory,
        imageUrl: nextAvailable.imageUrl || prepared.imageUrl,
        preferredStore: nextAvailable.preferredStore || prepared.preferredStore,
        expirationDate: nextAvailable.expirationDate || prepared.expirationDate
      },
      transitioned: true,
      nextBatch: nextAvailable,
      remainingBoxesInBatch: 0
    };
  }

  // No more batches left -> mark medicine as completed/depleted
  return {
    updatedMed: {
      ...prepared,
      currentStock: 0,
      bottlesCount: 0,
      status: 'completed',
      completedAt: new Date().toISOString().split('T')[0],
      completionReason: 'bottle_finished',
      completionNotes: notes || 'Todos los lotes y cajas fueron consumidos',
      batches: updatedBatches
    },
    transitioned: false,
    remainingBoxesInBatch: 0
  };
}

/**
 * Manually switch the active batch being dispensed to the patient.
 */
export function switchActiveBatch(med: Medication, targetBatchId: string): Medication {
  const prepared = ensureBatches(med);
  if (!prepared.batches) return med;

  const target = prepared.batches.find(b => b.id === targetBatchId);
  if (!target) return med;

  const updatedBatches = prepared.batches.map(b => ({
    ...b,
    isCurrentActive: b.id === targetBatchId
  }));

  return {
    ...prepared,
    activeBatchId: targetBatchId,
    batches: updatedBatches,
    laboratory: target.laboratory || prepared.laboratory,
    imageUrl: target.imageUrl || prepared.imageUrl,
    preferredStore: target.preferredStore || prepared.preferredStore,
    expirationDate: target.expirationDate || prepared.expirationDate,
    unitCost: target.unitCost !== undefined ? target.unitCost : prepared.unitCost,
    isMedicalSample: target.isMedicalSample !== undefined ? target.isMedicalSample : prepared.isMedicalSample,
    sampleNotes: target.sampleNotes || prepared.sampleNotes
  };
}

/**
 * Manually adjust the stock or boxes of a specific batch (e.g. lost, damaged, count correction).
 */
export function adjustBatchStockUnits(
  med: Medication,
  batchId: string,
  newRemainingUnits: number,
  reason: string = 'count_correction',
  newBoxes?: number
): Medication {
  const prepared = ensureBatches(med);
  if (!prepared.batches) return med;

  const isManual = prepared.stockTrackingMode === 'manual_bottle';
  const updatedBatches = prepared.batches.map(b => {
    if (b.id === batchId) {
      const unitsPerBox = b.unitsPerBox || (isManual ? 1 : 30);
      const calculatedBoxes = newBoxes !== undefined ? newBoxes : Math.ceil(newRemainingUnits / unitsPerBox);
      const isDepleted = newRemainingUnits <= 0;

      return {
        ...b,
        remainingUnits: Math.max(0, newRemainingUnits),
        remainingBoxes: Math.max(0, calculatedBoxes),
        finishedAt: isDepleted ? new Date().toISOString().split('T')[0] : undefined,
        finishReason: isDepleted ? (reason as any) : undefined
      };
    }
    return b;
  });

  const totalRemaining = updatedBatches.reduce((acc, b) => acc + Math.max(0, b.remainingUnits), 0);

  // If the adjusted batch was active and became depleted, auto-transition to next available
  let activeId = prepared.activeBatchId;
  const activeBatch = updatedBatches.find(b => b.id === activeId);

  if (activeBatch && activeBatch.remainingUnits <= 0) {
    const nextAvailable = updatedBatches.find(b => b.remainingUnits > 0 && !b.finishedAt);
    if (nextAvailable) {
      activeId = nextAvailable.id;
    }
  }

  return {
    ...prepared,
    currentStock: totalRemaining,
    bottlesCount: isManual ? totalRemaining : undefined,
    activeBatchId: activeId,
    batches: updatedBatches.map(b => ({
      ...b,
      isCurrentActive: b.id === activeId
    }))
  };
}

/**
 * Adds a new batch / promo restock with its own laboratory, photo, price, and box count.
 */
export function addNewBatchToMedication(
  med: Medication,
  batchData: {
    laboratory?: string;
    boxesCount: number;
    unitsPerBox: number;
    cost?: number;
    expirationDate?: string;
    imageUrl?: string;
    preferredStore?: string;
    isMedicalSample?: boolean;
    sampleNotes?: string;
    activateNow?: boolean;
    name?: string;
  }
): Medication {
  const prepared = ensureBatches(med);
  const isManual = prepared.stockTrackingMode === 'manual_bottle';
  const totalUnits = isManual ? batchData.boxesCount : batchData.boxesCount * batchData.unitsPerBox;

  const newBatch: MedicationBatch = {
    id: `batch-${Date.now()}`,
    name: batchData.name || (batchData.laboratory ? `Lote ${batchData.laboratory}` : `Lote ${batchData.boxesCount} Cajas`),
    laboratory: batchData.laboratory,
    boxesCount: batchData.boxesCount,
    remainingBoxes: batchData.boxesCount,
    unitsPerBox: batchData.unitsPerBox,
    totalUnits,
    remainingUnits: totalUnits,
    unitCost: batchData.cost,
    expirationDate: batchData.expirationDate,
    imageUrl: batchData.imageUrl,
    preferredStore: batchData.preferredStore,
    isMedicalSample: batchData.isMedicalSample,
    sampleNotes: batchData.sampleNotes,
    isCurrentActive: Boolean(batchData.activateNow) || prepared.currentStock <= 0,
    addedAt: new Date().toISOString().split('T')[0]
  };

  const existingBatches = prepared.batches || [];
  let updatedBatches = [...existingBatches, newBatch];

  // If activateNow or current medication was depleted, make this new batch active
  const shouldActivate = Boolean(batchData.activateNow) || prepared.currentStock <= 0;
  if (shouldActivate) {
    updatedBatches = updatedBatches.map(b => ({
      ...b,
      isCurrentActive: b.id === newBatch.id
    }));
  }

  const totalRemaining = updatedBatches.reduce((acc, b) => acc + Math.max(0, b.remainingUnits), 0);

  return {
    ...prepared,
    status: 'active',
    currentStock: totalRemaining,
    bottlesCount: isManual ? totalRemaining : undefined,
    activeBatchId: shouldActivate ? newBatch.id : prepared.activeBatchId,
    laboratory: shouldActivate && newBatch.laboratory ? newBatch.laboratory : prepared.laboratory,
    imageUrl: shouldActivate && newBatch.imageUrl ? newBatch.imageUrl : prepared.imageUrl,
    preferredStore: shouldActivate && newBatch.preferredStore ? newBatch.preferredStore : prepared.preferredStore,
    expirationDate: shouldActivate && newBatch.expirationDate ? newBatch.expirationDate : prepared.expirationDate,
    batches: updatedBatches,
    completedAt: undefined,
    completionReason: undefined,
    completionNotes: undefined
  };
}
