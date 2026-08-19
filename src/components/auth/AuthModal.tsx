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
  ArrowRight,
  Trash2,
  HelpCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFamilyManager?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenFamilyManager }) => {
  const { currentUser, allUsers, switchUser, loginUser, registerUser, resetUserPassword, loginWithSocialProvider, logoutUser, purgeAllDemoData } = useApp();
  const { t, language } = useLanguage();

  const [authMode, setAuthMode] = useState<'profile' | 'login' | 'register' | 'forgot_password'>('profile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const success = loginUser(email, password);
    if (success) {
      setEmail('');
      setPassword('');
      onClose();
    } else {
      setErrorMessage(
        language === 'es'
          ? 'Correo no encontrado en este dispositivo. Puedes crear tu cuenta o usar Recuperar Contraseña.'
          : 'Email not found on this device. You can register or reset your password.'
      );
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!name.trim() || !email.trim()) return;

    registerUser(name, email, password || '123');
    setName('');
    setEmail('');
    setPassword('');
    onClose();
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!email.trim() || !newPassword.trim()) return;

    resetUserPassword(email, newPassword);
    setSuccessMessage(
      language === 'es'
        ? `✅ ¡Contraseña actualizada exitosamente para ${email}! Has iniciado sesión.`
        : `✅ Password updated successfully for ${email}! Signed in.`
    );
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'microsoft') => {
    setErrorMessage('');
    setSuccessMessage('');
    loginWithSocialProvider(provider);
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
                : authMode === 'register'
                ? (language === 'es' ? 'Crear Cuenta Nueva' : 'Create New Account')
                : (language === 'es' ? 'Recuperar Contraseña' : 'Reset Password')}
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
                    fontWeight: 800,
                    fontSize: '1.1rem'
                  }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.email}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                    🔑 {language === 'es' ? `Clave: ${currentUser.password || '123'}` : `Password: ${currentUser.password || '123'}`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={logoutUser}
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', fontSize: '0.75rem' }}
                title={language === 'es' ? 'Cerrar sesión' : 'Sign out'}
              >
                <LogOut size={14} />
                <span>{language === 'es' ? 'Salir' : 'Sign Out'}</span>
              </button>
            </div>

            {/* Quick Switch Profiles */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 800,
                  display: 'block',
                  marginBottom: '0.5rem'
                }}
              >
                {language === 'es' ? '👥 Cambiar de Cuenta de Usuario:' : '👥 Switch User Profile:'}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {allUsers.map(user => {
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickSwitch(user.id)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: isCurrent ? '#f0f9ff' : undefined,
                        borderColor: isCurrent ? 'var(--primary)' : undefined,
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} color={isCurrent ? 'var(--primary)' : 'var(--text-secondary)'} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: isCurrent ? 800 : 500, color: isCurrent ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {user.name} ({user.email})
                        </span>
                      </div>
                      {isCurrent && <CheckCircle size={14} color="var(--primary)" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setAuthMode('login')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <LogIn size={16} /> {language === 'es' ? 'Iniciar con Otra Cuenta' : 'Sign In Another Account'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setAuthMode('register')}
                style={{ flex: 1, justifyContent: 'center' }}
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
                onClick={() => handleSocialLogin('google')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  padding: '0.65rem 1rem',
                  border: '1.5px solid #ea4335',
                  backgroundColor: '#ffffff',
                  color: '#c5221f',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🔴</span>
                <span>{language === 'es' ? 'Continuar con Google (Gmail)' : 'Continue with Google'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSocialLogin('facebook')}
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
                <span style={{ fontSize: '1.1rem' }}>🔵</span>
                <span>{language === 'es' ? 'Continuar con Facebook' : 'Continue with Facebook'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSocialLogin('microsoft')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  padding: '0.65rem 1rem',
                  border: '1.5px solid #0284c7',
                  backgroundColor: '#f0fdfa',
                  color: '#0369a1',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>✉️</span>
                <span>{language === 'es' ? 'Continuar con Outlook / jpoot@outlook.com' : 'Continue with Outlook'}</span>
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
                  placeholder="jpoot@outlook.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">{language === 'es' ? 'Contraseña' : 'Password'}</label>
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot_password')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
                </button>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="123"
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
                placeholder="e.g. José Manuel Poot"
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
                placeholder="jpoot@outlook.com"
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
                placeholder="123"
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
                <UserPlus size={16} /> {language === 'es' ? 'Crear Cuenta' : 'Register Account'}
              </button>
            </div>
          </form>
        )}

        {authMode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword}>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.75rem', color: '#1e40af' }}>
              💡 {language === 'es' ? 'Escribe tu correo y la nueva contraseña que deseas asignar. Se actualizará e iniciarás sesión de inmediato.' : 'Enter your email and your new password to sign in immediately.'}
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

            {successMessage && (
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem'
                }}
              >
                {successMessage}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{language === 'es' ? 'Correo de tu Cuenta' : 'Account Email'}</label>
              <input
                type="email"
                className="form-input"
                placeholder="jpoot@outlook.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'es' ? 'Nueva Contraseña' : 'New Password'}</label>
              <input
                type="password"
                className="form-input"
                placeholder="123"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setAuthMode('login')}
              >
                {t('cancel')}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#0284c7' }}>
                <KeyRound size={16} /> {language === 'es' ? 'Restablecer y Entrar' : 'Reset & Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
