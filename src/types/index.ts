export type PatientType = 'chronic' | 'temporary';

export interface Patient {
  id: string;
  name: string;
  age?: number;
  type: PatientType;
  primaryDiagnosis?: string;
  treatmentStartDate?: string; // YYYY-MM-DD
  durationDays?: number;
  notes?: string;
}

export type FrequencyType =
  | 'daily_fixed'
  | 'alternate_days'
  | 'every_n_days'
  | 'temporary_hourly';

export interface DoseSlot {
  time: string; // HH:MM
  dose: number; // 1, 0.5, 0.25 pills
  instruction?: string;
}

export interface FrequencyRule {
  type: FrequencyType;
  doseSlots: DoseSlot[];
  startDate: string;
  endDate?: string;
  intervalDays?: number;
  intervalHours?: number;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  presentation: string; // tablet, capsule, ml, etc.
  indication?: string;
  frequency: FrequencyRule;
  currentStock: number;
  minimumStockAlert: number;
  unitCost?: number;
  badgeColor?: string;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HI:MM
  actualTakenTime: string;
  dose: number;
  taken: boolean;
}

export type VitalType = 'glucose' | 'blood_pressure' | 'oxygen_saturation';

export interface VitalSign {
  id: string;
  patientId: string;
  type: VitalType;
  primaryValue: number; // mg/dL, systolic, or SpO2
  secondaryValue?: number; // diastolic
  pulse?: number;
  context?: string; // Fasting, Postprandial, Resting, etc.
  dateTime: string; // ISO
  notes?: string;
}

export interface MonitoringCampaign {
  id: string;
  patientId: string;
  name: string;
  vitalTypes: VitalType[];
  startDate: string;
  durationDays: number;
  checksPerDay: number;
  targetNotes?: string;
  isActive: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  splitPercentage: number;
  isActive: boolean;
}

export interface HealthExpense {
  id: string;
  patientId: string;
  concept: string;
  category: 'medication' | 'lab_study' | 'doctor_appointment' | 'supplies' | 'other';
  amount: number;
  date: string;
  paidBy: string;
  receiptUrl?: string;
}

export interface MedicalAppointment {
  id: string;
  patientId: string;
  doctorName: string;
  specialty: string;
  location: string;
  dateTime: string;
  cost?: number;
  reason: string;
  preparationInstructions?: string;
  isCompleted: boolean;
}

export interface MedicalStudy {
  id: string;
  patientId: string;
  title: string;
  category: string;
  laboratory: string;
  date: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  fileUrl?: string;
  cost?: number;
  keyFindings?: string;
}
