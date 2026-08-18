import { describe, it, expect } from 'vitest';
import { VitalSign } from '../src/types';
import {
  calculateVitalsStatistics,
  filterVitalsByDays,
  generateTrendPath
} from '../src/utils/vitalsChartEngine';

describe('Vitals Trend Chart & Clinical Statistics Engine (TDD)', () => {
  const sampleVitals: VitalSign[] = [
    {
      id: 'v-1',
      patientId: 'p-1',
      type: 'glucose',
      value: 110,
      timestamp: '2026-08-10T08:00:00',
      timing: 'fasting'
    },
    {
      id: 'v-2',
      patientId: 'p-1',
      type: 'glucose',
      value: 125,
      timestamp: '2026-08-14T08:00:00',
      timing: 'fasting'
    },
    {
      id: 'v-3',
      patientId: 'p-1',
      type: 'glucose',
      value: 140,
      timestamp: '2026-08-17T08:00:00',
      timing: 'fasting'
    },
    {
      id: 'v-4',
      patientId: 'p-1',
      type: 'glucose',
      value: 160,
      timestamp: '2026-05-01T08:00:00', // > 90 days ago
      timing: 'fasting'
    }
  ];

  it('1. Should filter vitals by selected day window (e.g. last 30 days)', () => {
    const refDate = new Date('2026-08-17T12:00:00');
    const last30Days = filterVitalsByDays(sampleVitals, 30, refDate);
    expect(last30Days.length).toBe(3); // v-1, v-2, v-3
  });

  it('2. Should compute mean, min, max, and in-range percentage accurately', () => {
    const refDate = new Date('2026-08-17T12:00:00');
    const last30Days = filterVitalsByDays(sampleVitals, 30, refDate);
    const stats = calculateVitalsStatistics(last30Days, 'glucose');

    expect(stats.count).toBe(3);
    expect(stats.min).toBe(110);
    expect(stats.max).toBe(140);
    expect(stats.avg).toBe(125); // (110 + 125 + 140) / 3 = 125
    expect(stats.inOptimalRangeCount).toBe(3); // fasting target 70-130 or <140
  });

  it('3. Should generate SVG polyline / path coordinates for chart rendering', () => {
    const points = generateTrendPath(sampleVitals.slice(0, 3), 400, 150);
    expect(points.length).toBe(3);
    expect(points[0].x).toBeDefined();
    expect(points[0].y).toBeDefined();
  });
});
