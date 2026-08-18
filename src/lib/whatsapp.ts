import { Patient, Medication, DoseLog, FamilyMember, DoseSlot } from '../types';
import { formatDose } from '../utils/formatters';
import { getDailyDoseSlots } from '../utils/frequencyEngine';

export function getCaregiversForShift(
  caregivers: FamilyMember[],
  shift: 'morning' | 'evening' | 'night' | 'full_day' | 'weekend'
): FamilyMember[] {
  const activeCaregivers = caregivers.filter(c => c.isActive);
  return activeCaregivers.filter(
    c => c.shift === shift || (shift === 'night' && c.shift === 'evening') || c.shift === 'full_day'
  );
}

export function getCurrentShiftCaregiver(
  caregivers: FamilyMember[],
  currentTime: Date = new Date()
): FamilyMember | undefined {
  const activeCaregivers = caregivers.filter(c => c.isActive);
  if (activeCaregivers.length === 0) return undefined;

  const hour = currentTime.getHours();

  let targetShift: 'morning' | 'evening' | 'night' = 'morning';
  if (hour >= 6 && hour < 14) {
    targetShift = 'morning';
  } else if (hour >= 14 && hour < 22) {
    targetShift = 'night';
  } else {
    targetShift = 'night';
  }

  const shiftMatches = getCaregiversForShift(activeCaregivers, targetShift);
  if (shiftMatches.length > 0) {
    const defaultMatch = shiftMatches.find(c => c.isDefaultCaregiver);
    return defaultMatch || shiftMatches[0];
  }

  const defaultCaregiver = activeCaregivers.find(c => c.isDefaultCaregiver);
  return defaultCaregiver || activeCaregivers[0];
}

/**
 * Builds a clean, Amazon-style WhatsApp notification for an administered dose
 */
export function buildDoseTakenWhatsAppMessage(
  patient: Patient,
  medication: Medication,
  slot: DoseSlot,
  administeredBy: string,
  dailyProgressText: string = '',
  lang: 'es' | 'en' = 'es'
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const doseText = formatDose(slot.dose, medication.presentation);

  if (lang === 'en') {
    const lines: string[] = [];
    lines.push(`✅ *Dose Confirmed - ${patient.name.toUpperCase()}* 💊`);
    lines.push('');
    lines.push(`The medication *${medication.name}* (${doseText}) was successfully administered. ✨`);
    lines.push('');
    lines.push(`⏰ *Administered Time:* ${timeStr} (Scheduled: ${slot.time})`);
    lines.push(`👤 *Recorded by:* ${administeredBy}`);
    if (slot.instruction || medication.indication) {
      lines.push(`📝 *Note:* ${slot.instruction || medication.indication}`);
    }
    if (dailyProgressText) {
      lines.push(`📊 *Daily Progress:* ${dailyProgressText}`);
    }
    lines.push('');
    lines.push(`💬 _FamHealth Medication Tracker_`);
    return lines.join('\n');
  }

  // Spanish (Clean, structured Amazon WhatsApp style)
  const lines: string[] = [];
  lines.push(`✅ *Toma Administrada - ${patient.name.toUpperCase()}* 💊`);
  lines.push('');
  lines.push(`El medicamento *${medication.name}* (${doseText}) fue administrado con éxito. ✨`);
  lines.push('');
  lines.push(`⏰ *Hora de toma:* ${timeStr} (Horario programado: ${slot.time})`);
  lines.push(`👤 *Registrado por:* ${administeredBy}`);
  if (slot.instruction || medication.indication) {
    lines.push(`📝 *Indicación:* ${slot.instruction || medication.indication}`);
  }
  if (dailyProgressText) {
    lines.push(`📊 *Progreso del día:* ${dailyProgressText}`);
  }
  lines.push('');
  lines.push(`💬 _FamHealth Control Médico Familiar_`);
  return lines.join('\n');
}

/**
 * Builds a comprehensive daily medication agenda in clean Amazon WhatsApp style
 */
export function buildWhatsAppSummary(
  patient: Patient,
  medications: Medication[],
  doseLogs: DoseLog[],
  date: Date = new Date(),
  lang: 'es' | 'en' = 'es'
): string {
  const isEn = lang === 'en';
  const dateStr = date.toLocaleDateString(isEn ? 'en-US' : 'es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dailyDoses: Array<{ time: string; medName: string; doseText: string; taken: boolean; administeredBy?: string }> = [];

  medications.forEach(med => {
    const slots = getDailyDoseSlots(med, date);
    slots.forEach(s => {
      const doseText = formatDose(s.dose, med.presentation);
      const log = doseLogs.find(l => l.medicationId === med.id && l.scheduledTime === s.time && l.taken);
      dailyDoses.push({
        time: s.time,
        medName: med.name,
        doseText,
        taken: !!log,
        administeredBy: log?.administeredBy
      });
    });
  });

  dailyDoses.sort((a, b) => a.time.localeCompare(b.time));

  const lines: string[] = [];

  if (isEn) {
    lines.push(`📋 *MEDICATION AGENDA - ${patient.name.toUpperCase()}* 💊`);
    lines.push(`📅 *Date:* ${dateStr}`);
    lines.push('');
    lines.push(`Here is the scheduled medication agenda for today ✨`);
    lines.push('');
    lines.push(`*Scheduled Doses:*`);

    if (dailyDoses.length === 0) {
      lines.push(`_No medications scheduled for today._`);
    } else {
      dailyDoses.forEach(item => {
        const icon = item.taken ? '✅ [DONE]' : '⏳ [PENDING]';
        const adminNote = item.administeredBy ? ` (by ${item.administeredBy})` : '';
        lines.push(`${icon} *${item.time}* -> ${item.medName} (${item.doseText})${adminNote}`);
      });
    }

    lines.push('');
    if (patient.notes) {
      lines.push(`📝 *Notes:* ${patient.notes}`);
      lines.push('');
    }

    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://famhealth.app';
    lines.push(`📱 *Caregiver Pass:* ${origin}?mode=pass&patientId=${patient.id}`);
    lines.push(`💬 _FamHealth PWA_`);
  } else {
    lines.push(`📋 *AGENDA DE MEDICAMENTOS - ${patient.name.toUpperCase()}* 💊`);
    lines.push(`📅 *Fecha:* ${dateStr}`);
    lines.push('');
    lines.push(`Aquí tienes el cronograma de tomas médicas para el día de hoy ✨`);
    lines.push('');
    lines.push(`*Tomas Programadas:*`);

    if (dailyDoses.length === 0) {
      lines.push(`_No hay medicamentos programados para hoy._`);
    } else {
      dailyDoses.forEach(item => {
        const icon = item.taken ? '✅ [REALIZADO]' : '⏳ [PENDIENTE]';
        const adminNote = item.administeredBy ? ` (por ${item.administeredBy})` : '';
        lines.push(`${icon} *${item.time}* -> ${item.medName} (${item.doseText})${adminNote}`);
      });
    }

    lines.push('');
    if (patient.notes) {
      lines.push(`📝 *Notas del paciente:* ${patient.notes}`);
      lines.push('');
    }

    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://famhealth.app';
    lines.push(`📱 *Pase para Cuidador:* ${origin}?mode=pass&patientId=${patient.id}`);
    lines.push(`💬 _FamHealth Control Médico Familiar_`);
  }

  return lines.join('\n');
}

export function shareViaWhatsApp(text: string, phone: string = ''): void {
  const encoded = encodeURIComponent(text);
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const url = cleanPhone ? 'https://wa.me/' + cleanPhone + '?text=' + encoded : 'https://wa.me/?text=' + encoded;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}
