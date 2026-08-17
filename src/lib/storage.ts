import { INITIAL_PATIENTS, INITIAL_MEDICATIONS, INITIAL_VITALS, INITIAL_FAMILIES, INITIAL_EXPENSES, INITIAL_APPOINTMENTS, INITIAL_STUDIES } from './demoData';
import { Patient, Medication, DoseLog, VitalSign, FamilyMember, HealthExpense, MedicalAppointment, MedicalStudy, MonitoringCampaign } from '../types';

const STORAGE_KEYS = {
  PATIENTS: 'famhealth_patients_v1',
  MEDICATIONS: 'famhealth_medications_v1',
  DOSE_LOGS: 'famhealth_dose_logs_v1',
  VITALS: 'famhealth_vitals_v1',
  CAMPAIGNS: 'famhealth_campaigns_v1',
  FAMILIES: 'famhealth_families_v1',
  EXPENSES: 'famhealth_expenses_v1',
  APPOINTMENTS: 'famhealth_appointments_v1',
  STUDIES: 'famhealth_studies_v1',
  ACTIVE_PATIENT: 'famhealth_active_patient_v1'
};

function getOrInit<T>(key: string, defaultData: T): T {
  try {
    if (typeof localStorage === 'undefined') return defaultData;
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('Error reading storage for ' + key, e);
    return defaultData;
  }
}

function save<T>(key: string, data: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving storage for ' + key, e);
  }
}

export const LocalStore = {
  getPatients: () => getOrInit<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS),
  savePatients: (data: Patient[]) => save(STORAGE_KEYS.PATIENTS, data),

  getMedications: () => getOrInit<Medication[]>(STORAGE_KEYS.MEDICATIONS, INITIAL_MEDICATIONS),
  saveMedications: (data: Medication[]) => save(STORAGE_KEYS.MEDICATIONS, data),

  getDoseLogs: () => getOrInit<DoseLog[]>(STORAGE_KEYS.DOSE_LOGS, []),
  saveDoseLogs: (data: DoseLog[]) => save(STORAGE_KEYS.DOSE_LOGS, data),

  getVitals: () => getOrInit<VitalSign[]>(STORAGE_KEYS.VITALS, INITIAL_VITALS),
  saveVitals: (data: VitalSign[]) => save(STORAGE_KEYS.VITALS, data),

  getCampaigns: () => getOrInit<MonitoringCampaign[]>(STORAGE_KEYS.CAMPAIGNS, [
    {
      id: 'camp-1',
      patientId: 'patient-grandfather',
      name: 'Glucose & Blood Pressure Monitoring (3 Days)',
      vitalTypes: ['glucose', 'blood_pressure'],
      startDate: '2026-08-16',
      durationDays: 3,
      checksPerDay: 2,
      targetNotes: 'Control requested by Dr. Mendoza before checkup',
      isActive: true
    }
  ]),
  saveCampaigns: (data: MonitoringCampaign[]) => save(STORAGE_KEYS.CAMPAIGNS, data),

  getFamilies: () => getOrInit<FamilyMember[]>(STORAGE_KEYS.FAMILIES, INITIAL_FAMILIES),
  saveFamilies: (data: FamilyMember[]) => save(STORAGE_KEYS.FAMILIES, data),

  getExpenses: () => getOrInit<HealthExpense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
  saveExpenses: (data: HealthExpense[]) => save(STORAGE_KEYS.EXPENSES, data),

  getAppointments: () => getOrInit<MedicalAppointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS),
  saveAppointments: (data: MedicalAppointment[]) => save(STORAGE_KEYS.APPOINTMENTS, data),

  getStudies: () => getOrInit<MedicalStudy[]>(STORAGE_KEYS.STUDIES, INITIAL_STUDIES),
  saveStudies: (data: MedicalStudy[]) => save(STORAGE_KEYS.STUDIES, data),

  getActivePatientId: () => (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT) : null) || 'patient-grandfather',
  setActivePatientId: (id: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT, id);
  }
};
