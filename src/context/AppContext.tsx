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
  UserAccount
} from '../types';
import { LocalStore } from '../lib/storage';
import { sendLocalNotification } from '../lib/notifications';
import { formatDateIso } from '../utils/frequencyEngine';
import { generateFamilyInviteCode } from '../utils/familyEngine';
import { getUserVisibleFamilyCircles, joinFamilyWithCode, isUserAuthenticated } from '../utils/authEngine';

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

  // Doses
  doseLogs: DoseLog[];
  toggleDoseTaken: (medicationId: string, scheduledTime: string, dateStr?: string, administeredBy?: string) => void;

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

  // Expenses
  expenses: HealthExpense[];
  addExpense: (e: Omit<HealthExpense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Appointments
  appointments: MedicalAppointment[];
  addAppointment: (a: Omit<MedicalAppointment, 'id'>) => void;
  toggleAppointmentCompleted: (id: string) => void;

  // Studies
  studies: MedicalStudy[];
  addStudy: (s: Omit<MedicalStudy, 'id'>) => void;
  deleteStudy: (id: string) => void;
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
  const [allStudies, setAllStudies] = useState<MedicalStudy[]>(() => LocalStore.getStudies());

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
  useEffect(() => { LocalStore.saveVitals(allVitals); }, [allVitals]);
  useEffect(() => { LocalStore.saveCampaigns(allCampaigns); }, [allCampaigns]);
  useEffect(() => { LocalStore.saveFamilies(allFamilies); }, [allFamilies]);
  useEffect(() => { LocalStore.saveExpenses(allExpenses); }, [allExpenses]);
  useEffect(() => { LocalStore.saveAppointments(allAppointments); }, [allAppointments]);
  useEffect(() => { LocalStore.saveStudies(allStudies); }, [allStudies]);

  // Family circles visible to current logged-in user
  const familyCircles = getUserVisibleFamilyCircles(currentUser, allFamilyCircles);

  const activeFamilyCircle = familyCircles.find(c => c.id === activeFamilyId) || familyCircles[0];
  const currentFamilyId = activeFamilyCircle ? activeFamilyCircle.id : '';

  // Filter entities by active family circle
  const patients = allPatients.filter(p => p.familyId === currentFamilyId);
  const medications = allMedications.filter(m => m.familyId === currentFamilyId);
  const doseLogs = allDoseLogs.filter(d => d.familyId === currentFamilyId);
  const vitals = allVitals.filter(v => v.familyId === currentFamilyId);
  const campaigns = allCampaigns.filter(c => c.familyId === currentFamilyId);
  const families = allFamilies.filter(f => f.familyId === currentFamilyId);
  const expenses = allExpenses.filter(e => e.familyId === currentFamilyId);
  const appointments = allAppointments.filter(a => a.familyId === currentFamilyId);
  const studies = allStudies.filter(s => s.familyId === currentFamilyId);

  // Active Patient inside current family
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  const switchUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    setCurrentUser(user);
    const visible = getUserVisibleFamilyCircles(user, allFamilyCircles);
    const newActiveFamId = visible.length > 0 ? (visible.find(c => c.id === user.activeFamilyId)?.id || visible[0].id) : '';
    setActiveFamilyIdState(newActiveFamId);

    const familyPatients = allPatients.filter(p => p.familyId === newActiveFamId);
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
    // Switch to clean guest state
    const cleanGuest: UserAccount = {
      id: 'guest',
      name: 'Invitado',
      email: 'guest@famhealth.app',
      activeFamilyId: '',
      joinedFamilyIds: []
    };
    setCurrentUser(cleanGuest);
    setActiveFamilyIdState('');
  };

  const setActiveFamilyId = (id: string) => {
    setActiveFamilyIdState(id);
    setCurrentUser(prev => ({ ...prev, activeFamilyId: id }));

    // When switching family, auto-select the first patient of that family
    const familyPatients = allPatients.filter(p => p.familyId === id);
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

  const addMedication = (m: Omit<Medication, 'id'>) => {
    const newMed: Medication = {
      ...m,
      id: 'med-' + Date.now(),
      familyId: currentFamilyId
    };
    setAllMedications(prev => [...prev, newMed]);
  };

  const updateMedication = (m: Medication) => {
    setAllMedications(prev => prev.map(item => item.id === m.id ? m : item));
  };

  const deleteMedication = (id: string) => {
    setAllMedications(prev => prev.filter(item => item.id !== id));
    setAllDoseLogs(prev => prev.filter(item => item.medicationId !== id));
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
          if (m.id === medicationId) {
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
          const newStock = Math.max(0, m.currentStock - dose);
          if (newStock <= m.minimumStockAlert) {
            sendLocalNotification(
              `⚠️ Low Stock Alert: ${m.name}`,
              `Only ${newStock} ${m.presentation}(s) remaining. Time to restock.`
            );
          }
          return { ...m, currentStock: newStock };
        }
        return m;
      }));

      setAllDoseLogs(prev => [...prev, newLog]);
    }
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

  const toggleAppointmentCompleted = (id: string) => {
    setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a));
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

        doseLogs,
        toggleDoseTaken,

        vitals,
        addVital,
        deleteVital,

        campaigns,
        addCampaign,
        toggleCampaignStatus,

        families,
        addFamilyMember,
        updateFamilyMember,

        expenses,
        addExpense,
        deleteExpense,

        appointments,
        addAppointment,
        toggleAppointmentCompleted,

        studies,
        addStudy,
        deleteStudy
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
