import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  User,
  Bell,
  BellRing,
  Share2,
  Printer,
  ChevronDown,
  Clock,
  HeartPulse
} from 'lucide-react';
import { PatientSelector } from './PatientSelector';
import { requestNotificationPermission } from '../../lib/notifications';
import { buildWhatsAppSummary, shareViaWhatsApp } from '../../lib/whatsapp';

export const Header: React.FC<{ onPrintReport?: () => void }> = ({ onPrintReport }) => {
  const { activePatient, medications, doseLogs } = useApp();
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsGranted(Notification.permission === 'granted');
    }
  }, []);

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsGranted(granted);
  };

  const handleShareWhatsApp = () => {
    if (!activePatient) return;
    const summary = buildWhatsAppSummary(activePatient, medications, doseLogs);
    shareViaWhatsApp(summary);
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
              onClick={handleShareWhatsApp}
              title="Share Today's Agenda on WhatsApp"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#16a34a' }}
            >
              <Share2 size={16} />
              <span className="hide-mobile" style={{ fontSize: '0.8125rem' }}>WhatsApp</span>
            </button>

            {onPrintReport && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onPrintReport}
                title="Print Doctor Report (Ctrl+P)"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Printer size={16} />
                <span className="hide-mobile" style={{ fontSize: '0.8125rem' }}>Report</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <PatientSelector
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
      />
    </>
  );
};
