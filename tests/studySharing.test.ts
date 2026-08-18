import { describe, it, expect } from 'vitest';
import { Patient, MedicalStudy } from '../src/types';
import { buildStudyWhatsAppMessage, buildStudyEmailLink } from '../src/utils/studySharingEngine';

describe('Medical Study Sharing with Online PACS Viewer & Report Links (TDD)', () => {
  const patient: Patient = {
    id: 'p-1',
    name: 'Don Manuel Poot',
    age: 78,
    type: 'chronic',
    primaryDiagnosis: 'Diabetes Tipo 2 y Pie Diabético'
  };

  const sampleTomography: MedicalStudy = {
    id: 's-tomo',
    patientId: 'p-1',
    title: 'Tomografía Computarizada / Angiotomografía de Miembros Inferiores',
    category: 'imaging',
    date: '2026-08-17',
    laboratory: 'Eva Center / Unirad Mérida',
    resultsSummary: 'Estenosis arterial en arteria tibial posterior. Visualización 3D disponible en PACS.',
    viewerUrl: 'https://pacs.evacenter.com/viewer/30b08ba1-be06-4459-ad48-ec455a42f147/?ac=token123',
    reportUrl: 'https://apps.evacenter.com/pacs/report-detail/30b08ba1-be06-4459-ad48-ec455a42f147/?ac=token123'
  };

  it('1. Should include direct PACS Viewer and Online Report URLs in WhatsApp message', () => {
    const message = buildStudyWhatsAppMessage(patient, sampleTomography);

    expect(message).toContain('ESTUDIO DE LABORATORIO - DON MANUEL POOT');
    expect(message).toContain('Tomografía Computarizada');
    expect(message).toContain('Eva Center / Unirad Mérida');
    expect(message).toContain('🖼️ *Visor de Imágenes PACS (Tomografía):*');
    expect(message).toContain('https://pacs.evacenter.com/viewer/30b08ba1');
    expect(message).toContain('📑 *Reporte Radiológico Online:*');
    expect(message).toContain('https://apps.evacenter.com/pacs/report-detail/30b08ba1');
  });

  it('2. Should include direct PACS Viewer and Online Report URLs in Email link', () => {
    const emailLink = buildStudyEmailLink(patient, sampleTomography, 'cirujano@hospital.com');

    expect(emailLink).toContain('mailto:cirujano@hospital.com?');
    expect(emailLink).toContain('https%3A%2F%2Fpacs.evacenter.com');
  });
});
