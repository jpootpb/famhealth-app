import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Heart,
  LogIn,
  UserPlus,
  ShieldCheck,
  Users,
  Globe,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { allUsers, switchUser, loginUser, registerUser } = useApp();
  const { t, language, setLanguage } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginUser(email, password);
    if (!success) {
      setErrorMsg(
        language === 'es'
          ? 'Correo no encontrado. Puedes registrarte o seleccionar una cuenta de prueba.'
          : 'Email not found. You can register or choose a demo account.'
      );
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim() || !email.trim()) return;
    registerUser(name, email, password);
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
              {language === 'es' ? 'Acceso Seguro y Privado' : 'Secure & Private Access'}
            </h1>
            <p style={{ fontSize: '0.8125rem', opacity: 0.9, margin: 0 }}>
              {language === 'es'
                ? 'Inicia sesión para acceder únicamente a tus espacios familiares.'
                : 'Sign in to access only your authorized family spaces.'}
            </p>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Quick 1-Click Demo Accounts */}
            <div style={{ marginBottom: '1.5rem' }}>
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
                {language === 'es' ? '⚡ Acceso Rápido de Prueba (Demo Cuentas):' : '⚡ 1-Click Demo Accounts:'}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => switchUser(user.id)}
                    className="btn btn-secondary"
                    style={{
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.875rem', display: 'block', color: 'var(--text-primary)' }}>
                        {user.name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {user.email} {user.joinedFamilyIds.length === 2 ? '• 2 Familias' : '• 1 Espacio'}
                      </span>
                    </div>
                    <ArrowRight size={16} color="var(--primary)" />
                  </button>
                ))}
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
              <span>{language === 'es' ? 'O INICIA CON TU CORREO' : 'OR SIGN IN WITH EMAIL'}</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            </div>

            {/* Error message */}
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

            {mode === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">{language === 'es' ? 'Correo Electrónico' : 'Email Address'}</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="carlos@famhealth.app"
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
            ) : (
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
                    placeholder="roberto@gmail.com"
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
          </div>
        </div>
      </div>
    </div>
  );
};
