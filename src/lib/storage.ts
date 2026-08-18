import {
  initialFamilyCircles,
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
  FamilyCircle,
  Patient,
  Medication,
  DoseLog,
  VitalSign,
  MonitoringCampaign,
  FamilyMember,
  HealthExpense,
  MedicalAppointment,
  MedicalStudy,
  UserAccount
} from '../types';

export const initialUsers: UserAccount[] = [
  {
    id: 'user-carlos',
    name: 'Carlos Poot (Cuidador)',
    email: 'carlos@famhealth.app',
    password: 'password123',
    activeFamilyId: 'circle-poot',
    joinedFamilyIds: ['circle-poot', 'circle-gomez'] // Has access to both Dad & In-laws
  },
  {
    id: 'user-claudia',
    name: 'Claudia Gómez (Esposa)',
    email: 'claudia@famhealth.app',
    password: 'password123',
    activeFamilyId: 'circle-gomez',
    joinedFamilyIds: ['circle-gomez'] // Only has access to her own parents
  },
  {
    id: 'user-laura',
    name: 'Laura Poot (Prima - Uso Personal)',
    email: 'laura@famhealth.app',
    password: 'password123',
    activeFamilyId: 'circle-personal-laura',
    joinedFamilyIds: ['circle-personal-laura'] // Only personal self-care
  }
];

export const guestUser: UserAccount = {
  id: 'guest',
  name: 'Invitado',
  email: 'guest@famhealth.app',
  activeFamilyId: '',
  joinedFamilyIds: []
};

const STORAGE_KEYS = {
  USERS: 'famhealth_users',
  CURRENT_USER: 'famhealth_current_user',
  FAMILY_CIRCLES: 'famhealth_family_circles',
  ACTIVE_FAMILY_ID: 'famhealth_active_family_id',
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
  // Users & Auth
  getUsers: (): UserAccount[] => safeGet<UserAccount[]>(STORAGE_KEYS.USERS, initialUsers),
  saveUsers: (users: UserAccount[]) => safeSet(STORAGE_KEYS.USERS, users),

  getCurrentUser: (): UserAccount => safeGet<UserAccount>(STORAGE_KEYS.CURRENT_USER, guestUser),
  saveCurrentUser: (user: UserAccount) => safeSet(STORAGE_KEYS.CURRENT_USER, user),

  // Family Circles
  getFamilyCircles: (): FamilyCircle[] => safeGet<FamilyCircle[]>(STORAGE_KEYS.FAMILY_CIRCLES, initialFamilyCircles),
  saveFamilyCircles: (circles: FamilyCircle[]) => safeSet(STORAGE_KEYS.FAMILY_CIRCLES, circles),

  getActiveFamilyId: (): string => {
    return safeGet<string>(STORAGE_KEYS.ACTIVE_FAMILY_ID, '');
  },
  setActiveFamilyId: (id: string) => safeSet(STORAGE_KEYS.ACTIVE_FAMILY_ID, id),

  // Patients
  getPatients: (): Patient[] => safeGet<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients),
  savePatients: (patients: Patient[]) => safeSet(STORAGE_KEYS.PATIENTS, patients),

  getActivePatientId: (): string => {
    return safeGet<string>(STORAGE_KEYS.ACTIVE_PATIENT_ID, '');
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

  // Families (Caregivers in family)
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
