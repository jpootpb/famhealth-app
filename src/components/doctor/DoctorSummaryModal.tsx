import React from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Printer,
  X,
  Heart,
  FileText,
  Calendar,
  Pill,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { formatDose, formatCurrency } from '../../utils/formatters';
import { getFrequencyLabel } from '../../utils/frequencyEngine';

interface DoctorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorSummaryModal: React.FC<DoctorSummaryModalProps> = ({ isOpen, onClose }) => {
  const { activePatient, medications, vitals, studies, appointments } = useApp();
  const { t, language } = useLanguage();

  if (!isOpen || !activePatient) return null;

  const patientMeds = medications.filter(m => m.patientId === activePatient.id);
  const patientVitals = vitals.filter(v => v.patientId === activePatient.id).slice(0, 8);
  const patientStudies = studies.filter(s => s.patientId === activePatient.id).slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '850px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Actions Bar (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {t('doctorSheet')}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={16} /> {t('printReport')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div
          className="print-sheet"
          style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '1rem',
              borderBottom: '2px solid var(--primary)',
              marginBottom: '1.25rem'
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
                {t('doctorReportTitle')}
              </h1>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                {t('consultationDate')}: {new Date().toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'block' }}>
                {activePatient.name}
              </strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {activePatient.age ? `${activePatient.age} ${language === 'es' ? 'años' : 'years old'}` : ''} • {activePatient.type === 'chronic' ? t('chronicCare') : t('tempCare')}
              </span>
            </div>
          </div>

          {/* Primary Condition & Warnings */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem'
            }}
          >
            <div>
              <strong>{t('diagnosis')}:</strong> {activePatient.primaryDiagnosis || (language === 'es' ? 'Control clínico general' : 'General clinical care')}
            </div>
            {activePatient.notes && (
              <div style={{ marginTop: '0.25rem', color: 'var(--danger)', fontWeight: 600 }}>
                ⚠️ <strong>{t('allergies')}:</strong> {activePatient.notes}
              </div>
            )}
          </div>

          {/* 1. Active Prescriptions */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('activePrescriptions')}
            </h3>

            {patientMeds.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('noMedsRegistered')}</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>{language === 'es' ? 'Medicamento / Marca' : 'Medication / Brand'}</th>
                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>{language === 'es' ? 'Frecuencia / Horarios' : 'Frequency / Schedule'}</th>
                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>{language === 'es' ? 'Dosis Fraccionada' : 'Dose'}</th>
                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>{language === 'es' ? 'Indicación / Propósito' : 'Indication'}</th>
                  </tr>
                </thead>
                <tbody>
                  {patientMeds.map((m, idx) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '0.4rem 0.6rem', fontWeight: 700 }}>
                        {m.name} {m.laboratory ? `(${m.laboratory})` : ''}
                      </td>
                      <td style={{ padding: '0.4rem 0.6rem' }}>
                        {getFrequencyLabel(m.frequency)} ({m.frequency.doseSlots.map(s => s.time).join(', ')})
                      </td>
                      <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}>
                        {m.frequency.doseSlots.map(s => formatDose(s.dose, m.presentation)).join(' / ')}
                      </td>
                      <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>
                        {m.indication || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 2. Recent Vitals Summary Table */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('recentVitalsLog')}
            </h3>

            {patientVitals.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('noVitalsLogged')}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {patientVitals.map(v => (
                  <div key={v.id} style={{ padding: '0.4rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>
                    <strong style={{ color: 'var(--primary)' }}>
                      {v.type === 'glucose' ? '🩸 Glucosa' : v.type === 'blood_pressure' ? '🫀 Presión' : '💨 SpO2'}:{' '}
                    </strong>
                    {v.type === 'glucose' ? `${v.value} mg/dL (${v.timing || 'ayunas'})` : v.type === 'blood_pressure' ? `${v.value}/${v.secondaryValue || 80} mmHg` : `${v.value}%`}
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {new Date(v.timestamp).toLocaleDateString()} {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Recent Studies Summary */}
          {patientStudies.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('recentLabStudies')}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
                {patientStudies.map(s => (
                  <li key={s.id} style={{ marginBottom: '0.25rem' }}>
                    <strong>{s.title}</strong> ({s.date}) {s.laboratory ? `• ${s.laboratory}` : ''}:{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{s.resultsSummary || (language === 'es' ? 'En expediente' : 'Archived')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Doctor Notes Blank Lines */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #94a3b8', paddingTop: '0.75rem' }}>
            <strong style={{ fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
              📝 {t('physicianNotesSpace')}
            </strong>
            <div style={{ height: '70px', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', backgroundColor: '#fafafa' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
