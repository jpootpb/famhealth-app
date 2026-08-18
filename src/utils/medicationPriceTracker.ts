import { Medication, HealthExpense } from '../types';

export interface MedicationPriceTrend {
  medicationId: string;
  medicationName: string;
  isImssCovered: boolean;
  latestPrice: number;
  previousPrice?: number;
  priceChange: number; // Positive = increased cost, Negative = savings / cheaper
  priceChangePercent: number;
  trendDirection: 'increase' | 'decrease' | 'stable' | 'imss_free';
  store: string;
  purchaseNotes?: string;
  purchaseCount: number;
  lastPurchaseDate?: string;
}

export interface SmartSavingsItem {
  medicationName: string;
  storeName: string;
  pricePaid: number;
  referencePrice: number;
  savingsAmount: number;
  savingsPercent: number;
  tips: string;
}

export interface FamilySavingsReport {
  totalSavings: number;
  smartPurchases: SmartSavingsItem[];
  imssCoveredCount: number;
  trackedMedsCount: number;
  priceIncreasesCount: number;
}

/**
 * Calculates price evolution and inflation/savings trend for each medication
 */
export function calculateMedicationPriceTrends(
  medications: Medication[],
  expenses: HealthExpense[]
): MedicationPriceTrend[] {
  return medications.map(med => {
    if (med.isImssCovered || med.source === 'imss') {
      return {
        medicationId: med.id,
        medicationName: med.name,
        isImssCovered: true,
        latestPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        trendDirection: 'imss_free',
        store: med.preferredStore || 'IMSS Suministro Institucional ($0 MXN)',
        purchaseNotes: med.purchaseNotes || 'Medicamento cubierto por el IMSS / Sector Salud (Sin gasto familiar).',
        purchaseCount: 0
      };
    }

    // Filter relevant purchases for this medication
    const purchases = expenses
      .filter(e => e.medicationId === med.id || e.concept.toLowerCase().includes(med.name.toLowerCase().split(' ')[0]))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (purchases.length === 0) {
      return {
        medicationId: med.id,
        medicationName: med.name,
        isImssCovered: false,
        latestPrice: med.unitCost || 0,
        priceChange: 0,
        priceChangePercent: 0,
        trendDirection: 'stable',
        store: med.preferredStore || 'Farmacia',
        purchaseNotes: med.purchaseNotes,
        purchaseCount: 0
      };
    }

    const latest = purchases[purchases.length - 1];
    const previous = purchases.length > 1 ? purchases[purchases.length - 2] : null;

    const latestPrice = latest.amount;
    const previousPrice = previous ? previous.amount : (med.unitCost || latestPrice);
    const priceChange = latestPrice - previousPrice;
    const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

    let trendDirection: 'increase' | 'decrease' | 'stable' = 'stable';
    if (priceChange > 0.01) trendDirection = 'increase';
    else if (priceChange < -0.01) trendDirection = 'decrease';

    return {
      medicationId: med.id,
      medicationName: med.name,
      isImssCovered: false,
      latestPrice,
      previousPrice,
      priceChange,
      priceChangePercent,
      trendDirection,
      store: latest.store || med.preferredStore || 'Farmacia',
      purchaseNotes: med.purchaseNotes,
      purchaseCount: purchases.length,
      lastPurchaseDate: latest.date
    };
  });
}

/**
 * Finds the cheapest recommended store and historical savings for a medication
 */
export function findBestStoreForMedication(
  medication: Medication,
  expenses: HealthExpense[]
): { storeName: string; lowestPrice: number; estimatedSavingsVsPharmacy: number; notes: string } {
  if (medication.isImssCovered) {
    return {
      storeName: 'IMSS / Sector Salud',
      lowestPrice: 0,
      estimatedSavingsVsPharmacy: medication.unitCost || 0,
      notes: 'Suministrado gratis por el IMSS.'
    };
  }

  const purchases = expenses.filter(
    e => e.medicationId === medication.id || e.concept.toLowerCase().includes(medication.name.toLowerCase().split(' ')[0])
  );

  if (purchases.length === 0) {
    return {
      storeName: medication.preferredStore || 'Farmacia Habitual',
      lowestPrice: medication.unitCost || 0,
      estimatedSavingsVsPharmacy: 0,
      notes: medication.purchaseNotes || 'Sin compras registradas aún.'
    };
  }

  const sortedByPrice = [...purchases].sort((a, b) => a.amount - b.amount);
  const cheapest = sortedByPrice[0];
  const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
  const savings = Math.max(0, mostExpensive.amount - cheapest.amount);

  return {
    storeName: cheapest.store || medication.preferredStore || 'Tienda Recomendada',
    lowestPrice: cheapest.amount,
    estimatedSavingsVsPharmacy: savings,
    notes: medication.purchaseNotes || `Mejor precio registrado en ${cheapest.store || 'tienda'}.`
  };
}

/**
 * Generates an executive summary of smart purchases, price increases and family savings
 */
export function analyzeFamilySavingsReport(
  medications: Medication[],
  expenses: HealthExpense[]
): FamilySavingsReport {
  let totalSavings = 0;
  const smartPurchases: SmartSavingsItem[] = [];
  let imssCount = 0;
  let priceIncreases = 0;

  medications.forEach(med => {
    if (med.isImssCovered) {
      imssCount++;
      return;
    }

    const purchases = expenses.filter(
      e => e.medicationId === med.id || e.concept.toLowerCase().includes(med.name.toLowerCase().split(' ')[0])
    );

    if (purchases.length >= 2) {
      const sorted = [...purchases].sort((a, b) => a.amount - b.amount);
      const lowest = sorted[0];
      const highest = sorted[sorted.length - 1];

      if (highest.amount > lowest.amount) {
        const savings = highest.amount - lowest.amount;
        totalSavings += savings;
        smartPurchases.push({
          medicationName: med.name,
          storeName: lowest.store || med.preferredStore || 'Tienda / Mercado Libre',
          pricePaid: lowest.amount,
          referencePrice: highest.amount,
          savingsAmount: savings,
          savingsPercent: Math.round((savings / highest.amount) * 100),
          tips: med.purchaseNotes || `Comprado en ${lowest.store || 'tienda'} en lugar de ${highest.store || 'farmacia'}.`
        });
      }
    }
  });

  const trends = calculateMedicationPriceTrends(medications, expenses);
  priceIncreases = trends.filter(t => t.trendDirection === 'increase').length;

  return {
    totalSavings,
    smartPurchases,
    imssCoveredCount: imssCount,
    trackedMedsCount: medications.length,
    priceIncreasesCount: priceIncreases
  };
}
