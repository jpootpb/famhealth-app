import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { VitalSign, VitalType, MonitoringCampaign } from '../../types';
import {
  Activity,
  Plus,
  HeartPulse,
  Droplet,
  Wind,
  Weight,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Target
} from 'lucide-react';
import { formatDateIso } from '../../utils/frequencyEngine';

export const VitalsView: React.FC = () => {
  const { activePatient, vitals, addVital, deleteVital, campaigns, addCampaign, toggleCampaignStatus } = useApp();
  const { t, language } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Vital entry form state
  const [type, setType] = useState<VitalType>('glucose');
  const [value, setValue] = useState<number | ''>(110);
  const [secondaryValue, setSecondaryValue] = useState<number | ''>(80);
  const [timing, setTiming] = useState<'fasting' | 'postprandial' | 'random' | 'before_sleep'>('fasting');
  const [notes, setNotes] = useState('');

  // Campaign form state
  const [campaignName, setCampaignName] = useState('3-Day Pre-Consultation Glucose Challenge');
  const [campaignType, setCampaignType] = useState<VitalType>('glucose');
  const [campaignDuration, setCampaignDuration] = useState<number>(3);
  const [campaignChecksPerDay, setCampaignChecksPerDay] = useState<number>(2);
  const [campaignNotes, setCampaignNotes] = useState('Fasting 7am & 2h after lunch');

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
      </div>
    );
  }

  const patientVitals = vitals.filter(v => v.patientId === activePatient.id);
  const patientCampaigns = campaigns.filter(c => c.patientId === activePatient.id);

  // Compute metrics
  const glucoseLogs = patientVitals.filter(v => v.type === 'glucose');
  const avgGlucose = glucoseLogs.length > 0
    ? Math.round(glucoseLogs.reduce((acc, curr) => acc + curr.value, 0) / glucoseLogs.length)
    : null;

  const bpLogs = patientVitals.filter(v => v.type === 'blood_pressure');
  const latestBP = bpLogs.length > 0 ? bpLogs[0] : null;

  const spo2Logs = patientVitals.filter(v => v.type === 'spo2');
  const latestSpo2 = spo2Logs.length > 0 ? spo2Logs[0].value : null;

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    addVital({
      patientId: activePatient.id,
      type,
      value: Number(value),
      secondaryValue: type === 'blood_pressure' && secondaryValue ? Number(secondaryValue) : undefined,
      timing: type === 'glucose' ? timing : undefined,
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined
    });

    setValue(110);
    setNotes('');
    setIsModalOpen(false);
  };

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) return;

    addCampaign({
      patientId: activePatient.id,
      name: campaignName.trim(),
      vitalTypes: [campaignType],
      startDate: formatDateIso(new Date()),
      durationDays: campaignDuration,
      checksPerDay: campaignChecksPerDay,
      targetNotes: campaignNotes.trim() || undefined,
      isActive: true
    });

    setIsCampaignModalOpen(false);
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
            {language === 'es' ? `${t('vitalsTitle')} ${activePatient.name}` : `${t('vitalsTitle')} ${activePatient.name}`}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('vitalsSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setIsCampaignModalOpen(true)}>
            <Target size={18} /> {t('newChallenge')}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> {t('recordVital')}
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid-3">
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', marginBottom: '0.25rem' }}>
            <Droplet size={18} />
            <strong style={{ fontSize: '0.8125rem' }}>{t('avgGlucose')}</strong>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {avgGlucose ? `${avgGlucose} mg/dL` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {glucoseLogs.length} {language === 'es' ? 'mediciones registradas' : 'logs in record'}
          </span>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', marginBottom: '0.25rem' }}>
            <HeartPulse size={18} />
            <strong style={{ fontSize: '0.8125rem' }}>{t('avgBP')}</strong>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {latestBP ? `${latestBP.value}/${latestBP.secondaryValue || 80} mmHg` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {latestBP ? (language === 'es' ? 'Última toma registrada' : 'Most recent reading') : (language === 'es' ? 'Sin registros' : 'No records')}
          </span>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', marginBottom: '0.25rem' }}>
            <Wind size={18} />
            <strong style={{ fontSize: '0.8125rem' }}>{t('latestSpo2')}</strong>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {latestSpo2 ? `${latestSpo2}%` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {latestSpo2 ? (language === 'es' ? 'Oxigenación en sangre' : 'Blood oxygen saturation') : (language === 'es' ? 'Sin registros' : 'No records')}
          </span>
        </div>
      </div>

      {/* Active Campaigns List */}
      {patientCampaigns.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🎯 {t('activeCampaignsTitle')}
          </h3>

          <div className="grid-2">
            {patientCampaigns.map(camp => (
              <div
                key={camp.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  border: camp.isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: camp.isActive ? '#ffffff' : 'var(--bg-secondary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>
                    {camp.name}
                  </strong>
                  <span className={`badge ${camp.isActive ? 'badge-green' : 'badge-amber'}`}>
                    {camp.isActive ? (language === 'es' ? 'En Curso' : 'Active') : (language === 'es' ? 'Finalizado' : 'Completed')}
                  </span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {camp.targetNotes || (language === 'es' ? 'Seguimiento intensivo para consulta médica.' : 'Intensive monitoring challenge.')}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>📅 {camp.durationDays} {t('daysDuration')} ({camp.checksPerDay} {t('targetChecks')})</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleCampaignStatus(camp.id)}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {camp.isActive ? (language === 'es' ? 'Concluir Reto' : 'Complete Challenge') : (language === 'es' ? 'Reactivar' : 'Reactivate')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Vitals Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
          📋 {t('historyLogs')}
        </h3>

        {patientVitals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('noVitalsLoggedDesc')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {patientVitals.map(v => {
              const formattedDate = new Date(v.timestamp).toLocaleString(language === 'es' ? 'es-MX' : 'en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={v.id}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        padding: '0.5rem',
                        borderRadius: '50%',
                        backgroundColor:
                          v.type === 'glucose' ? '#fef3c7' : v.type === 'blood_pressure' ? '#fee2e2' : '#e0f2fe',
                        color:
                          v.type === 'glucose' ? '#d97706' : v.type === 'blood_pressure' ? '#dc2626' : '#0284c7'
                      }}
                    >
                      {v.type === 'glucose' ? <Droplet size={18} /> : v.type === 'blood_pressure' ? <HeartPulse size={18} /> : <Wind size={18} />}
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.9375rem' }}>
                        {v.type === 'glucose'
                          ? `${v.value} mg/dL`
                          : v.type === 'blood_pressure'
                          ? `${v.value}/${v.secondaryValue || 80} mmHg`
                          : `${v.value}% SpO2`}
                      </strong>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        ⏰ {formattedDate} {v.timing ? `• ${v.timing === 'fasting' ? t('fasting') : v.timing === 'postprandial' ? t('postprandial') : v.timing === 'before_sleep' ? t('beforeBed') : t('random')}` : ''} {v.notes ? `• ${v.notes}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => deleteVital(v.id)}
                    aria-label="Delete vital record"
                  >
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Vital Sign Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('recordVital')}</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddVital}>
              <div className="form-group">
                <label className="form-label">{t('vitalType')}</label>
                <select className="form-select" value={type} onChange={e => setType(e.target.value as VitalType)}>
                  <option value="glucose">🩸 {t('glucose')} (mg/dL)</option>
                  <option value="blood_pressure">🫀 {t('bloodPressure')} (mmHg)</option>
                  <option value="spo2">💨 {t('spo2')} (%)</option>
                  <option value="weight">⚖️ {t('weight')}</option>
                  <option value="heart_rate">💓 {t('heartRate')}</option>
                </select>
              </div>

              {type === 'blood_pressure' ? (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('systolic')}</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 120"
                      value={value}
                      onChange={e => setValue(e.target.value ? Number(e.target.value) : '')}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('diastolic')}</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 80"
                      value={secondaryValue}
                      onChange={e => setSecondaryValue(e.target.value ? Number(e.target.value) : '')}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">{t('value')} {type === 'glucose' ? '(mg/dL)' : type === 'spo2' ? '(%)' : ''}</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={type === 'glucose' ? 'e.g. 115' : 'e.g. 98'}
                    value={value}
                    onChange={e => setValue(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </div>
              )}

              {type === 'glucose' && (
                <div className="form-group">
                  <label className="form-label">{t('timingLabel')}</label>
                  <select className="form-select" value={timing} onChange={e => setTiming(e.target.value as any)}>
                    <option value="fasting">🌅 {t('fasting')}</option>
                    <option value="postprandial">🍽️ {t('postprandial')}</option>
                    <option value="before_sleep">🌙 {t('beforeBed')}</option>
                    <option value="random">⚡ {t('random')}</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t('notesOptional')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'es' ? 'e.g. Tras desayuno con avena' : 'e.g. After breakfast with oatmeal'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t('saveVital')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Challenge Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCampaignModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('newChallenge')}</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCampaignModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCampaign}>
              <div className="form-group">
                <label className="form-label">{language === 'es' ? 'Nombre de la Campaña / Reto *' : 'Challenge Campaign Name *'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{language === 'es' ? 'Duración en Días' : 'Duration in Days'}</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="14"
                    value={campaignDuration}
                    onChange={e => setCampaignDuration(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'es' ? 'Mediciones al Día' : 'Checks per Day'}</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="6"
                    value={campaignChecksPerDay}
                    onChange={e => setCampaignChecksPerDay(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'es' ? 'Instrucciones del Reto' : 'Challenge Instructions'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'es' ? 'e.g. Medir en ayunas y 2h después de la comida' : 'e.g. Measure fasting and 2h post-lunch'}
                  value={campaignNotes}
                  onChange={e => setCampaignNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCampaignModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {language === 'es' ? 'Iniciar Reto' : 'Start Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
