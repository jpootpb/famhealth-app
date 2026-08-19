import { describe, it, expect } from 'vitest';
import { purgeDemoArtifacts, hasUserRealCustomData } from '../src/utils/demoPurgeEngine';
import { Patient, Medication, HealthExpense } from '../src/types';

describe('Demo Purge Engine (Clean Production Mode)', () => {
  const mixedPatients: Patient[] = [
    {
      id: 'patient-grandfather',
      name: 'Don Manuel Poot (Papá)',
      type: 'chronic'
    },
    {
      id: 'patient-maria',
      name: 'Doña María Poot (Mamá)',
      type: 'temporary'
    },
    {
      id: 'patient-real-sara',
      name: 'Sara Burgos Uc (Mamá)',
      type: 'chronic'
    }
  ];

  const mixedMeds: Medication[] = [
    {
      id: 'med-losartan',
      patientId: 'patient-grandfather',
      name: 'Losartán 50mg',
      presentation: 'tablet',
      currentStock: 30,
      minimumStockAlert: 5,
      frequency: { type: 'every_x_hours', intervalHours: 12, times: ['08:00', '20:00'] },
      history: []
    },
    {
      id: 'med-rivaroxaban',
      patientId: 'patient-real-sara',
      name: 'Rivaroxaban 2.5mg',
      presentation: 'tablet',
      currentStock: 56,
      minimumStockAlert: 5,
      frequency: { type: 'every_x_hours', intervalHours: 24, times: ['08:00'] },
      history: []
    }
  ];

  const mixedExpenses: HealthExpense[] = [
    {
      id: 'exp-demo',
      patientId: 'patient-grandfather',
      concept: 'Consulta demo',
      category: 'doctor_appointment',
      amount: 800,
      date: '2026-08-01',
      paidBy: 'Carlos'
    },
    {
      id: 'exp-real',
      patientId: 'patient-real-sara',
      concept: 'Compra Rivaroxaban',
      category: 'medication',
      amount: 1200,
      date: '2026-08-18',
      paidBy: 'Jose'
    }
  ];

  it('1. Detects when user has created real custom patient data', () => {
    expect(hasUserRealCustomData(mixedPatients)).toBe(true);
  });

  it('2. Purges all fake demo patients and retains ONLY real family data (Sara Burgos Uc)', () => {
    const cleaned = purgeDemoArtifacts({
      patients: mixedPatients,
      medications: mixedMeds,
      doseLogs: [],
      vitals: [],
      campaigns: [],
      families: [],
      expenses: mixedExpenses,
      appointments: [],
      studies: [],
      bookingReminders: []
    });

    expect(cleaned.patients.length).toBe(1);
    expect(cleaned.patients[0].name).toBe('Sara Burgos Uc (Mamá)');
    expect(cleaned.medications.length).toBe(1);
    expect(cleaned.medications[0].name).toBe('Rivaroxaban 2.5mg');
    expect(cleaned.expenses.length).toBe(1);
    expect(cleaned.expenses[0].concept).toBe('Compra Rivaroxaban');
  });
});
