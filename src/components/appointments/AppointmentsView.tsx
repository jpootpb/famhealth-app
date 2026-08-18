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
  Edit2,
  Phone,
  Navigation,
  Share2,
  ListPlus,
  AlertTriangle,
  Maximize2
} from 'lucide-react';
import { AIPrescriptionScannerModal } from '../medications/AIPrescriptionScannerModal';
import { ExtractedPrescriptionMed } from '../../utils/aiPrescriptionEngine';
import { openDocumentInNewTab } from '../../utils/pdfHelper';
import { getGoogleMapsSearchUrl, formatAppointmentShareMessage } from '../../utils/googleMapsHelper';
import { shareViaWhatsApp } from '../../lib/whatsapp';

export const AppointmentsView: React.FC = () => {
  const { activePatient, appointments, addAppointment, updateAppointment, deleteAppointment, toggleAppointmentCompleted, addMedication } = useApp();
  const { t, language } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<MedicalAppointment | null>(null);
  const [appToDelete, setAppToDelete] = useState<MedicalAppointment | null>(null);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [targetAppointmentForAi, setTargetAppointmentForAi] = useState<MedicalAppointment | null>(null);

  // Form states
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [verbalRecommendations, setVerbalRecommendations] = useState<string[]>([]);
  const [newVerbalAdvice, setNewVerbalAdvice] = useState('');
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
    setGoogleMapsUrl('');
    setDoctorPhone('');
    setNotes('');
    setVerbalRecommendations([]);
    setNewVerbalAdvice('');
    setPrescriptionUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: MedicalAppointment) => {
    setAppointmentToEdit(app);
    setDoctorName(app.doctorName);
    setSpecialty(app.specialty);
    setDateTime(app.dateTime);
    setLocation(app.location || '');
    setGoogleMapsUrl(app.googleMapsUrl || '');
    setDoctorPhone(app.doctorPhone || '');
    setNotes(app.notes || '');
    setVerbalRecommendations(app.verbalRecommendations || []);
    setNewVerbalAdvice('');
    setPrescriptionUrl(app.prescriptionUrl || '');
    setPrescriptionFileType(app.prescriptionFileType || 'image');
    setIsModalOpen(true);
  };

  const handleAddVerbalAdviceItem = () => {
    if (!newVerbalAdvice.trim()) return;
    setVerbalRecommendations([...verbalRecommendations, newVerbalAdvice.trim()]);
    setNewVerbalAdvice('');
  };

  const handleRemoveVerbalAdviceItem = (index: number) => {
    setVerbalRecommendations(verbalRecommendations.filter((_, idx) => idx !== index));
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

    const finalRecommendations = [...verbalRecommendations];
    if (newVerbalAdvice.trim()) {
      finalRecommendations.push(newVerbalAdvice.trim());
    }

    if (appointmentToEdit) {
      updateAppointment({
        ...appointmentToEdit,
        doctorName: doctorName.trim(),
        specialty: specialty.trim() || (language === 'es' ? 'Medicina General' : 'General Medicine'),
        dateTime,
        location: location.trim() || undefined,
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        doctorPhone: doctorPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        verbalRecommendations: finalRecommendations.length > 0 ? finalRecommendations : undefined,
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
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        doctorPhone: doctorPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        verbalRecommendations: finalRecommendations.length > 0 ? finalRecommendations : undefined,
        prescriptionUrl: prescriptionUrl || undefined,
        prescriptionFileType: prescriptionUrl ? prescriptionFileType : undefined,
        isCompleted: false
      });
    }

    setIsModalOpen(false);
  };

  const handleShareAppointment = (app: MedicalAppointment) => {
    const msg = formatAppointmentShareMessage({
      appointment: app,
      patientName: activePatient.name
    });
    shareViaWhatsApp(msg);
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

            const mapsSearchUrl = getGoogleMapsSearchUrl(app.location || '', app.googleMapsUrl);

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
                  opacity: app.isCompleted ? 0.9 : 1,
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
                    title={app.isCompleted ? 'Marcar como pendiente' : 'Marcar como realizada'}
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

                    {/* Date, Time & Clinic Location with Maps Link */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.375rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--primary)' }}>
                          <Clock size={14} /> {formattedDate}
                        </span>
                        {app.doctorPhone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontWeight: 600 }}>
                            <Phone size={14} /> {app.doctorPhone}
                          </span>
                        )}
                      </div>

                      {app.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={14} color="#dc2626" /> <strong>{app.location}</strong>
                          </span>

                          {mapsSearchUrl && (
                            <a
                              href={mapsSearchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                color: '#1d4ed8',
                                borderColor: '#bfdbfe',
                                backgroundColor: '#eff6ff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Abrir ubicación en Google Maps / Waze"
                            >
                              <Navigation size={12} />
                              <span>{language === 'es' ? '🗺️ Ver en Google Maps (Cómo llegar)' : 'View in Google Maps'}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pre-Consultation Preparation Notes */}
                    {app.notes && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', margin: '0.5rem 0 0.5rem 0' }}>
                        <strong>{t('prepNotes')}:</strong> {app.notes}
                      </p>
                    )}

                    {/* Verbal Doctor Recommendations (Not written on prescription) */}
                    {app.verbalRecommendations && app.verbalRecommendations.length > 0 && (
                      <div
                        style={{
                          backgroundColor: '#fefce8',
                          border: '1px solid #fef08a',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.625rem 0.75rem',
                          marginTop: '0.5rem',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#854d0e', fontWeight: 800, fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                          <span>🗣️ {language === 'es' ? 'Recomendaciones Verbales del Doctor en Consulta:' : 'Doctor Verbal Advice in Consultation:'}</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.76rem', color: '#713f12' }}>
                          {app.verbalRecommendations.map((rec, idx) => (
                            <li key={idx} style={{ marginBottom: '0.2rem' }}>{rec}</li>
                          ))}
                        </ul>
                      </div>
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
                          <span>{language === 'es' ? '📷 Adjuntar / Tomar Foto de la Receta' : '📷 Attach / Photo of Prescription'}</span>
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

                {/* Card Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${app.isCompleted ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                    {app.isCompleted ? (language === 'es' ? 'Realizada' : 'Completed') : (language === 'es' ? 'Pendiente' : 'Upcoming')}
                  </span>

                  {/* WhatsApp Share Button */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleShareAppointment(app)}
                    title={language === 'es' ? 'Compartir datos, ubicación y recomendaciones por WhatsApp' : 'Share consultation info'}
                    style={{ color: '#16a34a' }}
                  >
                    <Share2 size={14} />
                  </button>

                  {/* Edit / Reschedule Button */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(app)}
                    title={language === 'es' ? 'Modificar datos / Agregar recomendaciones verbales' : 'Edit appointment'}
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

      {/* Add / Edit Appointment Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {appointmentToEdit
                    ? (language === 'es' ? 'Editar Consulta Médica' : 'Edit Appointment')
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

              {/* Location & Google Maps Navigation */}
              <div className="form-group">
                <label className="form-label">
                  📍 {language === 'es' ? 'Dirección o Clínica del Consultorio' : 'Clinic / Hospital Address'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Clínica CAMED - Av. Cupules x Calle 60, Mérida"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />

                {/* Quick Location Presets */}
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  {['Clínica CAMED (Av. Cupules)', 'Clínica Mérida (Itzimná)', 'IMSS Clínica 59', 'Hospital Faro del Mayab', 'Star Médica Mérida', 'Consultorio Particular'].map(loc => (
                    <button
                      key={loc}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setLocation(loc)}
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)' }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    📞 {language === 'es' ? 'Teléfono del Consultorio (Opcional)' : 'Doctor Phone'}
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9991234567"
                    value={doctorPhone}
                    onChange={e => setDoctorPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    🗺️ {language === 'es' ? 'Enlace Directo Maps (Opcional)' : 'Custom Maps Link'}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="e.g. https://maps.app.goo.gl/..."
                    value={googleMapsUrl}
                    onChange={e => setGoogleMapsUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Verbal Doctor Recommendations (Not written on prescription) */}
              <div
                style={{
                  backgroundColor: '#fefce8',
                  border: '1.5px solid #fef08a',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  marginBottom: '1rem'
                }}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#854d0e', display: 'block', marginBottom: '0.25rem' }}>
                  🗣️ {language === 'es' ? 'Recomendaciones Verbales del Doctor en Consulta:' : 'Doctor Verbal Recommendations (In-Consultation Advice):'}
                </span>
                <p style={{ fontSize: '0.73rem', color: '#713f12', margin: '0 0 0.5rem 0' }}>
                  {language === 'es'
                    ? 'Anota los consejos que el médico da de palabra (ej: dieta, ejercicio, caminar, no suspender medicamento, etc.) que no aparecen en la receta.'
                    : 'Record verbal advice given by the doctor that may not be written on the prescription.'}
                </p>

                {/* Existing verbal recommendations list */}
                {verbalRecommendations.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.625rem' }}>
                    {verbalRecommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fde047',
                          padding: '0.4rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem'
                        }}
                      >
                        <span>• {rec}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVerbalAdviceItem(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new verbal advice item */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.8rem', backgroundColor: '#ffffff' }}
                    placeholder="e.g. Disminuir consumo de sal a menos de media cucharadita al día"
                    value={newVerbalAdvice}
                    onChange={e => setNewVerbalAdvice(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddVerbalAdviceItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddVerbalAdviceItem}
                    style={{ fontSize: '0.75rem', color: '#854d0e', borderColor: '#fde047' }}
                  >
                    <Plus size={14} /> {language === 'es' ? 'Agregar' : 'Add'}
                  </button>
                </div>

                {/* Quick Advice Presets */}
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    'Disminuir consumo de sal',
                    'Caminar 20 minutos diarios por la tarde',
                    'No suspender anticoagulante sin avisar',
                    'Tomar 2 litros de agua diarios',
                    'Usar calzado cómodo sin costuras'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        if (!verbalRecommendations.includes(preset)) {
                          setVerbalRecommendations([...verbalRecommendations, preset]);
                        }
                      }}
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)' }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{viewPrescription.title}</h3>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openDocumentInNewTab(viewPrescription.url, viewPrescription.title)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                  title="Abrir en ventana completa de navegador"
                >
                  <Maximize2 size={16} />
                  <span>{language === 'es' ? '🔍 Pantalla Completa / Abrir en Pestaña Nueva' : '🔍 Full Screen Window'}</span>
                </button>

                <a
                  href={viewPrescription.url}
                  download="Receta_Medica.pdf"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={16} />
                  <span>{language === 'es' ? 'Descargar' : 'Download'}</span>
                </a>

                <button className="btn btn-secondary btn-sm" onClick={() => setViewPrescription(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {viewPrescription.type === 'pdf' ? (
                <iframe
                  src={`${viewPrescription.url}#view=FitH&navpanes=0&toolbar=1`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={viewPrescription.title}
                />
              ) : (
                <img
                  src={viewPrescription.url}
                  alt={viewPrescription.title}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety Deletion Confirmation Modal */}
      {appToDelete && (
        <div className="modal-backdrop" onClick={() => setAppToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {language === 'es' ? '¿Eliminar esta consulta médica?' : 'Delete this medical appointment?'}
            </h3>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {language === 'es'
                ? 'Esta acción eliminará el registro de la consulta y sus recomendaciones asociadas.'
                : 'This action will delete the appointment and associated recommendations.'}
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                textAlign: 'left',
                fontSize: '0.8125rem'
              }}
            >
              <div><strong>{t('doctorNameLabel')}:</strong> {appToDelete.doctorName}</div>
              <div><strong>{t('specialtyLabel')}:</strong> {appToDelete.specialty}</div>
              <div><strong>{t('dateTimeLabel')}:</strong> {appToDelete.dateTime}</div>
              {appToDelete.prescriptionUrl && (
                <div style={{ color: 'var(--danger)', marginTop: '0.25rem', fontWeight: 600 }}>
                  ⚠️ {language === 'es' ? 'Contiene una receta médica adjunta que se perderá.' : 'Contains attached prescription.'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setAppToDelete(null)}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => {
                  deleteAppointment(appToDelete.id);
                  setAppToDelete(null);
                }}
              >
                {language === 'es' ? 'Sí, eliminar consulta' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Prescription Scanner Modal */}
      {isAiScannerOpen && targetAppointmentForAi && (
        <AIPrescriptionScannerModal
          isOpen={isAiScannerOpen}
          onClose={() => {
            setIsAiScannerOpen(false);
            setTargetAppointmentForAi(null);
          }}
          onSelectMedication={handleAiExtractedMed}
        />
      )}
    </div>
  );
};
