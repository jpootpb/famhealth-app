import { Medication } from '../types';
import { formatDateIso } from './frequencyEngine';

export interface TransferStockParams {
  sourceMedication: Medication;
  sourcePatientName: string;
  targetPatientId: string;
  targetPatientName: string;
  quantityToTransfer: number;
  commercialEstimatedValue?: number;
  note?: string;
}

export interface TransferStockResult {
  updatedSourceMed: Medication;
  createdOrUpdatedTargetMed: Medication;
  transferLog: {
    fromPatient: string;
    toPatient: string;
    medicationName: string;
    quantity: number;
    savingsAmount: number;
    date: string;
    note?: string;
  };
}

/**
 * Registers a new purchase towards a pharmacy loyalty promo (e.g. 3+1 free)
 */
export function recordLoyaltyPurchase(medication: Medication): Medication {
  if (!medication.loyaltyPromo || !medication.loyaltyPromo.enabled) {
    return medication;
  }

  const promo = medication.loyaltyPromo;
  const newCount = promo.currentPurchased + 1;
  const isReady = newCount >= promo.requiredPurchases;

  return {
    ...medication,
    loyaltyPromo: {
      ...promo,
      currentPurchased: newCount,
      isRewardReady: isReady
    }
  };
}

/**
 * Claims the free bonus item from a loyalty promo and resets the stamp counter
 */
export function claimLoyaltyReward(medication: Medication): { updatedMed: Medication; bonusAddedUnits: number } {
  if (!medication.loyaltyPromo) {
    return { updatedMed: medication, bonusAddedUnits: 0 };
  }

  const promo = medication.loyaltyPromo;
  return {
    updatedMed: {
      ...medication,
      currentStock: medication.currentStock + 1,
      loyaltyPromo: {
        ...promo,
        currentPurchased: 0,
        isRewardReady: false
      }
    },
    bonusAddedUnits: 1
  };
}

/**
 * Transfers unused medication stock between family members/in-laws at $0 cost
 */
export function transferMedicationStock({
  sourceMedication,
  sourcePatientName,
  targetPatientId,
  targetPatientName,
  quantityToTransfer,
  commercialEstimatedValue = 0,
  note
}: TransferStockParams): TransferStockResult {
  const actualQty = Math.min(sourceMedication.currentStock, quantityToTransfer);
  const remainingSourceStock = Math.max(0, sourceMedication.currentStock - actualQty);

  const updatedSourceMed: Medication = {
    ...sourceMedication,
    currentStock: remainingSourceStock
  };

  const createdOrUpdatedTargetMed: Medication = {
    ...sourceMedication,
    id: `med-transfer-${Date.now()}`,
    patientId: targetPatientId,
    currentStock: actualQty,
    unitCost: 0, // Donated at $0 to the receiving family member
    isImssCovered: sourceMedication.isImssCovered,
    donationSource: {
      fromPatientName: sourcePatientName,
      date: formatDateIso(new Date()),
      notes: note || `Donación solidaria de ${actualQty} ${sourceMedication.presentation}s de ${sourcePatientName}.`
    }
  };

  return {
    updatedSourceMed,
    createdOrUpdatedTargetMed,
    transferLog: {
      fromPatient: sourcePatientName,
      toPatient: targetPatientName,
      medicationName: sourceMedication.name,
      quantity: actualQty,
      savingsAmount: commercialEstimatedValue,
      date: formatDateIso(new Date()),
      note
    }
  };
}

export interface SavingsSummaryParams {
  loyaltyFreeBoxesClaimed: Array<{ medicationName: string; storeName: string; value: number }>;
  solidarityTransfers: Array<{ medicationName: string; from: string; to: string; estimatedValue: number }>;
}

export function calculateLoyaltyAndSolidaritySavings(params: SavingsSummaryParams) {
  const totalLoyaltySavings = params.loyaltyFreeBoxesClaimed.reduce((acc, c) => acc + c.value, 0);
  const totalSolidaritySavings = params.solidarityTransfers.reduce((acc, c) => acc + c.estimatedValue, 0);

  return {
    totalLoyaltySavings,
    totalSolidaritySavings,
    grandTotalSmartSavings: totalLoyaltySavings + totalSolidaritySavings
  };
}
