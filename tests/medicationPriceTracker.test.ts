import { describe, it, expect } from 'vitest';
import { Medication, HealthExpense } from '../src/types';
import {
  calculateMedicationPriceTrends,
  analyzeFamilySavingsReport,
  findBestStoreForMedication
} from '../src/utils/medicationPriceTracker';

describe('Medication Price Inflation, IMSS Coverage & Family Savings Tracker (TDD)', () => {
  const sampleMeds: Medication[] = [
    {
      id: 'med-metformin',
      patientId: 'patient-poot',
      name: 'Metformina 500mg',
      presentation: 'tablet',
      isImssCovered: true,
      source: 'imss',
      unitCost: 0,
      frequency: { type: 'daily_fixed', doseSlots: [{ time: '08:00', dose: 1 }], startDate: '2026-01-01' },
      currentStock: 30,
      minimumStockAlert: 5,
      preferredStore: 'IMSS Clínica 59',
      purchaseNotes: 'Suministrado gratis por el IMSS en la receta mensual.'
    },
    {
      id: 'med-rivaroxaban',
      patientId: 'patient-poot',
      name: 'Rivaroxabán 20mg',
      presentation: 'tablet',
      isImssCovered: false,
      source: 'online_store',
      unitCost: 510,
      frequency: { type: 'alternate_days', doseSlots: [{ time: '13:00', dose: 1 }], startDate: '2026-08-01' },
      currentStock: 14,
      minimumStockAlert: 4,
      preferredStore: 'Mercado Libre',
      purchaseNotes: 'Comprar genérico con mismo compuesto y gramaje a $510 en Mercado Libre (vs $1,200 en farmacias de cadena).'
    },
    {
      id: 'med-krytantek',
      patientId: 'patient-poot',
      name: 'Krytantek Gotas Oftálmicas',
      presentation: 'drops',
      isImssCovered: false,
      source: 'medical_sample',
      unitCost: 600,
      frequency: { type: 'daily_fixed', doseSlots: [{ time: '08:00', dose: 1 }, { time: '20:00', dose: 1 }], startDate: '2026-08-01' },
      currentStock: 2,
      minimumStockAlert: 1,
      preferredStore: 'Muestras Médicas / Consultorio',
      purchaseNotes: 'Conseguir muestras médicas a $600 (cuestan $890 en farmacias).'
    },
    {
      id: 'med-aspirin',
      patientId: 'patient-poot',
      name: 'Aspirina Protect 100mg',
      presentation: 'tablet',
      isImssCovered: false,
      source: 'private_pharmacy',
      unitCost: 210,
      frequency: { type: 'daily_fixed', doseSlots: [{ time: '14:00', dose: 1 }], startDate: '2026-08-01' },
      currentStock: 20,
      minimumStockAlert: 5,
      preferredStore: 'Farmacias Guadalajara'
    }
  ];

  const sampleExpenses: HealthExpense[] = [
    {
      id: 'exp-1',
      patientId: 'patient-poot',
      concept: 'Rivaroxabán 20mg en Farmacia Guadalajara',
      category: 'medication',
      amount: 1200,
      date: '2026-07-15',
      paidBy: 'Carlos Poot',
      store: 'Farmacias Guadalajara',
      medicationId: 'med-rivaroxaban'
    },
    {
      id: 'exp-2',
      patientId: 'patient-poot',
      concept: 'Rivaroxabán 20mg en Mercado Libre (Genérico mismo compuesto)',
      category: 'medication',
      amount: 510,
      date: '2026-08-14',
      paidBy: 'Lucía Poot',
      store: 'Mercado Libre',
      medicationId: 'med-rivaroxaban'
    },
    {
      id: 'exp-3',
      patientId: 'patient-poot',
      concept: 'Krytantek Gotas Muestras Médicas',
      category: 'medication',
      amount: 600,
      date: '2026-08-10',
      paidBy: 'Jorge Poot',
      store: 'Muestras Médicas',
      medicationId: 'med-krytantek'
    },
    {
      id: 'exp-4',
      patientId: 'patient-poot',
      concept: 'Aspirina Protect 100mg (Compra 1)',
      category: 'medication',
      amount: 180,
      date: '2026-06-10',
      paidBy: 'Carlos Poot',
      store: 'Farmacias Guadalajara',
      medicationId: 'med-aspirin'
    },
    {
      id: 'exp-5',
      patientId: 'patient-poot',
      concept: 'Aspirina Protect 100mg (Compra 2 con aumento)',
      category: 'medication',
      amount: 210,
      date: '2026-08-01',
      paidBy: 'Carlos Poot',
      store: 'Farmacias Guadalajara',
      medicationId: 'med-aspirin'
    }
  ];

  it('1. Should recognize IMSS-covered medications with $0 cost and zero financial burden', () => {
    const trends = calculateMedicationPriceTrends(sampleMeds, sampleExpenses);
    const metformin = trends.find(t => t.medicationId === 'med-metformin');

    expect(metformin).toBeDefined();
    expect(metformin?.isImssCovered).toBe(true);
    expect(metformin?.latestPrice).toBe(0);
    expect(metformin?.store).toContain('IMSS');
  });

  it('2. Should detect price inflation or price reduction across purchases', () => {
    const trends = calculateMedicationPriceTrends(sampleMeds, sampleExpenses);
    
    // Aspirina went up from $180 to $210 (+16.6%)
    const aspirin = trends.find(t => t.medicationId === 'med-aspirin');
    expect(aspirin?.priceChange).toBe(30);
    expect(aspirin?.priceChangePercent).toBeCloseTo(16.67, 1);
    expect(aspirin?.trendDirection).toBe('increase');

    // Rivaroxaban dropped from $1200 to $510 (-57.5%) thanks to Mercado Libre
    const rivaroxaban = trends.find(t => t.medicationId === 'med-rivaroxaban');
    expect(rivaroxaban?.priceChange).toBe(-690);
    expect(rivaroxaban?.priceChangePercent).toBeCloseTo(-57.5, 1);
    expect(rivaroxaban?.trendDirection).toBe('decrease');
  });

  it('3. Should calculate total family savings and recommended purchase stores for siblings', () => {
    const savingsReport = analyzeFamilySavingsReport(sampleMeds, sampleExpenses);

    expect(savingsReport.totalSavings).toBeGreaterThanOrEqual(690);
    expect(savingsReport.smartPurchases.length).toBeGreaterThan(0);

    const bestStore = findBestStoreForMedication(sampleMeds[1], sampleExpenses);
    expect(bestStore.storeName).toBe('Mercado Libre');
    expect(bestStore.lowestPrice).toBe(510);
    expect(bestStore.estimatedSavingsVsPharmacy).toBe(690);
  });
});
