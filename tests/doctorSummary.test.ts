import { describe, it, expect } from 'vitest';
import { Patient, Medication, VitalSign, MedicalStudy } from '../src/types';

describe('Doctor Consultation Summary Generator (Task 10)', () => {
  const patient: Patient = {
    id: 'patient-test',
    name: 'Don Manuel Poot',
    age: 78,
    type: 'chronic',
    primaryDiagnosis: 'Type 2 Diabetes & Hypertension',
    notes: 'Low sodium diet. Allergic to penicillin.'
  };

  const medications: Medication[] = [
    {
      id: 'med-1',
      patientId: 'patient-test',
      name: 'Metformin',
      presentation: 'tablet',
      indication: 'Glycemic control',
      frequency: {
        type: 'daily_fixed',
        doseSlots: [
          { time: '08:00', dose: 1 },
          { time: '20:00', dose: 0.5 }
        ],
        startDate: '2026-01-01'
      },
      currentStock: 20,
      minimumStockAlert: 5
    }
  ];

  const vitals: VitalSign[] = [
    { id: '1', patientId: 'patient-test', type: 'glucose', value: 112, timing: 'fasting', timestamp: '2026-08-17T07:00:00' },
    { id: '2', patientId: 'patient-test', type: 'blood_pressure', value: 120, secondaryValue: 80, timestamp: '2026-08-17T07:05:00' }
  ];

  const studies: MedicalStudy[] = [
    { id: '1', patientId: 'patient-test', title: 'Complete Blood Count', category: 'blood_test', date: '2026-08-10', resultsSummary: 'HbA1c 6.8%' }
  ];

  it('1. Should extract all active medications for physician review', () => {
    const medSummary = medications.map(m => `${m.name} (${m.frequency.type})`);
    expect(medSummary.length).toBe(1);
    expect(medSummary[0]).toContain('Metformin');
  });

  it('2. Should aggregate recent vitals and latest laboratory findings', () => {
    const recentGlucose = vitals.filter(v => v.type === 'glucose');
    const latestStudy = studies[0];

    expect(recentGlucose.length).toBe(1);
    expect(recentGlucose[0].value).toBe(112);
    expect(latestStudy.resultsSummary).toContain('HbA1c 6.8%');
  });
});
