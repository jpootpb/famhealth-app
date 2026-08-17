import { describe, it, expect } from 'vitest';
import { buildWhatsAppSummary } from '../src/lib/whatsapp';
import { Patient, Medication, DoseLog } from '../src/types';

describe('WhatsApp Delegation & Caregiver Agenda Export (Task 7)', () => {
  const patient: Patient = {
    id: 'patient-test-don-manuel',
    name: 'Don Manuel',
    type: 'chronic',
    primaryDiagnosis: 'Type 2 Diabetes',
    notes: 'Check fasting glucose daily'
  };

  const medications: Medication[] = [
    {
      id: 'med-1',
      patientId: 'patient-test-don-manuel',
      name: 'Metformin',
      presentation: 'tablet',
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

  it('1. Should format WhatsApp agenda with title, patient name and date', () => {
    const today = new Date(2026, 7, 17);
    const summary = buildWhatsAppSummary(patient, medications, [], today);

    expect(summary).toContain('MEDICATION AGENDA - DON MANUEL');
    expect(summary).toContain('08:00');
    expect(summary).toContain('Metformin');
    expect(summary).toContain('1 tablet');
    expect(summary).toContain('20:00');
    expect(summary).toContain('1/2 tablet');
  });

  it('2. Should distinguish taken vs pending doses in WhatsApp text', () => {
    const today = new Date(2026, 7, 17);
    const doseLogs: DoseLog[] = [
      {
        id: '1',
        medicationId: 'med-1',
        patientId: patient.id,
        date: '2026-08-17',
        scheduledTime: '08:00',
        dose: 1,
        taken: true
      }
    ];

    const summary = buildWhatsAppSummary(patient, medications, doseLogs, today);
    expect(summary).toContain('[DONE] *08:00* -> Metformin');
    expect(summary).toContain('[PENDING] *20:00* -> Metformin');
    expect(summary).toContain('Caregiver Pass');
  });
});
