import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Share2,
  Copy,
  Check,
  Phone,
  Calendar,
  ExternalLink,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { buildWhatsAppSummary, shareViaWhatsApp, getCurrentShiftCaregiver } from '../../lib/whatsapp';
import { formatDateIso } from '../../utils/frequencyEngine';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose }) => {
  const { activePatient, medications, doseLogs, families } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(formatDateIso(new Date()));
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && families.length > 0) {
      const shiftCaregiver = getCurrentShiftCaregiver(families, new Date());
      if (shiftCaregiver?.phone) {
        setPhoneNumber(shiftCaregiver.phone);
      }
    }
  }, [isOpen, families]);

  if (!isOpen || !activePatient) return null;

  const patientMeds = medications.filter(m => m.patientId === activePatient.id);
  const targetDate = new Date(selectedDate + 'T12:00:00');
  const summaryText = buildWhatsAppSummary(activePatient, patientMeds, doseLogs, targetDate);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleShare = () => {
    shareViaWhatsApp(summaryText, phoneNumber);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a'
              }}
            >
              <Share2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Share via WhatsApp</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Caregiver shift handover & daily medication agenda
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Date Selector & Recipient Phone */}
        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={14} color="var(--primary)" /> Agenda Date
            </label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Phone size={14} color="#16a34a" /> Phone (Optional with Country Code)
            </label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. 5219991234567"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>

        {/* Family Member Quick Select & Shift Indicator */}
        {families.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <UserCheck size={12} color="var(--primary)" /> Quick Select Caregiver / Shift Contact:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {families.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPhoneNumber(member.phone || '')}
                  className={`btn btn-sm ${phoneNumber === member.phone ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  {member.name} {member.shift ? `(${member.shift} shift)` : `(${member.relationship})`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Preview Box */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <MessageSquare size={14} color="var(--primary)" /> Message Preview
          </label>
          <pre
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '260px',
              overflowY: 'auto',
              color: 'var(--text-primary)',
              fontFamily: 'inherit'
            }}
          >
            {summaryText}
          </pre>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Text'}
          </button>

          <button
            type="button"
            className="btn btn-success"
            style={{ flex: 1.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
            onClick={handleShare}
          >
            <ExternalLink size={16} /> Open in WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
