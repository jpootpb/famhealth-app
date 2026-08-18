import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Medication, DoseSlot, DoseLog } from '../../types';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Pill,
  Sun,
  Sunset,
  Moon,
  AlertTriangle,
  Send,
  Plus,
  Share2,
  UserCheck,
  Building2,
  X
} from 'lucide-react';
import {
  getDailyDoseSlots,
  formatDateIso
} from '../../utils/frequencyEngine';
import { formatDose, getStockStatus, getExpirationStatus } from '../../utils/formatters';
import { getCurrentShiftCaregiver, buildDoseTakenWhatsAppMessage, shareViaWhatsApp } from '../../lib/whatsapp';

interface DailyTimelineProps {
  onOpenAddMedication?: () => void;
}

export const DailyTimeline: React.FC<DailyTimelineProps> = ({ onOpenAddMedication }) => {
  const { activePatient, medications, doseLogs, toggleDoseTaken, families } = useApp();
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  // Determine current on-duty caregiver
  const currentShiftCaregiver = getCurrentShiftCaregiver(families, new Date());
  const [selectedCaregiver, setSelectedCaregiver] = useState<string>(
    currentShiftCaregiver ? currentShiftCaregiver.name : (language === 'es' ? 'Cuidador Principal' : 'Primary Caregiver')
  );

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
      </div>
    );
  }

  const currentDateIso = formatDateIso(currentDate);
  const patientMeds = medications.filter(m => m.patientId === activePatient.id);

  // Compute all due doses for the selected date
  const timelineItems: Array<{
    med: Medication;
    slot: DoseSlot;
    log?: DoseLog;
  }> = [];

  patientMeds.forEach(med => {
    const slots = getDailyDoseSlots(med, currentDate);
    slots.forEach(slot => {
      const log = doseLogs.find(
        l => l.medicationId === med.id && l.scheduledTime === slot.time && l.date === currentDateIso
      );
      timelineItems.push({ med, slot, log });
    });
  });

  // Sort by time
  timelineItems.sort((a, b) => a.slot.time.localeCompare(b.slot.time));

  // Compliance metrics
  const totalDoses = timelineItems.length;
  const takenDoses = timelineItems.filter(item => item.log?.taken).length;
  const progressPercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  // Time-of-day Buckets
  const morningBucket = timelineItems.filter(item => item.slot.time >= '06:00' && item.slot.time < '12:00');
  const afternoonBucket = timelineItems.filter(item => item.slot.time >= '12:00' && item.slot.time < '18:00');
  const eveningBucket = timelineItems.filter(item => item.slot.time >= '18:00' || item.slot.time < '06:00');

  const handleToggleDose = (med: Medication, slot: DoseSlot) => {
    toggleDoseTaken(med.id, slot.time, currentDateIso, selectedCaregiver);
  };

  const handleNotifyFamilyDose = (med: Medication, slot: DoseSlot) => {
    const progressText = `${takenDoses} ${t('dosesTakenOf')} ${totalDoses} ${t('completedToday')}`;
    const message = buildDoseTakenWhatsAppMessage(
      activePatient,
      med,
      slot,
      selectedCaregiver,
      progressText
    );
    shareViaWhatsApp(message);
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

  const renderDoseCard = (item: { med: Medication; slot: DoseSlot; log?: DoseLog }) => {
    const { med, slot, log } = item;
    const isTaken = !!log?.taken;
    const stockStatus = getStockStatus(med.currentStock, med.minimumStockAlert);
    const expStatus = getExpirationStatus(med.expirationDate, currentDate);

    return (
      <div
        key={`${med.id}-${slot.time}`}
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          backgroundColor: isTaken ? 'var(--bg-secondary)' : '#ffffff',
          borderColor: isTaken ? 'var(--success)' : 'var(--border-color)',
          transition: 'all 0.2s ease',
          opacity: isTaken ? 0.9 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button
            onClick={() => handleToggleDose(med, slot)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isTaken ? 'var(--success)' : 'var(--border-color)'
            }}
            title={isTaken ? t('doseTaken') : t('confirmDose')}
          >
            {isTaken ? (
              <CheckCircle2 size={32} fill="var(--success-light)" />
            ) : (
              <Circle size={32} />
            )}
          </button>

          {/* Photo Thumbnail */}
          {med.imageUrl && (
            <img
              src={med.imageUrl}
              alt={med.name}
              onClick={() => setZoomImage({ url: med.imageUrl!, title: `${med.name} (${med.laboratory || t('boxPhoto')})` })}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: isTaken ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: isTaken ? 'line-through' : 'none'
                }}
              >
                {med.name}
              </span>

              <span className="fractional-badge">
                {formatDose(slot.dose, med.presentation)}
              </span>

              {med.laboratory && (
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  {med.laboratory}
                </span>
              )}

              {med.expirationDate && expStatus.status !== 'valid' && (
                <span className={`badge ${expStatus.badgeClass}`} style={{ fontSize: '0.65rem' }}>
                  ⚠️ {expStatus.label}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              ⏰ <strong>{slot.time}</strong> {slot.instruction ? `• ${slot.instruction}` : med.indication ? `• ${med.indication}` : ''}
            </div>

            {isTaken && (
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem', fontWeight: 600 }}>
                ✓ {t('administeredAt')} {log?.actualTakenTime ? `${log.actualTakenTime}` : ''} {log?.administeredBy ? `${t('by')} ${log.administeredBy}` : ''}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Notify Family Quick WhatsApp Button */}
          {isTaken && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleNotifyFamilyDose(med, slot)}
              title={t('notifyFamily')}
              style={{ fontSize: '0.75rem', color: '#16a34a', padding: '0.3rem 0.5rem' }}
            >
              <Share2 size={13} />
              <span className="hide-mobile">{t('notifyFamily')}</span>
            </button>
          )}

          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${stockStatus.badgeClass}`} style={{ fontSize: '0.7rem' }}>
              {med.currentStock} {t('remainingStockShort')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Multi-Caregiver On Duty Bar */}
      {families.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <UserCheck size={16} color="var(--primary)" />
              <span>{language === 'es' ? '¿Quién está cuidando hoy?' : 'Who is on caregiver duty?'}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {families.map(f => {
                const isSelected = selectedCaregiver === f.name;
                const shiftEmoji = f.shift === 'morning' ? '🌅' : f.shift === 'night' ? '🌙' : '☀️';
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCaregiver(f.name)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: isSelected ? 800 : 500
                    }}
                  >
                    <span>{shiftEmoji} {f.name}</span>
                    {f.shift && (
                      <span style={{ opacity: 0.8, fontSize: '0.6875rem' }}>
                        ({f.shift === 'morning' ? 'Mañana' : f.shift === 'night' ? 'Noche' : f.shift})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('signedBy')} <strong style={{ color: 'var(--primary)' }}>{selectedCaregiver}</strong>
          </span>
        </div>
      )}

      {/* Date Navigation & Compliance Progress Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => shiftDate(-1)}>
              ← {t('yesterday')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>
              {t('today')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => shiftDate(1)}>
              {t('tomorrow')} →
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, textTransform: 'capitalize', margin: 0 }}>
              {formattedDateLabel}
            </h2>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('dailyCompliance')}: {takenDoses} {t('dosesTakenOf')} {totalDoses} {t('completedToday')}
            </span>
            <strong style={{ color: progressPercent === 100 ? 'var(--success)' : 'var(--primary)' }}>
              {progressPercent}%
            </strong>
          </div>

          <div className="progress-container" style={{ height: '10px' }}>
            <div
              className="progress-bar"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: progressPercent === 100 ? 'var(--success)' : 'var(--primary)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Timeline Dose Buckets */}
      {totalDoses === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <Pill size={48} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {t('noMedsScheduled')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            {t('noMedsScheduledDesc')}
          </p>
          {onOpenAddMedication && (
            <button className="btn btn-primary" onClick={onOpenAddMedication} style={{ margin: '0 auto' }}>
              <Plus size={18} /> {t('addNewMedication')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Morning Bucket */}
          {morningBucket.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem', color: '#d97706' }}>
                <Sun size={18} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('morningBucket')}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {morningBucket.map(renderDoseCard)}
              </div>
            </div>
          )}

          {/* Afternoon Bucket */}
          {afternoonBucket.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                <Sunset size={18} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('afternoonBucket')}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {afternoonBucket.map(renderDoseCard)}
              </div>
            </div>
          )}

          {/* Evening / Night Bucket */}
          {eveningBucket.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>
                <Moon size={18} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('eveningBucket')}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
