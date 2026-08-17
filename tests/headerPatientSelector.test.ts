import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStore } from '../src/lib/storage';
import { Patient } from '../src/types';

const mockStorage: Record<string, string> = {};

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => {
      for (const k in mockStorage) delete mockStorage[k];
    }
  },
  configurable: true,
  writable: true
});

describe('Patient Multi-Profile Management (Task 4)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Should switch active patient correctly', () => {
    LocalStore.setActivePatientId('patient-maria');
    expect(LocalStore.getActivePatientId()).toBe('patient-maria');

    LocalStore.setActivePatientId('patient-grandfather');
    expect(LocalStore.getActivePatientId()).toBe('patient-grandfather');
  });

  it('2. Should support adding new temporary care patient profile', () => {
    const initialPatients = LocalStore.getPatients();
    const newPatient: Patient = {
      id: 'patient-test-temp',
      name: 'Carlos (Post-Surgery)',
      type: 'temporary',
      durationDays: 10,
      treatmentStartDate: '2026-08-17',
      primaryDiagnosis: 'Knee Arthroscopy',
      notes: 'Take antibiotic with food'
    };

    LocalStore.savePatients([...initialPatients, newPatient]);
    const stored = LocalStore.getPatients();
    const found = stored.find(p => p.id === 'patient-test-temp');

    expect(found).toBeDefined();
    expect(found?.type).toBe('temporary');
    expect(found?.durationDays).toBe(10);
  });
});
