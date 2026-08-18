import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { MedicalAppointment, FutureBookingReminder } from '../../types';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Circle,
  MapPin,
  Clock,
  Trash2,
  X,
  FileText,
  Camera,
  Paperclip,
  Sparkles,
  Download,
  Edit2,
  Phone,
  Navigation,
  Share2,
  AlertTriangle,
  Bell,
  BellRing,
  Calendar,
  PhoneCall,
  Check
} from 'lucide-react';
import { AIPrescriptionScannerModal } from '../medications/AIPrescriptionScannerModal';
import { ExtractedPrescriptionMed } from '../../utils/aiPrescriptionEngine';
import { openDocumentInNewTab } from '../../utils/pdfHelper';
import { getGoogleMapsSearchUrl, formatAppointmentShareMessage } from '../../utils/googleMapsHelper';
import { shareViaWhatsApp } from '../../lib/whatsapp';
import {
  calculateBookingReminderDates,
  isBookingWindowOpen,
  formatBookingWhatsAppMessage
} from '../../utils/appointmentBookingEngine';

export const AppointmentsView: React.FC = () => {
  const {
    activePatient,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    toggleAppointmentCompleted,
    addMedication,
    bookingReminders,
    addBookingReminder,
    updateBookingReminder,
    deleteBookingReminder,
    confirmBookingReminderToAppointment
  } = useApp();
  const { t, language } = useLanguage();

  const [appointmentSubTab, setAppointmentSubTab] = useState<'confirmed' | 'future_booking'>('confirmed');

  // Confirmed Appointment Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<MedicalAppointment | null>(null);
  const [appToDelete, setAppToDelete] = useState<MedicalAppointment | null>(null);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [targetAppointmentForAi, setTargetAppointmentForAi] = useState<MedicalAppointment | null>(null);

  // Form states for confirmed appointment
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

  // Future Booking Reminder Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<FutureBookingReminder | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<FutureBookingReminder | null>(null);
  const [reminderToConvert, setReminderToConvert] = useState<FutureBookingReminder | null>(null);
  const [convertDateTime, setConvertDateTime] = useState('');
  const [convertLocation, setConvertLocation] = useState('');

  // Future Booking Form fields
  const [bDoctorName, setBDoctorName] = useState('');
  const [bSpecialty, setBSpecialty] = useState('');
  const [bTargetDate, setBTargetDate] = useState('');
  const [bCallDate, setBCallDate] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bNotes, setBNotes] = useState('');

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
      </div>
    );
  }

  const patientApps = appointments.filter(a => a.patientId === activePatient.id);
  const sortedApps = [...patientApps].sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  const patientReminders = (bookingReminders || []).filter(r => r.patientId === activePatient.id);
  const sortedReminders = [...patientReminders].sort((a, b) => a.callClinicDate.localeCompare(b.callClinicDate));

  // Reminders ready to be called right now (agenda window open)
  const openReminders = patientReminders.filter(r => isBookingWindowOpen(r) && r.status !== 'booked_confirmed');

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

  const handleOpenAddBookingReminder = () => {
    setBookingToEdit(null);
    setBDoctorName('');
    setBSpecialty('');
    setBPhone('');
    setBAddress('');
    setBNotes('');

    // Default: 1-year annual review from today, call 1 month before
    const dates = calculateBookingReminderDates({
      baseDate: new Date(),
      targetMonthsAhead: 12,
      callMonthsAheadOfTarget: 1
    });
    setBTargetDate(dates.targetConsultationDate);
    setBCallDate(dates.callClinicDate);

    setIsBookingModalOpen(true);
  };

  const handleOpenEditBookingReminder = (r: FutureBookingReminder) => {
    setBookingToEdit(r);
    setBDoctorName(r.doctorName);
    setBSpecialty(r.specialty);
    setBTargetDate(r.targetConsultationDate);
    setBCallDate(r.callClinicDate);
    setBPhone(r.clinicPhone || '');
    setBAddress(r.clinicAddress || '');
    setBNotes(r.notes || '');
    setIsBookingModalOpen(true);
  };

  const applyPresetDates = (targetMonths: number, callMonthsBefore: number = 1) => {
    const dates = calculateBookingReminderDates({
      baseDate: new Date(),
      targetMonthsAhead: targetMonths,
      callMonthsAheadOfTarget: callMonthsBefore
    });
    setBTargetDate(dates.targetConsultationDate);
    setBCallDate(dates.callClinicDate);
  };

  const handleSaveBookingReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bDoctorName.trim() || !bTargetDate || !bCallDate) return;

    if (bookingToEdit) {
      updateBookingReminder({
        ...bookingToEdit,
        doctorName: bDoctorName.trim(),
        specialty: bSpecialty.trim() || (language === 'es' ? 'Especialidad Médica' : 'Medical Specialty'),
        targetConsultationDate: bTargetDate,
        callClinicDate: bCallDate,
        clinicPhone: bPhone.trim() || undefined,
        clinicAddress: bAddress.trim() || undefined,
        notes: bNotes.trim() || undefined
      });
    } else {
      addBookingReminder({
        patientId: activePatient.id,
        patientName: activePatient.name,
        doctorName: bDoctorName.trim(),
        specialty: bSpecialty.trim() || (language === 'es' ? 'Especialidad Médica' : 'Medical Specialty'),
        targetConsultationDate: bTargetDate,
        callClinicDate: bCallDate,
        clinicPhone: bPhone.trim() || undefined,
        clinicAddress: bAddress.trim() || undefined,
        notes: bNotes.trim() || undefined,
        status: 'waiting_agenda_open'
      });
    }
    setIsBookingModalOpen(false);
  };

  const handleConvertReminderToAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderToConvert || !convertDateTime) return;

    confirmBookingReminderToAppointment(
      reminderToConvert.id,
      convertDateTime,
      convertLocation.trim() || reminderToConvert.clinicAddress,
      reminderToConvert.notes
    );

    setReminderToConvert(null);
    setConvertDateTime('');
    setConvertLocation('');
    setAppointmentSubTab('confirmed');
  };

  const handleAddVerbalAdviceItem = () => {
    if (!newVerbalAdvice.trim()) return;
    setVerbalRecommendations([...verbalRecommendations, newVerbalAdvice.trim()]);
    setNewVerbalAdvice('');
  };

  const handleRemoveVerbalAdviceItem = (index: number) => {
    setVerbalRecommendations(verbalRecommendations.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      patientName: activePatient.name,
      lang: language
    });
    shareViaWhatsApp(msg);
  };

  const handleAiExtractedMed = (med: ExtractedPrescriptionMed) => {
    addMedication({
      patientId: activePatient.id,
      name: med.name,
      presentation: med.presentation || 'tablet',
      indication: med.instructions || 'Prescrito en consulta',
      laboratory: med.laboratory,
      currentStock: 30,
      minimumStockAlert: 5,
      frequency: {
        type: 'daily_fixed',
        startDate: new Date().toISOString().split('T')[0],
        doseSlots:
          med.scheduledTimes && med.scheduledTimes.length > 0
            ? med.scheduledTimes.map(t => ({ time: t, dose: med.dose || 1, instruction: med.instructions }))
            : [{ time: '08:00', dose: med.dose || 1, instruction: med.instructions }]
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header with Sub-tabs and New Appointment Buttons */}
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
            {language === 'es'
              ? 'Control de citas confirmadas y recordatorios de apertura de agenda médica (a 1 año o 6 meses).'
              : 'Confirmed medical appointments & long-term agenda booking opening alerts.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {appointmentSubTab === 'confirmed' ? (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={18} /> {t('newAppointment')}
            </button>
          ) : (
            <button className="btn btn-primary" style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }} onClick={handleOpenAddBookingReminder}>
              <Plus size={18} /> {language === 'es' ? '+ Recordatorio de Agenda Futura' : '+ Future Booking Reminder'}
            </button>
          )}
        </div>
      </div>

      {/* Subtab Navigation Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${appointmentSubTab === 'confirmed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setAppointmentSubTab('confirmed')}
          style={{ borderRadius: 'var(--radius-full)', fontWeight: appointmentSubTab === 'confirmed' ? 800 : 600 }}
        >
          <CalendarDays size={16} /> {language === 'es' ? `Citas Agendadas (${sortedApps.length})` : `Confirmed Appointments (${sortedApps.length})`}
        </button>

        <button
          className={`btn btn-sm ${appointmentSubTab === 'future_booking' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setAppointmentSubTab('future_booking')}
          style={{
            borderRadius: 'var(--radius-full)',
            backgroundColor: appointmentSubTab === 'future_booking' ? '#7c3aed' : undefined,
            borderColor: appointmentSubTab === 'future_booking' ? '#7c3aed' : undefined,
            fontWeight: appointmentSubTab === 'future_booking' ? 800 : 600,
            position: 'relative'
          }}
        >
          <BellRing size={16} /> {language === 'es' ? `Recordatorios de Agenda Futura (${sortedReminders.length})` : `Future Booking Reminders (${sortedReminders.length})`}
          {openReminders.length > 0 && (
            <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.65rem', borderRadius: '999px', padding: '0.1rem 0.4rem', marginLeft: '0.35rem', fontWeight: 800 }}>
              {openReminders.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Attention Banner if any clinic is opening agenda right now */}
      {openReminders.length > 0 && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔔</span>
            <div>
              <strong style={{ color: '#b45309', fontSize: '0.95rem' }}>
                {language === 'es'
                  ? `¡Atención! Es momento de llamar a la clínica para agendar ${openReminders.length} cita(s) pendiente(s):`
                  : `Attention! It's time to call the clinic to book ${openReminders.length} pending appointment(s):`}
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: '#92400e' }}>
                {language === 'es'
                  ? 'Entramos en el mes límite indicado por la asistente médica para abrir la agenda.'
                  : 'You have entered the call window indicated by the medical assistant to book the appointment.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {openReminders.map(rem => (
              <div
                key={rem.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>🩺 {rem.specialty} — {rem.doctorName}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    📅 {language === 'es' ? 'Mes previsto de consulta:' : 'Target Month:'} <strong>{rem.targetConsultationDate.substring(0, 7)}</strong>
                    {rem.clinicPhone && ` | 📞 Tel: ${rem.clinicPhone}`}
                  </div>
                  {rem.notes && <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.15rem' }}>📝 {rem.notes}</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {rem.clinicPhone && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const msg = formatBookingWhatsAppMessage(rem, activePatient.name, language);
                        shareViaWhatsApp(msg, rem.clinicPhone);
                      }}
                      style={{ fontSize: '0.75rem', backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
                    >
                      📲 {language === 'es' ? 'WhatsApp a Recepción' : 'WhatsApp Reception'}
                    </button>
                  )}

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setReminderToConvert(rem);
                      setConvertDateTime(`${rem.targetConsultationDate}T10:00`);
                      setConvertLocation(rem.clinicAddress || '');
                    }}
                    style={{ fontSize: '0.75rem', backgroundColor: '#10b981', borderColor: '#10b981' }}
                  >
                    🗓️ {language === 'es' ? 'Ya tengo fecha (Confirmar)' : 'Got Date (Confirm)'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: CONFIRMED APPOINTMENTS */}
      {appointmentSubTab === 'confirmed' && (
        <>
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

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '1rem',
                              color: app.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                              textDecoration: app.isCompleted ? 'line-through' : 'none'
                            }}
                          >
                            {app.doctorName}
                          </span>
                          <span className="badge badge-blue">{app.specialty}</span>
                          {app.isCompleted && (
                            <span className="badge badge-green">✓ {language === 'es' ? 'Realizada' : 'Completed'}</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                            <Clock size={15} color="var(--primary)" /> {formattedDate}
                          </span>

                          {app.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <MapPin size={15} color="#e11d48" /> {app.location}
                            </span>
                          )}

                          {app.doctorPhone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Phone size={14} color="#059669" /> {app.doctorPhone}
                            </span>
                          )}
                        </div>

                        {/* Location Navigation & Maps Button */}
                        {app.location && mapsSearchUrl && (
                          <div style={{ marginTop: '0.35rem' }}>
                            <a
                              href={mapsSearchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                color: '#1d4ed8',
                                backgroundColor: '#eff6ff',
                                borderColor: '#bfdbfe',
                                textDecoration: 'none'
                              }}
                            >
                              <Navigation size={13} /> {language === 'es' ? 'Ver en Google Maps (Cómo llegar)' : 'Open in Google Maps'}
                            </a>
                          </div>
                        )}

                        {app.notes && (
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            📝 {app.notes}
                          </p>
                        )}

                        {/* Verbal Doctor Recommendations */}
                        {app.verbalRecommendations && app.verbalRecommendations.length > 0 && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fef3c7',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.625rem 0.75rem'
                            }}
                          >
                            <strong style={{ fontSize: '0.78rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              🗣️ {language === 'es' ? 'Recomendaciones verbales del doctor (no escritas en receta):' : 'Doctor verbal advice:'}
                            </strong>
                            <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0, fontSize: '0.78rem', color: '#78350f' }}>
                              {app.verbalRecommendations.map((advice, idx) => (
                                <li key={idx} style={{ marginBottom: '0.15rem' }}>{advice}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Attached Prescription Preview & Actions */}
                        {app.prescriptionUrl && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.625rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileText size={18} color="var(--primary)" />
                              <div>
                                <strong style={{ fontSize: '0.78rem' }}>{language === 'es' ? 'Receta médica adjunta' : 'Attached Prescription'}</strong>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>
                                  {app.prescriptionFileType === 'pdf' ? 'Documento PDF' : 'Fotografía'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setViewPrescription({
                                  url: app.prescriptionUrl!,
                                  title: `Receta - ${app.doctorName} (${app.dateTime})`,
                                  type: app.prescriptionFileType || 'image'
                                })}
                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                              >
                                {language === 'es' ? 'Ver Receta' : 'View'}
                              </button>

                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setTargetAppointmentForAi(app);
                                  setIsAiScannerOpen(true);
                                }}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.5rem',
                                  backgroundColor: '#059669',
                                  borderColor: '#059669'
                                }}
                              >
                                <Sparkles size={13} /> {language === 'es' ? 'Extraer Medicamentos (IA)' : 'Scan AI'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleShareAppointment(app)}
                        title="Compartir cita por WhatsApp"
                        style={{ padding: '0.375rem 0.5rem', color: '#059669' }}
                      >
                        <Share2 size={15} />
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(app)}
                        title={language === 'es' ? 'Editar Consulta' : 'Edit Appointment'}
                        style={{ padding: '0.375rem 0.5rem' }}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setAppToDelete(app)}
                        title={language === 'es' ? 'Eliminar Consulta' : 'Delete Appointment'}
                        style={{ padding: '0.375rem 0.5rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: FUTURE BOOKING REMINDERS (1 YEAR / 6 MONTHS APPOINTMENT AGENDA ALERTS) */}
      {appointmentSubTab === 'future_booking' && (
        <>
          {sortedReminders.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
              <BellRing size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {language === 'es' ? 'No hay recordatorios de agenda futura' : 'No Future Booking Reminders'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                {language === 'es'
                  ? 'Cuando el médico te diga "Revisión en 1 año pero llama 1 mes antes para la agenda", regístralo aquí para que la app te avise en el mes exacto y no se te olvide.'
                  : 'Register 1-year or 6-month review dates where the clinic requests calling a month before to book.'}
              </p>
              <button className="btn btn-primary" style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }} onClick={handleOpenAddBookingReminder}>
                <Plus size={18} /> {language === 'es' ? '+ Crear Recordatorio de Agenda' : '+ Add Booking Reminder'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedReminders.map(rem => {
                const isOpen = isBookingWindowOpen(rem);
                const isConfirmed = rem.status === 'booked_confirmed';

                return (
                  <div
                    key={rem.id}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      padding: '1.25rem',
                      backgroundColor: isConfirmed ? 'var(--bg-secondary)' : (isOpen ? '#fffdf5' : '#ffffff'),
                      borderLeft: `4px solid ${isConfirmed ? 'var(--success)' : (isOpen ? '#f59e0b' : '#7c3aed')}`
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>{rem.doctorName}</span>
                        <span className="badge badge-purple">{rem.specialty}</span>

                        {isConfirmed ? (
                          <span className="badge badge-green">✓ {language === 'es' ? 'Cita Agendada en Calendario' : 'Booked & Confirmed'}</span>
                        ) : isOpen ? (
                          <span className="badge badge-yellow">🚨 {language === 'es' ? '¡Llamar este mes para agendar!' : 'Call Clinic this Month!'}</span>
                        ) : (
                          <span className="badge badge-blue">🕒 {language === 'es' ? 'Esperando apertura de agenda' : 'Waiting agenda opening'}</span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.35rem' }}>
                        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>
                            📅 {language === 'es' ? 'Mes previsto de la consulta médica:' : 'Target Consultation Month:'}
                          </span>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>
                            {rem.targetConsultationDate}
                          </strong>
                        </div>

                        <div style={{ backgroundColor: isOpen ? '#fef3c7' : 'var(--bg-primary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${isOpen ? '#fde68a' : 'var(--border-color)'}` }}>
                          <span style={{ fontSize: '0.7rem', color: isOpen ? '#92400e' : 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>
                            📞 {language === 'es' ? 'Fecha para llamar a recepción (1 mes antes):' : 'Date to call reception:'}
                          </span>
                          <strong style={{ fontSize: '0.875rem', color: isOpen ? '#b45309' : 'var(--text-primary)' }}>
                            {rem.callClinicDate}
                          </strong>
                        </div>
                      </div>

                      {rem.clinicPhone && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                          <Phone size={14} color="#059669" /> <strong>{rem.clinicPhone}</strong>
                          {rem.clinicAddress && ` | 📍 ${rem.clinicAddress}`}
                        </div>
                      )}

                      {rem.notes && (
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          📝 {rem.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end' }}>
                      {!isConfirmed && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setReminderToConvert(rem);
                            setConvertDateTime(`${rem.targetConsultationDate}T10:00`);
                            setConvertLocation(rem.clinicAddress || '');
                          }}
                          style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          🗓️ {language === 'es' ? 'Ya tengo fecha (Confirmar)' : 'Got Date (Confirm)'}
                        </button>
                      )}

                      {rem.clinicPhone && !isConfirmed && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const msg = formatBookingWhatsAppMessage(rem, activePatient.name, language);
                            shareViaWhatsApp(msg, rem.clinicPhone);
                          }}
                          style={{ fontSize: '0.75rem', backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0', whiteSpace: 'nowrap' }}
                        >
                          📲 {language === 'es' ? 'Pedir Cita por WhatsApp' : 'WhatsApp Clinic'}
                        </button>
                      )}

                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditBookingReminder(rem)}
                          title="Editar recordatorio"
                          style={{ padding: '0.35rem 0.5rem' }}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setBookingToDelete(rem)}
                          title="Eliminar recordatorio"
                          style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: ADD / EDIT CONFIRMED APPOINTMENT */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {appointmentToEdit ? (language === 'es' ? 'Editar Consulta Médica' : 'Edit Appointment') : (language === 'es' ? 'Nueva Consulta Médica' : 'New Appointment')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('doctorNameLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Alejandro Cantón"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('specialtyLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Angiología y Cirugía Vascular"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
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

                <div className="form-group">
                  <label className="form-label">📞 {language === 'es' ? 'Teléfono del Consultorio' : 'Clinic Phone'}</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9999254433"
                    value={doctorPhone}
                    onChange={e => setDoctorPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📍 {language === 'es' ? 'Ubicación / Consultorio' : 'Location'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Clínica CAMED - Av. Cupules x Calle 60, Mérida"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">📝 {language === 'es' ? 'Notas / Indicaciones' : 'Notes'}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Llevar estudios de sangre y ultrasonido doppler reciente."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Verbal Doctor Advice Builder */}
              <div style={{ backgroundColor: '#fffdf5', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.875rem', marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#92400e', fontWeight: 700 }}>
                  🗣️ {language === 'es' ? 'Recomendaciones verbales dadas por el doctor:' : 'Doctor Verbal Advice:'}
                </label>

                {verbalRecommendations.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.625rem' }}>
                    {verbalRecommendations.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fef3c7', fontSize: '0.78rem' }}>
                        <span>• {item}</span>
                        <button type="button" onClick={() => handleRemoveVerbalAdviceItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Usar medias de compresión graduada 15-20 mmHg"
                    value={newVerbalAdvice}
                    onChange={e => setNewVerbalAdvice(e.target.value)}
                    style={{ fontSize: '0.8125rem' }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddVerbalAdviceItem}>
                    <Plus size={14} /> {language === 'es' ? 'Agregar' : 'Add'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === 'es' ? 'Guardar Consulta' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT FUTURE BOOKING REMINDER */}
      {isBookingModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {bookingToEdit
                  ? (language === 'es' ? 'Editar Recordatorio de Agenda Futura' : 'Edit Future Booking Reminder')
                  : (language === 'es' ? 'Nuevo Recordatorio de Apertura de Agenda' : 'New Future Booking Reminder')}
              </h3>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {language === 'es'
                ? 'Úsalo cuando el doctor pida revisión en 1 año o 6 meses y la asistente te pida "hablar 1 mes antes para la agenda".'
                : 'Use when the doctor requests a review in 1 year/6 months and the assistant says to call 1 month before.'}
            </p>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: 600 }}>
                ⚡ {language === 'es' ? 'Preajustes rápidos:' : 'Quick Presets:'}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPresetDates(12, 1)}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#ede9fe', color: '#6d28d9', borderColor: '#ddd6fe' }}
              >
                🗓️ {language === 'es' ? 'Revisión en 1 Año (Llamar 1 mes antes)' : '1 Year Review (Call 1 mo before)'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPresetDates(6, 1)}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
              >
                📆 {language === 'es' ? 'Revisión en 6 Meses (Llamar 1 mes antes)' : '6 Months Review'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPresetDates(3, 1)}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}
              >
                🕒 {language === 'es' ? 'Revisión en 3 Meses' : '3 Months Review'}
              </button>
            </div>

            <form onSubmit={handleSaveBookingReminder}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('doctorNameLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Alejandro Cantón"
                    value={bDoctorName}
                    onChange={e => setBDoctorName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('specialtyLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Angiología y Cirugía Vascular"
                    value={bSpecialty}
                    onChange={e => setBSpecialty(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    📅 {language === 'es' ? 'Fecha Prevista de la Consulta:' : 'Target Consultation Date:'}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={bTargetDate}
                    onChange={e => setBTargetDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#b45309', fontWeight: 700 }}>
                    📞 {language === 'es' ? 'Fecha para Llamar a Recepción (1 mes antes):' : 'Date to Call Reception:'}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={bCallDate}
                    onChange={e => setBCallDate(e.target.value)}
                    required
                    style={{ borderColor: '#f59e0b', backgroundColor: '#fffdf5' }}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">📞 {language === 'es' ? 'Teléfono del Consultorio / Asistente:' : 'Clinic Phone:'}</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9999254433"
                    value={bPhone}
                    onChange={e => setBPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">📍 {language === 'es' ? 'Clínica / Dirección:' : 'Clinic Address:'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Clínica CAMED - Av. Cupules, Mérida"
                    value={bAddress}
                    onChange={e => setBAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📝 {language === 'es' ? 'Notas e Indicaciones de la Asistente:' : 'Notes:'}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. La asistente indicó que la agenda anual se abre el 1 de julio para apartar fecha."
                  value={bNotes}
                  onChange={e => setBNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsBookingModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
                  {language === 'es' ? 'Guardar Recordatorio' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONVERT REMINDER TO CONFIRMED APPOINTMENT */}
      {reminderToConvert && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                🗓️ {language === 'es' ? 'Confirmar Cita Médica Asignada' : 'Confirm Assigned Appointment'}
              </h3>
              <button
                onClick={() => setReminderToConvert(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {language === 'es'
                ? `Ingresa el día y la hora exacta que te asignó la asistente de ${reminderToConvert.doctorName} (${reminderToConvert.specialty}):`
                : `Enter the exact date and time assigned by the assistant:`}
            </p>

            <form onSubmit={handleConvertReminderToAppointment}>
              <div className="form-group">
                <label className="form-label">{t('dateTimeLabel')}</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={convertDateTime}
                  onChange={e => setConvertDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📍 {language === 'es' ? 'Lugar / Clínica:' : 'Location:'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={convertLocation}
                  onChange={e => setConvertLocation(e.target.value)}
                  placeholder="e.g. Clínica CAMED - Av. Cupules, Mérida"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReminderToConvert(null)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>
                  {language === 'es' ? '✓ Confirmar y Agregar a Citas' : 'Confirm & Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMED APPOINTMENT CONFIRMATION */}
      {appToDelete && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: '#fee2e2', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {language === 'es' ? '¿Eliminar esta consulta médica?' : 'Delete Appointment?'}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {language === 'es'
                ? `Esta acción eliminará el registro de la consulta con el ${appToDelete.doctorName}.`
                : `This will remove the appointment record.`}
            </p>

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
                {language === 'es' ? 'Sí, eliminar' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE BOOKING REMINDER CONFIRMATION */}
      {bookingToDelete && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: '#fee2e2', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {language === 'es' ? '¿Eliminar este recordatorio de agenda?' : 'Delete Booking Reminder?'}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {language === 'es'
                ? `Esta acción eliminará el recordatorio de llamada para el ${bookingToDelete.doctorName} (${bookingToDelete.specialty}).`
                : `This will remove the booking reminder.`}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setBookingToDelete(null)}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => {
                  deleteBookingReminder(bookingToDelete.id);
                  setBookingToDelete(null);
                }}
              >
                {language === 'es' ? 'Sí, eliminar' : 'Yes, delete'}
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
