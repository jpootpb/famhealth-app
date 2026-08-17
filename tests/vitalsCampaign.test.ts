import { describe, it, expect } from 'vitest';
import { VitalSign, MonitoringCampaign } from '../src/types';

export function classifyGlucose(value: number, timing: string = 'fasting'): { level: 'optimal' | 'elevated' | 'high'; label: string; badgeClass: string } {
  if (timing === 'fasting') {
    if (value < 130) return { level: 'optimal', label: 'Optimal (<130)', badgeClass: 'badge-green' };
    if (value <= 180) return { level: 'elevated', label: 'Elevated (130-180)', badgeClass: 'badge-yellow' };
    return { level: 'high', label: 'High (>180)', badgeClass: 'badge-red' };
  } else {
    // Postprandial (after meals)
    if (value < 140) return { level: 'optimal', label: 'Optimal (<140)', badgeClass: 'badge-green' };
    if (value <= 180) return { level: 'elevated', label: 'Elevated (140-180)', badgeClass: 'badge-yellow' };
    return { level: 'high', label: 'High (>180)', badgeClass: 'badge-red' };
  }
}

export function classifyBloodPressure(systolic: number, diastolic: number): { level: 'normal' | 'elevated' | 'high'; label: string; badgeClass: string } {
  if (systolic < 120 && diastolic < 80) {
    return { level: 'normal', label: 'Normal (<120/80)', badgeClass: 'badge-green' };
  }
  if (systolic <= 139 || diastolic <= 89) {
    return { level: 'elevated', label: 'Elevated (120-139 / 80-89)', badgeClass: 'badge-yellow' };
  }
  return { level: 'high', label: 'Stage 1/2 High (>=140/90)', badgeClass: 'badge-red' };
}

export function calculateCampaignProgress(campaign: MonitoringCampaign, vitals: VitalSign[]): { totalRequired: number; recordedCount: number; percent: number; isCompleted: boolean } {
  const totalRequired = campaign.durationDays * campaign.checksPerDay;
  const campaignVitals = vitals.filter(v =>
    v.patientId === campaign.patientId &&
    campaign.vitalTypes.includes(v.type) &&
    v.timestamp >= campaign.startDate
  );

  const recordedCount = campaignVitals.length;
  const percent = Math.min(100, Math.round((recordedCount / totalRequired) * 100));

  return {
    totalRequired,
    recordedCount,
    percent,
    isCompleted: recordedCount >= totalRequired
  };
}

describe('Vitals & Monitoring Campaigns Logic (Task 8)', () => {
  it('1. Should classify fasting glucose readings correctly', () => {
    expect(classifyGlucose(115, 'fasting').level).toBe('optimal');
    expect(classifyGlucose(145, 'fasting').level).toBe('elevated');
    expect(classifyGlucose(210, 'fasting').level).toBe('high');
  });

  it('2. Should classify blood pressure readings correctly', () => {
    expect(classifyBloodPressure(118, 76).level).toBe('normal');
    expect(classifyBloodPressure(130, 84).level).toBe('elevated');
    expect(classifyBloodPressure(150, 95).level).toBe('high');
  });

  it('3. Should calculate 3-day monitoring campaign progress accurately', () => {
    const campaign: MonitoringCampaign = {
      id: 'camp-1',
      patientId: 'patient-grandfather',
      name: '3-Day Glucose Challenge',
      vitalTypes: ['glucose'],
      startDate: '2026-08-16',
      durationDays: 3,
      checksPerDay: 2, // Total required = 6
      isActive: true
    };

    const vitals: VitalSign[] = [
      { id: '1', patientId: 'patient-grandfather', type: 'glucose', value: 110, timestamp: '2026-08-16T08:00:00' },
      { id: '2', patientId: 'patient-grandfather', type: 'glucose', value: 140, timestamp: '2026-08-16T15:00:00' },
      { id: '3', patientId: 'patient-grandfather', type: 'glucose', value: 115, timestamp: '2026-08-17T08:00:00' },
      { id: '4', patientId: 'patient-grandfather', type: 'glucose', value: 135, timestamp: '2026-08-17T15:00:00' }
    ];

    const progress = calculateCampaignProgress(campaign, vitals);
    expect(progress.totalRequired).toBe(6);
    expect(progress.recordedCount).toBe(4);
    expect(progress.percent).toBe(67);
    expect(progress.isCompleted).toBe(false);
  });
});
