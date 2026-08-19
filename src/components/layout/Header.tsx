import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Heart,
  Bell,
  BellRing,
  Share2,
  Printer,
  ChevronDown,
  Clock,
  HeartPulse,
  Users,
  Globe,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { PatientSelector } from './PatientSelector';
import { WhatsAppModal } from '../sharing/WhatsAppModal';
import { DoctorSummaryModal } from '../doctor/DoctorSummaryModal';
import { FamilyManagerModal } from '../auth/FamilyManagerModal';
import { AuthModal } from '../auth/AuthModal';
import { requestNotificationPermission, sendLocalNotification } from '../../lib/notifications';
import { getDailyDoseSlots, formatDateIso } from '../../utils/frequencyEngine';

export const Header: React.FC<{ onPrintReport?: () => void }> = () => {
  const { currentUser, logoutUser, activePatient, activeFamilyCircle, allFamilyCircles, medications, doseLogs } = useApp();
  const { t, language, setLanguage } = useLanguage();

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isDoctorSummaryOpen, setIsDoctorSummaryOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
        'You will now receive notifications for your scheduled medications.'
      );
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <>
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.75rem 1.25rem',
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
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Left: Brand Logo, User Profile, Sign Out & Family Circle Space Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
                }}
              >
                <Heart size={18} fill="#ffffff" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                FamHealth
              </span>
            </div>

            {/* Logged-in User Account Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                padding: '0.25rem 0.6rem'
              }}
              title={language === 'es' ? 'Cuenta de Usuario / Cambiar Perfil' : 'User Account / Switch Profile'}
            >
              <User size={13} color="var(--primary)" />
              <strong style={{ fontSize: '0.75rem', color: 'var(--primary-hover)' }}>
                {currentUser.name.split(' ')[0]}
              </strong>
            </button>

            {/* Direct 1-Click Sign Out Button */}
            <button
              onClick={logoutUser}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                borderRadius: 'var(--radius-full)',
                padding: '0.25rem 0.5rem',
                color: 'var(--danger)'
              }}
              title={language === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
            >
              <LogOut size={13} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                {language === 'es' ? 'Salir' : 'Logout'}
              </span>
            </button>

            {/* Family Circle Badge Selector - Always Visible & Highly Prominent */}
            <button
              onClick={() => setIsFamilyModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#f0fdf4',
                border: '1.5px solid #16a34a',
                padding: '0.3rem 0.75rem',
                color: '#15803d',
                cursor: 'pointer'
              }}
              title={language === 'es' ? 'Gestionar o Cambiar Círculo Familiar (Mi Hogar, Papás, etc.)' : 'Manage / Switch Family Circle'}
            >
              <Users size={14} color="#16a34a" />
              <strong style={{ fontSize: '0.8rem', color: '#15803d' }}>
                {activeFamilyCircle?.name || allFamilyCircles?.[0]?.name || (language === 'es' ? '👨‍👩‍👧 Círculos Familiares' : 'Family Circles')}
              </strong>
              <ChevronDown size={12} color="#16a34a" />
            </button>
          </div>

          {/* Center: Active Patient Pill Selector */}
          <button
            onClick={() => setIsPatientModalOpen(true)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: activePatient ? 'var(--bg-secondary)' : 'var(--primary-light)',
              border: `1.5px solid ${activePatient ? 'var(--border-color)' : 'var(--primary)'}`,
              cursor: 'pointer'
            }}
            title={activePatient ? t('changePatient') : (language === 'es' ? 'Dar de alta o seleccionar persona' : 'Register or select person')}
          >
            {activePatient ? (
              <>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {activePatient.name}
                    </strong>
                    <ChevronDown size={12} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: activePatient.type === 'chronic' ? 'var(--secondary)' : '#d97706' }}>
                    {activePatient.type === 'chronic' ? t('chronicCare') : t('tempCare')}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8125rem' }}>
                <User size={15} />
                <span>{language === 'es' ? '👤 + Dar de Alta / Seleccionar Persona' : '👤 + Register / Select Person'}</span>
              </div>
            )}
          </button>

          {/* Right: Language Switcher & Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {/* Bilingual Language Switcher Toggle */}
            <button
              onClick={toggleLanguage}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.6rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={language === 'es' ? 'Cambiar a English' : 'Switch to Spanish'}
            >
              <Globe size={13} color="var(--primary)" />
              {language === 'es' ? '🇲🇽 ES' : '🇺🇸 EN'}
            </button>

            {/* Desktop / Mobile Alerts */}
            <button
              className={`btn btn-sm ${notificationsGranted ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleToggleNotifications}
              title={notificationsGranted ? t('alertsOn') : t('enableAlerts')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem' }}
            >
              {notificationsGranted ? <BellRing size={15} color="var(--success)" /> : <Bell size={15} />}
              <span className="hide-mobile" style={{ fontSize: '0.75rem' }}>
                {notificationsGranted ? t('alertsOn') : t('enableAlerts')}
              </span>
            </button>

            {/* WhatsApp Agenda Exporter */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsWhatsAppModalOpen(true)}
              title={t('shareWhatsApp')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', padding: '0.3rem 0.6rem' }}
            >
              <Share2 size={15} />
              <span className="hide-mobile" style={{ fontSize: '0.75rem' }}>WhatsApp</span>
            </button>

            {/* Doctor Printable Sheet */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsDoctorSummaryOpen(true)}
              title={t('doctorSheet')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', padding: '0.3rem 0.6rem' }}
            >
              <Printer size={15} />
              <span className="hide-mobile" style={{ fontSize: '0.75rem' }}>{t('doctorSheet')}</span>
            </button>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

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

      <FamilyManagerModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
      />
    </>
  );
};
