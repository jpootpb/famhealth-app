import { describe, it, expect } from 'vitest';
import { calculateFamilyExpenseSplit, buildExpenseWhatsAppSummary } from '../src/utils/expenseEngine';
import { HealthExpense, FamilyMember, Patient } from '../src/types';

describe('Family Health Expense Split & Settlement Engine (Task 11)', () => {
  const families: FamilyMember[] = [
    { id: '1', name: 'Carlos Poot', splitPercentage: 50, isActive: true },
    { id: '2', name: 'Lucia Poot', splitPercentage: 50, isActive: true }
  ];

  const patient: Patient = {
    id: 'p-1',
    name: 'Don Manuel Poot',
    type: 'chronic'
  };

  it('1. Should calculate equal 50/50 split settlement accurately', () => {
    const expenses: HealthExpense[] = [
      { id: '1', patientId: 'p-1', concept: 'Metformin restock', category: 'medication', amount: 770, date: '2026-08-14', paidBy: 'Carlos Poot' },
      { id: '2', patientId: 'p-1', concept: 'HbA1c Lab Panel', category: 'lab_study', amount: 1250, date: '2026-08-10', paidBy: 'Carlos Poot' }
    ];

    const result = calculateFamilyExpenseSplit(expenses, families);

    expect(result.totalSpent).toBe(2020);
    expect(result.memberBalances.find(m => m.name === 'Carlos Poot')?.paid).toBe(2020);
    expect(result.memberBalances.find(m => m.name === 'Lucia Poot')?.paid).toBe(0);

    // Lucia owes Carlos 50% = $1,010
    expect(result.transfers.length).toBe(1);
    expect(result.transfers[0].from).toBe('Lucia Poot');
    expect(result.transfers[0].to).toBe('Carlos Poot');
    expect(result.transfers[0].amount).toBe(1010);
  });

  it('2. Should handle unequal payments with partial balances', () => {
    const expenses: HealthExpense[] = [
      { id: '1', patientId: 'p-1', concept: 'Pharmacy', category: 'medication', amount: 1000, date: '2026-08-14', paidBy: 'Carlos Poot' },
      { id: '2', patientId: 'p-1', concept: 'Doctor visit', category: 'doctor_appointment', amount: 600, date: '2026-08-10', paidBy: 'Lucia Poot' }
    ];

    const result = calculateFamilyExpenseSplit(expenses, families);

    expect(result.totalSpent).toBe(1600);
    expect(result.transfers.length).toBe(1);
    expect(result.transfers[0].from).toBe('Lucia Poot');
    expect(result.transfers[0].to).toBe('Carlos Poot');
    expect(result.transfers[0].amount).toBe(200);
  });

  it('3. Should format WhatsApp expense summary clearly', () => {
    const expenses: HealthExpense[] = [
      { id: '1', patientId: 'p-1', concept: 'Pharmacy', category: 'medication', amount: 1000, date: '2026-08-14', paidBy: 'Carlos Poot' },
      { id: '2', patientId: 'p-1', concept: 'Doctor visit', category: 'doctor_appointment', amount: 600, date: '2026-08-10', paidBy: 'Lucia Poot' }
    ];

    const summary = buildExpenseWhatsAppSummary(patient, expenses, families);
    expect(summary).toContain('HEALTH EXPENSES & FAMILY SPLIT - DON MANUEL POOT');
    expect(summary).toContain('Lucia Poot* transfers');
    expect(summary).toContain('Carlos Poot');
  });
});
