import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  Pill,
  Sun,
  Sunset,
  Moon,
  Plus
} from 'lucide-react';
import { getDailyDoseSlots, formatDateIso } from '../../utils/frequencyEngine';
import { formatDose, getStockStatus } from '../../utils/formatters';

interface DailyDoseItem {
  medicationId: string;
  medicationName: string;
  presentation: string;
  scheduledTime: string;
  dose: number;
  instructions?: string;
  currentStock: number;
  minimumStockAlert: number;
  isTaken: boolean;
  takenAt?: string;
}

export const DailyTimeline: React.FC<{ onOpenAddMedication?: () => void }> = ({ onOpenAddMedication }) => {
  const { activePatient, medications, doseLogs, toggleDoseTaken } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please select or create a patient profile to view the medication timeline.</p>
      </div>
    );
  }

  const selectedDateStr = formatDateIso(selectedDate);
  const isToday = formatDateIso(new Date()) === selectedDateStr;

  // Filter medications for active patient
  const patientMeds = medications.filter(m => m.patientId === activePatient.id);

  // Compute all scheduled doses for the selected date
  const timelineItems: DailyDoseItem[] = [];

  patientMeds.forEach(med => {
    const slots = getDailyDoseSlots(med, selectedDate);
    slots.forEach(slot => {
      const log = doseLogs.find(
        l => l.medicationId === med.id && l.scheduledTime === slot.time && l.date === selectedDateStr
      );

      timelineItems.push({
        medicationId: med.id,
        medicationName: med.name,
        presentation: med.presentation,
        scheduledTime: slot.time,
        dose: slot.dose,
        instructions: slot.instruction || med.indication,
        currentStock: med.currentStock,
        minimumStockAlert: med.minimumStockAlert,
        isTaken: !!log?.taken,
        takenAt: log?.actualTakenTime
      });
    });
  });

  // Sort chronologically
  timelineItems.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const totalDoses = timelineItems.length;
  const takenDoses = timelineItems.filter(item => item.isTaken).length;
  const progressPercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date());
  };

  // Group by Time-of-Day buckets
  const morningDoses = timelineItems.filter(i => i.scheduledTime < '12:00');
  const afternoonDoses = timelineItems.filter(i => i.scheduledTime >= '12:00' && i.scheduledTime < '18:00');
  const eveningDoses = timelineItems.filter(i => i.scheduledTime >= '18:00');

  const renderDoseCard = (item: DailyDoseItem) => {
    const stockStatus = getStockStatus(item.currentStock, item.minimumStockAlert);
    const doseText = formatDose(item.dose, item.presentation);

    return (
      <div
        key={`${item.medicationId}-${item.scheduledTime}`}
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderLeft: `4px solid ${item.isTaken ? 'var(--success)' : 'var(--primary)'}`,
          backgroundColor: item.isTaken ? 'var(--success-light)' : '#ffffff',
          transition: 'all 0.2s ease',
          marginBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <button
            onClick={() => toggleDoseTaken(item.medicationId, item.scheduledTime, selectedDateStr)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.isTaken ? 'var(--success)' : 'var(--text-muted)',
              transition: 'transform 0.15s ease'
            }}
            aria-label={item.isTaken ? 'Mark as pending' : 'Mark as taken'}
          >
            {item.isTaken ? (
              <CheckCircle2 size={32} color="var(--success)" fill="var(--success-light)" />
            ) : (
              <Circle size={32} color="var(--border-color)" />
            )}
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: item.isTaken ? 'var(--text-secondary)' : 'var(--primary)',
                  backgroundColor: item.isTaken ? '#e2e8f0' : 'var(--primary-light)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
                {item.scheduledTime}
              </span>

              <strong
                style={{
                  fontSize: '1.05rem',
                  color: item.isTaken ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textDecoration: item.isTaken ? 'line-through' : 'none'
                }}
              >
                {item.medicationName}
              </strong>

              {/* Fractional Dosage Badge */}
              <span
                className="badge badge-purple"
                style={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  backgroundColor: item.isTaken ? '#f1f5f9' : undefined,
                  color: item.isTaken ? 'var(--text-secondary)' : undefined
                }}
              >
                <Pill size={12} /> {doseText}
              </span>
            </div>

            {item.instructions && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {item.instructions}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.375rem', fontSize: '0.75rem' }}>
              {/* Stock Status */}
              <span
                className={`badge ${stockStatus.badgeClass}`}
                style={{ fontSize: '0.7rem' }}
                title={`Current stock: ${item.currentStock}`}
              >
                Stock: {item.currentStock} {item.presentation}s
              </span>

              {item.isTaken && item.takenAt && (
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Taken at {item.takenAt}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => toggleDoseTaken(item.medicationId, item.scheduledTime, selectedDateStr)}
          className={`btn btn-sm ${item.isTaken ? 'btn-secondary' : 'btn-success'}`}
          style={{ minWidth: '95px', fontWeight: 600 }}
        >
          {item.isTaken ? 'Undo' : 'Take Dose'}
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Date Navigation Toolbar */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrevDay} aria-label="Previous day">
            <ChevronLeft size={18} />
          </button>

          <button
            className={`btn btn-sm ${isToday ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleSetToday}
          >
            Today
          </button>

          <button className="btn btn-secondary btn-sm" onClick={handleNextDay} aria-label="Next day">
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="var(--primary)" />
          <strong style={{ fontSize: '1rem', textTransform: 'capitalize' }}>
            {selectedDate.toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </strong>
        </div>

        {onOpenAddMedication && (
          <button className="btn btn-primary btn-sm" onClick={onOpenAddMedication}>
            <Plus size={16} /> Add Medication
          </button>
        )}
      </div>

      {/* Daily Compliance Progress Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Daily Treatment Compliance
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {takenDoses} of {totalDoses} doses taken ({progressPercent}%)
            </div>
          </div>
          {progressPercent === 100 && totalDoses > 0 ? (
            <span className="badge badge-green" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}>
              ✓ All Doses Completed!
            </span>
          ) : (
            <span className="badge badge-blue" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}>
              {totalDoses - takenDoses} Doses Pending
            </span>
          )}
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

      {/* Doses List by Time Slots */}
      {totalDoses === 0 ? (
        <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
          <Pill size={40} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No medications scheduled for this date
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Either all medications have completed their course or none are set for this specific day.
          </p>
          {onOpenAddMedication && (
            <button className="btn btn-primary" onClick={onOpenAddMedication} style={{ margin: '0 auto' }}>
              <Plus size={18} /> Schedule New Medication
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Morning Doses (06:00 - 11:59) */}
          {morningDoses.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Sun size={18} color="#ea580c" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Morning (6:00 AM – 11:59 AM)
                </h3>
              </div>
              {morningDoses.map(renderDoseCard)}
            </section>
          )}

          {/* Afternoon Doses (12:00 - 17:59) */}
          {afternoonDoses.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Sunset size={18} color="#d97706" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Afternoon (12:00 PM – 5:59 PM)
                </h3>
              </div>
              {afternoonDoses.map(renderDoseCard)}
            </section>
          )}

          {/* Evening / Night Doses (18:00 - 23:59) */}
          {eveningDoses.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Moon size={18} color="#4f46e5" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Evening & Night (6:00 PM – 11:59 PM)
                </h3>
              </div>
              {eveningDoses.map(renderDoseCard)}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
