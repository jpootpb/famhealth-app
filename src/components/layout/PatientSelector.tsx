import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Patient, PatientType } from '../../types';
import { User, Plus, Check, X, ShieldAlert, Heart } from 'lucide-react';

interface PatientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({ isOpen, onClose }) => {
  const { patients, activePatient, setActivePatientId, addPatient } = useApp();
  const { t, language } = useLanguage();
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Patient Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [type, setType] = useState<PatientType>('chronic');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSelect = (patient: Patient) => {
    setActivePatientId(patient.id);
    onClose();
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addPatient({
      name: name.trim(),
      age: age ? Number(age) : undefined,
      type,
      primaryDiagnosis: primaryDiagnosis.trim() || undefined,
      notes: notes.trim() || undefined
    });

    setName('');
    setAge('');
    setPrimaryDiagnosis('');
    setNotes('');
    setIsAddingNew(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {isAddingNew ? t('addNewPatient') : t('selectPatientTitle')}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {!isAddingNew ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
              {patients.map(p => {
                const isCurrent = activePatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1rem',
                      backgroundColor: isCurrent ? 'var(--primary-light)' : '#ffffff',
                      border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: p.type === 'chronic' ? 'var(--secondary)' : 'var(--warning)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9375rem'
                        }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          {p.name}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {p.type === 'chronic' ? t('chronicCare') : t('tempCare')}
                          {p.primaryDiagnosis ? ` • ${p.primaryDiagnosis}` : ''}
                        </div>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                        ✓ {language === 'es' ? 'Activo' : 'Active'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setIsAddingNew(true)}
            >
              <Plus size={18} /> {t('addNewPatient')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreatePatient}>
            <div className="form-group">
              <label className="form-label">{t('patientName')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'e.g. Don Manuel Poot' : 'e.g. Robert Smith'}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('patientAge')}</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 78"
                  value={age}
                  onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('patientType')}</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={e => setType(e.target.value as PatientType)}
                >
                  <option value="chronic">{t('chronicCare')}</option>
                  <option value="temporary">{t('tempCare')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('primaryDiagnosisLabel')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'e.g. Diabetes Tipo 2, Hipertensión' : 'e.g. Type 2 Diabetes, Hypertension'}
                value={primaryDiagnosis}
                onChange={e => setPrimaryDiagnosis(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('patientNotes')}</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder={language === 'es' ? 'Alergias a medicamentos, dieta baja en sodio, etc.' : 'Drug allergies, low sodium diet, etc.'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsAddingNew(false)}
              >
                {t('cancel')}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {t('savePatient')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
