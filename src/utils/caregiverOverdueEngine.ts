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
    const patientMeds = medications.filter(m => m.patientId === patient.id);

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
 * Builds an empathetic, clear WhatsApp alert to verify with caregivers whether a dose was given or is pending
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
}): string {
  const { overdueItem, caregiverName, currentDate } = params;

  let msg = `⚠️ *FamHealth - Alerta de Toma Pendiente de Verificación*\n\n`;
  msg += `Hola familia / ${caregiverName ? `Cuidador en turno (*${caregiverName}*)` : 'Cuidadores'}:\n\n`;
  msg += `Vemos que la toma programada para *${overdueItem.patientName}* aún no ha sido marcada como suministrada en la aplicación:\n\n`;
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
  msg += `👉 *(Favor de marcar la casilla en la app o responder por este chat para tranquilidad de la familia)* 🙏`;

  return msg;
}
