import { describe, it, expect } from 'vitest';
import { getStockStatus } from '../src/utils/formatters';
import { Medication } from '../src/types';

describe('Temporary vs Chronic Treatment Stock Rules', () => {
  it('1. Temporary treatments with minimumStockAlert 0 do not trigger false low-stock warning', () => {
    const tempMed: Partial<Medication> = {
      name: 'Amoxicilina 500mg (Antibiótico 7 días)',
      treatmentType: 'temporary',
      currentStock: 2,
      minimumStockAlert: 0,
      stockTrackingMode: 'pieces'
    };

    const status = getStockStatus(tempMed.currentStock!, tempMed.minimumStockAlert!, tempMed.stockTrackingMode);
    expect(status.status).toBe('ok');
    expect(status.label).toContain('En Stock (2)');
  });

  it('2. Chronic treatments with low stock trigger low stock alert to repurchase', () => {
    const chronicMed: Partial<Medication> = {
      name: 'Rivaroxaban 2.5mg (Crónico Anticoagulante)',
      treatmentType: 'chronic',
      currentStock: 4,
      minimumStockAlert: 6,
      stockTrackingMode: 'pieces'
    };

    const status = getStockStatus(chronicMed.currentStock!, chronicMed.minimumStockAlert!, chronicMed.stockTrackingMode);
    expect(status.status).toBe('low');
    expect(status.label).toContain('Poco Stock (4)');
  });
});
