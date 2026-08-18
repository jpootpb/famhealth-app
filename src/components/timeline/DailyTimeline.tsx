import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Medication } from '../../types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sun,
  Sunset,
  Moon,
  Send,
  Plus,
  Share2,
  UserCheck,
  X,
  Users,
  AlertTriangle,
  BellRing
} from 'lucide-react';
import {
  formatDateIso
} from '../../utils/frequencyEngine';
import {
  generateUnifiedCaregiverTimeline,
  CaregiverTimelineSlot
} from '../../utils/multiPatientCaregiverEngine';
import {
  findOverdueUncheckedDoses,
  buildOverdueDoseVerificationMessage,
  OverdueDoseItem
} from '../../utils/caregiverOverdueEngine';
import { formatDose, getStockStatus, getExpirationStatus } from '../../utils/formatters';
import { getCurrentShiftCaregiver, buildDoseTakenWhatsAppMessage, shareViaWhatsApp } from '../../lib/whatsapp';

interface DailyTimelineProps {
  onOpenAddMedication?: () => void;
}

export const DailyTimeline: React.FC<DailyTimelineProps> = ({ onOpenAddMedication }) => {
  const { activePatient, patients, medications, doseLogs, toggleDoseTaken, families } = useApp();
  const { t, language } = useLanguage();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [caregiverFilter, setCaregiverFilter] = useState<string | 'all'>('all');
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  // Determine current on-duty caregiver
  const currentShiftCaregiver = getCurrentShiftCaregiver(families, new Date());
  const [selectedCaregiver, setSelectedCaregiver] = useState<string>(
    currentShiftCaregiver ? currentShiftCaregiver.name : (language === 'es' ? 'José Manuel Poot' : 'Primary Caregiver')
  );

  const currentDateIso = formatDateIso(currentDate);
  const isToday = currentDateIso === formatDateIso(new Date());

  // Compute all due doses for the selected date and patient filter
  const timelineSlots = generateUnifiedCaregiverTimeline({
    patients,
    medications,
    doseLogs,
    date: currentDate,
    selectedPatientId: caregiverFilter
  });

  // Compute overdue unchecked doses (only for today)
  const targetPatientsForOverdue = caregiverFilter === 'all'
    ? patients
    : patients.filter(p => p.id === caregiverFilter);

  const overdueDoses: OverdueDoseItem[] = isToday
    ? findOverdueUncheckedDoses({
        patients: targetPatientsForOverdue,
        medications,
        doseLogs,
        currentDateTime: new Date()
      })
    : [];

  // Compliance metrics
  const totalDoses = timelineSlots.length;
  const takenDoses = timelineSlots.filter(item => item.isTaken).length;
  const progressPercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  // Time-of-day Buckets
  const morningBucket = timelineSlots.filter(item => item.timeOfDay === 'morning');
  const afternoonBucket = timelineSlots.filter(item => item.timeOfDay === 'afternoon');
  const eveningBucket = timelineSlots.filter(item => item.timeOfDay === 'evening' || item.timeOfDay === 'night');

  const handleToggleDoseSlot = (slot: CaregiverTimelineSlot | OverdueDoseItem) => {
    const timeToToggle = 'time' in slot ? slot.time : slot.scheduledTime;
    toggleDoseTaken(slot.medicationId, timeToToggle, currentDateIso, selectedCaregiver);
  };

  const handleNotifyFamilyDose = (slot: CaregiverTimelineSlot) => {
    const med = medications.find(m => m.id === slot.medicationId);
    const patient = patients.find(p => p.id === slot.patientId);
    if (!med || !patient) return;

    const progressText = `${takenDoses} ${t('dosesTakenOf')} ${totalDoses} ${t('completedToday')}`;
    const message = buildDoseTakenWhatsAppMessage(
      patient,
      med,
      { time: slot.time, dose: slot.dose, instruction: slot.instruction },
      selectedCaregiver,
      progressText,
      language
    );
    shareViaWhatsApp(message);
  };

  const handleSendOverdueVerificationWhatsApp = (overdueItem: OverdueDoseItem) => {
    const msg = buildOverdueDoseVerificationMessage({
      overdueItem,
      caregiverName: selectedCaregiver,
      currentDate: currentDateIso,
      lang: language
    });
    shareViaWhatsApp(msg);
  };

  const handleShareHouseholdDailySummary = () => {
    const isEn = language === 'en';
    let msg = '';

    if (isEn) {
      msg += `📋 *FamHealth - Household Daily Medication Summary* ✨\n\n`;
      msg += `📅 *Date:* ${currentDateIso}\n`;
      msg += `👨‍⚕️ *Caregiver on Shift:* ${selectedCaregiver}\n`;
      msg += `📊 *Household Progress:* ${takenDoses} of ${totalDoses} doses completed (${progressPercent}%)\n\n`;
      msg += `*Scheduled Household Doses:*\n\n`;

      timelineSlots.forEach(s => {
        const statusIcon = s.isTaken ? '✅ [DONE]' : '⏳ [PENDING]';
        msg += `${statusIcon} *${s.time}* • *${s.patientName}*\n`;
        msg += `   💊 ${s.medicationName} (${s.dose} ${s.presentation})\n`;
        if (s.instruction) msg += `   📝 ${s.instruction}\n`;
        if (s.isTaken && s.administeredBy) msg += `   👤 Administered by: ${s.administeredBy}\n`;
        msg += `\n`;
      });

      msg += `💬 _FamHealth Household Care_`;
    } else {
      msg += `📋 *FamHealth - Resumen Diario del Hogar* ✨\n\n`;
      msg += `📅 *Fecha:* ${currentDateIso}\n`;
      msg += `👨‍⚕️ *Cuidador en Turno:* ${selectedCaregiver}\n`;
      msg += `📊 *Progreso del Hogar:* ${takenDoses} de ${totalDoses} tomas cumplidas (${progressPercent}%)\n\n`;
      msg += `*Tomas del Hogar Programadas:*\n\n`;

      timelineSlots.forEach(s => {
        const statusIcon = s.isTaken ? '✅ [REALIZADO]' : '⏳ [PENDIENTE]';
        msg += `${statusIcon} *${s.time}* • *${s.patientName}*\n`;
        msg += `   💊 ${s.medicationName} (${s.dose} ${s.presentation})\n`;
        if (s.instruction) msg += `   📝 ${s.instruction}\n`;
        if (s.isTaken && s.administeredBy) msg += `   👤 Administrado por: ${s.administeredBy}\n`;
        msg += `\n`;
      });

      msg += `💬 _FamHealth Control Médico Familiar_`;
    }

    shareViaWhatsApp(msg);
  };

  const shiftDate = (days: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  const formattedDateLabel = currentDate.toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const getPatientAvatar = (patientId: string) => {
    if (patientId === 'patient-jose') return '👤';
    if (patientId === 'patient-grandfather') return '👴';
    if (patientId === 'patient-maria') return '👵';
    return '🩺';
  };

  const getPatientBadgeStyle = (patientId: string) => {
    if (patientId === 'patient-jose') return { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' };
    if (patientId === 'patient-grandfather') return { backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' };
    if (patientId === 'patient-maria') return { backgroundColor: '#fdf4ff', color: '#86198f', border: '1px solid #f0abfc' };
    return { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' };
  };

  const isDoseOverdue = (time: string): boolean => {
    if (!isToday) return false;
    const now = new Date();
    const [h, m] = time.split(':').map(Number);
    const currentTotalMin = now.getHours() * 60 + now.getMinutes();
    const slotTotalMin = h * 60 + m;
    return currentTotalMin > slotTotalMin;
  };

  const renderDoseCard = (slot: CaregiverTimelineSlot) => {
    const med = medications.find(m => m.id === slot.medicationId);
    const stockStatus = med ? getStockStatus(med.currentStock, med.minimumStockAlert) : { status: 'safe', label: '', badgeClass: '' };
    const expStatus = med ? getExpirationStatus(med.expirationDate, currentDate) : { status: 'valid', label: '', badgeClass: '' };
    const patientBadge = getPatientBadgeStyle(slot.patientId);
    const overdue = !slot.isTaken && isDoseOverdue(slot.time);

    return (
      <div
        key={slot.id}
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          backgroundColor: slot.isTaken ? 'var(--bg-secondary)' : overdue ? '#fffbeb' : '#ffffff',
          borderColor: slot.isTaken ? 'var(--success)' : overdue ? '#f59e0b' : 'var(--border-color)',
          borderLeft: overdue ? '4px solid #f59e0b' : undefined,
          transition: 'all 0.2s ease',
          opacity: slot.isTaken ? 0.9 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button
            onClick={() => handleToggleDoseSlot(slot)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: slot.isTaken ? 'var(--success)' : overdue ? '#f59e0b' : 'var(--border-color)'
            }}
            title={slot.isTaken ? t('doseTaken') : t('confirmDose')}
          >
            {slot.isTaken ? (
              <CheckCircle2 size={32} fill="var(--success-light)" />
            ) : (
              <Circle size={32} />
            )}
          </button>

          {/* Photo Thumbnail */}
          {med?.imageUrl && (
            <img
              src={med.imageUrl}
              alt={slot.medicationName}
              onClick={() => setZoomImage({ url: med.imageUrl!, title: `${slot.medicationName} (${med.laboratory || t('boxPhoto')})` })}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                objectFit: 'cover',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                flexShrink: 0
              }}
              title={t('clickToZoomBox')}
            />
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              {/* Patient Badge */}
              <span
                style={{
                  ...patientBadge,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {getPatientAvatar(slot.patientId)} {slot.patientName}
              </span>

              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: slot.isTaken ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: slot.isTaken ? 'line-through' : 'none'
                }}
              >
                {slot.medicationName}
              </span>

              <span className="fractional-badge">
                {formatDose(slot.dose, slot.presentation)}
              </span>

              {overdue && (
                <span
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <AlertTriangle size={11} color="#d97706" />
                  {language === 'es' ? 'Pendiente / No checada' : 'Overdue'}
                </span>
              )}

              {med?.laboratory && (
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  {med.laboratory}
                </span>
              )}

              {med?.expirationDate && expStatus.status !== 'valid' && (
                <span className={`badge ${expStatus.badgeClass}`} style={{ fontSize: '0.65rem' }}>
                  {expStatus.label}
                </span>
              )}

              {med && stockStatus.status !== 'safe' && (
                <span className={`badge ${stockStatus.badgeClass}`} style={{ fontSize: '0.65rem' }}>
                  {stockStatus.label}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: overdue ? '#d97706' : 'var(--primary)' }}>
                <Clock size={14} /> {slot.time}
              </span>

              {slot.instruction && (
                <span>• {slot.instruction}</span>
              )}

              {slot.isTaken && slot.administeredBy && (
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  ✓ {t('signedBy')}: {slot.administeredBy} {slot.actualTakenTime ? `(${slot.actualTakenTime})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Right Actions */}
        <div>
          {slot.isTaken ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleNotifyFamilyDose(slot)}
              title={language === 'es' ? 'Notificar por WhatsApp' : 'Notify Family WhatsApp'}
              style={{ color: '#16a34a', borderColor: '#86efac' }}
            >
              <Send size={14} />
              <span className="desktop-only">{language === 'es' ? 'Notificar WhatsApp' : 'Notify WhatsApp'}</span>
            </button>
          ) : overdue ? (
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendOverdueVerificationWhatsApp({
                  id: slot.id,
                  patientId: slot.patientId,
                  patientName: slot.patientName,
                  medicationId: slot.medicationId,
                  medicationName: slot.medicationName,
                  presentation: slot.presentation,
                  dose: slot.dose,
                  instruction: slot.instruction,
                  scheduledTime: slot.time,
                  minutesOverdue: 0
                })}
                title={language === 'es' ? 'Preguntar a cuidadora/familia por WhatsApp' : 'Check with caregiver on WhatsApp'}
                style={{ color: '#d97706', borderColor: '#fde68a', backgroundColor: '#fffbeb' }}
              >
                <BellRing size={14} />
                <span className="desktop-only">{language === 'es' ? 'Preguntar si ya se dio' : 'Ask Caregiver'}</span>
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleToggleDoseSlot(slot)}
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
              >
                {language === 'es' ? '✓ Ya se dio' : '✓ Taken'}
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleToggleDoseSlot(slot)}
            >
              {language === 'es' ? 'Tomar / Dar' : 'Take'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Caregiver Multi-Patient Switcher Bar */}
      <div
        className="card"
        style={{
          padding: '0.875rem 1.25rem',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--primary)" />
            <strong style={{ fontSize: '0.875rem' }}>
              {language === 'es' ? 'Modo Cuidador Multi-Paciente y Autocuidado:' : 'Caregiver & Multi-Patient View:'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <UserCheck size={14} color="var(--success)" />
            <span>{language === 'es' ? 'Cuidador activo:' : 'Caregiver:'}</span>
            <select
              value={selectedCaregiver}
              onChange={e => setSelectedCaregiver(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.15rem 0.35rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            >
              {families.map(f => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Patient Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${caregiverFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCaregiverFilter('all')}
            style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}
          >
            🏠 {language === 'es' ? 'Todo el Hogar (Papá + Mamá + Mi Salud)' : 'All Household (Parents + Self)'}
          </button>

          {patients.map(p => (
            <button
              key={p.id}
              className={`btn btn-sm ${caregiverFilter === p.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCaregiverFilter(p.id)}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              {getPatientAvatar(p.id)} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue / Unchecked Doses Safety Alert Banner */}
      {overdueDoses.length > 0 && (
        <div
          className="card"
          style={{
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderLeft: '5px solid #f59e0b',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={22} color="#d97706" />
              <div>
                <strong style={{ color: '#92400e', fontSize: '0.9375rem', display: 'block' }}>
                  {language === 'es'
                    ? `⚠️ ${overdueDoses.length} Toma(s) Pendiente(s) de Verificación con el Cuidador`
                    : `⚠️ ${overdueDoses.length} Overdue Dose(s) Pending Verification`}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#78350f' }}>
                  {language === 'es'
                    ? 'La hora de estas tomas ya transcurrió y no han sido marcadas en la aplicación.'
                    : 'Scheduled time passed and doses are not signed off yet.'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {overdueDoses.map(od => (
              <div
                key={od.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #fde047',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.875rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 800, color: '#92400e' }}>
                    <span>{od.patientName}</span>
                    <span>•</span>
                    <span style={{ color: '#d97706' }}>Programada: {od.scheduledTime} ({od.minutesOverdue} min transcurridos)</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    💊 {od.medicationName} ({formatDose(od.dose, od.presentation)})
                  </div>
                  {od.instruction && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      📝 {od.instruction}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSendOverdueVerificationWhatsApp(od)}
                    style={{ color: '#d97706', borderColor: '#fde68a', backgroundColor: '#fffbeb', fontSize: '0.75rem' }}
                    title="Enviar mensaje por WhatsApp para preguntar si ya se dio"
                  >
                    <BellRing size={13} />
                    <span>{language === 'es' ? '📲 Preguntar a Cuidadora' : 'Ask Caregiver'}</span>
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleToggleDoseSlot(od)}
                    style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', fontSize: '0.75rem' }}
                  >
                    {language === 'es' ? '✓ Sí, ya se administró' : '✓ Suministrada'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Navigation & Actions */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => shiftDate(-1)}>
            ◀ {t('yesterday')}
          </button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'capitalize', display: 'block' }}>
              {formattedDateLabel}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isToday ? `(${t('today')})` : ''}
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => shiftDate(1)}>
            {t('tomorrow')} ▶
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleShareHouseholdDailySummary} style={{ color: '#16a34a' }}>
            <Share2 size={18} /> {language === 'es' ? 'Compartir Resumen del Hogar' : 'Share Daily Summary'}
          </button>
          {onOpenAddMedication && (
            <button className="btn btn-primary" onClick={onOpenAddMedication}>
              <Plus size={18} /> {language === 'es' ? 'Agregar Medicamento' : 'Add Medication'}
            </button>
          )}
        </div>
      </div>

      {/* Progress & Compliance Banner */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: progressPercent === 100 && totalDoses > 0 ? '#ecfdf5' : '#ffffff',
          borderLeft: `5px solid ${progressPercent === 100 && totalDoses > 0 ? 'var(--success)' : 'var(--primary)'}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.9375rem' }}>
            {caregiverFilter === 'all'
              ? (language === 'es' ? 'Cumplimiento Diario del Hogar' : 'Household Daily Compliance')
              : `${t('dailyCompliance')} (${patients.find(p => p.id === caregiverFilter)?.name || ''})`}
          </strong>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)' }}>
            {takenDoses} / {totalDoses} {t('completedToday')} ({progressPercent}%)
          </span>
        </div>

        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: progressPercent === 100 ? 'var(--success)' : 'var(--primary)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Timeline Section Buckets */}
      {timelineSlots.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>
            {language === 'es'
              ? 'No hay tomas de medicamentos programadas para esta fecha en los perfiles seleccionados.'
              : 'No scheduled doses for this date in selected profiles.'}
          </p>
          {onOpenAddMedication && (
            <button className="btn btn-primary" onClick={onOpenAddMedication}>
              <Plus size={18} /> {language === 'es' ? 'Agregar Medicamento' : 'Add Medication'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Morning Bucket */}
          {morningBucket.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <Sun size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {t('morningBucket')} ({morningBucket.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {morningBucket.map(renderDoseCard)}
              </div>
            </div>
          )}

          {/* Afternoon Bucket */}
          {afternoonBucket.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <Sunset size={18} color="#ea580c" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {t('afternoonBucket')} ({afternoonBucket.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {afternoonBucket.map(renderDoseCard)}
              </div>
            </div>
          )}

          {/* Evening / Night Bucket */}
          {eveningBucket.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <Moon size={18} color="#6366f1" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {t('eveningBucket')} ({eveningBucket.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {eveningBucket.map(renderDoseCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Box Photo Zoom Modal */}
      {zoomImage && (
        <div className="modal-backdrop" onClick={() => setZoomImage(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '500px', textAlign: 'center', padding: '1rem' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '1rem' }}>{zoomImage.title}</strong>
              <button className="btn btn-secondary btn-sm" onClick={() => setZoomImage(null)}>
                <X size={16} />
              </button>
            </div>
            <img
              src={zoomImage.url}
              alt={zoomImage.title}
              style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
