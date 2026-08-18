import { Medication } from '../types';
import { formatDateIso } from './frequencyEngine';

export type DonationRecipientType = 'family_member' | 'known_contact' | 'dispensary_or_stranger';

export interface TransferStockParams {
  sourceMedication: Medication;
  sourcePatientName: string;
  recipientType?: DonationRecipientType;
  targetPatientId?: string;
  targetPatientName?: string;
  recipientName?: string;
  quantityToTransfer: number;
  commercialEstimatedValue?: number;
  note?: string;
}

export interface TransferStockResult {
  updatedSourceMed: Medication;
  createdOrUpdatedTargetMed?: Medication;
  transferLog: {
    fromPatient: string;
    recipientType: DonationRecipientType;
    toRecipient: string;
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
 * Transfers unused medication stock to family members, friends/neighbors, or community dispensaries / strangers
 */
export function transferMedicationStock({
  sourceMedication,
  sourcePatientName,
  recipientType = 'family_member',
  targetPatientId,
  targetPatientName,
  recipientName,
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

  let destinationName = '';
  let createdOrUpdatedTargetMed: Medication | undefined = undefined;

  if (recipientType === 'family_member' && targetPatientId) {
    destinationName = targetPatientName || 'Familiar';
    createdOrUpdatedTargetMed = {
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
  } else if (recipientType === 'known_contact') {
    destinationName = recipientName?.trim() || 'Conocido / Amigo / Vecino';
  } else {
    destinationName = recipientName?.trim() || 'Dispensario Comunitario / Persona en Necesidad';
  }

  return {
    updatedSourceMed,
    createdOrUpdatedTargetMed,
    transferLog: {
      fromPatient: sourcePatientName,
      recipientType,
      toRecipient: destinationName,
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
