import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { DailyTimeline } from './components/timeline/DailyTimeline';
import { MedicationList } from './components/medications/MedicationList';
import { VitalsView } from './components/vitals/VitalsView';
import { StudiesView } from './components/studies/StudiesView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { useApp } from './context/AppContext';
import {
  Calendar,
  Pill,
  Activity,
  FileText,
  DollarSign,
  CalendarDays
} from 'lucide-react';

export default function App() {
  const { activePatient } = useApp();
  const [activeTab, setActiveTab] = useState<'timeline' | 'medications' | 'vitals' | 'studies' | 'expenses' | 'appointments'>('timeline');

  return (
    <div className="app-container">
      <Header onPrintReport={() => window.print()} />

      <main className="main-content">
        {/* Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <button
            onClick={() => setActiveTab('timeline')}
            className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', borderRadius: 'var(--radius-full)' }}
          >
            <Calendar size={16} /> Daily Timeline
          </button>

          <button
            onClick={() => setActiveTab('medications')}
            className={`btn btn-sm ${activeTab === 'medications' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', borderRadius: 'var(--radius-full)' }}
          >
            <Pill size={16} /> Medications & Stock
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            className={`btn btn-sm ${activeTab === 'vitals' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', borderRadius: 'var(--radius-full)' }}
          >
            <Activity size={16} /> Vitals & Campaigns
          </button>

          <button
            onClick={() => setActiveTab('studies')}
            className={`btn btn-sm ${activeTab === 'studies' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', borderRadius: 'var(--radius-full)' }}
          >
            <FileText size={16} /> Lab Studies & Archive
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`btn btn-sm ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', borderRadius: 'var(--radius-full)' }}
          >
            <CalendarDays size={16} /> Appointments
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`btn btn-sm ${activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', borderRadius: 'var(--radius-full)' }}
          >
            <DollarSign size={16} /> Expenses & Split
          </button>
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
          <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
            <DollarSign size={36} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Health Expense Splitter</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Family cost sharing calculator will load here in Task 11.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
