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
  Image as ImageIcon,
  Sparkles,
  Download,
  Edit2
} from 'lucide-react';
import { AIPrescriptionScannerModal } from '../medications/AIPrescriptionScannerModal';
import { ExtractedPrescriptionMed } from '../../utils/aiPrescriptionEngine';
import { openDocumentInNewTab } from '../../utils/pdfHelper';
import { Maximize2 } from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { activePatient, appointments, addAppointment, updateAppointment, deleteAppointment, toggleAppointmentCompleted, addMedication } = useApp();
  const { t, language } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<MedicalAppointment | null>(null);
  const [appToDelete, setAppToDelete] = useState<MedicalAppointment | null>(null);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [targetAppointmentForAi, setTargetAppointmentForAi] = useState<MedicalAppointment | null>(null);

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
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
      </div>
    );
  }

  const patientApps = appointments.filter(a => a.patientId === activePatient.id);
  const sortedApps = [...patientApps].sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  const handleOpenAdd = () => {
    setAppointmentToEdit(null);
    setDoctorName('');
    setSpecialty('');
    setDateTime('');
    setLocation('');
    setNotes('');
    setPrescriptionUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: MedicalAppointment) => {
    setAppointmentToEdit(app);
    setDoctorName(app.doctorName);
    setSpecialty(app.specialty);
    setDateTime(app.dateTime);
    setLocation(app.location || '');
    setNotes(app.notes || '');
    setPrescriptionUrl(app.prescriptionUrl || '');
    setPrescriptionFileType(app.prescriptionFileType || 'image');
    setIsModalOpen(true);
  };

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

  const handlePostConsultationPrescriptionUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    app: MedicalAppointment
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateAppointment({
          ...app,
          prescriptionUrl: reader.result,
          prescriptionFileType: isPdf ? 'pdf' : 'image'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !dateTime) return;

    if (appointmentToEdit) {
      updateAppointment({
        ...appointmentToEdit,
        doctorName: doctorName.trim(),
        specialty: specialty.trim() || (language === 'es' ? 'Medicina General' : 'General Medicine'),
        dateTime,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        prescriptionUrl: prescriptionUrl || undefined,
        prescriptionFileType: prescriptionUrl ? prescriptionFileType : undefined
      });
    } else {
      addAppointment({
        patientId: activePatient.id,
        doctorName: doctorName.trim(),
        specialty: specialty.trim() || (language === 'es' ? 'Medicina General' : 'General Medicine'),
        dateTime,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        prescriptionUrl: prescriptionUrl || undefined,
        prescriptionFileType: prescriptionUrl ? prescriptionFileType : undefined,
        isCompleted: false
      });
    }

    setIsModalOpen(false);
  };

  const handleAiExtractedMed = (med: ExtractedPrescriptionMed) => {
    addMedication({
      patientId: activePatient.id,
      name: med.name,
      presentation: med.presentation || 'tablet',
      indication: med.instructions,
      laboratory: med.laboratory,
      currentStock: 30,
      minimumStockAlert: 5,
      frequency: {
        type: med.durationDays ? 'temporary_hourly' : 'daily_fixed',
        doseSlots: med.scheduledTimes ? med.scheduledTimes.map(time => ({ time, dose: med.dose || 1, instruction: med.instructions })) : [{ time: '08:00', dose: 1 }],
        startDate: new Date().toISOString().split('T')[0]
      }
    });
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
            {language === 'es' ? `${t('appointmentsTitle')} ${activePatient.name}` : `${activePatient.name}${t('appointmentsTitle')}`}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('appointmentsSubtitle')}
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> {t('newAppointment')}
        </button>
      </div>

      {/* Appointment Cards List */}
      {sortedApps.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
          <CalendarDays size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {t('noAppointmentsLogged')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
            {t('noAppointmentsLoggedDesc')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sortedApps.map(app => {
            const dateObj = new Date(app.dateTime);
            const formattedDate = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleString('es-MX', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : app.dateTime;

            return (
              <div
                key={app.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '1.25rem',
                  backgroundColor: app.isCompleted ? 'var(--bg-secondary)' : '#ffffff',
                  opacity: app.isCompleted ? 0.85 : 1,
                  borderLeft: `4px solid ${app.isCompleted ? 'var(--success)' : 'var(--primary)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flex: 1, minWidth: '280px' }}>
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

                  <div style={{ flex: 1 }}>
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
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
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', margin: '0.5rem 0 0.5rem 0' }}>
                        <strong>{t('prepNotes')}:</strong> {app.notes}
                      </p>
                    )}

                    {/* Prescription Section */}
                    {app.prescriptionUrl ? (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.625rem' }}>
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
                          {language === 'es' ? '📜 Ver Receta Médica' : '📜 View Prescription'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setTargetAppointmentForAi(app);
                            setIsAiScannerOpen(true);
                          }}
                          style={{
                            fontSize: '0.75rem',
                            color: '#059669',
                            borderColor: '#059669',
                            backgroundColor: '#ecfdf5'
                          }}
                        >
                          <Sparkles size={14} />
                          {language === 'es' ? '🤖 Escanear Receta con IA' : 'Scan Prescription with AI'}
                        </button>
                      </div>
                    ) : (
                      /* Attach Prescription Post-Consultation Option */
                      <div style={{ marginTop: '0.625rem' }}>
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            borderStyle: 'dashed',
                            color: 'var(--primary)'
                          }}
                        >
                          <Camera size={14} />
                          <span>{language === 'es' ? '📷 Adjuntar / Tomar Foto de la Receta de esta Consulta' : '📷 Attach / Take Photo of Prescription'}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={e => handlePostConsultationPrescriptionUpload(e, app)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${app.isCompleted ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                    {app.isCompleted ? (language === 'es' ? 'Realizada' : 'Completed') : (language === 'es' ? 'Pendiente' : 'Upcoming')}
                  </span>

                  {/* Edit / Reschedule Button */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(app)}
                    title={language === 'es' ? 'Modificar datos / Cambiar horario' : 'Edit appointment / Reschedule'}
                    aria-label="Edit appointment"
                  >
                    <Edit2 size={14} color="var(--primary)" />
                  </button>

                  {/* Delete Button with Safety Protection */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAppToDelete(app)}
                    title={language === 'es' ? 'Eliminar consulta' : 'Delete appointment'}
                    aria-label="Delete appointment"
                  >
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Modal Form (Add & Edit / Reschedule) */}
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
                  {appointmentToEdit
                    ? (language === 'es' ? 'Modificar Consulta / Cambiar Horario' : 'Edit Appointment / Reschedule')
                    : t('newAppointment')}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('doctorNameLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Alejandro Hernández"
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('specialtyLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Medicina Interna / Geriatría"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('dateTimeLabel')}</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={dateTime}
                    onChange={e => setDateTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('locationLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Clínica Mérida - Consultorio 402"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('prepNotes')}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Llevar bitácora de glucosa de 3 días y estudios de sangre recientes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Prescription Attachment */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.875rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                  📜 {language === 'es' ? 'Receta Médica (Opcional):' : 'Prescription Photo (Optional):'}
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                  {language === 'es'
                    ? '💡 Puedes agendar la cita ahora y adjuntar la foto de la receta médica cuando salgas del consultorio.'
                    : '💡 You can schedule now and attach the prescription photo after the doctor consultation.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <label
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'center', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Camera size={15} color="var(--primary)" />
                    <span>{language === 'es' ? 'Tomar con Cámara' : 'Camera'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => handleFileUpload(e, true)}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <label
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'center', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Paperclip size={15} />
                    <span>{language === 'es' ? 'Subir Archivo / PDF' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {prescriptionUrl && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                      ✓ {language === 'es' ? 'Receta cargada con éxito' : 'Prescription file loaded'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrescriptionUrl('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {appointmentToEdit
                    ? (language === 'es' ? 'Guardar Cambios' : 'Save Changes')
                    : t('saveAppointment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Resolution Prescription Viewer Modal */}
      {viewPrescription && (
        <div className="modal-backdrop" onClick={() => setViewPrescription(null)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '1150px',
              width: '95vw',
              height: '92vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.25rem'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {viewPrescription.title}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openDocumentInNewTab(viewPrescription.url, viewPrescription.title)}
                  title={language === 'es' ? 'Abrir en pestaña completa' : 'Open full window'}
                  style={{ fontSize: '0.78rem' }}
                >
                  <Maximize2 size={15} /> {language === 'es' ? 'Pantalla Completa' : 'Full Screen'}
                </button>

                <button className="btn btn-secondary btn-sm" onClick={() => setViewPrescription(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, width: '100%', minHeight: 0, backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {viewPrescription.type === 'pdf' ? (
                <iframe
                  src={`${viewPrescription.url}#view=FitH&navpanes=0&toolbar=1`}
                  title="PDF Viewer"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <img
                  src={viewPrescription.url}
                  alt="Prescription"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsAiScannerOpen(true);
                  setViewPrescription(null);
                }}
                style={{ color: '#059669' }}
              >
                <Sparkles size={16} /> {language === 'es' ? 'Escanear Receta con IA' : 'Scan with AI'}
              </button>

              <a
                href={viewPrescription.url}
                download="Receta_Medica.pdf"
                className="btn btn-primary btn-sm"
              >
                <Download size={16} /> {language === 'es' ? 'Descargar Receta' : 'Download Prescription'}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* AI Prescription Scanner Modal */}
      <AIPrescriptionScannerModal
        isOpen={isAiScannerOpen}
        onClose={() => {
          setIsAiScannerOpen(false);
          setTargetAppointmentForAi(null);
        }}
        onSelectMedication={handleAiExtractedMed}
      />

      {/* Accidental Deletion Safety Confirmation Modal */}
      {appToDelete && (
        <div className="modal-backdrop" onClick={() => setAppToDelete(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', borderTop: '4px solid var(--danger)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>
                  {language === 'es' ? '¿Eliminar esta Consulta Médica?' : 'Delete Medical Appointment?'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {language === 'es' ? 'Confirmación de seguridad requerida' : 'Safety confirmation required'}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.8125rem'
              }}
            >
              <div><strong>👨‍⚕️ {appToDelete.doctorName}</strong> ({appToDelete.specialty})</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>📅 {appToDelete.dateTime}</div>
              {appToDelete.location && (
                <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>📍 {appToDelete.location}</div>
              )}
            </div>

            {/* Warning if prescription is attached */}
            {appToDelete.prescriptionUrl && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #f87171',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                  color: '#991b1b'
                }}
              >
                <strong>⚠️ {language === 'es' ? '¡Atención! Contiene Receta Médica:' : 'Warning! Contains Attached Prescription:'}</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>
                  {language === 'es'
                    ? 'Esta consulta tiene una foto o PDF de la receta médica. Al eliminarla, se borrará definitivamente del expediente.'
                    : 'This appointment includes an attached prescription file. Deleting it will permanently remove it from records.'}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={() => setAppToDelete(null)}
              >
                {language === 'es' ? 'Cancelar / Conservar' : 'Cancel / Keep'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', justifyContent: 'center' }}
                onClick={() => {
                  deleteAppointment(appToDelete.id);
                  setAppToDelete(null);
                }}
              >
                {language === 'es' ? 'Sí, Eliminar' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
