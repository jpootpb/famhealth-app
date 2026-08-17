import { INITIAL_PATIENTS, INITIAL_MEDICATIONS, INITIAL_VITALS, INITIAL_FAMILIES, INITIAL_EXPENSES, INITIAL_APPOINTMENTS, INITIAL_STUDIES } from './demoData';
import { Paciente, Medicamento, TomaRegistro, SignoVital, Familiar, GastoSalud, CitaMedica, EstudioMedico, CampaniaMonitoreo } from '../types';

const STORAGE_KEYS = {
  PATIENTS: 'salud_pacientes_v1',
  MEDICATIONS: 'salud_medicamentos_v1',
  TOMAS: 'salud_tomas_v1',
  VITALS: 'salud_vitals_v1',
  CAMPAIGNS: 'salud_campaigns_v1',
  FAMILIES: 'salud_families_v1',
  EXPENSES: 'salud_expenses_v1',
  APPOINTMENTS: 'salud_appointments_v1',
  STUDIES: 'salud_studies_v1',
  ACTIVE_PATIENT: 'salud_active_patient_v1'
};

function getOrInit<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('Error reading localStorage for ' + key, e);
    return defaultData;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving localStorage for ' + key, e);
  }
}

export const LocalStore = {
  getPatients: () => getOrInit<Paciente[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS),
  savePatients: (data: Paciente[]) => save(STORAGE_KEYS.PATIENTS, data),

  getMedications: () => getOrInit<Medicamento[]>(STORAGE_KEYS.MEDICATIONS, INITIAL_MEDICATIONS),
  saveMedications: (data: Medicamento[]) => save(STORAGE_KEYS.MEDICATIONS, data),

  getTomas: () => getOrInit<TomaRegistro[]>(STORAGE_KEYS.TOMAS, []),
  saveTomas: (data: TomaRegistro[]) => save(STORAGE_KEYS.TOMAS, data),

  getVitals: () => getOrInit<SignoVital[]>(STORAGE_KEYS.VITALS, INITIAL_VITALS),
  saveVitals: (data: SignoVital[]) => save(STORAGE_KEYS.VITALS, data),

  getCampaigns: () => getOrInit<CampaniaMonitoreo[]>(STORAGE_KEYS.CAMPAIGNS, [
    {
      id: 'camp-1',
      pacienteId: 'paciente-abuelo',
      nombre: 'Monitoreo Glucosa & Presión (3 Días)',
      tiposSigno: ['glucosa', 'presion'],
      fechaInicio: '2026-08-16',
      duracionDias: 3,
      tomasPorDia: 2,
      objetivo: 'Control solicitado por Dr. Mendoza antes de consulta',
      activa: true
    }
  ]),
  saveCampaigns: (data: CampaniaMonitoreo[]) => save(STORAGE_KEYS.CAMPAIGNS, data),

  getFamilies: () => getOrInit<Familiar[]>(STORAGE_KEYS.FAMILIES, INITIAL_FAMILIES),
  saveFamilies: (data: Familiar[]) => save(STORAGE_KEYS.FAMILIES, data),

  getExpenses: () => getOrInit<GastoSalud[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
  saveExpenses: (data: GastoSalud[]) => save(STORAGE_KEYS.EXPENSES, data),

  getAppointments: () => getOrInit<CitaMedica[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS),
  saveAppointments: (data: CitaMedica[]) => save(STORAGE_KEYS.APPOINTMENTS, data),

  getStudies: () => getOrInit<EstudioMedico[]>(STORAGE_KEYS.STUDIES, INITIAL_STUDIES),
  saveStudies: (data: EstudioMedico[]) => save(STORAGE_KEYS.STUDIES, data),

  getActivePatientId: () => localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT) || 'paciente-abuelo',
  setActivePatientId: (id: string) => localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT, id)
};