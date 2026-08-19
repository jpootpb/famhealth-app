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
  'patient-laura'
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
  // Keep all patients that are NOT hardcoded demo IDs
  let cleanPatients = state.patients.filter(p => !DEMO_PATIENT_IDS.includes(p.id));

  // If user only had demo patients or nothing, keep existing or let it be clean
  const realPatientIds = new Set(cleanPatients.map(p => p.id));

  const cleanMedications = state.medications.filter(m => realPatientIds.has(m.patientId));
  const cleanDoseLogs = state.doseLogs.filter(d => realPatientIds.has(d.patientId));
  const cleanVitals = state.vitals.filter(v => realPatientIds.has(v.patientId));
  const cleanCampaigns = state.campaigns.filter(c => realPatientIds.has(c.patientId));
  const cleanExpenses = state.expenses.filter(e => realPatientIds.has(e.patientId));
  const cleanAppointments = state.appointments.filter(a => realPatientIds.has(a.patientId));
  const cleanStudies = state.studies.filter(s => realPatientIds.has(s.patientId));
  const cleanBookingReminders = state.bookingReminders.filter(r => realPatientIds.has(r.patientId));

  // Keep family members (caregivers) that are not demo dummy
  const cleanFamilies = state.families.filter(f => !f.id.includes('demo') && f.name !== 'Laura Poot');

  // Keep users (ensure current user is preserved)
  const cleanUsers = (state.users || []).filter(u => u.id === state.currentUserId || !DEMO_USER_IDS.includes(u.id));

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
  return patients.some(p => !DEMO_PATIENT_IDS.includes(p.id));
}
