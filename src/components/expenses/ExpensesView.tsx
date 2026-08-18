import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { HealthExpense } from '../../types';
import {
  DollarSign,
  Plus,
  Trash2,
  Share2,
  Users,
  CheckCircle2,
  ArrowRight,
  Receipt,
  X,
  Calendar,
  PieChart,
  AlertTriangle,
  Pill,
  FileText,
  HeartPulse
} from 'lucide-react';
import {
  calculateFamilyExpenseSplit,
  filterExpensesByPeriod,
  getYearlyExpenseBreakdown,
  ExpensePeriodType
} from '../../utils/expenseEngine';
import { formatCurrency } from '../../utils/formatters';
import { formatDateIso } from '../../utils/frequencyEngine';
import { shareViaWhatsApp } from '../../lib/whatsapp';

export const ExpensesView: React.FC = () => {
  const { activePatient, expenses, families, addExpense, deleteExpense } = useApp();
  const { t, language } = useLanguage();

  const [selectedPeriod, setSelectedPeriod] = useState<ExpensePeriodType>('current_fortnight');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<HealthExpense | null>(null);

  // Form State
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState<HealthExpense['category']>('medication');
  const [amount, setAmount] = useState<number | ''>(500);
  const [date, setDate] = useState(formatDateIso(new Date()));
  const [paidBy, setPaidBy] = useState(families[0]?.name || 'Carlos Poot');

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
      </div>
    );
  }

  const patientExpenses = expenses.filter(e => e.patientId === activePatient.id);

  // Filtered by selected period
  const filteredExpenses = filterExpensesByPeriod(
    patientExpenses,
    selectedPeriod,
    new Date(),
    selectedYear
  );

  const periodSpent = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Settlement calculations for the filtered period
  const settlement = calculateFamilyExpenseSplit(filteredExpenses, families);

  // Annual Analytics Breakdown
  const annualBreakdown = getYearlyExpenseBreakdown(patientExpenses, selectedYear);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !amount) return;

    addExpense({
      patientId: activePatient.id,
      concept: concept.trim(),
      category,
      amount: Number(amount),
      date,
      paidBy
    });

    setConcept('');
    setAmount(500);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  const handleShareWhatsAppSettlement = () => {
    const periodLabel =
      selectedPeriod === 'current_fortnight'
        ? t('periodFortnight')
        : selectedPeriod === 'current_month'
        ? t('periodMonth')
        : selectedPeriod === 'current_week'
        ? t('periodWeek')
        : selectedPeriod === 'previous_month'
        ? t('periodPrevMonth')
        : selectedPeriod === 'year'
        ? `${t('periodYear')} (${selectedYear})`
        : t('periodAll');

    let msg = `💰 *FAMHEALTH - LIQUIDACIÓN DE GASTOS (${periodLabel.toUpperCase()})*\n`;
    msg += `👤 Paciente: *${activePatient.name}*\n`;
    msg += `📊 Gasto del Período: *${formatCurrency(periodSpent)}*\n\n`;
    msg += `*Desglose por Familiar:*\n`;
    settlement.memberBalances.forEach(b => {
      msg += `• *${b.name}*: Pagó ${formatCurrency(b.paid)} (Cuota: ${formatCurrency(b.targetShare)}) → ${b.netBalance >= 0 ? `A favor: +${formatCurrency(b.netBalance)}` : `Debe: ${formatCurrency(b.netBalance)}`}\n`;
    });

    if (settlement.transfers.length > 0) {
      msg += `\n🤝 *Transferencias para saldar este período:*\n`;
      settlement.transfers.forEach(tr => {
        msg += `👉 *${tr.from}* transfiere *${formatCurrency(tr.amount)}* a *${tr.to}*\n`;
      });
    } else {
      msg += `\n✓ Todos los gastos de este período están saldados.`;
    }

    shareViaWhatsApp(msg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
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
            {language === 'es' ? `${t('expensesTitle')} ${activePatient.name}` : `${activePatient.name}${t('expensesTitle')}`}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('expensesSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleShareWhatsAppSettlement} style={{ color: '#16a34a' }}>
            <Share2 size={18} /> {t('shareSettlement')}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> {t('recordExpense')}
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          className={`btn btn-sm ${selectedPeriod === 'current_fortnight' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('current_fortnight')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          📅 {t('periodFortnight')}
        </button>
        <button
          className={`btn btn-sm ${selectedPeriod === 'current_month' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('current_month')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          🗓️ {t('periodMonth')}
        </button>
        <button
          className={`btn btn-sm ${selectedPeriod === 'current_week' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('current_week')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          ⏳ {t('periodWeek')}
        </button>
        <button
          className={`btn btn-sm ${selectedPeriod === 'previous_month' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('previous_month')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          ⏪ {t('periodPrevMonth')}
        </button>
        <button
          className={`btn btn-sm ${selectedPeriod === 'bimonthly' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('bimonthly')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          🗓️ {t('periodBimonthly')}
        </button>
        <button
          className={`btn btn-sm ${selectedPeriod === 'quarterly' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('quarterly')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          🔬 {t('periodQuarterly')}
        </button>
        <button
          className={`btn btn-sm ${selectedPeriod === 'semiannual' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('semiannual')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          🩻 {t('periodSemiannual')}
        </button>
        <button
          className={`btn btn-sm ${selectedPeriod === 'year' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('year')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          📈 {t('periodYear')}
        </button>
        <button
          className={`btn btn-sm ${selectedPeriod === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedPeriod('all')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          📚 {t('periodAll')} ({patientExpenses.length})
        </button>
      </div>

      {/* Annual Health Budget Analytics Banner */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} color="var(--primary)" />
            <strong style={{ fontSize: '0.9375rem' }}>{t('annualBreakdownTitle')} ({selectedYear})</strong>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            {t('annualTotalSpent')}: {formatCurrency(annualBreakdown.total)} ({annualBreakdown.count} {language === 'es' ? 'gastos' : 'entries'})
          </span>
        </div>

        {/* Category Pills Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
          <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>💊 {t('catMedication')}:</span>
            <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {formatCurrency(annualBreakdown.categories['medication'] || 0)}
            </strong>
          </div>
          <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>🔬 {t('catLabStudy')}:</span>
            <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {formatCurrency(annualBreakdown.categories['lab_study'] || 0)}
            </strong>
          </div>
          <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>👨‍⚕️ {t('catDoctorApp')}:</span>
            <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {formatCurrency(annualBreakdown.categories['doctor_appointment'] || 0)}
            </strong>
          </div>
          <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>🩹 {t('catSupplies')}:</span>
            <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {formatCurrency(annualBreakdown.categories['supplies'] || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* Summary Total & Settlement Balances for Filtered Period */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t('totalSpent')} ({filteredExpenses.length} {language === 'es' ? 'compras' : 'items'})
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
              {formatCurrency(periodSpent)}
            </div>
          </div>
          <span className="badge badge-purple" style={{ fontSize: '0.8125rem' }}>
            {settlement.memberBalances.length} {language === 'es' ? 'familiares activos en la división' : 'active family contributors'}
          </span>
        </div>

        {/* Member Balances */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
          {settlement.memberBalances.map(b => (
            <div
              key={b.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div>
                <strong style={{ fontSize: '0.9375rem' }}>{b.name}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('paidOutOfPocket')}: {formatCurrency(b.paid)} • {t('targetShare')}: {formatCurrency(b.targetShare)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  className={`badge ${b.netBalance >= 0 ? 'badge-green' : 'badge-amber'}`}
                  style={{ fontSize: '0.8125rem', fontWeight: 800 }}
                >
                  {b.netBalance >= 0 ? `+${formatCurrency(b.netBalance)} (${t('creditor')})` : `${formatCurrency(b.netBalance)} (${t('due')})`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended Transfers */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px dashed var(--primary)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <strong style={{ fontSize: '0.875rem', color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>
            {t('transfersTitle')}
          </strong>

          {settlement.transfers.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--success)', margin: 0, fontWeight: 600 }}>
              {t('settledEvenly')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {settlement.transfers.map((tr, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{tr.from}</span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                  <span>{t('transfersTo')} <strong style={{ color: 'var(--success)' }}>{tr.to}</strong>:</span>
                  <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(tr.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expenses History List for Period */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
          📋 {language === 'es' ? 'Gastos del Período Seleccionado' : 'Period Expense Records'}
        </h3>

        {filteredExpenses.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('noExpensesLoggedDesc')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredExpenses.map(exp => (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9375rem', display: 'block' }}>{exp.concept}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    📅 {exp.date} • {t('paidByLabel')}: <strong>{exp.paidBy}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(exp.amount)}
                  </strong>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setExpenseToDelete(exp)}
                    aria-label="Delete expense"
                    title="Delete with safety confirmation"
                  >
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('recordExpense')}</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">{t('expenseConcept')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Compra de Metformina y Cilostazol (Farmacia)"
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('expenseCategory')}</label>
                  <select className="form-select" value={category} onChange={e => setCategory(e.target.value as any)}>
                    <option value="medication">💊 {t('catMedication')}</option>
                    <option value="lab_study">🔬 {t('catLabStudy')}</option>
                    <option value="doctor_appointment">👨‍⚕️ {t('catDoctorApp')}</option>
                    <option value="supplies">🩹 {t('catSupplies')}</option>
                    <option value="other">📦 {t('catOther')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('expenseAmount')}</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('expenseDate')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('paidByLabel')}</label>
                  <select className="form-select" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                    {families.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t('saveExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Deletion Confirmation Modal */}
      {expenseToDelete && (
        <div className="modal-backdrop" onClick={() => setExpenseToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {t('deleteExpenseSafetyTitle')}
            </h3>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {t('deleteExpenseSafetyDesc')}
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                textAlign: 'left',
                fontSize: '0.8125rem'
              }}
            >
              <div><strong>{t('expenseConcept')}:</strong> {expenseToDelete.concept}</div>
              <div><strong>{t('expenseAmount')}:</strong> {formatCurrency(expenseToDelete.amount)}</div>
              <div><strong>{t('paidByLabel')}:</strong> {expenseToDelete.paidBy}</div>
              <div><strong>{t('expenseDate')}:</strong> {expenseToDelete.date}</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setExpenseToDelete(null)}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={handleConfirmDelete}
              >
                {t('confirmDeleteExpenseBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
