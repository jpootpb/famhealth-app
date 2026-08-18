import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Patient, DailyCareRoutine } from '../../types';
import {
  Utensils,
  X,
  Clock,
  Check,
  Coffee,
  Sun,
  Moon,
  ShowerHead,
  Bandage,
  Footprints,
  Sparkles
} from 'lucide-react';

interface DailyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPatient?: Patient;
}

export const DailyRoutineModal: React.FC<DailyRoutineModalProps> = ({
  isOpen,
  onClose,
  targetPatient
}) => {
  const { activePatient, updatePatientRoutines } = useApp();
  const { language } = useLanguage();

  const patient = targetPatient || activePatient;

  const [enabled, setEnabled] = useState(true);
  const [breakfastTime, setBreakfastTime] = useState('08:30');
  const [breakfastNotes, setBreakfastNotes] = useState('');
  const [lunchTime, setLunchTime] = useState('14:00');
  const [lunchNotes, setLunchNotes] = useState('');
  const [dinnerTime, setDinnerTime] = useState('20:00');
  const [dinnerNotes, setDinnerNotes] = useState('');
  const [bathTime, setBathTime] = useState('10:00');
  const [bathNotes, setBathNotes] = useState('');
  const [woundCareTime, setWoundCareTime] = useState('10:30');
  const [woundCareNotes, setWoundCareNotes] = useState('');
  const [exerciseTime, setExerciseTime] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');

  useEffect(() => {
    if (isOpen && patient?.dailyRoutines) {
      const r = patient.dailyRoutines;
      setEnabled(r.enabled !== false);
      setBreakfastTime(r.breakfastTime || '08:30');
      setBreakfastNotes(r.breakfastNotes || '');
      setLunchTime(r.lunchTime || '14:00');
      setLunchNotes(r.lunchNotes || '');
      setDinnerTime(r.dinnerTime || '20:00');
      setDinnerNotes(r.dinnerNotes || '');
      setBathTime(r.bathTime || '10:00');
      setBathNotes(r.bathNotes || '');
      setWoundCareTime(r.woundCareTime || '');
      setWoundCareNotes(r.woundCareNotes || '');
      setExerciseTime(r.exerciseTime || '');
      setExerciseNotes(r.exerciseNotes || '');
    } else if (isOpen && !patient?.dailyRoutines) {
      // Default presets
      setEnabled(true);
      setBreakfastTime('08:30');
      setBreakfastNotes(language === 'es' ? 'Dieta habitual / baja en sodio' : 'Low sodium regular diet');
      setLunchTime('14:00');
      setLunchNotes('');
      setDinnerTime('20:00');
      setDinnerNotes(language === 'es' ? 'Cena ligera' : 'Light dinner');
      setBathTime('10:00');
      setBathNotes(language === 'es' ? 'Baño asistido' : 'Assisted bath');
      setWoundCareTime('');
      setWoundCareNotes('');
      setExerciseTime('');
      setExerciseNotes('');
    }
  }, [isOpen, patient, language]);

  if (!isOpen || !patient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedRoutines: DailyCareRoutine = {
      enabled,
      breakfastTime: breakfastTime || undefined,
      breakfastNotes: breakfastNotes.trim() || undefined,
      lunchTime: lunchTime || undefined,
      lunchNotes: lunchNotes.trim() || undefined,
      dinnerTime: dinnerTime || undefined,
      dinnerNotes: dinnerNotes.trim() || undefined,
      bathTime: bathTime || undefined,
      bathNotes: bathNotes.trim() || undefined,
      woundCareTime: woundCareTime || undefined,
      woundCareNotes: woundCareNotes.trim() || undefined,
      exerciseTime: exerciseTime || undefined,
      exerciseNotes: exerciseNotes.trim() || undefined
    };

    updatePatientRoutines(patient.id, updatedRoutines);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Utensils size={22} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {language === 'es' ? 'Rutinas Diarias de Cuidado y Comidas' : 'Daily Care & Meal Routines'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {patient.name}
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          {language === 'es'
            ? 'Configura de forma opcional los horarios de comidas (dietas especiales), baño, curación de heridas y fisioterapia para que aparezcan en el Cronograma Diario de los cuidadores.'
            : 'Optionally configure meal times, special diets, assisted bath, surgical wound care, and physical therapy for the daily caregiver timeline.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Toggle Enable */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: enabled ? 'var(--primary-light)' : 'var(--bg-secondary)',
              border: `1px solid ${enabled ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {language === 'es' ? 'Mostrar Rutinas en la Agenda Diaria' : 'Show Routines on Daily Timeline'}
              </strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {language === 'es' ? 'Integra las comidas y cuidados entre las tomas de medicamentos' : 'Integrate meals and hygiene with medication slots'}
              </div>
            </div>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: enabled ? 'var(--primary)' : '#ccc',
                  borderRadius: '24px',
                  transition: '0.2s'
                }}
              />
            </label>
          </div>

          {enabled && (
            <>
              {/* 1. Breakfast */}
              <div className="card" style={{ padding: '0.875rem', backgroundColor: '#fdf8f6', border: '1px solid #fed7aa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Coffee size={18} color="#ea580c" />
                  <strong style={{ fontSize: '0.875rem', color: '#9a3412' }}>
                    🍳 {language === 'es' ? 'Desayuno' : 'Breakfast'}
                  </strong>
                </div>
                <div className="grid-2">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>⏰ {language === 'es' ? 'Hora habitual:' : 'Time:'}</label>
                    <input
                      type="time"
                      className="form-input"
                      value={breakfastTime}
                      onChange={e => setBreakfastTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>📝 {language === 'es' ? 'Indicación o dieta especial:' : 'Diet / Notes:'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'es' ? 'e.g. Dieta blanda, baja en sodio' : 'e.g. Low sodium, soft diet'}
                      value={breakfastNotes}
                      onChange={e => setBreakfastNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Bath & Hygiene */}
              <div className="card" style={{ padding: '0.875rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <ShowerHead size={18} color="#0284c7" />
                  <strong style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                    🚿 {language === 'es' ? 'Baño y Aseo Asistido' : 'Bath & Hygiene'}
                  </strong>
                </div>
                <div className="grid-2">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>⏰ {language === 'es' ? 'Hora del baño:' : 'Time:'}</label>
                    <input
                      type="time"
                      className="form-input"
                      value={bathTime}
                      onChange={e => setBathTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>📝 {language === 'es' ? 'Instrucciones para el cuidador:' : 'Caregiver notes:'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'es' ? 'e.g. Baño asistido, no mojar vendaje' : 'e.g. Assisted, keep bandage dry'}
                      value={bathNotes}
                      onChange={e => setBathNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Wound Care / Dressings */}
              <div className="card" style={{ padding: '0.875rem', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Bandage size={18} color="#db2777" />
                  <strong style={{ fontSize: '0.875rem', color: '#9d174d' }}>
                    🩹 {language === 'es' ? 'Curación de Herida Quirúrgica / Vendajes (Post-Op)' : 'Surgical Wound & Dressing Care'}
                  </strong>
                </div>
                <div className="grid-2">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>⏰ {language === 'es' ? 'Hora de curación (Opcional):' : 'Time (Optional):'}</label>
                    <input
                      type="time"
                      className="form-input"
                      value={woundCareTime}
                      onChange={e => setWoundCareTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>📝 {language === 'es' ? 'Protocolo de curación:' : 'Wound care protocol:'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'es' ? 'e.g. Limpieza estéril, aplicar parche y gasa' : 'e.g. Sterile dressing, apply antiseptic'}
                      value={woundCareNotes}
                      onChange={e => setWoundCareNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Lunch */}
              <div className="card" style={{ padding: '0.875rem', backgroundColor: '#fefce8', border: '1px solid #fef08a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Sun size={18} color="#ca8a04" />
                  <strong style={{ fontSize: '0.875rem', color: '#854d0e' }}>
                    🍲 {language === 'es' ? 'Comida / Almuerzo' : 'Lunch'}
                  </strong>
                </div>
                <div className="grid-2">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>⏰ {language === 'es' ? 'Hora habitual:' : 'Time:'}</label>
                    <input
                      type="time"
                      className="form-input"
                      value={lunchTime}
                      onChange={e => setLunchTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>📝 {language === 'es' ? 'Indicaciones:' : 'Notes:'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'es' ? 'e.g. Sin grasas, abundante agua' : 'e.g. Low fat, plenty of water'}
                      value={lunchNotes}
                      onChange={e => setLunchNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 5. Physical Therapy / Walk */}
              <div className="card" style={{ padding: '0.875rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Footprints size={18} color="#16a34a" />
                  <strong style={{ fontSize: '0.875rem', color: '#166534' }}>
                    🚶‍♂️ {language === 'es' ? 'Caminata / Fisioterapia (Opcional)' : 'Walk / Physical Therapy (Optional)'}
                  </strong>
                </div>
                <div className="grid-2">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>⏰ {language === 'es' ? 'Hora:' : 'Time:'}</label>
                    <input
                      type="time"
                      className="form-input"
                      value={exerciseTime}
                      onChange={e => setExerciseTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>📝 {language === 'es' ? 'Ejercicio recomendado:' : 'Exercise notes:'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'es' ? 'e.g. Caminata 15 min a paso suave' : 'e.g. 15 min gentle walk'}
                      value={exerciseNotes}
                      onChange={e => setExerciseNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 6. Dinner */}
              <div className="card" style={{ padding: '0.875rem', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Moon size={18} color="#9333ea" />
                  <strong style={{ fontSize: '0.875rem', color: '#6b21a8' }}>
                    🌙 {language === 'es' ? 'Cena' : 'Dinner'}
                  </strong>
                </div>
                <div className="grid-2">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>⏰ {language === 'es' ? 'Hora habitual:' : 'Time:'}</label>
                    <input
                      type="time"
                      className="form-input"
                      value={dinnerTime}
                      onChange={e => setDinnerTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>📝 {language === 'es' ? 'Indicaciones:' : 'Notes:'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'es' ? 'e.g. Cena ligera antes de las 8:30pm' : 'e.g. Light meal'}
                      value={dinnerNotes}
                      onChange={e => setDinnerNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 800 }}>
              {language === 'es' ? 'Guardar Rutinas' : 'Save Routines'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
