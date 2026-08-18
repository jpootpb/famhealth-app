import { describe, it, expect } from 'vitest';
import {
  calculateBookingReminderDates,
  isBookingWindowOpen,
  formatBookingWhatsAppMessage,
  FutureBookingReminder
} from '../src/utils/appointmentBookingEngine';

describe('Future Appointment Booking & Clinic Agenda Opening Reminder (TDD)', () => {
  it('1. Should calculate the exact clinic call date (e.g. 1 month before a 1-year annual review)', () => {
    // Current consultation date: 2026-08-18
    const baseDate = new Date(2026, 7, 18);

    const dates = calculateBookingReminderDates({
      baseDate,
      targetMonthsAhead: 12, // 1 year review (August 2027)
      callMonthsAheadOfTarget: 1 // Call 1 month before target (July 2027)
    });

    expect(dates.targetConsultationDate).toBe('2027-08-18');
    expect(dates.callClinicDate).toBe('2027-07-18');
  });

  it('2. Should detect when current date enters the clinic agenda booking window', () => {
    const reminder: FutureBookingReminder = {
      id: 'rem-angio-1',
      patientId: 'patient-maria',
      patientName: 'Doña María Poot (Mamá)',
      doctorName: 'Dr. Alejandro Cantón',
      specialty: 'Angiología y Cirugía Vascular',
      targetConsultationDate: '2027-08-18',
      callClinicDate: '2027-07-18',
      clinicPhone: '9999254433',
      notes: 'La asistente indicó llamar en julio 2027 cuando abran la agenda anual.',
      status: 'waiting_agenda_open'
    };

    // 1. Current time is before the call window (e.g. March 2027) -> false
    const earlyDate = new Date(2027, 2, 1);
    expect(isBookingWindowOpen(reminder, earlyDate)).toBe(false);

    // 2. Current time enters the call window (e.g. July 20, 2027) -> true
    const callWindowDate = new Date(2027, 6, 20);
    expect(isBookingWindowOpen(reminder, callWindowDate)).toBe(true);
  });

  it('3. Should build a prefilled polite WhatsApp message to send to clinic reception to book the appointment', () => {
    const reminder: FutureBookingReminder = {
      id: 'rem-angio-1',
      patientId: 'patient-maria',
      patientName: 'Doña María Poot (Mamá)',
      doctorName: 'Dr. Alejandro Cantón',
      specialty: 'Angiología y Cirugía Vascular',
      targetConsultationDate: '2027-08-18',
      callClinicDate: '2027-07-18',
      clinicPhone: '9999254433',
      notes: 'Revisión anual de circulación y varices.',
      status: 'waiting_agenda_open'
    };

    const msg = formatBookingWhatsAppMessage(reminder, 'José Manuel Poot');

    expect(msg).toContain('Dr. Alejandro Cantón');
    expect(msg).toContain('Doña María Poot (Mamá)');
    expect(msg).toContain('revisión anual');
    expect(msg).toContain('Solicitud de Cita');
    expect(msg).toContain('José Manuel Poot');
  });
});
