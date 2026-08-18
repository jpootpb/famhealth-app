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
  MedicalStudy
} from '../types';
import { LocalStore } from '../lib/storage';
import { sendLocalNotification } from '../lib/notifications';
import { formatDateIso } from '../utils/frequencyEngine';
import { generateFamilyInviteCode } from '../utils/familyEngine';

interface AppContextType {
  familyCircles: FamilyCircle[];
  activeFamilyCircle: FamilyCircle | undefined;
  setActiveFamilyId: (id: string) => void;
  createFamilyCircle: (name: string) => FamilyCircle;
  joinFamilyCircleByCode: (code: string) => boolean;

  patients: Patient[];
  allPatients: Patient[];
  activePatient: Patient | undefined;
  setActivePatientId: (id: string) => void;
  addPatient: (p: Omit<Patient, 'id'>) => void;
  updatePatient: (p: Patient) => void;

  medications: Medication[];
  addMedication: (m: Omit<Medication, 'id'>) => void;
  updateMedication: (m: Medication) => void;
  deleteMedication: (id: string) => void;

  doseLogs: DoseLog[];
  toggleDoseTaken: (medicationId: string, scheduledTime: string, dateStr?: string, administeredBy?: string) => void;

  vitals: VitalSign[];
  addVital: (v: Omit<VitalSign, 'id'>) => void;
  deleteVital: (id: string) => void;

  campaigns: MonitoringCampaign[];
  addCampaign: (c: Omit<MonitoringCampaign, 'id'>) => void;
  toggleCampaignStatus: (id: string) => void;

  families: FamilyMember[];
  addFamilyMember: (f: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (f: FamilyMember) => void;

  expenses: HealthExpense[];
  addExpense: (e: Omit<HealthExpense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  appointments: MedicalAppointment[];
  addAppointment: (a: Omit<MedicalAppointment, 'id'>) => void;
  toggleAppointmentCompleted: (id: string) => void;

  studies: MedicalStudy[];
  addStudy: (s: Omit<MedicalStudy, 'id'>) => void;
  deleteStudy: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [familyCircles, setFamilyCircles] = useState<FamilyCircle[]>(() => LocalStore.getFamilyCircles());
  const [activeFamilyId, setActiveFamilyIdState] = useState<string>(() => LocalStore.getActiveFamilyId());

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

  // Sync state changes to storage
  useEffect(() => { LocalStore.saveFamilyCircles(familyCircles); }, [familyCircles]);
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

  const activeFamilyCircle = familyCircles.find(c => c.id === activeFamilyId) || familyCircles[0];

  // Filter entities by active family circle
  const currentFamilyId = activeFamilyCircle ? activeFamilyCircle.id : 'circle-poot';
  const patients = allPatients.filter(p => !p.familyId || p.familyId === currentFamilyId);
  const medications = allMedications.filter(m => !m.familyId || m.familyId === currentFamilyId);
  const doseLogs = allDoseLogs.filter(d => !d.familyId || d.familyId === currentFamilyId);
  const vitals = allVitals.filter(v => !v.familyId || v.familyId === currentFamilyId);
  const campaigns = allCampaigns.filter(c => !c.familyId || c.familyId === currentFamilyId);
  const families = allFamilies.filter(f => !f.familyId || f.familyId === currentFamilyId);
  const expenses = allExpenses.filter(e => !e.familyId || e.familyId === currentFamilyId);
  const appointments = allAppointments.filter(a => !a.familyId || a.familyId === currentFamilyId);
  const studies = allStudies.filter(s => !s.familyId || s.familyId === currentFamilyId);

  // Active Patient inside current family
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  const setActiveFamilyId = (id: string) => {
    setActiveFamilyIdState(id);
    // When switching family, auto-select the first patient of that family
    const familyPatients = allPatients.filter(p => !p.familyId || p.familyId === id);
    if (familyPatients.length > 0) {
      setActivePatientIdState(familyPatients[0].id);
    }
  };

  const createFamilyCircle = (name: string): FamilyCircle => {
    const inviteCode = generateFamilyInviteCode(name);
    const newCircle: FamilyCircle = {
      id: 'circle-' + Date.now(),
      name: name.trim(),
      inviteCode,
      createdAt: formatDateIso(new Date())
    };
    setFamilyCircles(prev => [...prev, newCircle]);
    setActiveFamilyId(newCircle.id);
    return newCircle;
  };

  const joinFamilyCircleByCode = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    const found = familyCircles.find(c => c.inviteCode.toUpperCase() === cleanCode);
    if (found) {
      setActiveFamilyId(found.id);
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
        administeredBy: administeredBy || 'Caregiver'
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
        familyCircles,
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
