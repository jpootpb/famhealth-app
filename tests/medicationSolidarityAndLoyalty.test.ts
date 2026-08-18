import { describe, it, expect } from 'vitest';
import { Medication, Patient } from '../src/types';
import {
  recordLoyaltyPurchase,
  transferMedicationStock,
  calculateLoyaltyAndSolidaritySavings
} from '../src/utils/medicationSolidarityEngine';

describe('Pharmacy Loyalty Programs (3+1 Free) & Family Medication Solidarity Bank (TDD)', () => {
  const patientMaria: Patient = {
    id: 'patient-maria',
    name: 'Doña María Poot',
    age: 52,
    type: 'temporary',
    primaryDiagnosis: 'Dolor Neuropático Tratado'
  };

  const patientSuegra: Patient = {
    id: 'patient-suegra',
    name: 'Doña Carmen (Suegra)',
    age: 72,
    type: 'chronic',
    primaryDiagnosis: 'Neuropatía Diabética'
  };

  const eyestilMed: Medication = {
    id: 'med-eyestil',
    patientId: 'patient-jose',
    name: 'Eyestil Plus Gotas Oftálmicas',
    presentation: 'drops',
    currentStock: 1,
    minimumStockAlert: 1,
    unitCost: 380,
    preferredStore: 'Farmacias Value',
    frequency: { type: 'daily_fixed', doseSlots: [{ time: '08:00', dose: 1 }], startDate: '2026-08-01' },
    loyaltyPromo: {
      enabled: true,
      storeName: 'Farmacias Value',
      requiredPurchases: 3,
      currentPurchased: 2,
      rewardDescription: '1 Frasco Gratis en la 3era compra acumulada'
    }
  };

  const pregabalinaMedMaria: Medication = {
    id: 'med-pregabalina-maria',
    patientId: 'patient-maria',
    name: 'Pregabalina 75mg (IMSS)',
    presentation: 'capsule',
    isImssCovered: true,
    source: 'imss',
    currentStock: 28, // 1 caja completa sin usar
    minimumStockAlert: 5,
    unitCost: 0,
    frequency: { type: 'daily_fixed', doseSlots: [{ time: '21:00', dose: 1 }], startDate: '2026-01-01' }
  };

  it('1. Should track loyalty purchases and trigger a FREE reward alert when goal is met (Farmacia Value 3+1)', () => {
    // Current is 2/3. Recording 1 more purchase reaches 3/3 -> Next one is FREE!
    const updatedMed = recordLoyaltyPurchase(eyestilMed);

    expect(updatedMed.loyaltyPromo?.currentPurchased).toBe(3);
    expect(updatedMed.loyaltyPromo?.isRewardReady).toBe(true);
    expect(updatedMed.loyaltyPromo?.rewardDescription).toContain('Gratis');
  });

  it('2. Should support transferring unused medication stock from one family member (Maria) to another (Suegra) at $0 cost', () => {
    const { updatedSourceMed, createdOrUpdatedTargetMed, transferLog } = transferMedicationStock({
      sourceMedication: pregabalinaMedMaria,
      sourcePatientName: patientMaria.name,
      targetPatientId: patientSuegra.id,
      targetPatientName: patientSuegra.name,
      quantityToTransfer: 28,
      commercialEstimatedValue: 450,
      note: 'Medicamento del seguro que Doña María ya no usa y le sirve a la suegra.'
    });

    // Maria's stock reduces from 28 to 0
    expect(updatedSourceMed.currentStock).toBe(0);

    // Suegra receives 28 capsules at $0 cost
    expect(createdOrUpdatedTargetMed.currentStock).toBe(28);
    expect(createdOrUpdatedTargetMed.unitCost).toBe(0);
    expect(createdOrUpdatedTargetMed.donationSource?.fromPatientName).toBe('Doña María Poot');
    expect(transferLog.savingsAmount).toBe(450);
  });

  it('3. Should calculate total family savings from pharmacy promos and inter-family donations', () => {
    const savings = calculateLoyaltyAndSolidaritySavings({
      loyaltyFreeBoxesClaimed: [
        { medicationName: 'Eyestil Plus', storeName: 'Farmacias Value', value: 380 }
      ],
      solidarityTransfers: [
        { medicationName: 'Pregabalina 75mg', from: 'Doña María', to: 'Suegra', estimatedValue: 450 }
      ]
    });

    expect(savings.totalLoyaltySavings).toBe(380);
    expect(savings.totalSolidaritySavings).toBe(450);
    expect(savings.grandTotalSmartSavings).toBe(830);
  });
});
