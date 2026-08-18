import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStore } from '../src/lib/storage';

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

describe('App Offline Persistence (LocalStore)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Should initialize with default patients in clean Spanish', () => {
    const patients = LocalStore.getPatients();
    expect(patients.length).toBeGreaterThanOrEqual(2);
    expect(patients[0].name).toContain('Don Manuel Poot');
    expect(patients[1].name).toContain('María');
  });

  it('2. Should save and retrieve medications in Spanish', () => {
    const meds = LocalStore.getMedications();
    expect(meds.some(m => m.name.toLowerCase().includes('metformin'))).toBe(true);
    expect(meds.some(m => m.name.toLowerCase().includes('rivaroxab'))).toBe(true);
  });

  it('3. Should save and retrieve dose logs', () => {
    LocalStore.saveDoseLogs([
      {
        id: 'toma-101',
        medicationId: 'med-metformin',
        patientId: 'patient-grandfather',
        date: '2026-08-17',
        scheduledTime: '08:00',
        actualTakenTime: '08:05',
        dose: 1,
        taken: true
      }
    ]);

    const logs = LocalStore.getDoseLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].taken).toBe(true);
    expect(logs[0].dose).toBe(1);
  });
});
