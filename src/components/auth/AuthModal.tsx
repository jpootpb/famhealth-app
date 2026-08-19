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
  onOpenFamilyManager?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenFamilyManager }) => {
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

            {/* Direct Family Circles Manager Button */}
            {onOpenFamilyManager && (
              <div style={{ marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onOpenFamilyManager();
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#16a34a', borderColor: '#16a34a', padding: '0.625rem 1rem' }}
                >
                  <Users size={16} />
                  <span>{language === 'es' ? '🏡 Crear o Cambiar Círculo Familiar (Mi Hogar, Papás, etc.)' : '🏡 Manage / Create Family Circles'}</span>
                </button>
              </div>
            )}

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
            {/* Social Logins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  loginUser('carlos@famhealth.app');
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  padding: '0.65rem 1rem',
                  border: '1.5px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{language === 'es' ? 'Continuar con Google (Gmail)' : 'Continue with Google'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  loginUser('claudia@famhealth.app');
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  padding: '0.65rem 1rem',
                  border: '1.5px solid #1877F2',
                  backgroundColor: '#1877F2',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                <svg width="18" height="18" fill="#ffffff" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>{language === 'es' ? 'Continuar con Facebook' : 'Continue with Facebook'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {language === 'es' ? 'O con tu correo' : 'Or with email'}
              </span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
            </div>

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
