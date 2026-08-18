import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { DailyTimeline } from './components/timeline/DailyTimeline';
import { MedicationList } from './components/medications/MedicationList';
import { VitalsView } from './components/vitals/VitalsView';
import { StudiesView } from './components/studies/StudiesView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { AuthScreen } from './components/auth/AuthScreen';
import { useApp } from './context/AppContext';
import { useLanguage } from './i18n/LanguageContext';
import {
  Calendar,
  Pill,
  Activity,
  FileText,
  DollarSign,
  CalendarDays
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, activePatient } = useApp();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'timeline' | 'medications' | 'vitals' | 'studies' | 'expenses' | 'appointments'>('timeline');

  // If user is not logged in, enforce Auth Gate
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const navTabs = [
    { id: 'timeline', label: t('tabTimeline'), icon: Calendar },
    { id: 'medications', label: t('tabMedications'), icon: Pill },
    { id: 'vitals', label: t('tabVitals'), icon: Activity },
    { id: 'studies', label: t('tabStudies'), icon: FileText },
    { id: 'appointments', label: t('tabAppointments'), icon: CalendarDays },
    { id: 'expenses', label: t('tabExpenses'), icon: DollarSign }
  ] as const;

  return (
    <div className="app-container">
      <Header onPrintReport={() => window.print()} />

      <main className="main-content">
        {/* Desktop Navigation Tabs */}
        <nav
          className="desktop-tabs-nav"
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: isActive ? 800 : 600
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab Views */}
        {activeTab === 'timeline' && (
          <DailyTimeline onOpenAddMedication={() => setActiveTab('medications')} />
        )}

        {activeTab === 'medications' && (
          <MedicationList />
        )}

        {activeTab === 'vitals' && (
          <VitalsView />
        )}

        {activeTab === 'studies' && (
          <StudiesView />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsView />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar for Ergonomic One-Handed Use */}
      <nav className="bottom-nav-mobile" aria-label="Navegación móvil">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab-item ${isActive ? 'active' : ''}`}
              aria-label={tab.label}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
