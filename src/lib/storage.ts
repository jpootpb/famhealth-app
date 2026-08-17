import {
  initialPatients,
  initialMedications,
  initialDoseLogs,
  initialVitals,
  initialCampaigns,
  initialFamilies,
  initialExpenses,
  initialAppointments,
  initialStudies
} from './demoData';
import {
  Patient,
  Medication,
  DoseLog,
  VitalSign,
  MonitoringCampaign,
  FamilyMember,
  HealthExpense,
  MedicalAppointment,
  MedicalStudy
} from '../types';

const STORAGE_KEYS = {
  PATIENTS: 'famhealth_patients',
  ACTIVE_PATIENT_ID: 'famhealth_active_patient_id',
  MEDICATIONS: 'famhealth_medications',
  DOSE_LOGS: 'famhealth_dose_logs',
  VITALS: 'famhealth_vitals',
  CAMPAIGNS: 'famhealth_campaigns',
  FAMILIES: 'famhealth_families',
  EXPENSES: 'famhealth_expenses',
  APPOINTMENTS: 'famhealth_appointments',
  STUDIES: 'famhealth_studies'
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error loading storage key ${key}:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving storage key ${key}:`, err);
  }
}

export const LocalStore = {
  // Patients
  getPatients: (): Patient[] => safeGet<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients),
  savePatients: (patients: Patient[]) => safeSet(STORAGE_KEYS.PATIENTS, patients),

  getActivePatientId: (): string => {
    return safeGet<string>(STORAGE_KEYS.ACTIVE_PATIENT_ID, 'patient-grandfather');
  },
  setActivePatientId: (id: string) => safeSet(STORAGE_KEYS.ACTIVE_PATIENT_ID, id),

  // Medications
  getMedications: (): Medication[] => safeGet<Medication[]>(STORAGE_KEYS.MEDICATIONS, initialMedications),
  saveMedications: (meds: Medication[]) => safeSet(STORAGE_KEYS.MEDICATIONS, meds),

  // Dose Logs
  getDoseLogs: (): DoseLog[] => safeGet<DoseLog[]>(STORAGE_KEYS.DOSE_LOGS, initialDoseLogs),
  saveDoseLogs: (logs: DoseLog[]) => safeSet(STORAGE_KEYS.DOSE_LOGS, logs),

  // Vitals
  getVitals: (): VitalSign[] => safeGet<VitalSign[]>(STORAGE_KEYS.VITALS, initialVitals),
  saveVitals: (vitals: VitalSign[]) => safeSet(STORAGE_KEYS.VITALS, vitals),

  // Campaigns
  getCampaigns: (): MonitoringCampaign[] => safeGet<MonitoringCampaign[]>(STORAGE_KEYS.CAMPAIGNS, initialCampaigns),
  saveCampaigns: (campaigns: MonitoringCampaign[]) => safeSet(STORAGE_KEYS.CAMPAIGNS, campaigns),

  // Families
  getFamilies: (): FamilyMember[] => safeGet<FamilyMember[]>(STORAGE_KEYS.FAMILIES, initialFamilies),
  saveFamilies: (families: FamilyMember[]) => safeSet(STORAGE_KEYS.FAMILIES, families),

  // Expenses
  getExpenses: (): HealthExpense[] => safeGet<HealthExpense[]>(STORAGE_KEYS.EXPENSES, initialExpenses),
  saveExpenses: (expenses: HealthExpense[]) => safeSet(STORAGE_KEYS.EXPENSES, expenses),

  // Appointments
  getAppointments: (): MedicalAppointment[] => safeGet<MedicalAppointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments),
  saveAppointments: (appointments: MedicalAppointment[]) => safeSet(STORAGE_KEYS.APPOINTMENTS, appointments),

  // Studies
  getStudies: (): MedicalStudy[] => safeGet<MedicalStudy[]>(STORAGE_KEYS.STUDIES, initialStudies),
  saveStudies: (studies: MedicalStudy[]) => safeSet(STORAGE_KEYS.STUDIES, studies),

  // Full Reset
  resetToDefaults: () => {
    if (typeof localStorage === 'undefined') return;
    localStorage.clear();
  }
};
