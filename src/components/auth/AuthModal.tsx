import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  X,
  ShieldCheck,
  Users,
  CheckCircle,
  KeyRound,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, switchUser, loginUser, registerUser, logoutUser } = useApp();
  const { t, language } = useLanguage();

  const [authMode, setAuthMode] = useState<'profile' | 'login' | 'register'>('profile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const success = loginUser(email, password);
    if (success) {
      setEmail('');
      setPassword('');
      onClose();
    } else {
      setErrorMessage(
        language === 'es'
          ? 'Correo no encontrado. Puedes registrarte o seleccionar una cuenta de prueba.'
          : 'Email not found. You can register or choose a demo account.'
      );
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name.trim() || !email.trim()) return;

    registerUser(name, email, password);
    setName('');
    setEmail('');
    setPassword('');
    onClose();
  };

  const handleQuickSwitch = (userId: string) => {
    switchUser(userId);
    onClose();
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
            <ShieldCheck size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {authMode === 'profile'
                ? (language === 'es' ? 'Cuenta de Usuario y Privacidad' : 'User Account & Privacy')
                : authMode === 'login'
                ? (language === 'es' ? 'Iniciar Sesión' : 'Sign In')
                : (language === 'es' ? 'Crear Cuenta Nueva' : 'Create New Account')}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {authMode === 'profile' && (
          <div>
            {/* Active User Card */}
            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.1rem'
                  }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'block' }}>
                    {currentUser.name}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {currentUser.email} • {currentUser.joinedFamilyIds.length} {language === 'es' ? 'espacios vinculados' : 'linked spaces'}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  logoutUser();
                  setAuthMode('login');
                }}
                style={{ color: 'var(--danger)', fontSize: '0.75rem' }}
                title="Sign out"
              >
                <LogOut size={14} /> {language === 'es' ? 'Salir' : 'Logout'}
              </button>
            </div>

            {/* Quick Demo Accounts Switcher */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                {language === 'es' ? '👥 Cambiar de Cuenta Rápida (Demostración de Aislamiento):' : '👥 Quick Account Switcher (Multi-Tenant Demo):'}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allUsers.map(user => {
                  const isCurrent = currentUser.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleQuickSwitch(user.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        backgroundColor: isCurrent ? '#f0fdf4' : 'var(--bg-secondary)',
                        border: `1px solid ${isCurrent ? '#16a34a' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.875rem' }}>{user.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {user.email} {user.joinedFamilyIds.length === 2 ? (language === 'es' ? '(Cuidador de 2 Familias)' : '(Dual Caregiver)') : ''}
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                          ✓ {language === 'es' ? 'Activo' : 'Active'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setAuthMode('login')}
              >
                <LogIn size={16} /> {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setAuthMode('register')}
              >
                <UserPlus size={16} /> {language === 'es' ? 'Crear Cuenta' : 'Register'}
              </button>
            </div>
          </div>
        )}

        {authMode === 'login' && (
          <form onSubmit={handleLogin}>
            {errorMessage && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem'
                }}
              >
                {errorMessage}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{language === 'es' ? 'Correo Electrónico' : 'Email Address'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. carlos@famhealth.app"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'es' ? 'Contraseña' : 'Password'}</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setAuthMode('profile')}
              >
                {t('cancel')}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <LogIn size={16} /> {language === 'es' ? 'Entrar' : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        {authMode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">{language === 'es' ? 'Nombre Completo' : 'Full Name'}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Roberto Gómez"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'es' ? 'Correo Electrónico' : 'Email Address'}</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. roberto@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'es' ? 'Contraseña' : 'Password'}</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setAuthMode('profile')}
              >
                {t('cancel')}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <UserPlus size={16} /> {language === 'es' ? 'Crear Cuenta Limpia' : 'Register Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
