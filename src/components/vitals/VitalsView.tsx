import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VitalSign, VitalType, MonitoringCampaign } from '../../types';
import {
  Activity,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Heart,
  Droplets,
  Wind,
  Scale,
  Award,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  classifyGlucose,
  classifyBloodPressure,
  calculateCampaignProgress
} from '../../utils/formatters';
import { formatDateIso } from '../../utils/frequencyEngine';

export const VitalsView: React.FC = () => {
  const { activePatient, vitals, addVital, deleteVital, campaigns, addCampaign, toggleCampaignStatus } = useApp();

  const [selectedType, setSelectedType] = useState<VitalType>('glucose');
  const [value, setValue] = useState<number | ''>('');
  const [secondaryValue, setSecondaryValue] = useState<number | ''>('');
  const [timing, setTiming] = useState<'fasting' | 'postprandial' | 'random' | 'before_sleep'>('fasting');
  const [timestamp, setTimestamp] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState<string>('');

  // Campaign modal/form state
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campName, setCampName] = useState('3-Day Pre-Consultation Glucose Check');
  const [campDays, setCampDays] = useState(3);
  const [campChecksPerDay, setCampChecksPerDay] = useState(2);
  const [campNotes, setCampNotes] = useState('Fasting 7am & Postprandial 2h after lunch');

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please select a patient profile to record and monitor vitals.</p>
      </div>
    );
  }

  const patientVitals = vitals.filter(v => v.patientId === activePatient.id);
  const activeCampaigns = campaigns.filter(c => c.patientId === activePatient.id && c.isActive);

  // Compute averages
  const glucoseLogs = patientVitals.filter(v => v.type === 'glucose');
  const bpLogs = patientVitals.filter(v => v.type === 'blood_pressure');
  const spo2Logs = patientVitals.filter(v => v.type === 'spo2');

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

  const latestSpo2 = spo2Logs.length > 0 ? spo2Logs[0].value : null;

  const handleSubmitVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === '') return;

    addVital({
      patientId: activePatient.id,
      type: selectedType,
      value: Number(value),
      secondaryValue: secondaryValue !== '' ? Number(secondaryValue) : undefined,
      timing: selectedType === 'glucose' ? timing : undefined,
      timestamp: new Date(timestamp).toISOString(),
      notes: notes.trim() || undefined
    });

    setValue('');
    setSecondaryValue('');
    setNotes('');
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;

    addCampaign({
      patientId: activePatient.id,
      name: campName.trim(),
      vitalTypes: ['glucose'],
      startDate: formatDateIso(new Date()),
      durationDays: campDays,
      checksPerDay: campChecksPerDay,
      targetNotes: campNotes.trim() || undefined,
      isActive: true
    });

    setShowCampaignForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 3-Day Monitoring Campaigns Section */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--secondary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary)'
              }}
            >
              <Award size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>Doctor's Monitoring Challenges</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                3-day intensive tracking campaigns for upcoming medical consultations
              </span>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowCampaignForm(!showCampaignForm)}
          >
            <Plus size={14} /> New 3-Day Challenge
          </button>
        </div>

        {showCampaignForm && (
          <form onSubmit={handleCreateCampaign} style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>Launch Monitoring Campaign</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Campaign Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={campName}
                  onChange={e => setCampName(e.target.value)}
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Duration (Days)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="14"
                    value={campDays}
                    onChange={e => setCampDays(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Checks / Day</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="6"
                    value={campChecksPerDay}
                    onChange={e => setCampChecksPerDay(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Instructions / Doctor Goals</label>
              <input
                type="text"
                className="form-input"
                value={campNotes}
                onChange={e => setCampNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCampaignForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Start Challenge
              </button>
            </div>
          </form>
        )}

        {activeCampaigns.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            No active 3-day challenge. Start one before your next doctor's appointment to collect reliable data.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeCampaigns.map(camp => {
              const progress = calculateCampaignProgress(camp, patientVitals);
              return (
                <div
                  key={camp.id}
                  style={{
                    backgroundColor: 'var(--primary-light)',
                    border: '1px solid rgba(2, 132, 199, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--primary-hover)' }}>
                        {camp.name}
                      </strong>
                      {camp.targetNotes && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                          🎯 {camp.targetNotes}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                      {progress.recordedCount} of {progress.totalRequired} recorded ({progress.percent}%)
                    </span>
                  </div>

                  <div className="progress-container" style={{ height: '8px', marginBottom: '0.5rem' }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${progress.percent}%`,
                        backgroundColor: progress.isCompleted ? 'var(--success)' : 'var(--primary)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Started: {camp.startDate} • {camp.durationDays} Days Goal</span>
                    {progress.isCompleted && (
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                        ✓ Campaign Goal Completed! Ready for Doctor Review.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid-3">
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <Droplets size={18} color="#ef4444" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Avg Glucose (Recent)
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {avgGlucose ? `${avgGlucose} mg/dL` : 'No data'}
          </div>
          {avgGlucose && (
            <span className={`badge ${classifyGlucose(avgGlucose, 'fasting').badgeClass}`} style={{ marginTop: '0.375rem', fontSize: '0.7rem' }}>
              {classifyGlucose(avgGlucose, 'fasting').label}
            </span>
          )}
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <Heart size={18} color="#0284c7" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Avg Blood Pressure
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {avgSys && avgDia ? `${avgSys} / ${avgDia} mmHg` : 'No data'}
          </div>
          {avgSys && avgDia && (
            <span className={`badge ${classifyBloodPressure(avgSys, avgDia).badgeClass}`} style={{ marginTop: '0.375rem', fontSize: '0.7rem' }}>
              {classifyBloodPressure(avgSys, avgDia).label}
            </span>
          )}
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <Wind size={18} color="#16a34a" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Latest SpO2
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {latestSpo2 ? `${latestSpo2}%` : 'No data'}
          </div>
          {latestSpo2 && (
            <span className={`badge ${latestSpo2 >= 95 ? 'badge-green' : 'badge-red'}`} style={{ marginTop: '0.375rem', fontSize: '0.7rem' }}>
              {latestSpo2 >= 95 ? 'Normal (>=95%)' : 'Low Oxygen (<95%)'}
            </span>
          )}
        </div>
      </div>

      {/* Log Form & Historical Records Grid */}
      <div className="grid-2">
        {/* Rapid Vital Log Entry Form */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} color="var(--primary)" /> Record Vital Sign
          </h3>

          <form onSubmit={handleSubmitVital}>
            <div className="form-group">
              <label className="form-label">Vital Sign Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedType('glucose')}
                  className={`btn btn-sm ${selectedType === 'glucose' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem' }}
                >
                  <Droplets size={12} /> Glucose
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType('blood_pressure')}
                  className={`btn btn-sm ${selectedType === 'blood_pressure' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem' }}
                >
                  <Heart size={12} /> Pressure
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType('spo2')}
                  className={`btn btn-sm ${selectedType === 'spo2' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem' }}
                >
                  <Wind size={12} /> SpO2 / Pulse
                </button>
              </div>
            </div>

            {selectedType === 'glucose' && (
              <>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Glucose (mg/dL) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 115"
                      min="30"
                      max="600"
                      value={value}
                      onChange={e => setValue(e.target.value ? Number(e.target.value) : '')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Context / Timing</label>
                    <select
                      className="form-select"
                      value={timing}
                      onChange={e => setTiming(e.target.value as any)}
                    >
                      <option value="fasting">Fasting (Ayunas)</option>
                      <option value="postprandial">Postprandial (2h Post-Meal)</option>
                      <option value="random">Random / Casual</option>
                      <option value="before_sleep">Before Bed</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {selectedType === 'blood_pressure' && (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Systolic (Top) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 120"
                    min="50"
                    max="250"
                    value={value}
                    onChange={e => setValue(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Diastolic (Bottom) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 80"
                    min="30"
                    max="150"
                    value={secondaryValue}
                    onChange={e => setSecondaryValue(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </div>
              </div>
            )}

            {selectedType === 'spo2' && (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">SpO2 Oxygen (%) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 98"
                    min="50"
                    max="100"
                    value={value}
                    onChange={e => setValue(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pulse (BPM)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 72"
                    min="30"
                    max="200"
                    value={secondaryValue}
                    onChange={e => setSecondaryValue(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={timestamp}
                onChange={e => setTimestamp(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Felt dizzy, before breakfast"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Vital Record
            </button>
          </form>
        </div>

        {/* Historical Logs List */}
        <div className="card" style={{ padding: '1.25rem', maxHeight: '520px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>
            Historical Log Records ({patientVitals.length})
          </h3>

          {patientVitals.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No vitals logged yet. Enter the first reading using the form on the left.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {patientVitals.map(v => {
                const dateLabel = new Date(v.timestamp).toLocaleString('es-MX', {
                  month: 'short',
                  day: 'numeric',
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
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {v.type === 'glucose' && (
                          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                            <Droplets size={10} /> Glucose
                          </span>
                        )}
                        {v.type === 'blood_pressure' && (
                          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                            <Heart size={10} /> BP
                          </span>
                        )}
                        {v.type === 'spo2' && (
                          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                            <Wind size={10} /> SpO2
                          </span>
                        )}

                        <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {v.type === 'glucose' && `${v.value} mg/dL`}
                          {v.type === 'blood_pressure' && `${v.value}/${v.secondaryValue} mmHg`}
                          {v.type === 'spo2' && `${v.value}% ${v.secondaryValue ? `(${v.secondaryValue} bpm)` : ''}`}
                        </strong>

                        {v.timing && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • {v.timing}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        📅 {dateLabel} {v.notes ? `• "${v.notes}"` : ''}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => deleteVital(v.id)}
                      aria-label="Delete entry"
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
