import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { FamilyMember, CaregiverShift } from '../../types';
import {
  Users,
  Plus,
  X,
  UserCheck,
  Phone,
  Mail,
  Clock,
  Share2,
  Trash2,
  Edit2,
  Copy,
  Check,
  Send,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { shareViaWhatsApp } from '../../lib/whatsapp';
import {
  formatFamilyInviteWhatsAppMessage,
  buildFamilyInviteMailto,
  RELATIONSHIP_OPTIONS
} from '../../utils/inviteOnboardingEngine';

interface CaregiverTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaregiverTeamModal: React.FC<CaregiverTeamModalProps> = ({ isOpen, onClose }) => {
  const {
    families,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    activeFamilyCircle,
    patients,
    currentUser
  } = useApp();
  const { language } = useLanguage();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Hermano / Hermana');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState<CaregiverShift>('morning');
  const [isDefault, setIsDefault] = useState(false);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setName('');
    setRelationship('Hermano / Hermana');
    setPhone('');
    setEmail('');
    setShift('morning');
    setIsDefault(families.length === 0);
    setEditingId(null);
    setIsAdding(true);
  };

  const handleEdit = (member: FamilyMember) => {
    setName(member.name);
    setRelationship(member.relationship || 'Familiar a Cuidar');
    setPhone(member.phone || '');
    setEmail(member.email || '');
    setShift(member.shift || 'morning');
    setIsDefault(Boolean(member.isDefaultCaregiver));
    setEditingId(member.id);
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const existing = families.find(f => f.id === editingId);
      if (existing) {
        updateFamilyMember({
          ...existing,
          name: name.trim(),
          relationship: relationship.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          shift,
          isDefaultCaregiver: isDefault
        });
      }
    } else {
      addFamilyMember({
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        shift,
        isDefaultCaregiver: isDefault,
        splitPercentage: 0,
        isActive: true
      });
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const patientNames = patients.map(p => p.name);

  const handleShareWhatsApp = (targetPhone?: string) => {
    if (!activeFamilyCircle) return;
    const msg = formatFamilyInviteWhatsAppMessage(
      activeFamilyCircle,
      patientNames,
      currentUser.name,
      language
    );
    shareViaWhatsApp(msg, targetPhone);
  };

  const handleShareEmail = () => {
    if (!activeFamilyCircle) return;
    const mailto = buildFamilyInviteMailto(
      activeFamilyCircle,
      patientNames,
      currentUser.name,
      language
    );
    if (typeof window !== 'undefined') {
      window.location.href = mailto;
    }
  };

  const handleCopyCode = async () => {
    if (!activeFamilyCircle) return;
    try {
      await navigator.clipboard.writeText(activeFamilyCircle.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      handleShareWhatsApp();
    }
  };

  const getShiftBadge = (s?: CaregiverShift) => {
    switch (s) {
      case 'morning':
        return { label: language === 'es' ? '🌅 Mañana (6 - 14h)' : '🌅 Morning', color: '#0284c7', bg: '#f0f9ff' };
      case 'evening':
        return { label: language === 'es' ? '🌇 Tarde / Noche (14 - 22h)' : '🌇 Evening', color: '#ea580c', bg: '#fff7ed' };
      case 'night':
        return { label: language === 'es' ? '🌙 Nocturno / Velada (22 - 6h)' : '🌙 Night', color: '#9333ea', bg: '#faf5ff' };
      case 'full_day':
        return { label: language === 'es' ? '⏰ 24 Horas / Completo' : '⏰ 24 Hours', color: '#16a34a', bg: '#f0fdf4' };
      case 'weekend':
        return { label: language === 'es' ? '🗓️ Fines de Semana' : '🗓️ Weekends', color: '#b45309', bg: '#fefce8' };
      default:
        return { label: language === 'es' ? '🌅 Mañana (6 - 14h)' : '🌅 Morning', color: '#0284c7', bg: '#f0f9ff' };
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {language === 'es' ? 'Equipo de Cuidadores y Turnos' : 'Caregiver Team & Shifts'}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Family Invite Banner */}
        {activeFamilyCircle && (
          <div
            className="card"
            style={{
              padding: '1rem',
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#065f46' }}>
                  🔑 {language === 'es' ? `Círculo: ${activeFamilyCircle.name}` : `Circle: ${activeFamilyCircle.name}`}
                </strong>
                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.15rem' }}>
                  {language === 'es' ? 'Código de Invitación: ' : 'Invite Code: '}
                  <code style={{ fontSize: '0.95rem', fontWeight: 900, backgroundColor: '#ffffff', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)' }}>
                    {activeFamilyCircle.inviteCode}
                  </code>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyCode}
                style={{ fontSize: '0.75rem', backgroundColor: '#ffffff', color: '#065f46', borderColor: '#a7f3d0' }}
              >
                {copiedCode ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copiedCode ? (language === 'es' ? 'Copiado' : 'Copied') : (language === 'es' ? 'Copiar Código' : 'Copy Code')}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleShareWhatsApp()}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Share2 size={14} />
                <span>📲 {language === 'es' ? 'Invitar por WhatsApp' : 'Invite via WhatsApp'}</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleShareEmail}
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ffffff' }}
              >
                <Mail size={14} color="#0284c7" />
                <span>✉️ {language === 'es' ? 'Invitar por Correo' : 'Invite via Email'}</span>
              </button>
            </div>
          </div>
        )}

        {!isAdding ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                👥 {language === 'es' ? `Cuidadores Registrados (${families.length})` : `Caregivers (${families.length})`}
              </strong>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                <Plus size={16} /> {language === 'es' ? '+ Agregar Cuidador' : '+ Add Caregiver'}
              </button>
            </div>

            {families.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {language === 'es'
                    ? 'No hay cuidadores registrados todavía. Da de alta a tus hermanos, familiares o enfermeras para asignarles turnos.'
                    : 'No caregivers registered yet. Add family members or nurses to assign shifts.'}
                </p>
                <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                  <Plus size={16} /> {language === 'es' ? 'Dar de Alta Cuidador' : 'Add Caregiver'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {families.map(member => {
                  const shiftBadge = getShiftBadge(member.shift);
                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.875rem 1rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {member.name}
                          </strong>
                          {member.isDefaultCaregiver && (
                            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                              ⭐ {language === 'es' ? 'Principal' : 'Primary'}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: shiftBadge.color,
                              backgroundColor: shiftBadge.bg,
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-full)'
                            }}
                          >
                            {shiftBadge.label}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {member.relationship && <span>👤 {member.relationship}</span>}
                          {member.phone && <span>📞 {member.phone}</span>}
                          {member.email && <span>✉️ {member.email}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {member.phone && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleShareWhatsApp(member.phone)}
                            style={{ fontSize: '0.75rem', color: '#16a34a', borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}
                            title={language === 'es' ? 'Enviar invitación por WhatsApp' : 'Send WhatsApp invite'}
                          >
                            📲 WhatsApp
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(member)}
                          title={language === 'es' ? 'Editar' : 'Edit'}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => deleteFamilyMember(member.id)}
                          style={{ color: 'var(--danger)' }}
                          title={language === 'es' ? 'Eliminar' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                {language === 'es' ? 'Nombre del Cuidador / Familiar:' : 'Caregiver Name:'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'e.g. Lucía Poot, Enfermera Carmen' : 'e.g. Lucy Smith, Nurse Sarah'}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{language === 'es' ? 'Parentesco o Rol:' : 'Role / Relationship:'}</label>
                <select
                  className="form-select"
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                >
                  {RELATIONSHIP_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {language === 'es' ? opt.labelEs : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'es' ? 'Turno Asignado:' : 'Assigned Shift:'}</label>
                <select
                  className="form-select"
                  value={shift}
                  onChange={e => setShift(e.target.value as CaregiverShift)}
                >
                  <option value="morning">🌅 {language === 'es' ? 'Mañana (06:00 - 14:00)' : 'Morning (6am - 2pm)'}</option>
                  <option value="evening">🌇 {language === 'es' ? 'Tarde / Noche (14:00 - 22:00)' : 'Evening (2pm - 10pm)'}</option>
                  <option value="night">🌙 {language === 'es' ? 'Nocturno / Velada (22:00 - 06:00)' : 'Night (10pm - 6am)'}</option>
                  <option value="full_day">⏰ {language === 'es' ? '24 Horas / Turno Completo' : '24 Hours / Full Day'}</option>
                  <option value="weekend">🗓️ {language === 'es' ? 'Fines de Semana' : 'Weekends'}</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">📞 {language === 'es' ? 'Teléfono de WhatsApp:' : 'WhatsApp Phone:'}</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9991234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">✉️ {language === 'es' ? 'Correo Electrónico (Opcional):' : 'Email (Optional):'}</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. lucia@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={e => setIsDefault(e.target.checked)}
              />
              <label htmlFor="isDefault" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                ⭐ {language === 'es' ? 'Asignar como cuidador principal por defecto' : 'Set as primary default caregiver'}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsAdding(false)}
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 800 }}>
                {language === 'es' ? 'Guardar Cuidador' : 'Save Caregiver'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
