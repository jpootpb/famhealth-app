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
  Target,
  TrendingUp,
  LineChart
} from 'lucide-react';
import { formatDateIso } from '../../utils/frequencyEngine';
import {
  filterVitalsByDays,
  calculateVitalsStatistics,
  generateTrendPath,
  isVitalInOptimalRange
} from '../../utils/vitalsChartEngine';

export const VitalsView: React.FC = () => {
  const { activePatient, vitals, addVital, deleteVital, campaigns, addCampaign, toggleCampaignStatus } = useApp();
  const { t, language } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Chart view state
  const [chartType, setChartType] = useState<VitalType>('glucose');
  const [chartDays, setChartDays] = useState<number>(30);

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

  // Filtered vitals for chart
  const vitalsForChartType = patientVitals.filter(v => v.type === chartType);
  const chartVitals = filterVitalsByDays(vitalsForChartType, chartDays);
  const chartStats = calculateVitalsStatistics(chartVitals, chartType);
  const chartPoints = generateTrendPath(chartVitals, 520, 160);

  // Compute overall summary metrics
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
            <strong style={{ fontSize: '0.875rem' }}>{t('glucose')} (Ayunas)</strong>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {avgGlucose !== null ? `${avgGlucose} mg/dL` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {glucoseLogs.length} {language === 'es' ? 'mediciones registradas' : 'logs recorded'}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.25rem' }}>
            <HeartPulse size={18} />
            <strong style={{ fontSize: '0.875rem' }}>{t('bloodPressure')}</strong>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {latestBP ? `${latestBP.value}/${latestBP.secondaryValue || 80}` : '—'}
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.375rem' }}>mmHg</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {bpLogs.length} {language === 'es' ? 'tomas de presión' : 'BP checks recorded'}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0891b2', marginBottom: '0.25rem' }}>
            <Wind size={18} />
            <strong style={{ fontSize: '0.875rem' }}>{t('spo2')}</strong>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {latestSpo2 !== null ? `${latestSpo2}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {spo2Logs.length} {language === 'es' ? 'oximetrías' : 'oxygenation logs'}
          </div>
        </div>
      </div>

      {/* Interactive Trends & Charts Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
              {language === 'es' ? 'Gráfica de Tendencia y Curva Clínica' : 'Clinical Trend Curve & Charts'}
            </h3>
          </div>

          {/* Metric Selector & Time Window */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem', width: 'auto' }}
              value={chartType}
              onChange={e => setChartType(e.target.value as VitalType)}
            >
              <option value="glucose">🩸 {t('glucose')} (mg/dL)</option>
              <option value="blood_pressure">🫀 {t('bloodPressure')} (mmHg)</option>
              <option value="spo2">💨 {t('spo2')} (%)</option>
              <option value="heart_rate">💓 {t('heartRate')}</option>
              <option value="weight">⚖️ {t('weight')}</option>
            </select>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                className={`btn btn-sm ${chartDays === 7 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartDays(7)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
              >
                7d
              </button>
              <button
                className={`btn btn-sm ${chartDays === 30 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartDays(30)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
              >
                30d
              </button>
              <button
                className={`btn btn-sm ${chartDays === 90 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartDays(90)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
              >
                {language === 'es' ? '3 Meses (HbA1c)' : '90d (Quarter)'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Pill Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-secondary)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.78rem'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>{language === 'es' ? 'Promedio:' : 'Average:'}</span>
            <strong style={{ display: 'block', fontSize: '0.9375rem', color: 'var(--primary)' }}>
              {chartStats.avg || '—'} {chartType === 'glucose' ? 'mg/dL' : chartType === 'blood_pressure' ? 'mmHg' : ''}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>{language === 'es' ? 'Mínimo:' : 'Minimum:'}</span>
            <strong style={{ display: 'block', fontSize: '0.9375rem', color: '#059669' }}>
              {chartStats.min || '—'}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>{language === 'es' ? 'Máximo:' : 'Maximum:'}</span>
            <strong style={{ display: 'block', fontSize: '0.9375rem', color: 'var(--danger)' }}>
              {chartStats.max || '—'}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>{language === 'es' ? 'En Rango Óptimo:' : 'In Target Range:'}</span>
            <strong style={{ display: 'block', fontSize: '0.9375rem', color: '#059669' }}>
              {chartStats.inOptimalRangeCount} / {chartStats.count} ({chartStats.count > 0 ? Math.round((chartStats.inOptimalRangeCount / chartStats.count) * 100) : 0}%)
            </strong>
          </div>
        </div>

        {/* SVG Curve Chart */}
        {chartVitals.length < 2 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <LineChart size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ margin: 0 }}>
              {language === 'es'
                ? `Registra al menos 2 mediciones de ${chartType} en este período para trazar la curva de tendencia.`
                : `Record at least 2 ${chartType} measurements in this window to plot the trend curve.`}
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox="0 0 520 180" style={{ width: '100%', height: 'auto', maxHeight: '200px' }}>
              {/* Background Target Zone Gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Area Fill */}
              <polygon
                fill="url(#chartGradient)"
                points={`20,150 ${chartPoints.map(p => `${p.x},${p.y}`).join(' ')} 500,150`}
              />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartPoints.map(p => `${p.x},${p.y}`).join(' ')}
              />

              {/* Data Points and Value Tooltips */}
              {chartPoints.map((p, idx) => {
                const inRange = isVitalInOptimalRange(p.value, p.secondaryValue, chartType);
                return (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill={inRange ? '#0284c7' : '#ef4444'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      fontSize="10"
                      fontWeight="bold"
                      fill="var(--text-primary)"
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                    >
                      {p.value}
                    </text>
                    <text
                      x={p.x}
                      y="170"
                      fontSize="9"
                      fill="var(--text-muted)"
                      textAnchor="middle"
                    >
                      {p.dateStr}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Active Monitoring Campaigns (Challenges) */}
      {patientCampaigns.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} color="var(--primary)" /> {t('activeCampaignsTitle')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patientCampaigns.map(camp => (
              <div
                key={camp.id}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: camp.isActive ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  border: `1px solid ${camp.isActive ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9375rem' }}>{camp.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    📅 {camp.startDate} • {camp.durationDays} {t('daysDuration')} ({camp.checksPerDay} {t('targetChecks')})
                  </div>
                  {camp.targetNotes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      "{camp.targetNotes}"
                    </div>
                  )}
                </div>

                <button
                  className={`btn btn-sm ${camp.isActive ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleCampaignStatus(camp.id)}
                  style={{ fontSize: '0.75rem' }}
                >
                  {camp.isActive ? (language === 'es' ? '✓ Reto Activo' : '✓ Active') : (language === 'es' ? 'Completado' : 'Completed')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Measurements Log */}
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
            {patientVitals.map(v => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9375rem', display: 'block' }}>
                    {v.type === 'glucose' && `🩸 Glucosa: ${v.value} mg/dL`}
                    {v.type === 'blood_pressure' && `🫀 Presión: ${v.value}/${v.secondaryValue || 80} mmHg`}
                    {v.type === 'spo2' && `💨 SpO2: ${v.value}%`}
                    {v.type === 'heart_rate' && `💓 Frecuencia Cardíaca: ${v.value} lpm`}
                    {v.type === 'weight' && `⚖️ Peso: ${v.value} kg`}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    📅 {new Date(v.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    {v.timing && ` • ${v.timing}`}
                  </div>
                  {v.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.15rem' }}>
                      "{v.notes}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => deleteVital(v.id)}
                    aria-label="Delete vital sign"
                  >
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Vital Modal */}
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
                  <option value="blood_pressure">🫀 {t('bloodPressure')} (Sistólica/Diastólica)</option>
                  <option value="spo2">💨 {t('spo2')} (%)</option>
                  <option value="heart_rate">💓 {t('heartRate')} (lpm)</option>
                  <option value="weight">⚖️ {t('weight')} (kg)</option>
                </select>
              </div>

              {type === 'blood_pressure' ? (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('systolic')}</label>
                    <input
                      type="number"
                      className="form-input"
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
                      value={secondaryValue}
                      onChange={e => setSecondaryValue(e.target.value ? Number(e.target.value) : '')}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">{t('value')}</label>
                  <input
                    type="number"
                    className="form-input"
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
                  placeholder="e.g. Después de caminar 15 min"
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

      {/* New Challenge Modal */}
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
                <label className="form-label">{language === 'es' ? 'Nombre del Reto' : 'Challenge Name'}</label>
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
                  <label className="form-label">{t('vitalType')}</label>
                  <select className="form-select" value={campaignType} onChange={e => setCampaignType(e.target.value as VitalType)}>
                    <option value="glucose">🩸 {t('glucose')}</option>
                    <option value="blood_pressure">🫀 {t('bloodPressure')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'es' ? 'Duración (Días)' : 'Duration (Days)'}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={campaignDuration}
                    onChange={e => setCampaignDuration(Number(e.target.value))}
                    min="1"
                    max="14"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'es' ? 'Mediciones por Día' : 'Checks per Day'}</label>
                <input
                  type="number"
                  className="form-input"
                  value={campaignChecksPerDay}
                  onChange={e => setCampaignChecksPerDay(Number(e.target.value))}
                  min="1"
                  max="6"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'es' ? 'Indicaciones del Médico para el Reto' : 'Doctor Challenge Notes'}</label>
                <input
                  type="text"
                  className="form-input"
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
