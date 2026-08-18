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
 * Formats a clean, structured Amazon-style WhatsApp message for appointment details, Google Maps, and doctor advice
 */
export function formatAppointmentShareMessage(params: {
  appointment: MedicalAppointment;
  patientName: string;
  lang?: 'es' | 'en';
}): string {
  const { appointment, patientName, lang = 'es' } = params;
  const isEn = lang === 'en';
  const mapsUrl = getGoogleMapsSearchUrl(appointment.location || '', appointment.googleMapsUrl);

  if (isEn) {
    let msg = `¡Hello! Here is the medical appointment details for *${patientName}* 🩺\n\n`;
    msg += `The attending physician is *${appointment.doctorName}* (${appointment.specialty}) ✨\n\n`;
    msg += `📅 *Date & Time:* ${appointment.dateTime.replace('T', ' ')}\n`;

    if (appointment.location) {
      msg += `📍 *Clinic Location:* ${appointment.location}\n`;
    }

    if (mapsUrl) {
      msg += `🗺️ *Get Directions on Google Maps:*\n${mapsUrl}\n`;
    }

    if (appointment.doctorPhone) {
      msg += `📞 *Clinic Phone:* ${appointment.doctorPhone}\n`;
    }

    if (appointment.notes) {
      msg += `\n📝 *Consultation Notes:* ${appointment.notes}\n`;
    }

    if (appointment.verbalRecommendations && appointment.verbalRecommendations.length > 0) {
      msg += `\n🗣️ *Doctor's Verbal Advice:*\n`;
      appointment.verbalRecommendations.forEach(rec => {
        msg += `• ${rec}\n`;
      });
    }

    msg += `\n💬 _FamHealth Medical Care_`;
    return msg;
  }

  // Spanish (Clean Amazon WhatsApp style)
  let msg = `¡Hola! Aquí tienes los detalles de la consulta médica de *${patientName}* 🩺\n\n`;
  msg += `El médico de la consulta es *${appointment.doctorName}* (${appointment.specialty}) ✨\n\n`;
  msg += `📅 *Fecha y Hora:* ${appointment.dateTime.replace('T', ' ')}\n`;

  if (appointment.location) {
    msg += `📍 *Ubicación del Consultorio:* ${appointment.location}\n`;
  }

  if (mapsUrl) {
    msg += `🗺️ *Cómo llegar con Google Maps:*\n${mapsUrl}\n`;
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

  msg += `\n💬 _FamHealth Control Médico Familiar_`;
  return msg;
}
