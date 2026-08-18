export type PatientType = 'chronic' | 'temporary';

export interface FamilyCircle {
  id: string;
  name: string;
  inviteCode: string; // e.g. "POOT-7821"
  createdAt: string;
  ownerEmail?: string;
  patientCount?: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  activeFamilyId: string;
  joinedFamilyIds: string[];
}

export interface Patient {
  id: string;
  familyId?: string;
  name: string;
  age?: number;
  type: PatientType;
  primaryDiagnosis?: string;
  treatmentStartDate?: string;
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
  familyId?: string;
  patientId: string;
  name: string;
  presentation: string; // tablet, capsule, ml, etc.
  indication?: string;
  laboratory?: string; // Brand or Lab manufacturer (e.g. MSD, Silanes, Farmacias del Ahorro)
  imageUrl?: string; // Photo of medicine box / blister pack (Base64 data URL)
  frequency: FrequencyRule;
  currentStock: number;
  minimumStockAlert: number;
  unitCost?: number;
  badgeColor?: string;
  expirationDate?: string; // YYYY-MM-DD
}

export interface DoseLog {
  id: string;
  familyId?: string;
  medicationId: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  actualTakenTime?: string; // HH:MM
  dose: number;
  taken: boolean;
  notes?: string;
  administeredBy?: string; // Name of caregiver who administered dose
}

export type VitalType = 'glucose' | 'blood_pressure' | 'spo2' | 'weight' | 'heart_rate';

export interface VitalSign {
  id: string;
  familyId?: string;
  patientId: string;
  type: VitalType;
  value: number; // For BP this can be systolic
  secondaryValue?: number; // Diastolic
  timing?: 'fasting' | 'postprandial' | 'random' | 'before_sleep';
  timestamp: string;
  notes?: string;
}

export interface MonitoringCampaign {
  id: string;
  familyId?: string;
  patientId: string;
  name: string;
  vitalTypes: VitalType[];
  startDate: string;
  durationDays: number;
  checksPerDay: number;
  targetNotes?: string;
  isActive: boolean;
}

export type CaregiverShift = 'morning' | 'evening' | 'night' | 'full_day' | 'weekend';

export interface FamilyMember {
  id: string;
  familyId?: string;
  name: string;
  relationship?: string;
  phone?: string;
  shift?: CaregiverShift;
  isDefaultCaregiver?: boolean;
  splitPercentage: number;
  isActive: boolean;
}

export interface HealthExpense {
  id: string;
  familyId?: string;
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
  familyId?: string;
  patientId: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  location?: string;
  notes?: string;
  isCompleted: boolean;
}

export interface MedicalStudy {
  id: string;
  familyId?: string;
  patientId: string;
  title: string;
  category: 'blood_test' | 'imaging' | 'cardiology' | 'pathology' | 'other';
  date: string;
  laboratory?: string;
  resultsSummary?: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'image';
}
