import { describe, it, expect } from 'vitest';
import { Patient, MedicalStudy } from '../src/types';
import { buildStudyWhatsAppMessage, buildStudyEmailLink } from '../src/utils/studySharingEngine';

describe('Medical Study Sharing via WhatsApp and Email to Doctor (TDD)', () => {
  const patient: Patient = {
    id: 'p-1',
    name: 'Don Manuel Poot',
    age: 78,
    type: 'chronic',
    primaryDiagnosis: 'Diabetes Tipo 2'
  };

  const sampleStudy: MedicalStudy = {
    id: 's-1',
    patientId: 'p-1',
    title: 'Química Sanguínea 6 Elementos + HbA1c',
    category: 'blood_test',
    date: '2026-08-10',
    laboratory: 'Laboratorios Chopo',
    resultsSummary: 'HbA1c: 6.8%. Glucosa en ayunas: 115 mg/dL. Creatinina: 1.0 mg/dL.',
    fileUrl: 'data:image/png;base64,mockImageBase64',
    fileType: 'image'
  };

  it('1. Should format clinical WhatsApp message for doctor', () => {
    const message = buildStudyWhatsAppMessage(patient, sampleStudy);

    expect(message).toContain('ESTUDIO DE LABORATORIO - DON MANUEL POOT');
    expect(message).toContain('Química Sanguínea 6 Elementos + HbA1c');
    expect(message).toContain('Laboratorios Chopo');
    expect(message).toContain('HbA1c: 6.8%');
    expect(message).toContain('FamHealth');
  });

  it('2. Should generate mailto email link with subject and pre-filled body', () => {
    const emailLink = buildStudyEmailLink(patient, sampleStudy, 'doctor@clinica.com');

    expect(emailLink.startsWith('mailto:doctor@clinica.com?')).toBe(true);
    expect(emailLink).toContain('subject=');
    expect(emailLink).toContain('body=');
  });
});
