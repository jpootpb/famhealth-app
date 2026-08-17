import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Plus, X, HeartPulse, Clock } from 'lucide-react';
import { PatientType } from '../../types';

export const PatientSelector: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { patients, activePatient, setActivePatientId, addPatient } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [type, setType] = useState<PatientType>('chronic');
  const [diagnosis, setDiagnosis] = useState('');
  const [durationDays, setDurationDays] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addPatient({
      name: name.trim(),
      age: age ? Number(age) : undefined,
      type,
      primaryDiagnosis: diagnosis.trim() || undefined,
      durationDays: durationDays ? Number(durationDays) : undefined,
      treatmentStartDate: type === 'temporary' ? new Date().toISOString().split('T')[0] : undefined,
      notes: notes.trim() || undefined
    });

    setName('');
    setAge('');
    setDiagnosis('');
    setDurationDays('');
    setNotes('');
    setShowAddForm(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="#0284c7" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Patient Profiles</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {!showAddForm ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Select the active patient to manage medications, vitals, and caregiver schedules:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {patients.map(p => {
                const isSelected = activePatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActivePatientId(p.id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1rem', color: isSelected ? 'var(--primary-hover)' : 'var(--text-primary)' }}>
                          {p.name}
                        </strong>
                        {p.type === 'chronic' ? (
                          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                            <HeartPulse size={12} /> Chronic (Elderly)
                          </span>
                        ) : (
                          <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                            <Clock size={12} /> Temporary ({p.durationDays || 7}d)
                          </span>
                        )}
                      </div>
                      {p.primaryDiagnosis && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {p.primaryDiagnosis}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <span className="badge badge-blue">Active</span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={18} /> Add New Patient / Family Member
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 700 }}>New Patient Profile</h3>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Don Manuel or Maria"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Care Type</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={e => setType(e.target.value as PatientType)}
                >
                  <option value="chronic">Chronic (Elderly / Long-term care)</option>
                  <option value="temporary">Temporary (Acute course / Fixed days)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Age (optional)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 78"
                  value={age}
                  onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            {type === 'temporary' && (
              <div className="form-group">
                <label className="form-label">Treatment Duration (Days)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 5 or 7"
                  value={durationDays}
                  onChange={e => setDurationDays(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Primary Diagnosis or Condition</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Type 2 Diabetes, Hypertension or Acute Infection"
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">General Notes / Allergies</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="e.g. Allergic to penicillin, check fasting glucose"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Save Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
