import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HealthExpense, FamilyMember } from '../../types';
import {
  DollarSign,
  Plus,
  Trash2,
  Share2,
  Receipt,
  Users,
  ArrowRight,
  Pill,
  FlaskConical,
  Stethoscope,
  ShoppingBag,
  X,
  Check
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { formatDateIso } from '../../utils/frequencyEngine';
import { calculateFamilyExpenseSplit, buildExpenseWhatsAppSummary } from '../../utils/expenseEngine';
import { shareViaWhatsApp } from '../../lib/whatsapp';

export const ExpensesView: React.FC = () => {
  const { activePatient, expenses, addExpense, deleteExpense, families, addFamilyMember } = useApp();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState<HealthExpense['category']>('medication');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [date, setDate] = useState<string>(formatDateIso(new Date()));

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please select a patient profile to view and split health expenses.</p>
      </div>
    );
  }

  const patientExpenses = expenses.filter(e => e.patientId === activePatient.id);
  const splitData = calculateFamilyExpenseSplit(patientExpenses, families);

  // Category totals
  const medTotal = patientExpenses.filter(e => e.category === 'medication').reduce((a, b) => a + b.amount, 0);
  const labTotal = patientExpenses.filter(e => e.category === 'lab_study').reduce((a, b) => a + b.amount, 0);
  const docTotal = patientExpenses.filter(e => e.category === 'doctor_appointment').reduce((a, b) => a + b.amount, 0);
  const supTotal = patientExpenses.filter(e => e.category === 'supplies' || e.category === 'other').reduce((a, b) => a + b.amount, 0);

  const handleOpenAdd = () => {
    setConcept('');
    setAmount('');
    setPaidBy(families.length > 0 ? families[0].name : '');
    setIsAddExpenseOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || amount === '' || !paidBy.trim()) return;

    addExpense({
      patientId: activePatient.id,
      concept: concept.trim(),
      category,
      amount: Number(amount),
      date,
      paidBy: paidBy.trim()
    });

    setIsAddExpenseOpen(false);
  };

  const handleShareWhatsApp = () => {
    const summary = buildExpenseWhatsAppSummary(activePatient, patientExpenses, families);
    shareViaWhatsApp(summary);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {activePatient.name}'s Health Expenses & Family Split
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Transparent caregiver expenditure tracking and fair settlement calculator.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleShareWhatsApp}
            title="Share settlement summary to Family WhatsApp group"
            style={{ color: '#16a34a' }}
          >
            <Share2 size={16} /> Share on WhatsApp
          </button>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Record Health Expense
          </button>
        </div>
      </div>

      {/* Category Spend Distribution Cards */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Pill size={14} /> Pharmacy & Meds
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>{formatCurrency(medTotal)}</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <FlaskConical size={14} /> Lab Studies & Tests
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>{formatCurrency(labTotal)}</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Stethoscope size={14} /> Doctor Consultations
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>{formatCurrency(docTotal)}</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShoppingBag size={14} /> Supplies & Other
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>{formatCurrency(supTotal)}</div>
        </div>
      </div>

      {/* Sibling Split Balances & Settlement Box */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--primary)" /> Family Cost Sharing & Net Balances (Total: {formatCurrency(splitData.totalSpent)})
        </h3>

        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          {splitData.memberBalances.map((member, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{member.name}</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Paid Out-of-Pocket: <strong>{formatCurrency(member.paid)}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Target Share: {formatCurrency(member.targetShare)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${member.netBalance >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}>
                  {member.netBalance >= 0
                    ? `+${formatCurrency(member.netBalance)} (Creditor)`
                    : `-${formatCurrency(Math.abs(member.netBalance))} (Due)`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended Transfers */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '1rem'
          }}
        >
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem' }}>
            🤝 Recommended Debt Settlement Transfers:
          </div>

          {splitData.transfers.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: '#1e3a8a', margin: 0 }}>
              ✓ All health expenses are currently settled evenly among caregivers.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {splitData.transfers.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e3a8a'
                  }}
                >
                  <span>💸 <strong>{t.from}</strong></span>
                  <ArrowRight size={14} />
                  <span>transfers <strong>{formatCurrency(t.amount)}</strong> to <strong>{t.to}</strong></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historical Expenses Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Expense Log History ({patientExpenses.length})
        </h3>

        {patientExpenses.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No expenses recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Date</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Concept</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Category</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Paid By</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {patientExpenses.map((exp, idx) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: idx % 2 === 0 ? '#fff' : 'var(--bg-primary)' }}>
                    <td style={{ padding: '0.625rem 0.75rem', whiteSpace: 'nowrap' }}>{exp.date}</td>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{exp.concept}</td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>{exp.paidBy}</td>
                    <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                      {formatCurrency(exp.amount)}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => deleteExpense(exp.id)}
                        aria-label="Delete expense"
                        style={{ padding: '0.2rem 0.4rem' }}
                      >
                        <Trash2 size={14} color="var(--danger)" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddExpenseOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Record Health Expense</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddExpenseOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Expense Concept / Description *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Metformin 3-month supply, Doctor Consultation"
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                  >
                    <option value="medication">Pharmacy & Medications</option>
                    <option value="lab_study">Laboratory Studies / X-Ray</option>
                    <option value="doctor_appointment">Doctor Consultation</option>
                    <option value="supplies">Medical Supplies & Equipment</option>
                    <option value="other">Other Health Expense</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount ($ MXN) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 750"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Paid By (Caregiver) *</label>
                  <select
                    className="form-select"
                    value={paidBy}
                    onChange={e => setPaidBy(e.target.value)}
                    required
                  >
                    {families.map(f => (
                      <option key={f.id} value={f.name}>{f.name} ({f.relationship || 'Family'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Expense</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddExpenseOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
