import { VitalSign, MonitoringCampaign } from '../types';

export function formatDose(dose: number, presentation: string = 'tablet'): string {
  if (dose === 0.5) return '1/2 ' + presentation;
  if (dose === 0.25) return '1/4 ' + presentation;
  if (dose === 0.75) return '3/4 ' + presentation;
  if (dose === 1) return '1 ' + presentation;
  return dose + ' ' + presentation + (dose > 1 ? 's' : '');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

export interface StockStatusResult {
  status: 'depleted' | 'low' | 'ok';
  label: string;
  color: string;
  badgeClass: string;
}

export function getStockStatus(current: number, minimum: number): StockStatusResult {
  if (current <= 0) {
    return { status: 'depleted', label: 'Out of Stock (0)', color: '#dc2626', badgeClass: 'badge-red' };
  }
  if (current <= minimum) {
    return { status: 'low', label: 'Low Stock (' + current + ')', color: '#d97706', badgeClass: 'badge-yellow' };
  }
  return { status: 'ok', label: 'In Stock (' + current + ')', color: '#16a34a', badgeClass: 'badge-green' };
}

export function classifyGlucose(value: number, timing: string = 'fasting'): { level: 'optimal' | 'elevated' | 'high'; label: string; badgeClass: string } {
  if (timing === 'fasting') {
    if (value < 130) return { level: 'optimal', label: 'Optimal (<130 mg/dL)', badgeClass: 'badge-green' };
    if (value <= 180) return { level: 'elevated', label: 'Elevated (130-180 mg/dL)', badgeClass: 'badge-yellow' };
    return { level: 'high', label: 'High (>180 mg/dL)', badgeClass: 'badge-red' };
  } else {
    if (value < 140) return { level: 'optimal', label: 'Optimal (<140 mg/dL)', badgeClass: 'badge-green' };
    if (value <= 180) return { level: 'elevated', label: 'Elevated (140-180 mg/dL)', badgeClass: 'badge-yellow' };
    return { level: 'high', label: 'High (>180 mg/dL)', badgeClass: 'badge-red' };
  }
}

export function classifyBloodPressure(systolic: number, diastolic: number): { level: 'normal' | 'elevated' | 'high'; label: string; badgeClass: string } {
  if (systolic < 120 && diastolic < 80) {
    return { level: 'normal', label: 'Normal (<120/80 mmHg)', badgeClass: 'badge-green' };
  }
  if (systolic <= 139 || diastolic <= 89) {
    return { level: 'elevated', label: 'Elevated (120-139 / 80-89)', badgeClass: 'badge-yellow' };
  }
  return { level: 'high', label: 'Hypertension (>=140/90)', badgeClass: 'badge-red' };
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
