import {
  Patient,
  Medication,
  DoseLog,
  VitalSign,
  MonitoringCampaign,
  FamilyMember,
  HealthExpense,
  MedicalAppointment,
  MedicalStudy,
  FutureBookingReminder,
  FamilyCircle,
  UserAccount
} from '../types';

export const DEMO_PATIENT_IDS = [
  'patient-grandfather',
  'patient-maria',
  'patient-claudia-mother',
  'patient-laura',
  'patient-demo-manuel',
  'patient-demo-maria'
];

export const DEMO_NAMES = [
  'roberto gómez',
  'roberto gomez',
  'laura poot',
  'claudia gómez',
  'claudia gomez',
  'doña maría',
  'dona maria',
  'demo pruebas',
  'carlos gómez',
  'carlos gomez'
];

export const DEMO_CIRCLE_IDS = [
  'circle-gomez',
  'circle-personal-laura'
];

export const DEMO_USER_IDS = [
  'user-carlos',
  'user-claudia',
  'user-laura'
];

export interface CleanedProductionState {
  patients: Patient[];
  medications: Medication[];
  doseLogs: DoseLog[];
  vitals: VitalSign[];
  campaigns: MonitoringCampaign[];
  families: FamilyMember[];
  expenses: HealthExpense[];
  appointments: MedicalAppointment[];
  studies: MedicalStudy[];
  bookingReminders: FutureBookingReminder[];
  familyCircles: FamilyCircle[];
  users: UserAccount[];
}

export function isDemoNameOrId(id?: string, name?: string): boolean {
  if (id && DEMO_PATIENT_IDS.includes(id)) return true;
  if (name) {
    const lower = name.toLowerCase();
    if (DEMO_NAMES.some(d => lower.includes(d))) return true;
  }
  return false;
}

export function purgeDemoArtifacts(state: {
  patients: Patient[];
  medications: Medication[];
  doseLogs: DoseLog[];
  vitals: VitalSign[];
  campaigns: MonitoringCampaign[];
  families: FamilyMember[];
  expenses: HealthExpense[];
  appointments: MedicalAppointment[];
  studies: MedicalStudy[];
  bookingReminders: FutureBookingReminder[];
  familyCircles?: FamilyCircle[];
  users?: UserAccount[];
  currentUserId?: string;
}): CleanedProductionState {
  // 1. Remove all fake demo patients
  const nonDemoPatients = state.patients.filter(p => !isDemoNameOrId(p.id, p.name));

  // Deduplicate patients by normalized name
  const seenPatientNames = new Set<string>();
  const cleanPatients: Patient[] = [];
  for (const p of nonDemoPatients) {
    const key = p.name.trim().toLowerCase();
    if (!seenPatientNames.has(key)) {
      seenPatientNames.add(key);
      cleanPatients.push(p);
    }
  }

  const realPatientIds = new Set(cleanPatients.map(p => p.id));

  // 2. Clean medications (drop demo meds and deduplicate)
  const nonDemoMeds = state.medications.filter(m => {
    if (m.name.toLowerCase().includes('losartán') && !m.patientId) return false;
    if (m.name.toLowerCase().includes('atorvastatina') && !m.patientId) return false;
    if (isDemoNameOrId(m.id, m.name)) return false;
    if (m.patientId && !realPatientIds.has(m.patientId)) return false;
    return true;
  });

  const seenMeds = new Set<string>();
  const cleanMedications: Medication[] = [];
  for (const m of nonDemoMeds) {
    const key = `${m.patientId || ''}-${m.name.trim().toLowerCase()}`;
    if (!seenMeds.has(key)) {
      seenMeds.add(key);
      cleanMedications.push(m);
    }
  }

  const cleanMedIds = new Set(cleanMedications.map(m => m.id));

  const cleanDoseLogs = state.doseLogs.filter(d => {
    if (d.medicationId && !cleanMedIds.has(d.medicationId)) return false;
    if (d.patientId && !realPatientIds.has(d.patientId)) return false;
    return true;
  });

  const cleanVitals = state.vitals.filter(v => !v.patientId || realPatientIds.has(v.patientId));
  const cleanCampaigns = state.campaigns.filter(c => !c.patientId || realPatientIds.has(c.patientId));
  const cleanExpenses = state.expenses.filter(e => !e.patientId || realPatientIds.has(e.patientId));
  const cleanAppointments = state.appointments.filter(a => !a.patientId || realPatientIds.has(a.patientId));
  const cleanStudies = state.studies.filter(s => !s.patientId || realPatientIds.has(s.patientId));
  const cleanBookingReminders = state.bookingReminders.filter(r => !r.patientId || realPatientIds.has(r.patientId));

  // Keep family members (caregivers) that are not demo dummy
  const cleanFamilies = state.families.filter(f => !isDemoNameOrId(f.id, f.name));

  // Keep users (ensure current user is preserved)
  const cleanUsers = (state.users || []).filter(u => u.id === state.currentUserId || (!DEMO_USER_IDS.includes(u.id) && !isDemoNameOrId(u.id, u.name)));

  // Keep primary family circles
  const cleanCircles = (state.familyCircles || []).filter(c => !DEMO_CIRCLE_IDS.includes(c.id));

  return {
    patients: cleanPatients,
    medications: cleanMedications,
    doseLogs: cleanDoseLogs,
    vitals: cleanVitals,
    campaigns: cleanCampaigns,
    families: cleanFamilies,
    expenses: cleanExpenses,
    appointments: cleanAppointments,
    studies: cleanStudies,
    bookingReminders: cleanBookingReminders,
    familyCircles: cleanCircles.length > 0 ? cleanCircles : (state.familyCircles || []),
    users: cleanUsers.length > 0 ? cleanUsers : (state.users || [])
  };
}

export function hasUserRealCustomData(patients: Patient[]): boolean {
  return patients.some(p => !isDemoNameOrId(p.id, p.name));
}
