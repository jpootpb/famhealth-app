import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  Bell,
  BellRing,
  Share2,
  Printer,
  ChevronDown,
  Clock,
  HeartPulse
} from 'lucide-react';
import { PatientSelector } from './PatientSelector';
import { WhatsAppModal } from '../sharing/WhatsAppModal';
import { DoctorSummaryModal } from '../doctor/DoctorSummaryModal';
import { requestNotificationPermission, sendLocalNotification } from '../../lib/notifications';
import { getDailyDoseSlots, formatDateIso } from '../../utils/frequencyEngine';

export const Header: React.FC<{ onPrintReport?: () => void }> = () => {
  const { activePatient, medications, doseLogs } = useApp();
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isDoctorSummaryOpen, setIsDoctorSummaryOpen] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsGranted(Notification.permission === 'granted');
    }
  }, []);

  // Periodic reminder checker (checks every 60 seconds for due doses)
  useEffect(() => {
    if (!notificationsGranted || !activePatient) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentH}:${currentM}`;
      const todayIso = formatDateIso(now);

      const patientMeds = medications.filter(m => m.patientId === activePatient.id);
      patientMeds.forEach(med => {
        const slots = getDailyDoseSlots(med, now);
        slots.forEach(slot => {
          if (slot.time === currentTimeStr) {
            const alreadyTaken = doseLogs.some(
              l => l.medicationId === med.id && l.scheduledTime === slot.time && l.date === todayIso && l.taken
            );
            if (!alreadyTaken) {
              sendLocalNotification(
                `⏰ Medication Time: ${med.name}`,
                `Scheduled dose: ${slot.dose} ${med.presentation} for ${activePatient.name}. Please take or administer now.`
              );
            }
          }
        });
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [notificationsGranted, activePatient, medications, doseLogs]);

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsGranted(granted);
    if (granted) {
      sendLocalNotification(
        '🔔 FamHealth Alerts Active',
        'You will now receive desktop notifications for your scheduled medications.'
      );
    }
  };

  return (
    <>
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.875rem 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Heart size={20} fill="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                FamHealth
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Caregiver & Patient Hub
              </span>
            </div>
          </div>

          {/* Active Patient Pill Selector */}
          {activePatient && (
            <button
              onClick={() => setIsPatientModalOpen(true)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
              title="Change active patient profile"
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: activePatient.type === 'chronic' ? 'var(--secondary)' : 'var(--warning)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {activePatient.name.charAt(0)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {activePatient.name}
                  </strong>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                  {activePatient.type === 'chronic' ? (
                    <span style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <HeartPulse size={10} /> Chronic Care
                    </span>
                  ) : (
                    <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Clock size={10} /> Temp ({activePatient.durationDays || 7}d)
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}

          {/* Global Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${notificationsGranted ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleToggleNotifications}
              title={notificationsGranted ? 'Desktop Alerts Active' : 'Enable Medication Reminders'}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              {notificationsGranted ? <BellRing size={16} color="var(--success)" /> : <Bell size={16} />}
              <span className="hide-mobile" style={{ fontSize: '0.8125rem' }}>
                {notificationsGranted ? 'Alerts ON' : 'Enable Alerts'}
              </span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsWhatsAppModalOpen(true)}
              title="Share Today's Agenda on WhatsApp"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#16a34a' }}
            >
              <Share2 size={16} />
              <span className="hide-mobile" style={{ fontSize: '0.8125rem' }}>WhatsApp</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsDoctorSummaryOpen(true)}
              title="Open Doctor Consultation Summary & Print Sheet"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--primary)' }}
            >
              <Printer size={16} />
              <span className="hide-mobile" style={{ fontSize: '0.8125rem' }}>Doctor Sheet</span>
            </button>
          </div>
        </div>
      </header>

      <PatientSelector
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
      />

      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      <DoctorSummaryModal
        isOpen={isDoctorSummaryOpen}
        onClose={() => setIsDoctorSummaryOpen(false)}
      />
    </>
  );
};
