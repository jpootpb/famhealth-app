import { Medication, FrequencyRule, DoseSlot } from '../types';

export function parseDateOnly(dateStr: string): Date {
  const [partY, partM, partD] = dateStr.split('-').map(Number);
  return new Date(partY, partM - 1, partD, 0, 0, 0, 0);
}

export function formatDateIso(date: Date): string {
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

export function isDoseDueToday(rule: FrequencyRule, evalDate: Date = new Date()): boolean {
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

export function getDailyDoseSlots(med: Medication, date: Date = new Date()): DoseSlot[] {
  if (!isDoseDueToday(med.frequency, date)) return [];
  return med.frequency.doseSlots;
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
