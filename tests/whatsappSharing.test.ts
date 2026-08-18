import { describe, it, expect } from 'vitest';
import { buildWhatsAppSummary, buildDoseTakenWhatsAppMessage } from '../src/lib/whatsapp';
import { Patient, Medication, DoseLog } from '../src/types';

describe('WhatsApp Delegation & Caregiver Agenda Export (Bilingual & Amazon Aesthetic)', () => {
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

  it('1. Should format WhatsApp agenda in English when selected', () => {
    const today = new Date(2026, 7, 17);
    const summary = buildWhatsAppSummary(patient, medications, [], today, 'en');

    expect(summary).toContain('MEDICATION AGENDA - DON MANUEL');
    expect(summary).toContain('08:00');
    expect(summary).toContain('Metformin');
    expect(summary).toContain('1 tablet');
    expect(summary).toContain('20:00');
    expect(summary).toContain('1/2 tablet');
    expect(summary).toContain('Caregiver Pass');
  });

  it('2. Should distinguish taken vs pending doses in Spanish WhatsApp text', () => {
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

    const summary = buildWhatsAppSummary(patient, medications, doseLogs, today, 'es');
    expect(summary).toContain('AGENDA DE MEDICAMENTOS - DON MANUEL');
    expect(summary).toContain('[REALIZADO] *08:00* -> Metformin');
    expect(summary).toContain('[PENDIENTE] *20:00* -> Metformin');
    expect(summary).toContain('Pase para Cuidador');
  });

  it('3. Should format single dose notification in clean Amazon WhatsApp style', () => {
    const msgEs = buildDoseTakenWhatsAppMessage(
      patient,
      medications[0],
      { time: '08:00', dose: 1, instruction: 'Con el desayuno' },
      'José Manuel Poot',
      '1 de 2 tomas cumplidas hoy',
      'es'
    );

    expect(msgEs).toContain('Toma Administrada - DON MANUEL');
    expect(msgEs).toContain('Metformin');
    expect(msgEs).toContain('fue administrado con éxito');
    expect(msgEs).toContain('José Manuel Poot');

    const msgEn = buildDoseTakenWhatsAppMessage(
      patient,
      medications[0],
      { time: '08:00', dose: 1, instruction: 'With breakfast' },
      'José Manuel Poot',
      '1 of 2 doses completed today',
      'en'
    );

    expect(msgEn).toContain('Dose Confirmed - DON MANUEL');
    expect(msgEn).toContain('successfully administered');
  });
});
