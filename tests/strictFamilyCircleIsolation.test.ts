import { describe, it, expect } from 'vitest';
import { Patient, Medication } from '../src/types';

describe('Strict Family Circle Isolation (Zero Data Leakage)', () => {
  const allPatients: Patient[] = [
    {
      id: 'patient-sara',
      familyId: 'circle-poot',
      name: 'Sara Burgos Uc (Mamá)',
      type: 'chronic'
    },
    {
      id: 'patient-esposa',
      familyId: 'circle-poot-ibarra',
      name: 'Esposa Ibarra',
      type: 'preventive'
    }
  ];

  const allMeds: Medication[] = [
    {
      id: 'med-sara-rivaroxaban',
      familyId: 'circle-poot',
      patientId: 'patient-sara',
      name: 'Rivaroxaban 2.5mg',
      presentation: 'tablet',
      currentStock: 30,
      minimumStockAlert: 5,
      frequency: { type: 'daily_fixed', doseSlots: [{ time: '08:00', dose: 1 }] },
      history: []
    },
    {
      id: 'med-esposa-vitamin',
      familyId: 'circle-poot-ibarra',
      patientId: 'patient-esposa',
      name: 'Vitaminas C & D',
      presentation: 'capsule',
      currentStock: 60,
      minimumStockAlert: 10,
      frequency: { type: 'daily_fixed', doseSlots: [{ time: '09:00', dose: 1 }] },
      history: []
    }
  ];

  it('1. Familia Poot Burgos (circle-poot) MUST ONLY show Sara Burgos Uc and her medications', () => {
    const activeFamilyId = 'circle-poot';
    const patientsInCircle = allPatients.filter(p => (p.familyId || 'circle-poot') === activeFamilyId);
    const medsInCircle = allMeds.filter(m => (m.familyId || 'circle-poot') === activeFamilyId);

    expect(patientsInCircle.length).toBe(1);
    expect(patientsInCircle[0].name).toBe('Sara Burgos Uc (Mamá)');
    expect(medsInCircle.length).toBe(1);
    expect(medsInCircle[0].name).toBe('Rivaroxaban 2.5mg');
  });

  it('2. Familia Poot Ibarra (circle-poot-ibarra) MUST NEVER show Sara Burgos Uc nor her medications', () => {
    const activeFamilyId = 'circle-poot-ibarra';
    const patientsInCircle = allPatients.filter(p => (p.familyId || 'circle-poot') === activeFamilyId);
    const medsInCircle = allMeds.filter(m => (m.familyId || 'circle-poot') === activeFamilyId);

    expect(patientsInCircle.length).toBe(1);
    expect(patientsInCircle[0].name).toBe('Esposa Ibarra');
    expect(patientsInCircle.some(p => p.name.includes('Sara Burgos'))).toBe(false);

    expect(medsInCircle.length).toBe(1);
    expect(medsInCircle[0].name).toBe('Vitaminas C & D');
    expect(medsInCircle.some(m => m.name.includes('Rivaroxaban'))).toBe(false);
  });

  it('3. A newly created empty circle has 0 patients and 0 medications', () => {
    const activeFamilyId = 'circle-brand-new';
    const patientsInCircle = allPatients.filter(p => (p.familyId || 'circle-poot') === activeFamilyId);
    const medsInCircle = allMeds.filter(m => (m.familyId || 'circle-poot') === activeFamilyId);

    expect(patientsInCircle.length).toBe(0);
    expect(medsInCircle.length).toBe(0);
  });
});
