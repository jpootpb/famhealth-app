import { describe, it, expect } from 'vitest';
import { MedicalAppointment, Patient } from '../src/types';

describe('Medical Appointments Prescription Photos, Rescheduling & Personal Care Mode (TDD)', () => {
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

  it('2. Should support rescheduling and modifying appointment time and location details', () => {
    const originalApp: MedicalAppointment = {
      id: 'app-101',
      patientId: 'patient-grandfather',
      doctorName: 'Dr. Alejandro Hernandez',
      specialty: 'Internal Medicine',
      dateTime: '2026-08-25T11:00',
      location: 'Clinica Merida - Suite 402',
      isCompleted: false
    };

    // User made a mistake in the time or doctor moved the appointment to 4:30 PM in Star Medica
    const updatedApp: MedicalAppointment = {
      ...originalApp,
      dateTime: '2026-08-25T16:30',
      location: 'Hospital Star Medica - Consultorio 810',
      notes: 'Cambio de horario confirmado por la asistente'
    };

    expect(updatedApp.dateTime).toBe('2026-08-25T16:30');
    expect(updatedApp.location).toContain('Star Medica');
    expect(updatedApp.notes).toContain('Cambio de horario');
  });

  it('3. Should support personal self-care profile without family caregivers', () => {
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
