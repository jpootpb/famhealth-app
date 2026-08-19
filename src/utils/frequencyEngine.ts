import { Medication, FrequencyRule, DoseSlot } from '../types';

export function parseDateOnly(dateStr?: string | null): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

export function formatDateIso(date?: Date | null): string {
  if (!date || isNaN(date.getTime())) {
    date = new Date();
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function diffInDays(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function isDoseDueToday(rule?: FrequencyRule | null, evalDate: Date = new Date()): boolean {
  if (!rule || !rule.startDate) return false;
  const startDate = parseDateOnly(rule.startDate);
  const targetDate = new Date(evalDate.getFullYear(), evalDate.getMonth(), evalDate.getDate());

  const elapsedDays = diffInDays(startDate, targetDate);
  if (elapsedDays < 0) return false;

  if (rule.endDate) {
    const endDate = parseDateOnly(rule.endDate);
    if (targetDate > endDate) return false;
  }

  switch (rule.type) {
    case 'daily_fixed':
      return true;
    case 'alternate_days':
      return elapsedDays % 2 === 0;
    case 'every_n_days':
      const n = rule.intervalDays || 1;
      return elapsedDays % n === 0;
    case 'temporary_hourly':
      return true;
    default:
      return true;
  }
}

export function getDailyDoseSlots(med?: Medication | null, date: Date = new Date()): DoseSlot[] {
  if (!med || !med.frequency) return [];
  if (!isDoseDueToday(med.frequency, date)) return [];

  const dateIso = formatDateIso(date);
  const isStartDate = dateIso === med.frequency.startDate;
  const isEndDate = Boolean(med.frequency.endDate && dateIso === med.frequency.endDate);

  let slots = Array.isArray(med.frequency.doseSlots) ? [...med.frequency.doseSlots] : [];
  if (slots.length === 0) return [];

  // Sort slots chronologically
  slots.sort((a, b) => a.time.localeCompare(b.time));

  // If start date and first dose time is specified, filter out slots before that time
  if (isStartDate && med.frequency.startFirstDoseTime) {
    slots = slots.filter(s => s.time >= med.frequency.startFirstDoseTime!);
  }

  // If end date and end dose time is specified, filter out slots after that time on the end date
  if (isEndDate && med.frequency.endDoseTime) {
    if (!isStartDate || med.frequency.endDoseTime >= (med.frequency.startFirstDoseTime || '00:00')) {
      slots = slots.filter(s => s.time <= med.frequency.endDoseTime!);
    }
  }

  return slots;
}

export interface TemporaryTreatmentCalculation {
  startDate: string;
  endDate: string;
  startFirstDoseTime: string;
  endDoseTime: string;
  totalPrescribedDoses: number;
  dosesPerDay: number;
  durationDays: number;
  summaryText: string;
}

export function calculateTemporaryTreatmentSchedule(params: {
  startDate?: string;
  durationDays?: number;
  doseSlots?: DoseSlot[];
  startFirstDoseTime?: string;
  lang?: 'es' | 'en';
}): TemporaryTreatmentCalculation {
  const isEn = params.lang === 'en';
  const validStartDate = params.startDate && typeof params.startDate === 'string' && params.startDate.length >= 8
    ? params.startDate
    : formatDateIso(new Date());

  const validDurationDays = Math.max(Number(params.durationDays) || 1, 1);
  const rawSlots = Array.isArray(params.doseSlots) && params.doseSlots.length > 0
    ? params.doseSlots
    : [{ time: '08:00', dose: 1 }];

  const slots = [...rawSlots].sort((a, b) => a.time.localeCompare(b.time));
  const dosesPerDay = Math.max(slots.length, 1);
  const totalDoses = validDurationDays * dosesPerDay;
  const firstDoseTime = params.startFirstDoseTime || slots[0]?.time || '08:00';

  // Find how many doses will be taken on Day 1
  const day1Slots = slots.filter(s => s.time >= firstDoseTime);
  const day1Count = day1Slots.length;

  let remainingDoses = totalDoses - day1Count;
  let currentDate = parseDateOnly(validStartDate);
  let lastDoseTime = day1Slots.length > 0
    ? (day1Slots[day1Slots.length - 1]?.time || firstDoseTime)
    : (slots[slots.length - 1]?.time || firstDoseTime);

  if (remainingDoses <= 0) {
    return {
      startDate: validStartDate,
      endDate: validStartDate,
      startFirstDoseTime: firstDoseTime,
      endDoseTime: lastDoseTime,
      totalPrescribedDoses: totalDoses,
      dosesPerDay,
      durationDays: validDurationDays,
      summaryText: isEn
        ? `1 day (${totalDoses} doses) starting at ${firstDoseTime}`
        : `1 día (${totalDoses} tomas) iniciando a las ${firstDoseTime}`
    };
  }

  // Safety counter to guarantee no infinite loop
  let safetyLoops = 0;
  while (remainingDoses > 0 && safetyLoops < 3650) {
    safetyLoops++;
    currentDate.setDate(currentDate.getDate() + 1);
    if (remainingDoses >= dosesPerDay) {
      remainingDoses -= dosesPerDay;
      lastDoseTime = slots[slots.length - 1]?.time || '20:00';
    } else {
      const lastDaySlots = slots.slice(0, remainingDoses);
      lastDoseTime = lastDaySlots[lastDaySlots.length - 1]?.time || slots[0]?.time || '08:00';
      remainingDoses = 0;
    }
  }

  const endDateIso = formatDateIso(currentDate);

  const summaryText = isEn
    ? `Starts on ${validStartDate} at ${firstDoseTime} (${day1Count} doses Day 1) ➔ Completes on ${endDateIso} at ${lastDoseTime} (${totalDoses} total doses)`
    : `Inicia el ${validStartDate} a las ${firstDoseTime} (${day1Count} tomas Día 1) ➔ Concluye el ${endDateIso} a las ${lastDoseTime} (${totalDoses} tomas totales completas)`;

  return {
    startDate: validStartDate,
    endDate: endDateIso,
    startFirstDoseTime: firstDoseTime,
    endDoseTime: lastDoseTime,
    totalPrescribedDoses: totalDoses,
    dosesPerDay,
    durationDays: validDurationDays,
    summaryText
  };
}

export function getFrequencyLabel(rule: FrequencyRule): string {
  switch (rule.type) {
    case 'daily_fixed':
      return 'Daily (' + rule.doseSlots.length + ' times/day)';
    case 'alternate_days':
      return 'Alternate Days (every other day)';
    case 'every_n_days':
      return 'Every ' + (rule.intervalDays || 1) + ' days';
    case 'temporary_hourly':
      return 'Every ' + (rule.intervalHours || 8) + ' hours (Temporary)';
    default:
      return 'Custom';
  }
}
