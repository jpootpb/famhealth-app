import { Patient, Medication, DoseLog } from '../types';
import { formatDose } from '../utils/formatters';
import { getDailyDoseSlots } from '../utils/frequencyEngine';

export function buildWhatsAppSummary(
  patient: Patient,
  medications: Medication[],
  doseLogs: DoseLog[],
  date: Date = new Date()
): string {
  const dateStr = date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const lines: string[] = [];
  lines.push('*MEDICATION AGENDA - ' + patient.name.toUpperCase() + '*');
  lines.push('*Date:* ' + dateStr);
  lines.push('');
  lines.push('*Scheduled Doses:*');

  const dailyDoses: Array<{ time: string; medName: string; doseText: string; taken: boolean }> = [];

  medications.forEach(med => {
    const slots = getDailyDoseSlots(med, date);
    slots.forEach(s => {
      const doseText = formatDose(s.dose, med.presentation);
      const isTaken = doseLogs.some(l => l.medicationId === med.id && l.scheduledTime === s.time && l.taken);
      dailyDoses.push({
        time: s.time,
        medName: med.name,
        doseText,
        taken: isTaken
      });
    });
  });

  dailyDoses.sort((a, b) => a.time.localeCompare(b.time));

  if (dailyDoses.length === 0) {
    lines.push('_No medications scheduled for today._');
  } else {
    dailyDoses.forEach(item => {
      const check = item.taken ? '[DONE]' : '[PENDING]';
      lines.push(check + ' *' + item.time + '* -> ' + item.medName + ' (' + item.doseText + ')');
    });
  }

  lines.push('');
  if (patient.notes) {
    lines.push('*Notes:* ' + patient.notes);
    lines.push('');
  }

  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://famhealth.app';
  lines.push('_Caregiver Pass:_ ' + origin + '?mode=pass&patientId=' + patient.id);
  lines.push('_FamHealth PWA_');

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
