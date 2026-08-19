import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Users,
  Plus,
  KeyRound,
  Copy,
  Check,
  CheckCircle2,
  X,
  Share2,
  Building2,
  HeartHandshake,
  User
} from 'lucide-react';
import { shareViaWhatsApp } from '../../lib/whatsapp';

interface FamilyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyManagerModal: React.FC<FamilyManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    familyCircles,
    activeFamilyCircle,
    setActiveFamilyId,
    createFamilyCircle,
    joinFamilyCircleByCode,
    allPatients,
    addPatient,
    exportFamilyBackup,
    importFamilyBackup
  } = useApp();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'switch' | 'create' | 'join' | 'sync'>('switch');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [personalName, setPersonalName] = useState('');
  const [isPersonalMode, setIsPersonalMode] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSyncPayload, setCopiedSyncPayload] = useState(false);
  const [syncInput, setSyncInput] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyInvite = async () => {
    if (!activeFamilyCircle) return;
    const msg = `🏡 *FamHealth Invite:* Join our family care circle for *${activeFamilyCircle.name}*!\n🔑 Use Invite Code: *${activeFamilyCircle.inviteCode}*\n📲 Open: ${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      shareViaWhatsApp(msg);
    }
  };

  const handleShareWhatsAppInvite = () => {
    if (!activeFamilyCircle) return;
    const msg = `🏡 *FamHealth Invite:* Join our family care circle for *${activeFamilyCircle.name}*!\n🔑 Use Invite Code: *${activeFamilyCircle.inviteCode}*\n📲 Open: ${window.location.origin}`;
    shareViaWhatsApp(msg);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isPersonalMode
      ? (personalName.trim() ? `Mi Cuidado Personal (${personalName.trim()})` : 'Mi Cuidado Personal')
      : newFamilyName.trim();

    if (!finalName) return;

    const newCircle = createFamilyCircle(finalName);

    if (isPersonalMode) {
      // Auto-create personal patient
      addPatient({
        name: personalName.trim() || 'Mi Perfil',
        type: 'temporary',
        notes: 'Uso personal individual. Registro de tratamientos y signos vitales.'
      });
    }

    setNewFamilyName('');
    setPersonalName('');
    setIsPersonalMode(false);
    setActiveTab('switch');
    onClose();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess(false);

    const success = joinFamilyCircleByCode(inviteCodeInput);
    if (success) {
      setJoinSuccess(true);
      setInviteCodeInput('');
      setTimeout(() => {
        setActiveTab('switch');
        onClose();
      }, 1000);
    } else {
      setJoinError(
        language === 'es'
          ? 'Código familiar no encontrado. Verifica el código e intenta de nuevo.'
          : 'Family invite code not found. Please verify the code.'
      );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {language === 'es' ? 'Espacios Familiares y Personales' : 'Family Circles & Personal Spaces'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {language === 'es'
                  ? 'Gestiona el cuidado de tus padres, suegros o tu propio tratamiento personal de forma aislada.'
                  : 'Manage care for your parents, in-laws, or your own personal treatment separately.'}
              </p>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Current Active Family Banner & Invite Code */}
        {activeFamilyCircle && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {language === 'es' ? 'Espacio Activo:' : 'Active Space:'}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-hover)', margin: '0.1rem 0' }}>
                  {activeFamilyCircle.name}
                </h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {language === 'es' ? 'Código de Acceso:' : 'Access Code:'}
                </span>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px dashed var(--primary)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--primary)'
                  }}
                >
                  {activeFamilyCircle.inviteCode}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyInvite}
                style={{ flex: 1, fontSize: '0.75rem' }}
              >
                {copiedCode ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copiedCode ? (language === 'es' ? '¡Copiado!' : 'Copied!') : (language === 'es' ? 'Copiar Invitación' : 'Copy Invite')}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleShareWhatsAppInvite}
                style={{ color: '#16a34a', fontSize: '0.75rem' }}
              >
                <Share2 size={14} /> WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('switch')}
            className={`btn btn-sm ${activeTab === 'switch' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '100px', borderRadius: 'var(--radius-full)' }}
          >
            {language === 'es' ? 'Mis Espacios' : 'My Spaces'}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`btn btn-sm ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '100px', borderRadius: 'var(--radius-full)' }}
          >
            <Plus size={14} /> {language === 'es' ? 'Crear' : 'Create'}
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`btn btn-sm ${activeTab === 'join' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '100px', borderRadius: 'var(--radius-full)' }}
          >
            <KeyRound size={14} /> {language === 'es' ? 'Código' : 'Code'}
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`btn btn-sm ${activeTab === 'sync' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '110px', borderRadius: 'var(--radius-full)' }}
          >
            🔄 {language === 'es' ? 'Sincronizar' : 'Sync'}
          </button>
        </div>

        {/* Tab 1: Switch between Family Circles */}
        {activeTab === 'switch' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {familyCircles.map(circle => {
              const isCurrent = activeFamilyCircle?.id === circle.id;
              const circlePatientsCount = allPatients.filter(p => p.familyId === circle.id).length;

              return (
                <div
                  key={circle.id}
                  style={{
                    backgroundColor: isCurrent ? '#f0f9ff' : 'var(--bg-secondary)',
                    border: isCurrent ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => {
                    setActiveFamilyId(circle.id);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isCurrent ? 'var(--primary)' : 'var(--border-color)',
                        color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {circle.isPersonalSpace ? <User size={18} /> : <Building2 size={18} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isCurrent ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {circle.name}
                        </span>
                        {isCurrent && (
                          <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                            {language === 'es' ? 'Activo' : 'Active'}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {circlePatientsCount === 1
                          ? (language === 'es' ? '1 Paciente registrado' : '1 Patient registered')
                          : (language === 'es' ? `${circlePatientsCount} Pacientes registrados` : `${circlePatientsCount} Patients registered`)}
                        {' • '}
                        <code style={{ fontFamily: 'var(--font-mono)' }}>{circle.inviteCode}</code>
                      </span>
                    </div>
                  </div>

                  {isCurrent ? (
                    <CheckCircle2 size={20} color="var(--primary)" />
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={e => {
                        e.stopPropagation();
                        setActiveFamilyId(circle.id);
                        onClose();
                      }}
                    >
                      {language === 'es' ? 'Cambiar' : 'Switch'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Create New Family Circle */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${!isPersonalMode ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setIsPersonalMode(false)}
              >
                <Users size={14} /> {language === 'es' ? 'Familia / Grupo' : 'Family / Group'}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${isPersonalMode ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setIsPersonalMode(true)}
              >
                <User size={14} /> {language === 'es' ? 'Uso Personal' : 'Personal Use'}
              </button>
            </div>

            {isPersonalMode ? (
              <div className="form-group">
                <label className="form-label">
                  {language === 'es' ? 'Tu Nombre o Identificador *' : 'Your Name *'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'es' ? 'e.g. José Manuel Poot, Carlos' : 'e.g. John Doe'}
                  value={personalName}
                  onChange={e => setPersonalName(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  {language === 'es'
                    ? 'Se creará tu espacio individual privado para registrar tus medicamentos y signos vitales personales.'
                    : 'A private space will be created to track your personal medicines and vitals.'}
                </span>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">
                  {language === 'es' ? 'Nombre de la Familia o Espacio *' : 'Family Space Name *'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'es' ? 'e.g. Familia Gómez (Suegros), Familia Pérez' : 'e.g. In-Laws Care Circle, Smith Family'}
                  value={newFamilyName}
                  onChange={e => setNewFamilyName(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  {language === 'es'
                    ? 'Se creará un espacio totalmente aislado con su propio código de invitación para compartir con tus hermanos o cuidadores.'
                    : 'A completely isolated space will be created with its own unique invite code.'}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveTab('switch')}>
                {language === 'es' ? 'Atrás' : 'Back'}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {language === 'es' ? 'Crear y Entrar' : 'Create & Enter'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Join with Invite Code */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label">
                {language === 'es' ? 'Ingresa el Código de Invitación (6-8 caracteres) *' : 'Enter Family Invite Code (6-8 characters) *'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. POOT-7821, IBARRA-2026"
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value)}
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                required
              />
            </div>

            {joinError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                ⚠️ {joinError}
              </p>
            )}

            {joinSuccess && (
              <p style={{ color: 'var(--success)', fontSize: '0.8125rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                ✓ {language === 'es' ? '¡Te has unido exitosamente al espacio familiar!' : 'Successfully joined family space!'}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveTab('switch')}>
                {language === 'es' ? 'Atrás' : 'Back'}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {language === 'es' ? 'Unirme al Círculo' : 'Join Circle'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Sync & Backup across devices */}
        {activeTab === 'sync' && (
          <div>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.875rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.8125rem', color: '#1e40af' }}>
              📲 <strong>{language === 'es' ? 'Sincronización Directa entre Dispositivos:' : 'Direct Multi-Device Sync:'}</strong>
              <p style={{ margin: '0.25rem 0 0', opacity: 0.9 }}>
                {language === 'es'
                  ? 'Copia los datos de tu familia desde tu computadora o celular para pegarlos y sincronizarlos de inmediato en cualquier otro teléfono.'
                  : 'Copy your family data from this device and paste it on another phone to sync immediately.'}
              </p>
            </div>

            {/* Export Section */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem', backgroundColor: '#ffffff' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📤 1. Exportar Datos de {activeFamilyCircle?.name}</span>
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    const payload = exportFamilyBackup();
                    try {
                      await navigator.clipboard.writeText(payload);
                      setCopiedSyncPayload(true);
                      setTimeout(() => setCopiedSyncPayload(false), 2500);
                    } catch {
                      setSyncStatusMsg({ type: 'success', msg: 'Respaldo listo. Cópialo manualmente.' });
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  {copiedSyncPayload ? <Check size={14} color="#ffffff" /> : <Copy size={14} />}
                  {copiedSyncPayload ? (language === 'es' ? '¡Datos Copiados al Portapapeles!' : 'Copied!') : (language === 'es' ? 'Copiar Datos de Respaldo' : 'Copy Backup Data')}
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#ffffff' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📥 2. Pegar Datos desde Otro Dispositivo</span>
              </h4>
              <textarea
                className="form-input"
                rows={3}
                placeholder={language === 'es' ? 'Pega aquí el código de respaldo copiado de tu otro celular o computadora...' : 'Paste backup code here...'}
                value={syncInput}
                onChange={e => setSyncInput(e.target.value)}
                style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '0.75rem' }}
              />

              {syncStatusMsg && (
                <div
                  style={{
                    backgroundColor: syncStatusMsg.type === 'success' ? '#ecfdf5' : '#fee2e2',
                    border: `1px solid ${syncStatusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                    color: syncStatusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  {syncStatusMsg.msg}
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={!syncInput.trim()}
                onClick={() => {
                  setSyncStatusMsg(null);
                  const res = importFamilyBackup(syncInput);
                  if (res.success) {
                    setSyncStatusMsg({
                      type: 'success',
                      msg: language === 'es' ? '✅ ¡Datos sincronizados y actualizados exitosamente en este celular!' : '✅ Synced successfully!'
                    });
                    setSyncInput('');
                    setTimeout(() => {
                      onClose();
                    }, 1200);
                  } else {
                    setSyncStatusMsg({
                      type: 'error',
                      msg: res.error || (language === 'es' ? 'Error al procesar los datos de sincronización.' : 'Error importing data.')
                    });
                  }
                }}
              >
                🔄 {language === 'es' ? 'Sincronizar y Actualizar este Celular' : 'Sync & Update this Phone'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
