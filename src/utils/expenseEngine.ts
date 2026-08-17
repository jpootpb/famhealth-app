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
    const settleAmount = Math.min(debtor.owes, creditor.receives);

    if (settleAmount > 0.01) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settleAmount * 100) / 100
      });
    }

    debtor.owes -= settleAmount;
    creditor.receives -= settleAmount;

    if (debtor.owes <= 0.01) dIdx++;
    if (creditor.receives <= 0.01) cIdx++;
  }

  return { totalSpent, memberBalances, transfers };
}

export function buildExpenseWhatsAppSummary(
  patient: Patient,
  expenses: HealthExpense[],
  families: FamilyMember[]
): string {
  const { totalSpent, memberBalances, transfers } = calculateFamilyExpenseSplit(expenses, families);

  const lines: string[] = [];
  lines.push('*HEALTH EXPENSES & FAMILY SPLIT - ' + patient.name.toUpperCase() + '*');
  lines.push('*Total Spent:* ' + formatCurrency(totalSpent));
  lines.push('');
  lines.push('*Family Contributions:*');

  memberBalances.forEach(m => {
    const statusText = m.netBalance >= 0
      ? `(Paid: ${formatCurrency(m.paid)} • Covered target)`
      : `(Paid: ${formatCurrency(m.paid)} • Owes: ${formatCurrency(Math.abs(m.netBalance))})`;
    lines.push(`• *${m.name}*: ${statusText}`);
  });

  lines.push('');
  lines.push('*Recommended Settlement Transfers:*');
  if (transfers.length === 0) {
    lines.push('✓ All family contributions are settled evenly.');
  } else {
    transfers.forEach(t => {
      lines.push(`💸 *${t.from}* transfers *${formatCurrency(t.amount)}* to *${t.to}*`);
    });
  }

  lines.push('');
  lines.push('_FamHealth Expense Splitter_');
  return lines.join('\n');
}
