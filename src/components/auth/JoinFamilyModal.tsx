import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Users,
  X,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { RELATIONSHIP_OPTIONS } from '../../utils/inviteOnboardingEngine';

interface JoinFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledCode?: string;
}

export const JoinFamilyModal: React.FC<JoinFamilyModalProps> = ({
  isOpen,
  onClose,
  prefilledCode = ''
}) => {
  const {
    allFamilyCircles,
    joinFamilyCircleByCode,
    addFamilyMember,
    currentUser,
    patients
  } = useApp();
  const { language } = useLanguage();

  const [inviteCode, setInviteCode] = useState(prefilledCode);
  const [userName, setUserName] = useState(currentUser.name || '');
  const [relationship, setRelationship] = useState('Hijo / Hija');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (prefilledCode) {
      setInviteCode(prefilledCode);
    }
  }, [prefilledCode]);

  if (!isOpen) return null;

  const matchedFamily = allFamilyCircles.find(
    f => f.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase()
  );

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError(language === 'es' ? 'Ingresa el código de invitación.' : 'Please enter an invite code.');
      return;
    }

    if (!userName.trim()) {
      setError(language === 'es' ? 'Ingresa tu nombre para identificarte en el grupo.' : 'Please enter your name.');
      return;
    }

    const ok = joinFamilyCircleByCode(cleanCode);
    if (!ok) {
      setError(
        language === 'es'
          ? 'Código no encontrado o ya eres miembro de este círculo.'
          : 'Invalid invite code or you are already a member.'
      );
      return;
    }

    // Auto-register caregiver profile in the joined circle
    addFamilyMember({
      name: userName.trim(),
      relationship: relationship.trim(),
      phone: phone.trim() || undefined,
      shift: 'morning',
      isDefaultCaregiver: false,
      splitPercentage: 0,
      isActive: true
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HeartHandshake size={24} color="#16a34a" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {language === 'es' ? 'Unirse a un Círculo de Cuidado' : 'Join Care Circle'}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
              {language === 'es' ? '¡Te has unido con éxito!' : 'Successfully Joined!'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {language === 'es'
                ? `Ahora puedes ver los medicamentos, tomas y citas del grupo como ${relationship}.`
                : `You can now view medications, doses, and appointments as ${relationship}.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {language === 'es'
                ? 'Ingresa el código o invitación para coordinar los cuidados de tu familiar o persona asignada:'
                : 'Enter your family code or invitation to coordinate care:'}
            </p>

            {error && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                🔑 {language === 'es' ? 'Código de Familia:' : 'Family Invite Code:'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. POOT-7482"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                style={{ letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase' }}
                required
              />
              {matchedFamily && (
                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>
                  ✓ {language === 'es' ? `Círculo encontrado: ${matchedFamily.name}` : `Found Circle: ${matchedFamily.name}`}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                👤 {language === 'es' ? 'Tu Nombre Completo:' : 'Your Full Name:'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'e.g. Lucía Poot, Mateo, Carmen' : 'e.g. Lucy Smith'}
                value={userName}
                onChange={e => setUserName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                🤝 {language === 'es' ? '¿Qué eres de la persona o familiar a cuidar?' : 'Relationship to the cared person:'}
              </label>
              <select
                className="form-select"
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                required
              >
                {RELATIONSHIP_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {language === 'es' ? opt.labelEs : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                📞 {language === 'es' ? 'Tu Teléfono de WhatsApp (Opcional):' : 'Your WhatsApp Phone (Optional):'}
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 9991234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 800, backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                {language === 'es' ? 'Unirse al Círculo' : 'Join Care Circle'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
