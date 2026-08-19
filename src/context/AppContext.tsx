import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  FutureBookingReminder,
  RoutineLog,
  DailyCareRoutine,
  UserAccount
} from '../types';
import { LocalStore, guestUser } from '../lib/storage';
import { sendLocalNotification } from '../lib/notifications';
import { formatDateIso } from '../utils/frequencyEngine';
import { generateFamilyInviteCode } from '../utils/familyEngine';
import { getUserVisibleFamilyCircles, joinFamilyWithCode, isUserAuthenticated } from '../utils/authEngine';
import {
  ensureBatches,
  deductDoseFromBatches,
  finishActiveBoxOrBatch,
  switchActiveBatch,
  adjustBatchStockUnits,
  addNewBatchToMedication
} from '../utils/medicationBatchEngine';
import { purgeDemoArtifacts, hasUserRealCustomData } from '../utils/demoPurgeEngine';
import {
  exportFamilySyncPayload,
  parseAndValidateFamilySyncPayload,
  pushFamilyDataToCloud,
  pullFamilyDataFromCloud,
  subscribeToFamilyCloudUpdates
} from '../lib/cloudSyncEngine';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface AppContextType {
  // Auth & Current User
  currentUser: UserAccount;
  isAuthenticated: boolean;
  allUsers: UserAccount[];
  switchUser: (userId: string) => void;
  loginUser: (email: string, password?: string) => boolean;
  registerUser: (name: string, email: string, password?: string) => UserAccount;
  resetUserPassword: (email: string, newPassword: string) => boolean;
  loginWithSocialProvider: (provider: 'google' | 'facebook' | 'microsoft', email?: string, name?: string) => UserAccount;
  logoutUser: () => void;

  // Family Spaces
  familyCircles: FamilyCircle[];
  allFamilyCircles: FamilyCircle[];
  activeFamilyCircle: FamilyCircle | undefined;
  currentFamilyId: string;
  setActiveFamilyId: (id: string) => void;
  createFamilyCircle: (name: string, isPersonal?: boolean) => FamilyCircle;
  joinFamilyCircleByCode: (code: string) => boolean;
  exportFamilyBackup: () => string;
  importFamilyBackup: (jsonStr: string) => { success: boolean; error?: string };

  // Patients
  patients: Patient[];
  allPatients: Patient[];
  activePatient: Patient | undefined;
  setActivePatientId: (id: string) => void;
  addPatient: (p: Omit<Patient, 'id'>) => void;
  updatePatient: (p: Patient) => void;

  // Medications
  medications: Medication[];
  addMedication: (m: Omit<Medication, 'id'>) => void;
  updateMedication: (m: Medication) => void;
  deleteMedication: (id: string) => void;
  completeMedication: (id: string, reason?: 'bottle_finished' | 'doctor_stopped' | 'treatment_completed' | 'other', notes?: string) => void;
  consumeBottle: (id: string, reason?: 'bottle_finished' | 'doctor_stopped' | 'treatment_completed' | 'other', notes?: string) => boolean;
  restockMedication: (id: string, params: {
    quantityToAdd?: number;
    boxesCount?: number;
    unitsPerBox?: number;
    bottlesToAdd?: number;
    cost?: number;
    preferredStore?: string;
    isMedicalSample?: boolean;
    sampleNotes?: string;
  }) => void;
  reactivateMedication: (id: string, newStock?: number) => void;
  customPharmacies: string[];
  addCustomPharmacy: (pharmacyName: string) => void;
  switchActiveMedicationBatch: (medicationId: string, targetBatchId: string) => void;
  finishActiveMedicationBox: (medicationId: string, reason?: 'depleted' | 'manual_box_finish' | 'expired' | 'damaged' | 'lost', notes?: string) => { transitioned: boolean; nextBatch?: import('../types').MedicationBatch; remainingBoxesInBatch: number };
  adjustMedicationBatchStock: (medicationId: string, batchId: string, newUnits: number, reason?: string, newBoxes?: number) => void;
  addMedicationBatch: (medicationId: string, batchData: {
    laboratory?: string;
    boxesCount: number;
    unitsPerBox: number;
    cost?: number;
    expirationDate?: string;
    imageUrl?: string;
    preferredStore?: string;
    isMedicalSample?: boolean;
    sampleNotes?: string;
    activateNow?: boolean;
    name?: string;
  }) => void;

  // Doses
  doseLogs: DoseLog[];
  toggleDoseTaken: (medicationId: string, scheduledTime: string, dateStr?: string, administeredBy?: string) => void;

  // Daily Care Routines (Meals, Bath, Wound Care, Exercise)
  routineLogs: RoutineLog[];
  toggleRoutineCompleted: (patientId: string, routineType: 'breakfast' | 'lunch' | 'dinner' | 'bath' | 'wound_care' | 'exercise', scheduledTime: string, dateStr?: string, completedBy?: string) => void;
  updatePatientRoutines: (patientId: string, routines: DailyCareRoutine) => void;

  // Vitals
  vitals: VitalSign[];
  addVital: (v: Omit<VitalSign, 'id'>) => void;
  deleteVital: (id: string) => void;

  // Campaigns
  campaigns: MonitoringCampaign[];
  addCampaign: (c: Omit<MonitoringCampaign, 'id'>) => void;
  toggleCampaignStatus: (id: string) => void;

  // Caregivers
  families: FamilyMember[];
  addFamilyMember: (f: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (f: FamilyMember) => void;
  deleteFamilyMember: (id: string) => void;

  // Expenses
  expenses: HealthExpense[];
  addExpense: (e: Omit<HealthExpense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Appointments
  appointments: MedicalAppointment[];
  addAppointment: (a: Omit<MedicalAppointment, 'id'>) => void;
  updateAppointment: (a: MedicalAppointment) => void;
  deleteAppointment: (id: string) => void;
  toggleAppointmentCompleted: (id: string) => void;

  // Future Booking Reminders (Apertura de Agenda)
  bookingReminders: FutureBookingReminder[];
  addBookingReminder: (r: Omit<FutureBookingReminder, 'id'>) => void;
  updateBookingReminder: (r: FutureBookingReminder) => void;
  deleteBookingReminder: (id: string) => void;
  confirmBookingReminderToAppointment: (reminderId: string, appointmentDateTime: string, location?: string, notes?: string) => void;

  // Studies
  studies: MedicalStudy[];
  addStudy: (s: Omit<MedicalStudy, 'id'>) => void;
  deleteStudy: (id: string) => void;

  // Clean Production Purge
  purgeAllDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => LocalStore.getUsers());
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => LocalStore.getCurrentUser());

  const [allFamilyCircles, setAllFamilyCircles] = useState<FamilyCircle[]>(() => LocalStore.getFamilyCircles());
  const [activeFamilyId, setActiveFamilyIdState] = useState<string>(() => currentUser.activeFamilyId || LocalStore.getActiveFamilyId());

  const [allPatients, setAllPatients] = useState<Patient[]>(() => LocalStore.getPatients());
  const [activePatientId, setActivePatientIdState] = useState<string>(() => LocalStore.getActivePatientId());
  const [allMedications, setAllMedications] = useState<Medication[]>(() => LocalStore.getMedications());
  const [allDoseLogs, setAllDoseLogs] = useState<DoseLog[]>(() => LocalStore.getDoseLogs());
  const [allVitals, setAllVitals] = useState<VitalSign[]>(() => LocalStore.getVitals());
  const [allCampaigns, setAllCampaigns] = useState<MonitoringCampaign[]>(() => LocalStore.getCampaigns());
  const [allFamilies, setAllFamilies] = useState<FamilyMember[]>(() => LocalStore.getFamilies());
  const [allExpenses, setAllExpenses] = useState<HealthExpense[]>(() => LocalStore.getExpenses());
  const [allAppointments, setAllAppointments] = useState<MedicalAppointment[]>(() => LocalStore.getAppointments());
  const [allBookingReminders, setAllBookingReminders] = useState<FutureBookingReminder[]>(() => LocalStore.getBookingReminders());
  const [allRoutineLogs, setAllRoutineLogs] = useState<RoutineLog[]>(() => LocalStore.getRoutineLogs());
  const [allStudies, setAllStudies] = useState<MedicalStudy[]>(() => LocalStore.getStudies());
  const [customPharmacies, setCustomPharmacies] = useState<string[]>(() => LocalStore.getCustomPharmacies());

  const isAuthenticated = isUserAuthenticated(currentUser);

  // Sync state changes to storage
  useEffect(() => { LocalStore.saveUsers(allUsers); }, [allUsers]);
  useEffect(() => { LocalStore.saveCurrentUser(currentUser); }, [currentUser]);
  useEffect(() => { LocalStore.saveFamilyCircles(allFamilyCircles); }, [allFamilyCircles]);
  useEffect(() => { LocalStore.setActiveFamilyId(activeFamilyId); }, [activeFamilyId]);
  useEffect(() => { LocalStore.savePatients(allPatients); }, [allPatients]);
  useEffect(() => { LocalStore.setActivePatientId(activePatientId); }, [activePatientId]);
  useEffect(() => { LocalStore.saveMedications(allMedications); }, [allMedications]);
  useEffect(() => { LocalStore.saveDoseLogs(allDoseLogs); }, [allDoseLogs]);
  useEffect(() => { LocalStore.saveRoutineLogs(allRoutineLogs); }, [allRoutineLogs]);
  useEffect(() => { LocalStore.saveVitals(allVitals); }, [allVitals]);
  useEffect(() => { LocalStore.saveCampaigns(allCampaigns); }, [allCampaigns]);
  useEffect(() => { LocalStore.saveFamilies(allFamilies); }, [allFamilies]);
  useEffect(() => { LocalStore.saveExpenses(allExpenses); }, [allExpenses]);
  useEffect(() => { LocalStore.saveAppointments(allAppointments); }, [allAppointments]);
  useEffect(() => { LocalStore.saveBookingReminders(allBookingReminders); }, [allBookingReminders]);
  useEffect(() => { LocalStore.saveStudies(allStudies); }, [allStudies]);
  useEffect(() => { LocalStore.saveCustomPharmacies(customPharmacies); }, [customPharmacies]);

  // Auto-heal current user & reconcile default family circles across devices
  useEffect(() => {
    // 1. Deduplicate any multiple "Familia Poot Ibarra" circles into ONE single circle
    const ibarraCircles = allFamilyCircles.filter(c => c.name.toLowerCase().includes('ibarra') || c.id === 'circle-poot-ibarra');
    if (ibarraCircles.length > 1) {
      const primaryId = 'circle-poot-ibarra';
      const duplicateIds = new Set(ibarraCircles.map(c => c.id).filter(id => id !== primaryId));

      // Migrate all entities from duplicate circles to primary circle-poot-ibarra
      setAllPatients(prev => prev.map(p => duplicateIds.has(p.familyId || '') ? { ...p, familyId: primaryId } : p));
      setAllMedications(prev => prev.map(m => duplicateIds.has(m.familyId || '') ? { ...m, familyId: primaryId } : m));
      setAllDoseLogs(prev => prev.map(d => duplicateIds.has(d.familyId || '') ? { ...d, familyId: primaryId } : d));
      setAllVitals(prev => prev.map(v => duplicateIds.has(v.familyId || '') ? { ...v, familyId: primaryId } : v));
      setAllExpenses(prev => prev.map(e => duplicateIds.has(e.familyId || '') ? { ...e, familyId: primaryId } : e));
      setAllAppointments(prev => prev.map(a => duplicateIds.has(a.familyId || '') ? { ...a, familyId: primaryId } : a));
      setAllStudies(prev => prev.map(s => duplicateIds.has(s.familyId || '') ? { ...s, familyId: primaryId } : s));

      // Deduplicate the circles list
      setAllFamilyCircles(prev => {
        const seen = new Set<string>();
        return prev.filter(c => {
          if (duplicateIds.has(c.id)) return false;
          if (c.name.toLowerCase().includes('ibarra')) {
            if (seen.has('ibarra')) return false;
            seen.add('ibarra');
          }
          return true;
        });
      });

      if (duplicateIds.has(activeFamilyId)) {
        setActiveFamilyIdState(primaryId);
      }
    } else if (ibarraCircles.length === 0) {
      const ibarraCircle: FamilyCircle = {
        id: 'circle-poot-ibarra',
        name: 'Familia Poot Ibarra',
        inviteCode: 'IBARRA-2026',
        createdAt: '2026-08-18'
      };
      setAllFamilyCircles(prev => [ibarraCircle, ...prev]);
    }

    // 2. If current user is jpoot@outlook.com or jose@famhealth.app, ensure circle-poot-ibarra is active
    if (currentUser && currentUser.id !== 'guest' && (currentUser.email === 'jpoot@outlook.com' || currentUser.email === 'jose@famhealth.app')) {
      const updatedIds = Array.from(new Set(['circle-poot-ibarra', ...(currentUser.joinedFamilyIds || ['circle-poot-ibarra'])]));
      const updatedUser: UserAccount = {
        ...currentUser,
        activeFamilyId: 'circle-poot-ibarra',
        joinedFamilyIds: updatedIds
      };
      if (currentUser.activeFamilyId !== 'circle-poot-ibarra' || currentUser.joinedFamilyIds?.length !== updatedIds.length) {
        setCurrentUser(updatedUser);
        setActiveFamilyIdState('circle-poot-ibarra');
        setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      }
    } else if (currentUser && currentUser.id !== 'guest' && (!currentUser.joinedFamilyIds || currentUser.joinedFamilyIds.length === 0)) {
      const defaultFamIds = allFamilyCircles.map(c => c.id);
      const healedUser: UserAccount = {
        ...currentUser,
        activeFamilyId: currentUser.activeFamilyId || allFamilyCircles[0]?.id || '',
        joinedFamilyIds: defaultFamIds
      };
      setCurrentUser(healedUser);
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? healedUser : u));
    }
  }, [allFamilyCircles, currentUser]);

  // Family circles visible to current logged-in user (with fallback to allFamilyCircles if empty)
  const userCircles = getUserVisibleFamilyCircles(currentUser, allFamilyCircles);
  const familyCircles = userCircles.length > 0 ? userCircles : allFamilyCircles;

  const activeFamilyCircle = familyCircles.find(c => c.id === activeFamilyId) || familyCircles[0] || allFamilyCircles[0];
  const currentFamilyId = activeFamilyCircle ? activeFamilyCircle.id : (allFamilyCircles[0]?.id || '');

  const purgeAllDemoData = () => {
    const cleaned = purgeDemoArtifacts({
      patients: allPatients,
      medications: allMedications,
      doseLogs: allDoseLogs,
      vitals: allVitals,
      campaigns: allCampaigns,
      families: allFamilies,
      expenses: allExpenses,
      appointments: allAppointments,
      studies: allStudies,
      bookingReminders: allBookingReminders,
      familyCircles: allFamilyCircles,
      users: allUsers,
      currentUserId: currentUser.id
    });

    setAllPatients(cleaned.patients);
    setAllMedications(cleaned.medications);
    setAllDoseLogs(cleaned.doseLogs);
    setAllVitals(cleaned.vitals);
    setAllCampaigns(cleaned.campaigns);
    setAllFamilies(cleaned.families);
    setAllExpenses(cleaned.expenses);
    setAllAppointments(cleaned.appointments);
    setAllStudies(cleaned.studies);
    setAllBookingReminders(cleaned.bookingReminders);
    setAllFamilyCircles(cleaned.familyCircles);
    setAllUsers(cleaned.users);

    if (cleaned.patients.length > 0) {
      setActivePatientIdState(cleaned.patients[0].id);
    }
  };

  // Auto-clean demo mock data when user has registered real custom patients (e.g. Sara Burgos Uc)
  useEffect(() => {
    if (hasUserRealCustomData(allPatients) && allPatients.some(p => p.id === 'patient-grandfather' || p.id === 'patient-maria')) {
      purgeAllDemoData();
    }
  }, [allPatients]);

  // Normalize and bridge entities to primary family circle 'circle-poot-ibarra'
  useEffect(() => {
    setAllPatients(prev => prev.map(p => (!p.familyId || p.familyId === 'circle-poot') ? { ...p, familyId: 'circle-poot-ibarra' } : p));
    setAllMedications(prev => prev.map(m => (!m.familyId || m.familyId === 'circle-poot') ? { ...m, familyId: 'circle-poot-ibarra' } : m));
    setAllDoseLogs(prev => prev.map(d => (!d.familyId || d.familyId === 'circle-poot') ? { ...d, familyId: 'circle-poot-ibarra' } : d));
    setAllVitals(prev => prev.map(v => (!v.familyId || v.familyId === 'circle-poot') ? { ...v, familyId: 'circle-poot-ibarra' } : v));
    setAllExpenses(prev => prev.map(e => (!e.familyId || e.familyId === 'circle-poot') ? { ...e, familyId: 'circle-poot-ibarra' } : e));
    setAllAppointments(prev => prev.map(a => (!a.familyId || a.familyId === 'circle-poot') ? { ...a, familyId: 'circle-poot-ibarra' } : a));
    setAllStudies(prev => prev.map(s => (!s.familyId || s.familyId === 'circle-poot') ? { ...s, familyId: 'circle-poot-ibarra' } : s));
  }, []);

  // Strict entity filtering by active family circle (Zero Cross-Circle Contamination + Patient Ownership)
  const patients = allPatients.filter(p => {
    const fam = p.familyId || 'circle-poot-ibarra';
    return fam === currentFamilyId || (currentFamilyId === 'circle-poot-ibarra' && fam === 'circle-poot');
  });
  const patientIdSet = new Set(patients.map(p => p.id));

  const medications = allMedications.filter(m => {
    const fam = m.familyId || 'circle-poot-ibarra';
    return fam === currentFamilyId || (currentFamilyId === 'circle-poot-ibarra' && fam === 'circle-poot') || (m.patientId && patientIdSet.has(m.patientId));
  });
  const doseLogs = allDoseLogs.filter(d => {
    const fam = d.familyId || 'circle-poot-ibarra';
    return fam === currentFamilyId || (currentFamilyId === 'circle-poot-ibarra' && fam === 'circle-poot') || (d.patientId && patientIdSet.has(d.patientId));
  });
  const vitals = allVitals.filter(v => {
    const fam = v.familyId || 'circle-poot-ibarra';
    return fam === currentFamilyId || (currentFamilyId === 'circle-poot-ibarra' && fam === 'circle-poot') || (v.patientId && patientIdSet.has(v.patientId));
  });
  const campaigns = allCampaigns.filter(c => {
    const fam = c.familyId || 'circle-poot-ibarra';
    return fam === currentFamilyId || (currentFamilyId === 'circle-poot-ibarra' && fam === 'circle-poot') || (c.patientId && patientIdSet.has(c.patientId));
  });
  const families = allFamilies.filter(f => (f.familyId || 'circle-poot-ibarra') === currentFamilyId);
  const expenses = allExpenses.filter(e => {
    const fam = e.familyId || 'circle-poot-ibarra';
    return fam === currentFamilyId || (currentFamilyId === 'circle-poot-ibarra' && fam === 'circle-poot') || (e.patientId && patientIdSet.has(e.patientId));
  });
  const appointments = allAppointments.filter(a => {
    const fam = a.familyId || 'circle-poot-ibarra';
    return fam === currentFamilyId || (currentFamilyId === 'circle-poot-ibarra' && fam === 'circle-poot') || (a.patientId && patientIdSet.has(a.patientId));
  });
  const bookingReminders = allBookingReminders.filter(r => (r.familyId || 'circle-poot') === currentFamilyId || (r.patientId && patientIdSet.has(r.patientId)));
  const studies = allStudies.filter(s => (s.familyId || 'circle-poot') === currentFamilyId || (s.patientId && patientIdSet.has(s.patientId)));

  // Active Patient inside current family (undefined if current family has 0 patients)
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  const switchUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    setCurrentUser(user);
    const visible = getUserVisibleFamilyCircles(user, allFamilyCircles);
    const newActiveFamId = visible.length > 0 ? (visible.find(c => c.id === user.activeFamilyId)?.id || visible[0].id) : '';
    setActiveFamilyIdState(newActiveFamId);

    const familyPatients = allPatients.filter(p => (p.familyId || 'circle-poot') === newActiveFamId);
    setActivePatientIdState(familyPatients.length > 0 ? familyPatients[0].id : '');
  };

  const loginUser = (email: string, password?: string): boolean => {
    const user = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user) {
      switchUser(user.id);
      return true;
    }
    return false;
  };

  const registerUser = (name: string, email: string, password?: string): UserAccount => {
    const initialFamId = allFamilyCircles[0]?.id || 'circle-poot';
    const initialFamList = allFamilyCircles.map(c => c.id);
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      const updated = { ...existing, name: name.trim() || existing.name, password: password || existing.password || '123' };
      setAllUsers(prev => prev.map(u => u.id === existing.id ? updated : u));
      setCurrentUser(updated);
      switchUser(existing.id);
      return updated;
    }

    const newUser: UserAccount = {
      id: 'user-' + Date.now(),
      name: name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: password || '123',
      activeFamilyId: initialFamId,
      joinedFamilyIds: initialFamList.length > 0 ? initialFamList : ['circle-poot']
    };

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setActiveFamilyIdState(initialFamId);
    return newUser;
  };

  const resetUserPassword = (email: string, newPassword: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (user) {
      const updatedUser = { ...user, password: newPassword };
      setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      switchUser(user.id);
      return true;
    }
    // If not found in current local session, register it with this password
    const newUser = registerUser(cleanEmail.split('@')[0], cleanEmail, newPassword);
    switchUser(newUser.id);
    return true;
  };

  const loginWithSocialProvider = (
    provider: 'google' | 'facebook' | 'microsoft',
    customEmail?: string,
    customName?: string
  ): UserAccount => {
    let targetEmail = (customEmail || '').trim().toLowerCase();
    let targetName = (customName || '').trim();

    if (!targetEmail) {
      if (provider === 'google') {
        targetEmail = 'jpoot@gmail.com';
        targetName = targetName || 'José Manuel Poot (Google)';
      } else if (provider === 'facebook') {
        targetEmail = 'jpoot.facebook@famhealth.app';
        targetName = targetName || 'José Manuel Poot (Facebook)';
      } else if (provider === 'microsoft') {
        targetEmail = 'jpoot@outlook.com';
        targetName = targetName || 'José Manuel Poot (Outlook)';
      }
    }

    const existing = allUsers.find(u => u.email.toLowerCase() === targetEmail);
    if (existing) {
      switchUser(existing.id);
      return existing;
    }

    return registerUser(targetName || 'Usuario', targetEmail, '123');
  };

  const logoutUser = () => {
    setCurrentUser(guestUser);
    setActiveFamilyIdState('');
    setActivePatientIdState('');
  };

  const setActiveFamilyId = (id: string) => {
    setActiveFamilyIdState(id);
    setCurrentUser(prev => ({ ...prev, activeFamilyId: id }));

    // When switching family, auto-select the first patient of that family or empty if brand new
    const familyPatients = allPatients.filter(p => (p.familyId || 'circle-poot') === id);
    setActivePatientIdState(familyPatients.length > 0 ? familyPatients[0].id : '');
  };

  const createFamilyCircle = (name: string, isPersonal: boolean = false): FamilyCircle => {
    const inviteCode = generateFamilyInviteCode(name);
    const newCircle: FamilyCircle = {
      id: 'circle-' + Date.now(),
      name: name.trim(),
      inviteCode,
      createdAt: formatDateIso(new Date()),
      ownerEmail: currentUser.email,
      isPersonalSpace: isPersonal
    };

    setAllFamilyCircles(prev => [...prev, newCircle]);

    // Attach to current user
    const updatedJoined = [...currentUser.joinedFamilyIds, newCircle.id];
    const updatedUser = {
      ...currentUser,
      joinedFamilyIds: updatedJoined,
      activeFamilyId: newCircle.id
    };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setActiveFamilyIdState(newCircle.id);
    setActivePatientIdState(''); // Brand new family starts completely clean with 0 patients

    return newCircle;
  };

  const joinFamilyCircleByCode = (code: string): boolean => {
    const result = joinFamilyWithCode(currentUser, code, allFamilyCircles);
    if (result.success && result.joinedCircle) {
      setCurrentUser(result.updatedUser);
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? result.updatedUser : u));
      setActiveFamilyId(result.joinedCircle.id);
      return true;
    }
    return false;
  };

  const exportFamilyBackup = (): string => {
    if (!activeFamilyCircle) return '';
    return exportFamilySyncPayload({
      familyCircle: activeFamilyCircle,
      patients: allPatients,
      medications: allMedications,
      doseLogs: allDoseLogs,
      vitals: allVitals,
      expenses: allExpenses,
      appointments: allAppointments,
      studies: allStudies,
      routineLogs: allRoutineLogs
    });
  };

  const importFamilyBackup = (jsonStr: string): { success: boolean; error?: string } => {
    const { success, payload, error } = parseAndValidateFamilySyncPayload(jsonStr);
    if (!success || !payload) {
      return { success: false, error: error || 'Formato no válido' };
    }

    const famId = payload.familyId;

    // Ensure family circle exists
    setAllFamilyCircles(prev => {
      if (prev.some(c => c.id === famId)) {
        return prev.map(c => c.id === famId ? { ...c, name: payload.familyName || c.name } : c);
      }
      return [...prev, {
        id: famId,
        name: payload.familyName,
        inviteCode: generateFamilyInviteCode(payload.familyName),
        createdAt: formatDateIso(new Date())
      }];
    });

    // Ensure joined
    if (!currentUser.joinedFamilyIds?.includes(famId)) {
      const updatedUser = {
        ...currentUser,
        joinedFamilyIds: [...(currentUser.joinedFamilyIds || []), famId],
        activeFamilyId: famId
      };
      setCurrentUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    }
    setActiveFamilyIdState(famId);

    // Merge patients
    setAllPatients(prev => {
      const other = prev.filter(p => (p.familyId || 'circle-poot') !== famId);
      return [...other, ...payload.patients];
    });

    // Merge medications
    setAllMedications(prev => {
      const other = prev.filter(m => (m.familyId || 'circle-poot') !== famId);
      return [...other, ...payload.medications];
    });

    // Merge doses
    setAllDoseLogs(prev => {
      const payloadMedIds = new Set(payload.medications.map(m => m.id));
      const other = prev.filter(d => !payloadMedIds.has(d.medicationId));
      return [...other, ...payload.doseLogs];
    });

    // Merge vitals
    setAllVitals(prev => {
      const payloadPatIds = new Set(payload.patients.map(p => p.id));
      const other = prev.filter(v => !payloadPatIds.has(v.patientId));
      return [...other, ...payload.vitals];
    });

    // Merge expenses
    setAllExpenses(prev => {
      const other = prev.filter(e => (e.familyId || 'circle-poot') !== famId);
      return [...other, ...payload.expenses];
    });

    // Merge appointments
    setAllAppointments(prev => {
      const payloadPatIds = new Set(payload.patients.map(p => p.id));
      const other = prev.filter(a => !payloadPatIds.has(a.patientId));
      return [...other, ...payload.appointments];
    });

    // Merge studies
    setAllStudies(prev => {
      const other = prev.filter(s => (s.familyId || 'circle-poot') !== famId);
      return [...other, ...payload.studies];
    });

    return { success: true };
  };

  // Automated Cloud Sync (Pull on mount/family change, Realtime subscription)
  useEffect(() => {
    if (!isSupabaseConfigured() || !activeFamilyCircle) return;

    // Pull latest snapshot from cloud on family change or mount (only if snapshot has real data)
    pullFamilyDataFromCloud(activeFamilyCircle.id).then(res => {
      if (res.success && res.payload && (res.payload.patients?.length > 0 || res.payload.medications?.length > 0)) {
        importFamilyBackup(JSON.stringify(res.payload));
      }
    });

    // Realtime subscription (only merge if payload has real data)
    const unsubscribe = subscribeToFamilyCloudUpdates(activeFamilyCircle.id, payload => {
      if (payload && payload.familyId === activeFamilyCircle.id && (payload.patients?.length > 0 || payload.medications?.length > 0)) {
        importFamilyBackup(JSON.stringify(payload));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeFamilyId]);

  // Debounced auto-push to Supabase cloud whenever data changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !activeFamilyCircle) return;

    const timer = setTimeout(() => {
      const payloadStr = exportFamilySyncPayload({
        familyCircle: activeFamilyCircle,
        patients: allPatients,
        medications: allMedications,
        doseLogs: allDoseLogs,
        vitals: allVitals,
        expenses: allExpenses,
        appointments: allAppointments,
        studies: allStudies,
        routineLogs: allRoutineLogs
      });
      try {
        const parsed = JSON.parse(payloadStr);
        pushFamilyDataToCloud(parsed);
      } catch (err) {
        console.warn('Sync push error:', err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [allPatients, allMedications, allDoseLogs, allVitals, allExpenses, allAppointments, allStudies, allRoutineLogs]);

  const setActivePatientId = (id: string) => {
    setActivePatientIdState(id);
  };

  const addPatient = (p: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...p,
      id: 'patient-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllPatients(prev => [...prev, newPatient]);
    setActivePatientIdState(newPatient.id);
  };

  const updatePatient = (p: Patient) => {
    setAllPatients(prev => prev.map(item => item.id === p.id ? { ...item, ...p, familyId: p.familyId || item.familyId || currentFamilyId } : item));
  };

  const addCustomPharmacy = (pharmacyName: string) => {
    const trimmed = pharmacyName.trim();
    if (!trimmed) return;
    setCustomPharmacies(prev => {
      if (prev.some(p => p.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [trimmed, ...prev];
    });
  };

  const addMedication = (m: Omit<Medication, 'id'>) => {
    if (m.preferredStore) {
      addCustomPharmacy(m.preferredStore);
    }
    const newMed: Medication = {
      ...m,
      id: 'med-' + Date.now(),
      familyId: m.familyId || currentFamilyId
    };
    setAllMedications(prev => [...prev, newMed]);
  };

  const updateMedication = (m: Medication) => {
    if (m.preferredStore) {
      addCustomPharmacy(m.preferredStore);
    }
    setAllMedications(prev => prev.map(item => item.id === m.id ? { ...item, ...m, familyId: m.familyId || item.familyId || currentFamilyId } : item));
  };

  const deleteMedication = (id: string) => {
    setAllMedications(prev => prev.filter(item => item.id !== id));
    setAllDoseLogs(prev => prev.filter(item => item.medicationId !== id));
  };

  const completeMedication = (
    id: string,
    reason: 'bottle_finished' | 'doctor_stopped' | 'treatment_completed' | 'other' = 'bottle_finished',
    notes?: string
  ) => {
    setAllMedications(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'completed',
          completedAt: new Date().toISOString().split('T')[0],
          completionReason: reason,
          completionNotes: notes || undefined,
          bottlesCount: 0
        };
      }
      return item;
    }));
  };

  const consumeBottle = (
    id: string,
    reason: 'bottle_finished' | 'doctor_stopped' | 'treatment_completed' | 'other' = 'bottle_finished',
    notes?: string
  ): boolean => {
    const med = allMedications.find(m => m.id === id);
    if (!med) return false;

    if (med.stockTrackingMode === 'manual_bottle' && (med.bottlesCount || 1) > 1) {
      const remaining = (med.bottlesCount || 1) - 1;
      setAllMedications(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            bottlesCount: remaining,
            currentStock: remaining
          };
        }
        return item;
      }));
      return true; // Still has reserve bottles
    }

    // It was the last bottle
    completeMedication(id, reason, notes);
    return false;
  };

  const restockMedication = (
    id: string,
    params: {
      quantityToAdd?: number;
      boxesCount?: number;
      unitsPerBox?: number;
      bottlesToAdd?: number;
      cost?: number;
      preferredStore?: string;
      isMedicalSample?: boolean;
      sampleNotes?: string;
    }
  ) => {
    if (params.preferredStore) {
      addCustomPharmacy(params.preferredStore);
    }
    setAllMedications(prev => prev.map(item => {
      if (item.id === id) {
        const addedPieces = params.quantityToAdd !== undefined
          ? params.quantityToAdd
          : (params.boxesCount && params.unitsPerBox ? params.boxesCount * params.unitsPerBox : 0);

        const isManual = item.stockTrackingMode === 'manual_bottle';
        const newBottles = (item.bottlesCount || 0) + (params.bottlesToAdd || (isManual && params.boxesCount ? params.boxesCount : 0));
        const newPieces = item.currentStock + addedPieces;

        return {
          ...item,
          status: 'active',
          currentStock: isManual ? (newBottles > 0 ? newBottles : 1) : newPieces,
          bottlesCount: isManual ? (newBottles > 0 ? newBottles : 1) : undefined,
          packageUnits: params.unitsPerBox || item.packageUnits,
          unitCost: params.cost !== undefined ? params.cost : item.unitCost,
          preferredStore: params.preferredStore || item.preferredStore,
          isMedicalSample: params.isMedicalSample !== undefined ? params.isMedicalSample : item.isMedicalSample,
          sampleNotes: params.sampleNotes || item.sampleNotes,
          completedAt: undefined,
          completionReason: undefined,
          completionNotes: undefined
        };
      }
      return item;
    }));
  };

  const reactivateMedication = (id: string, newStock?: number) => {
    setAllMedications(prev => prev.map(item => {
      if (item.id === id) {
        const isManual = item.stockTrackingMode === 'manual_bottle';
        return {
          ...item,
          status: 'active',
          currentStock: isManual ? (newStock || 1) : (newStock !== undefined && newStock > 0 ? newStock : (item.currentStock > 0 ? item.currentStock : 30)),
          bottlesCount: isManual ? (newStock || 1) : undefined,
          completedAt: undefined,
          completionReason: undefined,
          completionNotes: undefined
        };
      }
      return item;
    }));
  };

  const toggleDoseTaken = (
    medicationId: string,
    scheduledTime: string,
    dateStr: string = formatDateIso(new Date()),
    administeredBy?: string
  ) => {
    const med = allMedications.find(m => m.id === medicationId);
    if (!med) return;

    const existingIndex = allDoseLogs.findIndex(
      l => l.medicationId === medicationId && l.scheduledTime === scheduledTime && l.date === dateStr
    );

    if (existingIndex >= 0) {
      const existing = allDoseLogs[existingIndex];
      if (existing.taken) {
        setAllMedications(prev => prev.map(m => {
          if (m.id === medicationId && m.stockTrackingMode !== 'manual_bottle') {
            return { ...m, currentStock: m.currentStock + existing.dose };
          }
          return m;
        }));
      }
      setAllDoseLogs(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      const slot = med.frequency.doseSlots.find(s => s.time === scheduledTime);
      const dose = slot ? slot.dose : 1;

      const newLog: DoseLog = {
        id: 'dose-' + Date.now(),
        familyId: currentFamilyId,
        medicationId,
        patientId: med.patientId,
        date: dateStr,
        scheduledTime,
        actualTakenTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        dose,
        taken: true,
        administeredBy: administeredBy || currentUser.name || 'Caregiver'
      };

      setAllMedications(prev => prev.map(m => {
        if (m.id === medicationId) {
          if (m.stockTrackingMode === 'manual_bottle') {
            return m; // Manual bottle control does not decrease pills
          }
          const { updatedMed, transitioned, nextBatch } = deductDoseFromBatches(m, dose);
          if (transitioned && nextBatch) {
            sendLocalNotification(
              `🔄 Cambio de Lote Activo: ${m.name}`,
              `Se agotó el lote anterior. Se activó automáticamente el lote de ${nextBatch.laboratory || 'reserva'} con su foto correspondiente.`
            );
          }
          if (updatedMed.currentStock <= updatedMed.minimumStockAlert) {
            sendLocalNotification(
              `⚠️ Low Stock Alert: ${m.name}`,
              `Only ${updatedMed.currentStock} ${m.presentation}(s) remaining. Time to restock.`
            );
          }
          return updatedMed;
        }
        return m;
      }));

      setAllDoseLogs(prev => [...prev, newLog]);
    }
  };

  const switchActiveMedicationBatch = (medicationId: string, targetBatchId: string) => {
    setAllMedications(prev => prev.map(m => m.id === medicationId ? switchActiveBatch(m, targetBatchId) : m));
  };

  const finishActiveMedicationBox = (
    medicationId: string,
    reason: 'depleted' | 'manual_box_finish' | 'expired' | 'damaged' | 'lost' = 'manual_box_finish',
    notes?: string
  ) => {
    const med = allMedications.find(m => m.id === medicationId);
    if (!med) return { transitioned: false, remainingBoxesInBatch: 0 };
    const res = finishActiveBoxOrBatch(med, reason, notes);
    setAllMedications(prev => prev.map(m => m.id === medicationId ? res.updatedMed : m));
    return res;
  };

  const adjustMedicationBatchStock = (
    medicationId: string,
    batchId: string,
    newUnits: number,
    reason: string = 'count_correction',
    newBoxes?: number
  ) => {
    setAllMedications(prev => prev.map(m => m.id === medicationId ? adjustBatchStockUnits(m, batchId, newUnits, reason, newBoxes) : m));
  };

  const addMedicationBatch = (
    medicationId: string,
    batchData: {
      laboratory?: string;
      boxesCount: number;
      unitsPerBox: number;
      cost?: number;
      expirationDate?: string;
      imageUrl?: string;
      preferredStore?: string;
      isMedicalSample?: boolean;
      sampleNotes?: string;
      activateNow?: boolean;
      name?: string;
    }
  ) => {
    if (batchData.preferredStore) {
      addCustomPharmacy(batchData.preferredStore);
    }
    setAllMedications(prev => prev.map(m => m.id === medicationId ? addNewBatchToMedication(m, batchData) : m));
  };

  const addVital = (v: Omit<VitalSign, 'id'>) => {
    const newVital: VitalSign = {
      ...v,
      id: 'vital-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllVitals(prev => [newVital, ...prev]);
  };

  const deleteVital = (id: string) => {
    setAllVitals(prev => prev.filter(v => v.id !== id));
  };

  const addCampaign = (c: Omit<MonitoringCampaign, 'id'>) => {
    const newCamp: MonitoringCampaign = {
      ...c,
      id: 'camp-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllCampaigns(prev => [...prev, newCamp]);
  };

  const toggleCampaignStatus = (id: string) => {
    setAllCampaigns(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const updatePatientRoutines = (patientId: string, routines: DailyCareRoutine) => {
    setAllPatients(prev => prev.map(p => p.id === patientId ? { ...p, dailyRoutines: routines } : p));
  };

  const toggleRoutineCompleted = (
    patientId: string,
    routineType: 'breakfast' | 'lunch' | 'dinner' | 'bath' | 'wound_care' | 'exercise',
    scheduledTime: string,
    dateStr?: string,
    completedBy?: string
  ) => {
    const today = dateStr || formatDateIso(new Date());
    const existing = allRoutineLogs.find(
      l => l.patientId === patientId && l.routineType === routineType && l.date === today && l.scheduledTime === scheduledTime
    );

    if (existing) {
      setAllRoutineLogs(prev => prev.map(l => l.id === existing.id ? { ...l, completed: !l.completed } : l));
    } else {
      const newLog: RoutineLog = {
        id: 'rlog-' + Date.now(),
        familyId: currentFamilyId,
        patientId,
        routineType,
        date: today,
        scheduledTime,
        actualTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        completedBy: completedBy || currentUser.name || 'Caregiver'
      };
      setAllRoutineLogs(prev => [...prev, newLog]);
    }
  };

  const addFamilyMember = (f: Omit<FamilyMember, 'id'>) => {
    const newFam: FamilyMember = {
      ...f,
      id: 'fam-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllFamilies(prev => [...prev, newFam]);
  };

  const updateFamilyMember = (f: FamilyMember) => {
    setAllFamilies(prev => prev.map(item => item.id === f.id ? f : item));
  };

  const deleteFamilyMember = (id: string) => {
    setAllFamilies(prev => prev.filter(item => item.id !== id));
  };

  const addExpense = (e: Omit<HealthExpense, 'id'>) => {
    const newExp: HealthExpense = {
      ...e,
      id: 'exp-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllExpenses(prev => [newExp, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setAllExpenses(prev => prev.filter(item => item.id !== id));
  };

  const addAppointment = (a: Omit<MedicalAppointment, 'id'>) => {
    const newApp: MedicalAppointment = {
      ...a,
      id: 'app-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllAppointments(prev => [...prev, newApp]);
  };

  const updateAppointment = (a: MedicalAppointment) => {
    setAllAppointments(prev => prev.map(item => item.id === a.id ? a : item));
  };

  const deleteAppointment = (id: string) => {
    setAllAppointments(prev => prev.filter(item => item.id !== id));
  };

  const toggleAppointmentCompleted = (id: string) => {
    setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a));
  };

  const addBookingReminder = (r: Omit<FutureBookingReminder, 'id'>) => {
    const newReminder: FutureBookingReminder = {
      ...r,
      id: 'rem-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllBookingReminders(prev => [newReminder, ...prev]);
  };

  const updateBookingReminder = (r: FutureBookingReminder) => {
    setAllBookingReminders(prev => prev.map(item => item.id === r.id ? r : item));
  };

  const deleteBookingReminder = (id: string) => {
    setAllBookingReminders(prev => prev.filter(item => item.id !== id));
  };

  const confirmBookingReminderToAppointment = (
    reminderId: string,
    appointmentDateTime: string,
    location?: string,
    notes?: string
  ) => {
    const reminder = allBookingReminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const newApp: MedicalAppointment = {
      id: 'app-' + Date.now(),
      familyId: currentFamilyId,
      patientId: reminder.patientId,
      doctorName: reminder.doctorName,
      specialty: reminder.specialty,
      dateTime: appointmentDateTime,
      location: location || reminder.clinicAddress,
      doctorPhone: reminder.clinicPhone,
      notes: notes || reminder.notes,
      isCompleted: false
    };

    setAllAppointments(prev => [...prev, newApp]);
    setAllBookingReminders(prev =>
      prev.map(item =>
        item.id === reminderId
          ? { ...item, status: 'booked_confirmed', confirmedAppointmentId: newApp.id }
          : item
      )
    );
  };

  const addStudy = (s: Omit<MedicalStudy, 'id'>) => {
    const newStudy: MedicalStudy = {
      ...s,
      id: 'study-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllStudies(prev => [newStudy, ...prev]);
  };

  const deleteStudy = (id: string) => {
    setAllStudies(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        allUsers,
        switchUser,
        loginUser,
        registerUser,
        resetUserPassword,
        loginWithSocialProvider,
        logoutUser,

        familyCircles,
        allFamilyCircles,
        activeFamilyCircle,
        currentFamilyId,
        setActiveFamilyId,
        createFamilyCircle,
        joinFamilyCircleByCode,
        exportFamilyBackup,
        importFamilyBackup,

        patients,
        allPatients,
        activePatient,
        setActivePatientId,
        addPatient,
        updatePatient,

        medications,
        addMedication,
        updateMedication,
        deleteMedication,
        completeMedication,
        consumeBottle,
        restockMedication,
        reactivateMedication,
        customPharmacies,
        addCustomPharmacy,
        switchActiveMedicationBatch,
        finishActiveMedicationBox,
        adjustMedicationBatchStock,
        addMedicationBatch,

        doseLogs,
        toggleDoseTaken,

        routineLogs: allRoutineLogs.filter(l => !currentFamilyId || l.familyId === currentFamilyId),
        toggleRoutineCompleted,
        updatePatientRoutines,

        vitals,
        addVital,
        deleteVital,

        campaigns,
        addCampaign,
        toggleCampaignStatus,

        families,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,

        expenses,
        addExpense,
        deleteExpense,

        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        toggleAppointmentCompleted,

        bookingReminders,
        addBookingReminder,
        updateBookingReminder,
        deleteBookingReminder,
        confirmBookingReminderToAppointment,

        studies,
        addStudy,
        deleteStudy,

        purgeAllDemoData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
