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

export interface ExpirationStatusResult {
  status: 'expired' | 'expiring_soon' | 'valid';
  label: string;
  badgeClass: string;
}

export function getExpirationStatus(expirationDate?: string, referenceDate: Date = new Date()): ExpirationStatusResult {
  if (!expirationDate) {
    return { status: 'valid', label: 'No expiry set', badgeClass: 'badge-blue' };
  }
  const exp = new Date(expirationDate + 'T23:59:59');
  const now = new Date(referenceDate);
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', label: `Expired on ${expirationDate}`, badgeClass: 'badge-red' };
  }
  if (diffDays <= 30) {
    return { status: 'expiring_soon', label: `Expires in ${diffDays}d (${expirationDate})`, badgeClass: 'badge-yellow' };
  }
  return { status: 'valid', label: `Exp: ${expirationDate}`, badgeClass: 'badge-green' };
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

/**
 * Automatically calculates precise age from birth date (YYYY-MM-DD), updating dynamically over time
 */
export function calculateAge(birthDate?: string, fallbackAge?: number, referenceDate: Date = new Date()): number | undefined {
  if (!birthDate) return fallbackAge;
  const parts = birthDate.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return fallbackAge;
  }

  const [year, month, day] = parts;
  const birth = new Date(year, month - 1, day);
  const now = referenceDate;

  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Formats a patient's age in a clean, readable string (e.g., "80 años" or "80 years old")
 */
export function formatPatientAge(birthDate?: string, fallbackAge?: number, lang: 'es' | 'en' = 'es'): string {
  const age = calculateAge(birthDate, fallbackAge);
  if (age === undefined) return '';
  return lang === 'es' ? `${age} años` : `${age} years old`;
}

