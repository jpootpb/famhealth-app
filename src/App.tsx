import React from 'react';
import { useApp } from './context/AppContext';

export default function App() {
  const { activePatient } = useApp();
  return (
    <div className="app-container">
      <div className="main-content">
        <h1>SaludFamiliar PWA</h1>
        <p>Paciente Activo: {activePatient?.nombre || 'Ninguno'}</p>
      </div>
    </div>
  );
}
