import { describe, it, expect } from 'vitest';
import { Medication, Patient, DoseLog } from '../src/types';
import { generateUnifiedCaregiverTimeline } from '../src/utils/multiPatientCaregiverEngine';
import { findOverdueUncheckedDoses } from '../src/utils/caregiverOverdueEngine';

describe('Manual Medication Completion & Archive Engine (TDD)', () => {
  const testPatient: Patient = {
    id: 'patient-test-1',
    name: 'Don Manuel Poot',
    type: 'chronic'
  };

  const activeMed: Medication = {
    id: 'med-active-1',
    patientId: 'patient-test-1',
    name: 'Losartán 50mg',
    presentation: 'tablet',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [{ time: '08:00', dose: 1 }],
      startDate: '2026-08-01'
    },
    currentStock: 15,
    minimumStockAlert: 5,
    status: 'active'
  };

  const completedMed: Medication = {
    id: 'med-completed-1',
    patientId: 'patient-test-1',
    name: 'Amoxicilina Jarabe / Suspensión',
    presentation: 'ml',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [{ time: '14:00', dose: 5 }],
      startDate: '2026-08-01'
    },
    currentStock: 0,
    minimumStockAlert: 5,
    status: 'completed',
    completedAt: '2026-08-18',
    completionReason: 'bottle_finished',
    completionNotes: 'Se terminó el frasco de jarabe'
  };

  it('1. Should exclude completed medications from unified daily caregiver timeline', () => {
    const today = new Date(2026, 7, 18);
    const slots = generateUnifiedCaregiverTimeline({
      patients: [testPatient],
      medications: [activeMed, completedMed],
      doseLogs: [],
      date: today
    });

    expect(slots.length).toBe(1);
    expect(slots[0].medicationId).toBe('med-active-1');
    expect(slots[0].medicationName).toBe('Losartán 50mg');
  });

  it('2. Should exclude completed medications from overdue dose verification alerts', () => {
    const afternoonTime = new Date(2026, 7, 18, 16, 0); // 4:00 PM (past 14:00 Amoxicilina)
    const overdue = findOverdueUncheckedDoses({
      patients: [testPatient],
      medications: [activeMed, completedMed],
      doseLogs: [],
      currentDateTime: afternoonTime
    });

    // Only activeMed (08:00) is overdue, completedMed (14:00) is ignored because it is completed
    expect(overdue.length).toBe(1);
    expect(overdue[0].medicationId).toBe('med-active-1');
  });

  it('3. Should include reactivated medications back in the daily timeline', () => {
    const reactivatedMed: Medication = {
      ...completedMed,
      status: 'active',
      currentStock: 60,
      completedAt: undefined,
      completionReason: undefined
    };

    const today = new Date(2026, 7, 18);
    const slots = generateUnifiedCaregiverTimeline({
      patients: [testPatient],
      medications: [activeMed, reactivatedMed],
      doseLogs: [],
      date: today
    });

    expect(slots.length).toBe(2);
  });
});
