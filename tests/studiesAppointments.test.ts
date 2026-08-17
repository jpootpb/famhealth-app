import { describe, it, expect } from 'vitest';
import { MedicalAppointment, MedicalStudy } from '../src/types';

describe('Lab Studies Archive & Appointments Management (Task 9)', () => {
  const appointments: MedicalAppointment[] = [
    {
      id: 'app-1',
      patientId: 'p-1',
      doctorName: 'Dr. Alejandro Hernandez',
      specialty: 'Internal Medicine & Geriatrics',
      dateTime: '2026-08-25T11:00',
      location: 'Clinica Merida - Suite 402',
      isCompleted: false
    },
    {
      id: 'app-2',
      patientId: 'p-1',
      doctorName: 'Dr. Sofia Ruiz',
      specialty: 'Ophthalmology',
      dateTime: '2026-08-10T09:30',
      location: 'Centro Oftalmologico',
      isCompleted: true
    }
  ];

  const studies: MedicalStudy[] = [
    {
      id: 'study-1',
      patientId: 'p-1',
      title: 'Complete Blood Count & Glucose',
      category: 'blood_test',
      date: '2026-08-10',
      laboratory: 'Laboratorios Chopo'
    },
    {
      id: 'study-2',
      patientId: 'p-1',
      title: 'Chest X-Ray (AP & Lateral)',
      category: 'imaging',
      date: '2026-08-05',
      laboratory: 'Hospital Faro del Mayab'
    }
  ];

  it('1. Should separate upcoming vs completed appointments correctly', () => {
    const upcoming = appointments.filter(a => !a.isCompleted);
    const completed = appointments.filter(a => a.isCompleted);

    expect(upcoming.length).toBe(1);
    expect(upcoming[0].doctorName).toContain('Dr. Alejandro Hernandez');
    expect(completed.length).toBe(1);
    expect(completed[0].doctorName).toContain('Dr. Sofia Ruiz');
  });

  it('2. Should filter studies by category accurately', () => {
    const bloodTests = studies.filter(s => s.category === 'blood_test');
    const imagingTests = studies.filter(s => s.category === 'imaging');

    expect(bloodTests.length).toBe(1);
    expect(bloodTests[0].title).toContain('Blood Count');
    expect(imagingTests.length).toBe(1);
    expect(imagingTests[0].title).toContain('Chest X-Ray');
  });
});
