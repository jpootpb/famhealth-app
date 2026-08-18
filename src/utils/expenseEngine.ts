import { HealthExpense, FamilyMember, Patient } from '../types';
import { formatCurrency } from './formatters';

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface SplitResult {
  totalSpent: number;
  memberBalances: Array<{ name: string; paid: number; targetShare: number; netBalance: number }>;
  transfers: SettlementTransfer[];
}

export type ExpensePeriodType =
  | 'current_week'
  | 'current_fortnight'
  | 'current_month'
  | 'previous_month'
  | 'year'
  | 'all';

export function filterExpensesByPeriod(
  expenses: HealthExpense[],
  period: ExpensePeriodType,
  refDate: Date = new Date(),
  customYear?: number
): HealthExpense[] {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth(); // 0-indexed
  const currentDay = refDate.getDate();

  return expenses.filter(exp => {
    const expDate = new Date(exp.date + 'T12:00:00');
    if (isNaN(expDate.getTime())) return true;

    const eYear = expDate.getFullYear();
    const eMonth = expDate.getMonth();
    const eDay = expDate.getDate();

    switch (period) {
      case 'current_week': {
        const dayOfWeek = refDate.getDay();
        const startOfWeek = new Date(refDate);
        startOfWeek.setDate(refDate.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return expDate >= startOfWeek && expDate <= endOfWeek;
      }

      case 'current_fortnight': {
        if (eYear !== currentYear || eMonth !== currentMonth) return false;
        if (currentDay <= 15) {
          return eDay <= 15;
        } else {
          return eDay >= 16;
        }
      }

      case 'current_month': {
        return eYear === currentYear && eMonth === currentMonth;
      }

      case 'previous_month': {
        const prevMonthDate = new Date(refDate);
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        return eYear === prevMonthDate.getFullYear() && eMonth === prevMonthDate.getMonth();
      }

      case 'year': {
        const targetYear = customYear || currentYear;
        return eYear === targetYear;
      }

      case 'all':
      default:
        return true;
    }
  });
}

export interface YearlyBreakdown {
  year: number;
  total: number;
  categories: Record<string, number>;
  count: number;
}

export function getYearlyExpenseBreakdown(
  expenses: HealthExpense[],
  year: number = new Date().getFullYear()
): YearlyBreakdown {
  const yearlyExpenses = expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d.getFullYear() === year;
  });

  const total = yearlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const categories: Record<string, number> = {
    medication: 0,
    lab_study: 0,
    doctor_appointment: 0,
    supplies: 0,
    other: 0
  };

  yearlyExpenses.forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + e.amount;
  });

  return {
    year,
    total,
    categories,
    count: yearlyExpenses.length
  };
}

export function calculateFamilyExpenseSplit(
  expenses: HealthExpense[],
  families: FamilyMember[]
): SplitResult {
  const activeMembers = families.filter(f => f.isActive);
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (activeMembers.length === 0 || totalSpent === 0) {
    return { totalSpent, memberBalances: [], transfers: [] };
  }

  const memberBalances = activeMembers.map(member => {
    const paid = expenses
      .filter(e => e.paidBy.trim().toLowerCase() === member.name.trim().toLowerCase())
      .reduce((acc, curr) => acc + curr.amount, 0);

    const sharePercent = member.splitPercentage || (100 / activeMembers.length);
    const targetShare = (totalSpent * sharePercent) / 100;
    const netBalance = paid - targetShare;

    return {
      name: member.name,
      paid,
      targetShare,
      netBalance
    };
  });

  const debtors = memberBalances
    .filter(m => m.netBalance < -0.01)
    .map(m => ({ name: m.name, owes: -m.netBalance }))
    .sort((a, b) => b.owes - a.owes);

  const creditors = memberBalances
    .filter(m => m.netBalance > 0.01)
    .map(m => ({ name: m.name, receives: m.netBalance }))
    .sort((a, b) => b.receives - a.receives);

  const transfers: SettlementTransfer[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = Math.min(debtor.owes, creditor.receives);

    if (amount > 0.01) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amount * 100) / 100
      });
    }

    debtor.owes -= amount;
    creditor.receives -= amount;

    if (debtor.owes <= 0.01) dIdx++;
    if (creditor.receives <= 0.01) cIdx++;
  }

  return {
    totalSpent,
    memberBalances,
    transfers
  };
}

export function buildExpenseWhatsAppSummary(
  patient: Patient,
  expenses: HealthExpense[],
  families: FamilyMember[]
): string {
  const settlement = calculateFamilyExpenseSplit(expenses, families);
  const lines: string[] = [];

  lines.push('💰 *HEALTH EXPENSES & FAMILY SPLIT - ' + patient.name.toUpperCase() + '*');
  lines.push('📊 *Total Spent:* ' + formatCurrency(settlement.totalSpent));
  lines.push('');
  lines.push('*Family Balances:*');

  settlement.memberBalances.forEach(b => {
    const status = b.netBalance >= 0 ? 'Owed +' + formatCurrency(b.netBalance) : 'Due ' + formatCurrency(b.netBalance);
    lines.push('• *' + b.name + '*: Paid ' + formatCurrency(b.paid) + ' (' + status + ')');
  });

  if (settlement.transfers.length > 0) {
    lines.push('');
    lines.push('🤝 *Recommended Transfers:*');
    settlement.transfers.forEach(t => {
      lines.push('👉 *' + t.from + '* transfers *' + formatCurrency(t.amount) + '* to *' + t.to + '*');
    });
  } else {
    lines.push('');
    lines.push('✓ All expenses are settled evenly.');
  }

  lines.push('');
  lines.push('_FamHealth Expense Splitter_');

  return lines.join('\n');
}
