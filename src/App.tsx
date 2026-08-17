import React from 'react';
import { useApp } from './context/AppContext';

export default function App() {
  const { activePatient } = useApp();
  return (
    <div className="app-container">
      <div className="main-content">
        <h1>FamHealth PWA</h1>
        <p>Active Patient: {activePatient ? activePatient.name : 'None'}</p>
      </div>
    </div>
  );
}
