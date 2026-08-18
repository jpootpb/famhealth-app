import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Share2,
  X,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Send,
  UserCheck
} from 'lucide-react';
import {
  buildWhatsAppSummary,
  shareViaWhatsApp,
  getCurrentShiftCaregiver
} from '../../lib/whatsapp';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose }) => {
  const { activePatient, medications, doseLogs, families } = useApp();
  const { t, language } = useLanguage();

  const [selectedPhone, setSelectedPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [onDutyCaregiverName, setOnDutyCaregiverName] = useState('');

  // Auto-detect current shift caregiver on open
  useEffect(() => {
    if (isOpen && families.length > 0) {
      const shiftCaregiver = getCurrentShiftCaregiver(families, new Date());
      if (shiftCaregiver) {
        setSelectedPhone(shiftCaregiver.phone || '');
        setOnDutyCaregiverName(shiftCaregiver.name);
      } else {
        setSelectedPhone(families[0].phone || '');
        setOnDutyCaregiverName(families[0].name);
      }
    }
  }, [isOpen, families]);

  if (!isOpen || !activePatient) return null;

  const patientMeds = medications.filter(m => m.patientId === activePatient.id);
  const messagePreview = buildWhatsAppSummary(activePatient, patientMeds, doseLogs, new Date(), language);

  const handleSend = () => {
    shareViaWhatsApp(messagePreview, selectedPhone || undefined);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messagePreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={22} color="#16a34a" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {t('whatsappModalTitle')}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {t('whatsappModalSubtitle')}
        </p>

        {/* Shift Caregiver Quick Selector */}
        {families.length > 0 && (
          <div className="form-group" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <UserCheck size={16} color="var(--primary)" /> {t('targetCaregiverPhone')}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {families.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedPhone(member.phone || '');
                    setOnDutyCaregiverName(member.name);
                  }}
                  className={`btn btn-sm ${selectedPhone === member.phone ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', borderRadius: 'var(--radius-full)' }}
                >
                  {member.name} {member.shift ? `(${member.shift})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">{t('previewMessage')}</label>
          <pre
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              whiteSpace: 'pre-wrap',
              maxHeight: '260px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {messagePreview}
          </pre>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopy}>
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            {copied ? (language === 'es' ? '¡Copiado!' : 'Copied!') : (language === 'es' ? 'Copiar Mensaje' : 'Copy Message')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1, backgroundColor: '#16a34a', borderColor: '#16a34a' }}
            onClick={handleSend}
          >
            <Send size={16} /> {t('sendToWhatsApp')}
          </button>
        </div>
      </div>
    </div>
  );
};
