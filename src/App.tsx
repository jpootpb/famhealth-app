import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { useApp } from './context/AppContext';

export default function App() {
  const { activePatient } = useApp();
  const [activeTab, setActiveTab] = useState<'timeline' | 'medications' | 'vitals' | 'studies' | 'expenses' | 'appointments'>('timeline');

  return (
    <div className="app-container">
      <Header onPrintReport={() => window.print()} />

      <main className="main-content">
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {activePatient ? `${activePatient.name}'s Dashboard` : 'Family Dashboard'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {activePatient?.primaryDiagnosis || 'Select a patient profile to start monitoring.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
