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

interface AppContextType {
  // Auth & Current User
  currentUser: UserAccount;
  isAuthenticated: boolean;
  allUsers: UserAccount[];
  switchUser: (userId: string) => void;
  loginUser: (email: string, password?: string) => boolean;
  registerUser: (name: string, email: string, password?: string) => UserAccount;
  logoutUser: () => void;

  // Family Spaces
  familyCircles: FamilyCircle[];
  allFamilyCircles: FamilyCircle[];
  activeFamilyCircle: FamilyCircle | undefined;
  setActiveFamilyId: (id: string) => void;
  createFamilyCircle: (name: string, isPersonal?: boolean) => FamilyCircle;
  joinFamilyCircleByCode: (code: string) => boolean;

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

  // Auto-heal current user if joinedFamilyIds is empty
  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest' && (!currentUser.joinedFamilyIds || currentUser.joinedFamilyIds.length === 0)) {
      const defaultFamIds = allFamilyCircles.map(c => c.id);
      const healedUser: UserAccount = {
        ...currentUser,
        activeFamilyId: currentUser.activeFamilyId || allFamilyCircles[0]?.id || '',
        joinedFamilyIds: defaultFamIds
      };
      setCurrentUser(healedUser);
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? healedUser : u));
    }
  }, [currentUser, allFamilyCircles]);

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

  // Filter entities by active family circle with backwards compatibility for unmigrated local storage
  const patients = allPatients.filter(p => !p.familyId || p.familyId === currentFamilyId);
  const medications = allMedications.filter(m => !m.familyId || m.familyId === currentFamilyId);
  const doseLogs = allDoseLogs.filter(d => !d.familyId || d.familyId === currentFamilyId);
  const vitals = allVitals.filter(v => !v.familyId || v.familyId === currentFamilyId);
  const campaigns = allCampaigns.filter(c => !c.familyId || c.familyId === currentFamilyId);
  const families = allFamilies.filter(f => !f.familyId || f.familyId === currentFamilyId);
  const expenses = allExpenses.filter(e => !e.familyId || e.familyId === currentFamilyId);
  const appointments = allAppointments.filter(a => !a.familyId || a.familyId === currentFamilyId);
  const bookingReminders = allBookingReminders.filter(r => !r.familyId || r.familyId === currentFamilyId);
  const studies = allStudies.filter(s => !s.familyId || s.familyId === currentFamilyId);

  // Active Patient inside current family with automatic auto-selection fallback
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  const switchUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    setCurrentUser(user);
    const visible = getUserVisibleFamilyCircles(user, allFamilyCircles);
    const newActiveFamId = visible.length > 0 ? (visible.find(c => c.id === user.activeFamilyId)?.id || visible[0].id) : '';
    setActiveFamilyIdState(newActiveFamId);

    const familyPatients = allPatients.filter(p => !p.familyId || p.familyId === newActiveFamId);
    if (familyPatients.length > 0) {
      setActivePatientIdState(familyPatients[0].id);
    }
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
    const newUser: UserAccount = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password || 'password123',
      activeFamilyId: '',
      joinedFamilyIds: []
    };

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setActiveFamilyIdState('');
    return newUser;
  };

  const logoutUser = () => {
    setCurrentUser(guestUser);
    setActiveFamilyIdState('');
    setActivePatientIdState('');
  };

  const setActiveFamilyId = (id: string) => {
    setActiveFamilyIdState(id);
    setCurrentUser(prev => ({ ...prev, activeFamilyId: id }));

    // When switching family, auto-select the first patient of that family
    const familyPatients = allPatients.filter(p => !p.familyId || p.familyId === id);
    if (familyPatients.length > 0) {
      setActivePatientIdState(familyPatients[0].id);
    }
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
    setAllPatients(prev => prev.map(item => item.id === p.id ? p : item));
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
      familyId: currentFamilyId
    };
    setAllMedications(prev => [...prev, newMed]);
  };

  const updateMedication = (m: Medication) => {
    if (m.preferredStore) {
      addCustomPharmacy(m.preferredStore);
    }
    setAllMedications(prev => prev.map(item => item.id === m.id ? m : item));
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
        logoutUser,

        familyCircles,
        allFamilyCircles,
        activeFamilyCircle,
        setActiveFamilyId,
        createFamilyCircle,
        joinFamilyCircleByCode,

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
