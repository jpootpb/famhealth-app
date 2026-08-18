import { Medication, Patient, DoseLog } from '../types';
import { getDailyDoseSlots, formatDateIso } from './frequencyEngine';

export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export interface CaregiverTimelineSlot {
  id: string;
  patientId: string;
  patientName: string;
  patientType?: Patient['type'];
  medicationId: string;
  medicationName: string;
  presentation: string;
  time: string;
  dose: number;
  instruction?: string;
  timeOfDay: TimeOfDayBucket;
  isTaken: boolean;
  actualTakenTime?: string;
  administeredBy?: string;
  doseLogId?: string;
}

export interface UnifiedTimelineParams {
  patients: Patient[];
  medications: Medication[];
  doseLogs: DoseLog[];
  date: Date;
  selectedPatientId?: string | 'all';
}

export function getTimeOfDayBucket(time: string): TimeOfDayBucket {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Generates a chronologically sorted multi-patient timeline for caregivers managing parents + self-care
 */
export function generateUnifiedCaregiverTimeline({
  patients,
  medications,
  doseLogs,
  date,
  selectedPatientId = 'all'
}: UnifiedTimelineParams): CaregiverTimelineSlot[] {
  const dateStr = formatDateIso(date);
  const targetPatients = selectedPatientId === 'all' || !selectedPatientId
    ? patients
    : patients.filter(p => p.id === selectedPatientId);

  const slots: CaregiverTimelineSlot[] = [];

  targetPatients.forEach(patient => {
    const patientMeds = medications.filter(m => m.patientId === patient.id);

    patientMeds.forEach(med => {
      const dailySlots = getDailyDoseSlots(med, date);

      dailySlots.forEach(slot => {
        // Find if this specific dose was logged as taken
        const matchingLog = doseLogs.find(
          l =>
            l.patientId === patient.id &&
            l.medicationId === med.id &&
            l.date === dateStr &&
            l.scheduledTime === slot.time
        );

        slots.push({
          id: `${patient.id}-${med.id}-${dateStr}-${slot.time}`,
          patientId: patient.id,
          patientName: patient.name,
          patientType: patient.type,
          medicationId: med.id,
          medicationName: med.name,
          presentation: med.presentation,
          time: slot.time,
          dose: slot.dose,
          instruction: slot.instruction,
          timeOfDay: getTimeOfDayBucket(slot.time),
          isTaken: Boolean(matchingLog?.taken),
          actualTakenTime: matchingLog?.actualTakenTime,
          administeredBy: matchingLog?.administeredBy,
          doseLogId: matchingLog?.id
        });
      });
    });
  });

  // Sort slots chronologically by time, then by patient name
  slots.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time.localeCompare(b.time);
    }
    return a.patientName.localeCompare(b.patientName);
  });

  return slots;
}
