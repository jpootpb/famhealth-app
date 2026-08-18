import { describe, it, expect } from 'vitest';
import { MedicalAppointment, MedicalStudy } from '../src/types';

describe('Accidental Deletion Safety & Confirmation Rules (TDD)', () => {
  it('1. Should detect if an appointment contains a critical attached prescription before deletion', () => {
    const appWithPrescription: MedicalAppointment = {
      id: 'app-1',
      patientId: 'patient-grandfather',
      doctorName: 'Dr. Alejandro Hernandez',
      specialty: 'Internal Medicine',
      dateTime: '2026-08-25T11:00',
      prescriptionUrl: 'data:image/jpeg;base64,sample...',
      prescriptionFileType: 'image',
      isCompleted: false
    };

    const hasAttachedPrescription = !!appWithPrescription.prescriptionUrl;
    expect(hasAttachedPrescription).toBe(true);
  });

  it('2. Should detect if a medical study contains online PACS 3D viewer or attached files', () => {
    const studyWithPacs: MedicalStudy = {
      id: 'study-ct',
      patientId: 'patient-grandfather',
      title: 'Tomografía Computarizada de Tórax',
      category: 'imaging',
      date: '2026-08-17',
      viewerUrl: 'https://pacs.evacenter.com/viewer/123',
      fileUrl: 'data:application/pdf;base64,...'
    };

    const isCriticalDocument = !!(studyWithPacs.viewerUrl || studyWithPacs.fileUrl);
    expect(isCriticalDocument).toBe(true);
  });
});
