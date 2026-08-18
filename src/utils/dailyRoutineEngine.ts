import { Patient, RoutineLog } from '../types';
import { formatDateIso } from './frequencyEngine';

export type RoutineEventType = 'breakfast' | 'lunch' | 'dinner' | 'bath' | 'wound_care' | 'exercise';

export interface CareRoutineSlot {
  id: string;
  itemType: 'routine';
  patientId: string;
  patientName: string;
  routineType: RoutineEventType;
  title: string;
  time: string; // HH:MM
  notes?: string;
  isCompleted: boolean;
  completedBy?: string;
  icon: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

function getTimeOfDay(timeStr: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const [h] = timeStr.split(':').map(Number);
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

/**
 * Extracts and formats all active daily care routine events (Meals, Bath, Wound Care, Exercise) for a patient on a given date
 */
export function getPatientDailyRoutineSlots(
  patient: Patient,
  date: Date = new Date(),
  routineLogs: RoutineLog[] = [],
  lang: 'es' | 'en' = 'es'
): CareRoutineSlot[] {
  const isEn = lang === 'en';
  const routines = patient.dailyRoutines;
  if (!routines || routines.enabled === false) return [];

  const dateIso = formatDateIso(date);
  const slots: CareRoutineSlot[] = [];

  const checkCompleted = (type: RoutineEventType, time: string) => {
    const log = routineLogs.find(
      l => l.patientId === patient.id && l.routineType === type && l.date === dateIso && l.scheduledTime === time
    );
    return {
      isCompleted: Boolean(log?.completed),
      completedBy: log?.completedBy
    };
  };

  // 1. Breakfast
  if (routines.breakfastTime) {
    const status = checkCompleted('breakfast', routines.breakfastTime);
    slots.push({
      id: `routine-${patient.id}-breakfast-${routines.breakfastTime}`,
      itemType: 'routine',
      patientId: patient.id,
      patientName: patient.name,
      routineType: 'breakfast',
      title: isEn ? 'Breakfast / Morning Meal' : 'Desayuno / Alimento Matutino',
      time: routines.breakfastTime,
      notes: routines.breakfastNotes,
      isCompleted: status.isCompleted,
      completedBy: status.completedBy,
      icon: '🍳',
      timeOfDay: getTimeOfDay(routines.breakfastTime)
    });
  }

  // 2. Bath / Hygiene
  if (routines.bathTime) {
    const status = checkCompleted('bath', routines.bathTime);
    slots.push({
      id: `routine-${patient.id}-bath-${routines.bathTime}`,
      itemType: 'routine',
      patientId: patient.id,
      patientName: patient.name,
      routineType: 'bath',
      title: isEn ? 'Bath & Personal Hygiene' : 'Baño y Aseo Personal',
      time: routines.bathTime,
      notes: routines.bathNotes,
      isCompleted: status.isCompleted,
      completedBy: status.completedBy,
      icon: '🚿',
      timeOfDay: getTimeOfDay(routines.bathTime)
    });
  }

  // 3. Wound Care / Dressings
  if (routines.woundCareTime) {
    const status = checkCompleted('wound_care', routines.woundCareTime);
    slots.push({
      id: `routine-${patient.id}-wound-${routines.woundCareTime}`,
      itemType: 'routine',
      patientId: patient.id,
      patientName: patient.name,
      routineType: 'wound_care',
      title: isEn ? 'Surgical Wound & Dressing Care' : 'Curación de Herida y Vendajes',
      time: routines.woundCareTime,
      notes: routines.woundCareNotes,
      isCompleted: status.isCompleted,
      completedBy: status.completedBy,
      icon: '🩹',
      timeOfDay: getTimeOfDay(routines.woundCareTime)
    });
  }

  // 4. Lunch
  if (routines.lunchTime) {
    const status = checkCompleted('lunch', routines.lunchTime);
    slots.push({
      id: `routine-${patient.id}-lunch-${routines.lunchTime}`,
      itemType: 'routine',
      patientId: patient.id,
      patientName: patient.name,
      routineType: 'lunch',
      title: isEn ? 'Lunch / Midday Meal' : 'Comida / Almuerzo',
      time: routines.lunchTime,
      notes: routines.lunchNotes,
      isCompleted: status.isCompleted,
      completedBy: status.completedBy,
      icon: '🍲',
      timeOfDay: getTimeOfDay(routines.lunchTime)
    });
  }

  // 5. Exercise / Physical Therapy
  if (routines.exerciseTime) {
    const status = checkCompleted('exercise', routines.exerciseTime);
    slots.push({
      id: `routine-${patient.id}-exercise-${routines.exerciseTime}`,
      itemType: 'routine',
      patientId: patient.id,
      patientName: patient.name,
      routineType: 'exercise',
      title: isEn ? 'Walk / Physical Therapy' : 'Caminata / Fisioterapia',
      time: routines.exerciseTime,
      notes: routines.exerciseNotes,
      isCompleted: status.isCompleted,
      completedBy: status.completedBy,
      icon: '🚶‍♂️',
      timeOfDay: getTimeOfDay(routines.exerciseTime)
    });
  }

  // 6. Dinner
  if (routines.dinnerTime) {
    const status = checkCompleted('dinner', routines.dinnerTime);
    slots.push({
      id: `routine-${patient.id}-dinner-${routines.dinnerTime}`,
      itemType: 'routine',
      patientId: patient.id,
      patientName: patient.name,
      routineType: 'dinner',
      title: isEn ? 'Dinner / Light Evening Meal' : 'Cena / Alimento Nocturno',
      time: routines.dinnerTime,
      notes: routines.dinnerNotes,
      isCompleted: status.isCompleted,
      completedBy: status.completedBy,
      icon: '🌙',
      timeOfDay: getTimeOfDay(routines.dinnerTime)
    });
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
}
