import { formatDateIso } from './frequencyEngine';

export type BookingStatus = 'waiting_agenda_open' | 'call_now_ready' | 'booked_confirmed';

export interface FutureBookingReminder {
  id: string;
  familyId?: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  targetConsultationDate: string; // YYYY-MM-DD (e.g. 2027-08-18)
  callClinicDate: string; // YYYY-MM-DD (e.g. 2027-07-18, 1 month before)
  clinicPhone?: string;
  clinicAddress?: string;
  notes?: string;
  status: BookingStatus;
  confirmedAppointmentId?: string;
  createdAt?: string;
}

export interface CalculateBookingDatesParams {
  baseDate: Date;
  targetMonthsAhead: number; // e.g. 12 (1 year) or 6 (6 months)
  callMonthsAheadOfTarget?: number; // e.g. 1 (call 1 month before)
  callDaysAheadOfTarget?: number;
}

/**
 * Calculates the target appointment date and the exact date to call the clinic assistant
 */
export function calculateBookingReminderDates({
  baseDate,
  targetMonthsAhead,
  callMonthsAheadOfTarget = 1,
  callDaysAheadOfTarget = 0
}: CalculateBookingDatesParams): { targetConsultationDate: string; callClinicDate: string } {
  // Target consultation date
  const targetDate = new Date(baseDate);
  targetDate.setMonth(targetDate.getMonth() + targetMonthsAhead);

  // Date to call the clinic to book
  const callDate = new Date(targetDate);
  if (callMonthsAheadOfTarget > 0) {
    callDate.setMonth(callDate.getMonth() - callMonthsAheadOfTarget);
  }
  if (callDaysAheadOfTarget > 0) {
    callDate.setDate(callDate.getDate() - callDaysAheadOfTarget);
  }

  return {
    targetConsultationDate: formatDateIso(targetDate),
    callClinicDate: formatDateIso(callDate)
  };
}

/**
 * Checks whether the current date has reached or passed the clinic agenda booking window
 */
export function isBookingWindowOpen(
  reminder: FutureBookingReminder,
  currentDate: Date = new Date()
): boolean {
  if (reminder.status === 'booked_confirmed') return false;
  const currentIso = formatDateIso(currentDate);
  return currentIso >= reminder.callClinicDate;
}

/**
 * Formats a polite, clear WhatsApp message to send to clinic reception to request booking
 */
export function formatBookingWhatsAppMessage(
  reminder: FutureBookingReminder,
  familyContactName: string = 'Familiar'
): string {
  let msg = `🏥 *Solicitud de Cita Médica - Consultorio del ${reminder.doctorName}*\n\n`;
  msg += `Hola, buenas tardes. Me comunico de parte de la paciente *${reminder.patientName}*.\n\n`;
  msg += `En nuestra última consulta de ${reminder.specialty}, nos indicaron comunicarnos este mes para agendar la *revisión anual / de seguimiento* correspondiente a *${reminder.targetConsultationDate.substring(0, 7)}*.\n\n`;

  if (reminder.notes) {
    msg += `📝 *Motivo de la cita:* ${reminder.notes}\n\n`;
  }

  msg += `¿Podrían indicarme qué días y horarios tienen disponibles con el doctor para agendar la consulta?\n\n`;
  msg += `Quedo atento(a). Muchas gracias.\n`;
  msg += `👤 *Contacto:* ${familyContactName}`;

  return msg;
}
