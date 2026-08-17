import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Printer,
  X,
  Heart,
  Pill,
  Activity,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDose, classifyGlucose, classifyBloodPressure } from '../../utils/formatters';
import { getFrequencyLabel } from '../../utils/frequencyEngine';

interface DoctorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorSummaryModal: React.FC<DoctorSummaryModalProps> = ({ isOpen, onClose }) => {
  const { activePatient, medications, vitals, studies, campaigns } = useApp();

  if (!isOpen || !activePatient) return null;

  const patientMeds = medications.filter(m => m.patientId === activePatient.id);
  const patientVitals = vitals.filter(v => v.patientId === activePatient.id).slice(0, 10);
  const patientStudies = studies.filter(s => s.patientId === activePatient.id).slice(0, 5);
  const activeCampaign = campaigns.find(c => c.patientId === activePatient.id && c.isActive);

  // Compute key metrics
  const glucoseLogs = patientVitals.filter(v => v.type === 'glucose');
  const bpLogs = patientVitals.filter(v => v.type === 'blood_pressure');

  const avgGlucose =
    glucoseLogs.length > 0
      ? Math.round(glucoseLogs.reduce((acc, curr) => acc + curr.value, 0) / glucoseLogs.length)
      : null;

  const avgSys =
    bpLogs.length > 0
      ? Math.round(bpLogs.reduce((acc, curr) => acc + curr.value, 0) / bpLogs.length)
      : null;

  const avgDia =
    bpLogs.length > 0
      ? Math.round(bpLogs.reduce((acc, curr) => acc + (curr.secondaryValue || 80), 0) / bpLogs.length)
      : null;

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '850px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2rem'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Physician Consultation Sheet</h2>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={16} /> Print Report (Ctrl+P)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="printable-report" style={{ color: '#0f172a' }}>
          {/* Header Banner */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0284c7',
              paddingBottom: '0.875rem',
              marginBottom: '1.25rem'
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284c7', margin: 0, textTransform: 'uppercase' }}>
                FamHealth • Clinical Consultation Summary
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.2rem 0 0' }}>
                Date of Consultation: <strong>{currentDateStr}</strong>
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '1.15rem' }}>{activePatient.name}</strong>
              <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                {activePatient.age ? `Age: ${activePatient.age} years • ` : ''}
                {activePatient.type === 'chronic' ? 'Chronic Elderly Care' : 'Temporary Course'}
              </div>
            </div>
          </div>

          {/* Patient Clinical Info Card */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
              fontSize: '0.8125rem'
            }}
          >
            <div>
              <strong>Primary Diagnosis / Condition:</strong>
              <div>{activePatient.primaryDiagnosis || 'None specified'}</div>
            </div>
            <div>
              <strong>Allergies / Special Warnings:</strong>
              <div style={{ color: activePatient.notes ? '#dc2626' : 'inherit', fontWeight: activePatient.notes ? 600 : 400 }}>
                {activePatient.notes || 'None registered'}
              </div>
            </div>
          </div>

          {/* Section 1: Active Prescribed Medications */}
          <section style={{ marginBottom: '1.25rem' }}>
            <h2
              style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#0284c7',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '0.25rem',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <Pill size={14} /> 1. Active Prescribed Medications ({patientMeds.length})
            </h2>

            {patientMeds.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>No medications currently prescribed.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.4rem 0.5rem' }}>Medication & Purpose</th>
                    <th style={{ padding: '0.4rem 0.5rem' }}>Frequency Rule</th>
                    <th style={{ padding: '0.4rem 0.5rem' }}>Scheduled Hours & Doses</th>
                  </tr>
                </thead>
                <tbody>
                  {patientMeds.map((med, idx) => {
                    const freqLabel = getFrequencyLabel(med.frequency);
                    return (
                      <tr key={med.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '0.4rem 0.5rem' }}>
                          <strong>{med.name}</strong>
                          {med.indication && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{med.indication}</div>}
                        </td>
                        <td style={{ padding: '0.4rem 0.5rem', verticalAlign: 'top' }}>{freqLabel}</td>
                        <td style={{ padding: '0.4rem 0.5rem', verticalAlign: 'top' }}>
                          {med.frequency.doseSlots.map((s, sIdx) => (
                            <span key={sIdx} style={{ display: 'inline-block', marginRight: '0.5rem', fontWeight: 600 }}>
                              {s.time} ({formatDose(s.dose, med.presentation)})
                            </span>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* Section 2: Recent Vital Signs & Challenge Progress */}
          <section style={{ marginBottom: '1.25rem' }}>
            <h2
              style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#0284c7',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '0.25rem',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <Activity size={14} /> 2. Vital Signs & Monitoring Log (Recent)
            </h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ padding: '0.4rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                Avg Fasting Glucose: <strong>{avgGlucose ? `${avgGlucose} mg/dL` : 'N/A'}</strong>
              </div>
              <div style={{ padding: '0.4rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                Avg Blood Pressure: <strong>{avgSys && avgDia ? `${avgSys}/${avgDia} mmHg` : 'N/A'}</strong>
              </div>
              {activeCampaign && (
                <div style={{ padding: '0.4rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  Monitoring Challenge: <strong>{activeCampaign.name}</strong>
                </div>
              )}
            </div>

            {patientVitals.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Date & Time</th>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Type</th>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Value</th>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Context / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {patientVitals.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.3rem 0.5rem' }}>{v.timestamp.replace('T', ' ').slice(0, 16)}</td>
                      <td style={{ padding: '0.3rem 0.5rem', textTransform: 'capitalize' }}>{v.type.replace('_', ' ')}</td>
                      <td style={{ padding: '0.3rem 0.5rem' }}>
                        <strong>
                          {v.type === 'glucose' && `${v.value} mg/dL`}
                          {v.type === 'blood_pressure' && `${v.value}/${v.secondaryValue} mmHg`}
                          {v.type === 'spo2' && `${v.value}%`}
                        </strong>
                      </td>
                      <td style={{ padding: '0.3rem 0.5rem', color: '#64748b' }}>
                        {v.timing ? `[${v.timing}] ` : ''}{v.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Section 3: Latest Laboratory Studies */}
          <section style={{ marginBottom: '1.25rem' }}>
            <h2
              style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#0284c7',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '0.25rem',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <FileText size={14} /> 3. Recent Laboratory & Diagnostic Studies
            </h2>

            {patientStudies.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>No recent lab studies registered.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Date</th>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Study Title & Lab</th>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Summary Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {patientStudies.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.3rem 0.5rem', width: '90px' }}>{s.date}</td>
                      <td style={{ padding: '0.3rem 0.5rem' }}>
                        <strong>{s.title}</strong>
                        {s.laboratory && <div style={{ color: '#64748b' }}>{s.laboratory}</div>}
                      </td>
                      <td style={{ padding: '0.3rem 0.5rem' }}>{s.resultsSummary || 'Available in digital file'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Section 4: Physician Notes & Prescriptions Space */}
          <section style={{ border: '1px dashed #94a3b8', borderRadius: '6px', padding: '0.75rem 1rem', minHeight: '85px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.25rem' }}>
              Doctor's Notes, Prescription Changes & Next Follow-Up Date:
            </div>
            <div style={{ borderBottom: '1px dotted #cbd5e1', height: '22px' }} />
            <div style={{ borderBottom: '1px dotted #cbd5e1', height: '22px' }} />
            <div style={{ borderBottom: '1px dotted #cbd5e1', height: '22px' }} />
          </section>
        </div>
      </div>
    </div>
  );
};
