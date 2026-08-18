import { describe, it, expect } from 'vitest';
import { MedicalAppointment, MedicalStudy } from '../src/types';

describe('Lab Studies Archive & Appointments Management with Nutrition Plans (TDD)', () => {
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
    },
    {
      id: 'app-3',
      patientId: 'p-1',
      doctorName: 'Lic. Mariana Gomez',
      specialty: 'Nutrición Clínica y Dietética',
      dateTime: '2026-08-18T17:00',
      location: 'Consultorio Nutricional - Torre Médica 2',
      notes: 'Entrega de Plan de Alimentación Fase 2 (Control Glucémico y Peso)',
      prescriptionUrl: 'data:application/pdf;base64,...',
      prescriptionFileType: 'pdf',
      isCompleted: false
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
    },
    {
      id: 'study-nutrition',
      patientId: 'p-1',
      title: 'Plan de Alimentación Personalizado - Fase 2 (JOSE MANUEL POOT PLAN 2.pdf)',
      category: 'nutrition_plan',
      date: '2026-08-17',
      laboratory: 'Consulta de Nutrición Clínica',
      resultsSummary: 'Dieta de 1,600 kcal con control de índice glucémico, 5 tiempos de comida y lista de compras.',
      fileUrl: 'data:application/pdf;base64,...',
      fileType: 'pdf'
    }
  ];

  it('1. Should separate upcoming vs completed appointments correctly', () => {
    const upcoming = appointments.filter(a => !a.isCompleted);
    const completed = appointments.filter(a => a.isCompleted);

    expect(upcoming.length).toBe(2);
    expect(upcoming[0].doctorName).toContain('Dr. Alejandro Hernandez');
    expect(upcoming[1].doctorName).toContain('Lic. Mariana Gomez');
    expect(completed.length).toBe(1);
  });

  it('2. Should filter studies by category accurately including nutrition plans', () => {
    const bloodTests = studies.filter(s => s.category === 'blood_test');
    const imagingTests = studies.filter(s => s.category === 'imaging');
    const nutritionPlans = studies.filter(s => s.category === 'nutrition_plan');

    expect(bloodTests.length).toBe(1);
    expect(imagingTests.length).toBe(1);
    expect(nutritionPlans.length).toBe(1);
    expect(nutritionPlans[0].title).toContain('PLAN 2');
    expect(nutritionPlans[0].fileType).toBe('pdf');
  });
});
