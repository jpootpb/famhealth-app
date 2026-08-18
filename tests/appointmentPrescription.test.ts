import { describe, it, expect } from 'vitest';
import { MedicalAppointment, Patient } from '../src/types';

describe('Medical Appointments Prescription Photos & Personal Care Mode (TDD)', () => {
  it('1. Should support prescription photo / document attached to an appointment', () => {
    const app: MedicalAppointment = {
      id: 'app-nephrology',
      patientId: 'patient-mom',
      doctorName: 'Dr. Roberto Mendoza',
      specialty: 'Nephrology & Urology',
      dateTime: '2026-08-17T16:00',
      location: 'Hospital Faro del Mayab',
      notes: 'Prescribed Ciprofloxacin 500mg for 7 days for urinary infection',
      prescriptionUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      prescriptionFileType: 'image',
      isCompleted: true
    };

    expect(app.prescriptionUrl).toBeDefined();
    expect(app.prescriptionFileType).toBe('image');
    expect(app.notes).toContain('Ciprofloxacin');
  });

  it('2. Should support personal self-care profile without family caregivers', () => {
    const personalPatient: Patient = {
      id: 'patient-cousin',
      familyId: 'circle-personal-laura',
      name: 'Laura Poot (Personal Care)',
      type: 'temporary',
      primaryDiagnosis: 'Hypercholesterolemia / Cholesterol Control',
      treatmentStartDate: '2026-08-17',
      durationDays: 60,
      notes: 'Atorvastatin 20mg daily for 2 months. Self-care.'
    };

    expect(personalPatient.type).toBe('temporary');
    expect(personalPatient.durationDays).toBe(60);
    expect(personalPatient.primaryDiagnosis).toContain('Cholesterol');
  });
});
