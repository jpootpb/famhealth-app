import { VitalSign, VitalType } from '../types';

export interface VitalsStatistics {
  count: number;
  min: number;
  max: number;
  avg: number;
  inOptimalRangeCount: number;
  targetRangeLabel: string;
}

export function filterVitalsByDays(
  vitals: VitalSign[],
  days: number,
  refDate: Date = new Date()
): VitalSign[] {
  const threshold = new Date(refDate);
  threshold.setDate(threshold.getDate() - days);
  threshold.setHours(0, 0, 0, 0);

  return vitals
    .filter(v => {
      const d = new Date(v.timestamp);
      return !isNaN(d.getTime()) && d >= threshold && d <= refDate;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function calculateVitalsStatistics(
  vitals: VitalSign[],
  type: VitalType
): VitalsStatistics {
  if (vitals.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      inOptimalRangeCount: 0,
      targetRangeLabel: getTargetRangeLabel(type)
    };
  }

  const values = vitals.map(v => v.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / values.length) * 10) / 10;

  let inOptimalRangeCount = 0;
  vitals.forEach(v => {
    if (isVitalInOptimalRange(v.value, v.secondaryValue, type)) {
      inOptimalRangeCount++;
    }
  });

  return {
    count: vitals.length,
    min,
    max,
    avg,
    inOptimalRangeCount,
    targetRangeLabel: getTargetRangeLabel(type)
  };
}

export function getTargetRangeLabel(type: VitalType): string {
  switch (type) {
    case 'glucose':
      return '70 – 130 mg/dL (Ayunas) / < 180 (Postprandial)';
    case 'blood_pressure':
      return '< 120/80 mmHg (Normal)';
    case 'spo2':
      return '95% – 100%';
    case 'heart_rate':
      return '60 – 100 lpm';
    case 'weight':
      return 'Objetivo Clínico Estable';
    default:
      return 'Normal';
  }
}

export function isVitalInOptimalRange(
  val: number,
  secVal?: number,
  type?: VitalType
): boolean {
  if (!type) return true;
  switch (type) {
    case 'glucose':
      return val >= 70 && val <= 140;
    case 'blood_pressure':
      return val <= 130 && (!secVal || secVal <= 85);
    case 'spo2':
      return val >= 94;
    case 'heart_rate':
      return val >= 60 && val <= 100;
    default:
      return true;
  }
}

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
  secondaryValue?: number;
  dateStr: string;
}

export function generateTrendPath(
  vitals: VitalSign[],
  width: number = 500,
  height: number = 180,
  padding: number = 24
): ChartPoint[] {
  if (vitals.length === 0) return [];

  const values = vitals.map(v => v.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 10;

  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;

  return vitals.map((v, index) => {
    const x =
      vitals.length === 1
        ? width / 2
        : padding + (index / (vitals.length - 1)) * drawableWidth;

    const normalizedY = (v.value - minVal) / range;
    const y = height - padding - normalizedY * drawableHeight;

    const d = new Date(v.timestamp);
    const dateStr = !isNaN(d.getTime())
      ? d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
      : '';

    return {
      x,
      y,
      value: v.value,
      secondaryValue: v.secondaryValue,
      dateStr
    };
  });
}
