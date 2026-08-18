import { describe, it, expect } from 'vitest';
import { HealthExpense, FamilyMember } from '../src/types';
import {
  filterExpensesByPeriod,
  calculateFamilyExpenseSplit,
  getYearlyExpenseBreakdown,
  ExpensePeriodType
} from '../src/utils/expenseEngine';

describe('Health Expenses Extended Periods (Bimonthly, Quarterly, Semiannual) (TDD)', () => {
  const sampleExpenses: HealthExpense[] = [
    {
      id: 'e-1',
      patientId: 'p-1',
      concept: 'August Metformin',
      category: 'medication',
      amount: 400,
      date: '2026-08-16', // Within 30 days
      paidBy: 'Carlos Poot'
    },
    {
      id: 'e-2',
      patientId: 'p-1',
      concept: 'July Blood Chem',
      category: 'lab_study',
      amount: 1200,
      date: '2026-07-15', // Within 60 days (Bimonthly)
      paidBy: 'Lucia Poot'
    },
    {
      id: 'e-3',
      patientId: 'p-1',
      concept: 'June Cardiology Consult',
      category: 'doctor_appointment',
      amount: 1500,
      date: '2026-06-10', // Within 90 days (Quarterly / Trimestral)
      paidBy: 'Carlos Poot'
    },
    {
      id: 'e-4',
      patientId: 'p-1',
      concept: 'March Doppler Ultrasound',
      category: 'imaging',
      amount: 2500,
      date: '2026-03-20', // Within 180 days (Semiannual / Cada 6 Meses)
      paidBy: 'Lucia Poot'
    },
    {
      id: 'e-5',
      patientId: 'p-1',
      concept: 'Old 2025 Surgery Expense',
      category: 'supplies',
      amount: 5000,
      date: '2025-10-10', // > 180 days (Prior Year)
      paidBy: 'Carlos Poot'
    }
  ];

  const refDate = new Date('2026-08-17T12:00:00');

  it('1. Should filter bimonthly expenses (Bimestral / Last 2 Months / 60 days)', () => {
    const bimonthly = filterExpensesByPeriod(sampleExpenses, 'bimonthly', refDate);
    expect(bimonthly.length).toBe(2); // e-1 (Aug) and e-2 (Jul)
    expect(bimonthly.map(e => e.id)).toEqual(['e-1', 'e-2']);
  });

  it('2. Should filter quarterly expenses (Trimestral / Last 3 Months / 90 days - HbA1c cycle)', () => {
    const quarterly = filterExpensesByPeriod(sampleExpenses, 'quarterly', refDate);
    expect(quarterly.length).toBe(3); // e-1 (Aug), e-2 (Jul), e-3 (Jun)
    expect(quarterly.map(e => e.id)).toEqual(['e-1', 'e-2', 'e-3']);
  });

  it('3. Should filter semiannual expenses (Semestral / Cada 6 Meses / 180 days)', () => {
    const semiannual = filterExpensesByPeriod(sampleExpenses, 'semiannual', refDate);
    expect(semiannual.length).toBe(4); // e-1, e-2, e-3, e-4 (March is within 6 months)
    expect(semiannual.find(e => e.id === 'e-5')).toBeUndefined();
  });
});
