import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Patient, PatientType } from '../../types';
import { User, Plus, Check, X, ShieldAlert, Heart, Users, UserPlus, Calendar } from 'lucide-react';
import { calculateAge, formatPatientAge } from '../../utils/formatters';

interface PatientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const RELATIONSHIP_PRESETS = [
  { label: 'Hermana', labelEn: 'Sister', icon: '👧' },
  { label: 'Hermano', labelEn: 'Brother', icon: '👦' },
  { label: 'Sobrino / Sobrina', labelEn: 'Nephew / Niece', icon: '👶' },
  { label: 'Mamá', labelEn: 'Mother', icon: '👵' },
  { label: 'Papá', labelEn: 'Father', icon: '👴' },
  { label: 'Hijo / Hija', labelEn: 'Son / Daughter', icon: '🧒' },
  { label: 'Abuelo / Abuela', labelEn: 'Grandparent', icon: '🧓' },
  { label: 'Pareja / Esposo(a)', labelEn: 'Partner / Spouse', icon: '❤️' },
  { label: 'Amigo / Amiga', labelEn: 'Friend', icon: '🤝' },
  { label: 'Tío / Tía', labelEn: 'Uncle / Aunt', icon: '🧑' },
  { label: 'Yo Mismo (Autocuidado)', labelEn: 'Self Care', icon: '👤' },
  { label: 'Familiar a Cuidar', labelEn: 'Family Member', icon: '👥' }
];

export const PatientSelector: React.FC<PatientSelectorProps> = ({ isOpen, onClose }) => {
  const { patients, activePatient, setActivePatientId, addPatient, purgeAllDemoData } = useApp();
  const { t, language } = useLanguage();
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Patient Form State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [type, setType] = useState<PatientType>('chronic');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSelect = (patient: Patient) => {
    setActivePatientId(patient.id);
    onClose();
  };

  const computedAge = birthDate ? calculateAge(birthDate) : undefined;

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedName = relationship && !name.includes('(')
      ? `${name.trim()} (${relationship})`
      : name.trim();

    const finalAge = computedAge ?? (age ? Number(age) : undefined);

    addPatient({
      name: formattedName,
      birthDate: birthDate || undefined,
      age: finalAge,
      type,
      primaryDiagnosis: primaryDiagnosis.trim() || undefined,
      notes: notes.trim() || undefined
    });

    setName('');
    setRelationship('');
    setBirthDate('');
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
        style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {isAddingNew
                ? (language === 'es' ? 'Dar de Alta Persona / Familiar a Cuidar' : 'Register Person to Care For')
                : (language === 'es' ? 'Seleccionar o Administrar Personas Cuidadas' : 'Select or Manage Cared Persons')}
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
                const formattedAgeStr = formatPatientAge(p.birthDate, p.age, language);

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
                      border: `1.5px solid ${isCurrent ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
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
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {p.name}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formattedAgeStr && <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formattedAgeStr} • </span>}
                          {p.type === 'chronic' ? t('chronicCare') : t('tempCare')}
                          {p.primaryDiagnosis ? ` • ${p.primaryDiagnosis}` : ''}
                        </div>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        ✓ {language === 'es' ? 'Seleccionado' : 'Selected'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
              onClick={() => setIsAddingNew(true)}
            >
              <UserPlus size={18} /> {language === 'es' ? '+ Dar de Alta Nueva Persona / Familiar a Cuidar' : '+ Register New Person to Care For'}
            </button>

            {patients.some(p => p.id === 'patient-grandfather' || p.id === 'patient-maria') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', color: '#b91c1c', borderColor: '#fca5a5', backgroundColor: '#fef2f2', fontSize: '0.78rem' }}
                onClick={() => {
                  purgeAllDemoData();
                }}
              >
                🧹 {language === 'es' ? 'Limpiar Pacientes de Prueba Demo (Dejar solo mi Familia Real)' : 'Purge Demo Dummy Patients'}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreatePatient}>
            {/* Quick Relationship Preset Pills */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                {language === 'es' ? '👤 Parentesco o Relación:' : '👤 Relationship:'}
              </label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {RELATIONSHIP_PRESETS.map(preset => {
                  const label = language === 'es' ? preset.label : preset.labelEn;
                  const isSelected = relationship === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setRelationship(preset.label)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 800 : 500,
                        backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span>{preset.icon}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                {language === 'es' ? 'Nombre Completo de la Persona:' : 'Full Name:'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'e.g. Lucía Poot, Mateo, Don Manuel' : 'e.g. Lucy Smith, Matthew'}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Birth Date (Dynamic Age) & Type */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📅 {language === 'es' ? 'Fecha de Nacimiento:' : 'Birth Date:'}</span>
                  {computedAge !== undefined && (
                    <span className="badge badge-green" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                      🎂 {computedAge} {language === 'es' ? 'años' : 'years'}
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                  {language === 'es' ? 'Calcula la edad automáticamente y se actualiza cada año.' : 'Calculates age dynamically and updates every year.'}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">{t('patientType')}</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={e => setType(e.target.value as PatientType)}
                >
                  <option value="chronic">{language === 'es' ? 'Tratamiento Crónico / Continuo' : 'Chronic Care'}</option>
                  <option value="temporary">{language === 'es' ? 'Tratamiento Temporal / Post-cirugía' : 'Temporary / Post-surgery'}</option>
                  <option value="preventive">{language === 'es' ? 'Preventivo / Autocuidado' : 'Preventive / Self-care'}</option>
                </select>
              </div>
            </div>

            {/* Fallback Age Input if Birth Date is not known */}
            {!birthDate && (
              <div className="form-group" style={{ marginTop: '-0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  {language === 'es' ? 'O introduce la edad aproximada si no sabes la fecha exacta:' : 'Or enter approximate age if exact date is unknown:'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 80, 45, 12"
                  value={age}
                  onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('primaryDiagnosisLabel')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'e.g. Asma, Post-cirugía rodilla, Hipertensión' : 'e.g. Asthma, Knee surgery, Hypertension'}
                value={primaryDiagnosis}
                onChange={e => setPrimaryDiagnosis(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('patientNotes')}</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder={language === 'es' ? 'Alergias a penicilina, cuidados especiales, etc.' : 'Allergies, special care notes, etc.'}
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
              <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 800 }}>
                {language === 'es' ? 'Guardar y Dar de Alta' : 'Save & Register'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
