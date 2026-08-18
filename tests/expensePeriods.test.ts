import { describe, it, expect } from 'vitest';
import { HealthExpense, FamilyMember } from '../src/types';
import {
  filterExpensesByPeriod,
  calculateFamilyExpenseSplit,
  getYearlyExpenseBreakdown,
  ExpensePeriodType
} from '../src/utils/expenseEngine';

describe('Health Expenses Period Filtering, Annual Analytics & Settlement (TDD)', () => {
  const sampleExpenses: HealthExpense[] = [
    {
      id: 'e-1',
      patientId: 'p-1',
      concept: 'Metformin Box',
      category: 'medication',
      amount: 400,
      date: '2026-08-16', // August Fortnight 2 (16-31)
      paidBy: 'Carlos Poot'
    },
    {
      id: 'e-2',
      patientId: 'p-1',
      concept: 'Blood Chem Lab Panel',
      category: 'lab_study',
      amount: 1200,
      date: '2026-08-05', // August Fortnight 1 (1-15)
      paidBy: 'Lucia Poot'
    },
    {
      id: 'e-3',
      patientId: 'p-1',
      concept: 'Cardiologist Consultation',
      category: 'doctor_appointment',
      amount: 1500,
      date: '2026-07-20', // July 2026
      paidBy: 'Carlos Poot'
    },
    {
      id: 'e-4',
      patientId: 'p-1',
      concept: 'Previous Year Hospital Supplies',
      category: 'supplies',
      amount: 3000,
      date: '2025-11-10', // 2025
      paidBy: 'Lucia Poot'
    }
  ];

  const families: FamilyMember[] = [
    { id: 'f-1', name: 'Carlos Poot', splitPercentage: 50, isActive: true },
    { id: 'f-2', name: 'Lucia Poot', splitPercentage: 50, isActive: true }
  ];

  const refDate = new Date('2026-08-17T12:00:00');

  it('1. Should filter expenses by current fortnight (16-31 August)', () => {
    const fortnightExpenses = filterExpensesByPeriod(sampleExpenses, 'current_fortnight', refDate);
    expect(fortnightExpenses.length).toBe(1);
    expect(fortnightExpenses[0].concept).toBe('Metformin Box');
    expect(fortnightExpenses[0].amount).toBe(400);
  });

  it('2. Should filter expenses by current month (August 2026)', () => {
    const monthExpenses = filterExpensesByPeriod(sampleExpenses, 'current_month', refDate);
    expect(monthExpenses.length).toBe(2); // e-1 (400) and e-2 (1200)
    const totalMonth = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    expect(totalMonth).toBe(1600);
  });

  it('3. Should filter expenses by specific year (2026 vs 2025)', () => {
    const expenses2026 = filterExpensesByPeriod(sampleExpenses, 'year', refDate, 2026);
    expect(expenses2026.length).toBe(3); // e-1, e-2, e-3
    const total2026 = expenses2026.reduce((acc, curr) => acc + curr.amount, 0);
    expect(total2026).toBe(3100);

    const expenses2025 = filterExpensesByPeriod(sampleExpenses, 'year', refDate, 2025);
    expect(expenses2025.length).toBe(1);
    expect(expenses2025[0].amount).toBe(3000);
  });

  it('4. Should calculate category breakdown for annual health reporting', () => {
    const breakdown2026 = getYearlyExpenseBreakdown(sampleExpenses, 2026);
    expect(breakdown2026.total).toBe(3100);
    expect(breakdown2026.categories['medication']).toBe(400);
    expect(breakdown2026.categories['lab_study']).toBe(1200);
    expect(breakdown2026.categories['doctor_appointment']).toBe(1500);
  });

  it('5. Should settle debts scoped to selected month only', () => {
    const monthExpenses = filterExpensesByPeriod(sampleExpenses, 'current_month', refDate);
    const settlement = calculateFamilyExpenseSplit(monthExpenses, families);

    expect(settlement.totalSpent).toBe(1600);
    // Target is 800 each. Carlos paid 400 (owes 400), Lucia paid 1200 (owed 400)
    const carlos = settlement.memberBalances.find(m => m.name === 'Carlos Poot');
    const lucia = settlement.memberBalances.find(m => m.name === 'Lucia Poot');

    expect(carlos?.netBalance).toBe(-400);
    expect(lucia?.netBalance).toBe(400);
    expect(settlement.transfers[0]).toEqual({ from: 'Carlos Poot', to: 'Lucia Poot', amount: 400 });
  });
});
