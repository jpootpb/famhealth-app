import { Patient, Medication, DoseLog, FamilyMember, DoseSlot } from '../types';
import { formatDose } from '../utils/formatters';
import { getDailyDoseSlots } from '../utils/frequencyEngine';

export function getCurrentShiftCaregiver(
  caregivers: FamilyMember[],
  currentTime: Date = new Date()
): FamilyMember | undefined {
  const activeCaregivers = caregivers.filter(c => c.isActive);
  if (activeCaregivers.length === 0) return undefined;

  const hour = currentTime.getHours();

  // Shift matching:
  // Morning: 06:00 - 13:59 (6 to 13)
  // Evening: 14:00 - 21:59 (14 to 21)
  // Night: 22:00 - 05:59 (22 to 23 or 0 to 5)
  let targetShift: 'morning' | 'evening' | 'night' = 'morning';
  if (hour >= 6 && hour < 14) {
    targetShift = 'morning';
  } else if (hour >= 14 && hour < 22) {
    targetShift = 'night'; // Map evening/night
  } else {
    targetShift = 'night';
  }

  const shiftMatch = activeCaregivers.find(
    c => c.shift === targetShift || (targetShift === 'night' && c.shift === 'evening')
  );

  if (shiftMatch) return shiftMatch;

  // Fallback to default caregiver or first active caregiver
  const defaultCaregiver = activeCaregivers.find(c => c.isDefaultCaregiver);
  return defaultCaregiver || activeCaregivers[0];
}

export function buildDoseTakenWhatsAppMessage(
  patient: Patient,
  medication: Medication,
  slot: DoseSlot,
  administeredBy: string,
  dailyProgressText: string = ''
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const doseText = formatDose(slot.dose, medication.presentation);

  const lines: string[] = [];
  lines.push('✅ *DOSE ADMINISTERED - ' + patient.name.toUpperCase() + '*');
  lines.push('💊 *Medication:* ' + medication.name + ' (' + doseText + ')');
  lines.push('⏰ *Administered Time:* ' + timeStr + ' (Scheduled: ' + slot.time + ')');
  lines.push('👤 *Administered by:* ' + administeredBy);
  if (slot.instruction || medication.indication) {
    lines.push('📝 *Note:* ' + (slot.instruction || medication.indication));
  }
  if (dailyProgressText) {
    lines.push('📊 *Daily Progress:* ' + dailyProgressText);
  }
  lines.push('');
  lines.push('_FamHealth Dose Tracker_');

  return lines.join('\n');
}

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

  if (dailyDoses.length === 0) {
    lines.push('_No medications scheduled for today._');
  } else {
    dailyDoses.forEach(item => {
      const check = item.taken ? '[DONE]' : '[PENDING]';
      const adminNote = item.administeredBy ? ` (by ${item.administeredBy})` : '';
      lines.push(check + ' *' + item.time + '* -> ' + item.medName + ' (' + item.doseText + ')' + adminNote);
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
