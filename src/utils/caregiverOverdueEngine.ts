import { Medication, Patient, DoseLog } from '../types';
import { getDailyDoseSlots, formatDateIso } from './frequencyEngine';

export interface OverdueDoseItem {
  id: string;
  patientId: string;
  patientName: string;
  medicationId: string;
  medicationName: string;
  presentation: string;
  dose: number;
  instruction?: string;
  scheduledTime: string;
  minutesOverdue: number;
}

export interface FindOverdueParams {
  patients: Patient[];
  medications: Medication[];
  doseLogs: DoseLog[];
  currentDateTime: Date;
  gracePeriodMinutes?: number; // default 0 minutes
}

/**
 * Finds all doses scheduled for today whose time has passed and have NOT been signed off in doseLogs
 */
export function findOverdueUncheckedDoses({
  patients,
  medications,
  doseLogs,
  currentDateTime,
  gracePeriodMinutes = 0
}: FindOverdueParams): OverdueDoseItem[] {
  const dateStr = formatDateIso(currentDateTime);
  const currentHours = currentDateTime.getHours();
  const currentMinutes = currentDateTime.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  const overdueList: OverdueDoseItem[] = [];

  patients.forEach(patient => {
    const patientMeds = medications.filter(m => m.patientId === patient.id && m.status !== 'completed' && m.status !== 'suspended');

    patientMeds.forEach(med => {
      const slots = getDailyDoseSlots(med, currentDateTime);

      slots.forEach(slot => {
        const [slotH, slotM] = slot.time.split(':').map(Number);
        const slotTotalMinutes = slotH * 60 + slotM;

        // Check if current time is past slot time + grace period
        if (currentTotalMinutes > slotTotalMinutes + gracePeriodMinutes) {
          const matchingLog = doseLogs.find(
            l =>
              l.patientId === patient.id &&
              l.medicationId === med.id &&
              l.date === dateStr &&
              l.scheduledTime === slot.time
          );

          if (!matchingLog || !matchingLog.taken) {
            overdueList.push({
              id: `${patient.id}-${med.id}-${dateStr}-${slot.time}`,
              patientId: patient.id,
              patientName: patient.name,
              medicationId: med.id,
              medicationName: med.name,
              presentation: med.presentation,
              dose: slot.dose,
              instruction: slot.instruction,
              scheduledTime: slot.time,
              minutesOverdue: currentTotalMinutes - slotTotalMinutes
            });
          }
        }
      });
    });
  });

  return overdueList;
}

/**
 * Builds a clean, Amazon-style WhatsApp alert to verify with caregivers whether a dose was given or is pending
 */
export function buildOverdueDoseVerificationMessage(params: {
  overdueItem: {
    patientName: string;
    medicationName: string;
    dose: number;
    presentation: string;
    scheduledTime: string;
    instruction?: string;
    minutesOverdue: number;
  };
  caregiverName?: string;
  currentDate?: string;
  lang?: 'es' | 'en';
}): string {
  const { overdueItem, caregiverName, currentDate, lang = 'es' } = params;
  const isEn = lang === 'en';

  if (isEn) {
    let msg = `⚠️ *FamHealth - Pending Dose Verification Alert* 💊\n\n`;
    msg += `Hello family / ${caregiverName ? `Caregiver on shift (*${caregiverName}*)` : 'Caregivers'}:\n\n`;
    msg += `The scheduled dose for *${overdueItem.patientName}* has not been recorded in the app yet. ✨\n\n`;
    msg += `💊 *Medication:* ${overdueItem.medicationName} (${overdueItem.dose} ${overdueItem.presentation})\n`;
    msg += `⏰ *Scheduled Time:* ${overdueItem.scheduledTime} (${overdueItem.minutesOverdue} mins elapsed)\n`;

    if (overdueItem.instruction) {
      msg += `📝 *Instruction:* ${overdueItem.instruction}\n`;
    }

    if (currentDate) {
      msg += `📅 *Date:* ${currentDate}\n`;
    }

    msg += `\n❓ *Please confirm with the caregiver:*\n`;
    msg += `1️⃣ Was the medication already administered and just needs to be checked off?\n`;
    msg += `2️⃣ Or is it still pending to be given?\n\n`;
    msg += `👉 _(Please check it off in the app or reply to this message)_ 🙏\n`;
    msg += `💬 _FamHealth Caregiver Team_`;

    return msg;
  }

  // Spanish (Clean, structured Amazon WhatsApp style)
  let msg = `⚠️ *FamHealth - Alerta de Toma Pendiente de Verificación* 💊\n\n`;
  msg += `Hola familia / ${caregiverName ? `Cuidador en turno (*${caregiverName}*)` : 'Cuidadores'}:\n\n`;
  msg += `Vemos que la toma programada para *${overdueItem.patientName}* aún no ha sido marcada en la aplicación. ✨\n\n`;
  msg += `💊 *Medicamento:* ${overdueItem.medicationName} (${overdueItem.dose} ${overdueItem.presentation})\n`;
  msg += `⏰ *Hora programada:* ${overdueItem.scheduledTime} (${overdueItem.minutesOverdue} minutos transcurridos)\n`;

  if (overdueItem.instruction) {
    msg += `📝 *Indicación:* ${overdueItem.instruction}\n`;
  }

  if (currentDate) {
    msg += `📅 *Fecha:* ${currentDate}\n`;
  }

  msg += `\n❓ *Por favor confirmar con el cuidador:*\n`;
  msg += `1️⃣ ¿Ya se le administró el medicamento y solo faltó marcarlo en la app?\n`;
  msg += `2️⃣ ¿O sigue pendiente de darse?\n\n`;
  msg += `👉 _(Favor de marcar la casilla en la app o responder por este chat para tranquilidad de la familia)_ 🙏\n`;
  msg += `💬 _FamHealth Control Médico Familiar_`;

  return msg;
}
