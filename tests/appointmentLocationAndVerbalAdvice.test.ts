import { describe, it, expect } from 'vitest';
import { MedicalAppointment } from '../src/types';
import {
  getGoogleMapsSearchUrl,
  formatAppointmentShareMessage
} from '../src/utils/googleMapsHelper';

describe('Doctor Consultation Verbal Advice & Google Maps Location (TDD)', () => {
  const appointment: MedicalAppointment = {
    id: 'app-camed-1',
    patientId: 'patient-grandfather',
    doctorName: 'Dr. Roberto Méndez',
    specialty: 'Medicina Interna / Geriatría',
    dateTime: '2026-08-25T11:00',
    location: 'Clínica CAMED - Av. Cupules x Calle 60, Mérida, Yucatán',
    doctorPhone: '9991234567',
    notes: 'Llevar bitácora de glucosa de 3 días y estudios de sangre recientes.',
    verbalRecommendations: [
      'Disminuir el consumo de sal a menos de media cucharadita al día.',
      'Caminar 20 minutos diarios por la tarde a paso suave.',
      'No suspender el anticoagulante antes de la limpieza dental sin avisar previamente al cardiólogo.',
      'Tomar 2 litros de agua diarios para ayudar a la función renal.'
    ],
    isCompleted: true
  };

  it('1. Should generate a valid Google Maps search/navigation URL from clinic location address', () => {
    const mapsUrl = getGoogleMapsSearchUrl(appointment.location || '');
    expect(mapsUrl).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(mapsUrl).toContain('CAMED');
    expect(mapsUrl).toContain('Cupules');
  });

  it('2. Should use custom Google Maps URL if explicitly provided by the user', () => {
    const customUrl = 'https://maps.app.goo.gl/camed-cupules-merida';
    const resolvedUrl = getGoogleMapsSearchUrl(appointment.location || '', customUrl);
    expect(resolvedUrl).toBe(customUrl);
  });

  it('3. Should format a comprehensive WhatsApp share message including location, maps link and verbal doctor recommendations', () => {
    const msg = formatAppointmentShareMessage({
      appointment,
      patientName: 'Don Manuel Poot (Papá)'
    });

    expect(msg).toContain('Dr. Roberto Méndez');
    expect(msg).toContain('CAMED');
    expect(msg).toContain('Cupules');
    expect(msg).toContain('https://www.google.com/maps');
    expect(msg).toContain('Recomendaciones Verbales del Doctor');
    expect(msg).toContain('Disminuir el consumo de sal');
    expect(msg).toContain('Caminar 20 minutos diarios');
  });
});
