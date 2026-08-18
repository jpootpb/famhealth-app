import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { MedicalAppointment } from '../../types';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Circle,
  MapPin,
  Clock,
  User,
  Trash2,
  X,
  FileText,
  Camera,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { activePatient, appointments, addAppointment, toggleAppointmentCompleted } = useApp();
  const { t, language } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState<string>('');
  const [prescriptionFileType, setPrescriptionFileType] = useState<'image' | 'pdf'>('image');
  const [viewPrescription, setViewPrescription] = useState<{ url: string; title: string; type: 'image' | 'pdf' } | null>(null);

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please select a patient profile to view appointments.</p>
      </div>
    );
  }

  const patientApps = appointments.filter(a => a.patientId === activePatient.id);
  const sortedApps = [...patientApps].sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isCamera: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    setPrescriptionFileType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPrescriptionUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !dateTime) return;

    addAppointment({
      patientId: activePatient.id,
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || 'General Medicine',
      dateTime,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      prescriptionUrl: prescriptionUrl || undefined,
      prescriptionFileType: prescriptionUrl ? prescriptionFileType : undefined,
      isCompleted: false
    });

    setDoctorName('');
    setSpecialty('');
    setDateTime('');
    setLocation('');
    setNotes('');
    setPrescriptionUrl('');
    setIsModalOpen(false);
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
            {activePatient.name}{t('appointmentsTitle')}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('appointmentsSubtitle')}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> {t('newAppointment')}
        </button>
      </div>

      {/* Appointment Cards List */}
      {sortedApps.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <CalendarDays size={48} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {language === 'es' ? 'No hay consultas médicas agendadas' : 'No upcoming medical consultations'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            {language === 'es'
              ? 'Agenda las citas con especialistas, adjunta fotos de las recetas y prepara los estudios previos.'
              : 'Schedule specialist checkups, attach prescription photos, and keep track of instructions.'}
          </p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ margin: '0 auto' }}>
            <Plus size={18} /> {t('newAppointment')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {sortedApps.map(app => {
            const formattedDate = new Date(app.dateTime).toLocaleString('es-MX', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={app.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '1.25rem',
                  backgroundColor: app.isCompleted ? 'var(--bg-secondary)' : '#ffffff',
                  opacity: app.isCompleted ? 0.8 : 1,
                  borderLeft: `4px solid ${app.isCompleted ? 'var(--success)' : 'var(--primary)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <button
                    onClick={() => toggleAppointmentCompleted(app.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      color: app.isCompleted ? 'var(--success)' : 'var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={app.isCompleted ? 'Mark as pending' : 'Mark as completed'}
                  >
                    {app.isCompleted ? <CheckCircle2 size={26} fill="var(--success-light)" /> : <Circle size={26} />}
                  </button>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong
                        style={{
                          fontSize: '1.05rem',
                          color: app.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: app.isCompleted ? 'line-through' : 'none'
                        }}
                      >
                        {app.doctorName}
                      </strong>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {app.specialty}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--primary)' }}>
                        <Clock size={14} /> {formattedDate}
                      </span>
                      {app.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={14} /> {app.location}
                        </span>
                      )}
                    </div>

                    {app.notes && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong>{t('prepNotes')}:</strong> {app.notes}
                      </p>
                    )}

                    {/* Prescription Attachment Badge / Button */}
                    {app.prescriptionUrl && (
                      <div style={{ marginTop: '0.625rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewPrescription({
                            url: app.prescriptionUrl!,
                            title: `Receta Médica - ${app.doctorName}`,
                            type: app.prescriptionFileType || 'image'
                          })}
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            borderColor: 'var(--primary-light)',
                            backgroundColor: 'var(--primary-light)'
                          }}
                        >
                          <FileText size={14} />
                          {language === 'es' ? '📜 Ver Receta Médica Adjunta' : '📜 View Attached Prescription'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className={`badge ${app.isCompleted ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                    {app.isCompleted ? (language === 'es' ? 'Realizada' : 'Completed') : (language === 'es' ? 'Pendiente' : 'Upcoming')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Modal Form */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {t('newAppointment')}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    {language === 'es' ? 'Nombre del Médico / Especialista *' : 'Doctor / Specialist Name *'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Alejandro Hernández"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'es' ? 'Especialidad' : 'Specialty'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Geriatría, Cardiología, Urología"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    {language === 'es' ? 'Fecha y Hora *' : 'Date & Time *'}
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={dateTime}
                    onChange={e => setDateTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'es' ? 'Ubicación / Consultorio' : 'Location / Clinic'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Clínica Mérida - Consultorio 402"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {language === 'es' ? 'Indicaciones Previas / Notas' : 'Prep Instructions / Notes'}
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder={language === 'es' ? 'e.g. Llevar bitácora de glucosa de 3 días y estudios de sangre en ayunas.' : 'e.g. Bring 3-day glucose log and fasting blood test.'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Prescription Attachment Options: Camera & Gallery/File */}
              <div
                className="card"
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem', display: 'block' }}>
                      {language === 'es' ? '📜 Foto de la Receta Médica' : '📜 Doctor Prescription Document'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {language === 'es' ? 'Guarda la receta en foto o PDF para no perderla.' : 'Attach the prescription sheet via camera or PDF.'}
                    </span>
                  </div>

                  {prescriptionUrl && (
                    <button
                      type="button"
                      onClick={() => setPrescriptionUrl('')}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)', fontSize: '0.75rem' }}
                    >
                      <Trash2 size={13} /> {language === 'es' ? 'Quitar Receta' : 'Remove'}
                    </button>
                  )}
                </div>

                {prescriptionUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    {prescriptionFileType === 'image' ? (
                      <img
                        src={prescriptionUrl}
                        alt="Prescription Preview"
                        style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                    ) : (
                      <FileText size={32} color="var(--primary)" />
                    )}
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>
                      ✓ {language === 'es' ? 'Receta médica adjuntada correctamente' : 'Prescription attached successfully'}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Option 1: Take Photo with Mobile Camera */}
                    <label
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flex: 1, justifyContent: 'center' }}
                    >
                      <Camera size={15} color="var(--primary)" />
                      {language === 'es' ? 'Tomar Foto con Cámara' : 'Take Photo (Camera)'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={e => handleFileUpload(e, true)}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Option 2: Attach from Gallery / PDF */}
                    <label
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flex: 1, justifyContent: 'center' }}
                    >
                      <Paperclip size={15} color="var(--secondary)" />
                      {language === 'es' ? 'Adjuntar de Galería / PDF' : 'Attach from Gallery / PDF'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={e => handleFileUpload(e, false)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {language === 'es' ? 'Guardar Consulta' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Viewer Zoom Modal */}
      {viewPrescription && (
        <div className="modal-backdrop" onClick={() => setViewPrescription(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px', textAlign: 'center', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '1.05rem' }}>{viewPrescription.title}</strong>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewPrescription(null)}>
                <X size={16} />
              </button>
            </div>

            {viewPrescription.type === 'image' ? (
              <img
                src={viewPrescription.url}
                alt="Prescription Document"
                style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
              />
            ) : (
              <iframe
                src={viewPrescription.url}
                title="Prescription PDF"
                style={{ width: '100%', height: '500px', border: 'none', borderRadius: 'var(--radius-md)' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
