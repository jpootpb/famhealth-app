import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Heart,
  LogIn,
  UserPlus,
  ShieldCheck,
  Globe,
  ArrowRight,
  KeyRound,
  Lock,
  Mail,
  User,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { allUsers, switchUser, loginUser, registerUser, resetUserPassword, loginWithSocialProvider } = useApp();
  const { t, language, setLanguage } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const success = loginUser(email, password);
    if (!success) {
      setErrorMsg(
        language === 'es'
          ? 'Correo no encontrado en este dispositivo. Puedes crear tu cuenta o usar Recuperar Contraseña.'
          : 'Email not found on this device. You can register or reset your password.'
      );
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!name.trim() || !email.trim()) return;
    registerUser(name, email, password || '123');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !newPassword.trim()) return;

    resetUserPassword(email, newPassword);
    setSuccessMsg(
      language === 'es'
        ? `✅ ¡Contraseña actualizada exitosamente para ${email}! Has iniciado sesión.`
        : `✅ Password updated successfully for ${email}! Signed in.`
    );
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'microsoft') => {
    setErrorMsg('');
    setSuccessMsg('');
    loginWithSocialProvider(provider);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Top Navbar */}
      <nav
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.875rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
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
            <Heart size={20} fill="#ffffff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            FamHealth
          </span>
        </div>

        <button
          onClick={toggleLanguage}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.8125rem', fontWeight: 700 }}
        >
          <Globe size={14} color="var(--primary)" />
          {language === 'es' ? '🇲🇽 Español' : '🇺🇸 English'}
        </button>
      </nav>

      {/* Main Hero & Auth Box */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              padding: '1.5rem',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.25rem' }}>
              {mode === 'forgot_password'
                ? (language === 'es' ? 'Recuperar Contraseña' : 'Reset Password')
                : mode === 'register'
                ? (language === 'es' ? 'Crear Cuenta Nueva' : 'Create Account')
                : (language === 'es' ? 'Acceso Seguro y Privado' : 'Secure & Private Access')}
            </h1>
            <p style={{ fontSize: '0.8125rem', opacity: 0.9, margin: 0 }}>
              {mode === 'forgot_password'
                ? (language === 'es' ? 'Restablece tu clave para entrar desde tu celular o computadora.' : 'Reset your password for mobile or desktop access.')
                : (language === 'es' ? 'Inicia sesión para acceder únicamente a tus espacios familiares.' : 'Sign in to access your family spaces.')}
            </p>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Social Login Buttons (Google, Facebook, Outlook) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 800,
                  display: 'block',
                  marginBottom: '0.625rem'
                }}
              >
                {language === 'es' ? '⚡ Iniciar con Redes y Cuentas:' : '⚡ Sign in with Social & Email:'}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'center',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #ea4335',
                    color: '#c5221f',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>🔴</span>
                  <span>{language === 'es' ? 'Continuar con Google (Gmail)' : 'Continue with Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'center',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#f0f6ff',
                    border: '1.5px solid #1877f2',
                    color: '#1877f2',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>🔵</span>
                  <span>{language === 'es' ? 'Continuar con Facebook' : 'Continue with Facebook'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('microsoft')}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'center',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#f0fdfa',
                    border: '1.5px solid #0284c7',
                    color: '#0369a1',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>✉️</span>
                  <span>{language === 'es' ? 'Continuar con Outlook / jpoot@outlook.com' : 'Continue with Outlook'}</span>
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '1.25rem 0',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
              <span>{language === 'es' ? 'O ACCEDE CON TU CONTRASEÑA' : 'OR WITH PASSWORD'}</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            </div>

            {/* Error & Success messages */}
            {errorMsg && (
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
                {errorMsg}
              </div>
            )}

            {successMsg && (
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
                {successMsg}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">{language === 'es' ? 'Contraseña' : 'Password'}</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}
                >
                  <LogIn size={18} /> {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.8125rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                  {language === 'es' ? '¿No tienes cuenta?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {language === 'es' ? 'Crear Cuenta Nueva' : 'Register Here'}
                  </button>
                </p>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">{language === 'es' ? 'Nombre Completo' : 'Full Name'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="José Manuel Poot"
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}
                >
                  <UserPlus size={18} /> {language === 'es' ? 'Registrar y Comenzar' : 'Register & Get Started'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.8125rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                  {language === 'es' ? '¿Ya tienes cuenta?' : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                  </button>
                </p>
              </form>
            )}

            {mode === 'forgot_password' && (
              <form onSubmit={handleForgotPassword}>
                <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.75rem', color: '#1e40af' }}>
                  💡 {language === 'es' ? 'Escribe tu correo y la nueva contraseña que deseas asignar. Se actualizará e iniciarás sesión de inmediato.' : 'Enter your email and your new password to sign in immediately.'}
                </div>

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

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem', backgroundColor: '#0284c7' }}
                >
                  <KeyRound size={18} /> {language === 'es' ? 'Restablecer Contraseña y Entrar' : 'Reset Password & Sign In'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.8125rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    ← {language === 'es' ? 'Volver al Inicio de Sesión' : 'Back to Sign In'}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
