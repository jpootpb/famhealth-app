import { MedicalAppointment } from '../types';

/**
 * Returns a direct Google Maps search / navigation URL for a clinic address or custom URL
 */
export function getGoogleMapsSearchUrl(location: string, customUrl?: string): string {
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }
  const cleanLocation = location.trim();
  if (!cleanLocation) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanLocation)}`;
}

/**
 * Formats a WhatsApp message sharing appointment details, Google Maps clinic location, and doctor verbal advice
 */
export function formatAppointmentShareMessage(params: {
  appointment: MedicalAppointment;
  patientName: string;
}): string {
  const { appointment, patientName } = params;
  const mapsUrl = getGoogleMapsSearchUrl(appointment.location || '', appointment.googleMapsUrl);

  let msg = `🏥 *FamHealth - Consulta Médica de ${patientName}*\n`;
  msg += `👨‍⚕️ *Médico:* ${appointment.doctorName} (${appointment.specialty})\n`;
  msg += `📅 *Fecha y Hora:* ${appointment.dateTime.replace('T', ' ')}\n`;

  if (appointment.location) {
    msg += `📍 *Ubicación del Consultorio:* ${appointment.location}\n`;
  }

  if (mapsUrl) {
    msg += `🗺️ *Ver en Google Maps (Cómo llegar):*\n${mapsUrl}\n`;
  }

  if (appointment.doctorPhone) {
    msg += `📞 *Teléfono del Consultorio:* ${appointment.doctorPhone}\n`;
  }

  if (appointment.notes) {
    msg += `\n📝 *Notas previas:* ${appointment.notes}\n`;
  }

  if (appointment.verbalRecommendations && appointment.verbalRecommendations.length > 0) {
    msg += `\n🗣️ *Recomendaciones Verbales del Doctor en Consulta:*\n`;
    appointment.verbalRecommendations.forEach(rec => {
      msg += `• ${rec}\n`;
    });
  }

  return msg;
}
