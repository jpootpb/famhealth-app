import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import { LocalStore } from '../lib/storage';
import { sendLocalNotification } from '../lib/notifications';
import { formatDateIso } from '../utils/frequencyEngine';

interface AppContextType {
  patients: Patient[];
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
  const [patients, setPatients] = useState<Patient[]>(() => LocalStore.getPatients());
  const [activePatientId, setActivePatientIdState] = useState<string>(() => LocalStore.getActivePatientId());
  const [medications, setMedications] = useState<Medication[]>(() => LocalStore.getMedications());
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(() => LocalStore.getDoseLogs());
  const [vitals, setVitals] = useState<VitalSign[]>(() => LocalStore.getVitals());
  const [campaigns, setCampaigns] = useState<MonitoringCampaign[]>(() => LocalStore.getCampaigns());
  const [families, setFamilies] = useState<FamilyMember[]>(() => LocalStore.getFamilies());
  const [expenses, setExpenses] = useState<HealthExpense[]>(() => LocalStore.getExpenses());
  const [appointments, setAppointments] = useState<MedicalAppointment[]>(() => LocalStore.getAppointments());
  const [studies, setStudies] = useState<MedicalStudy[]>(() => LocalStore.getStudies());

  // Sync state changes to storage
  useEffect(() => { LocalStore.savePatients(patients); }, [patients]);
  useEffect(() => { LocalStore.setActivePatientId(activePatientId); }, [activePatientId]);
  useEffect(() => { LocalStore.saveMedications(medications); }, [medications]);
  useEffect(() => { LocalStore.saveDoseLogs(doseLogs); }, [doseLogs]);
  useEffect(() => { LocalStore.saveVitals(vitals); }, [vitals]);
  useEffect(() => { LocalStore.saveCampaigns(campaigns); }, [campaigns]);
  useEffect(() => { LocalStore.saveFamilies(families); }, [families]);
  useEffect(() => { LocalStore.saveExpenses(expenses); }, [expenses]);
  useEffect(() => { LocalStore.saveAppointments(appointments); }, [appointments]);
  useEffect(() => { LocalStore.saveStudies(studies); }, [studies]);

  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  const setActivePatientId = (id: string) => {
    setActivePatientIdState(id);
  };

  const addPatient = (p: Omit<Patient, 'id'>) => {
    const newPatient: Patient = { ...p, id: 'patient-' + Date.now() };
    setPatients(prev => [...prev, newPatient]);
    setActivePatientIdState(newPatient.id);
  };

  const updatePatient = (p: Patient) => {
    setPatients(prev => prev.map(item => item.id === p.id ? p : item));
  };

  const addMedication = (m: Omit<Medication, 'id'>) => {
    const newMed: Medication = { ...m, id: 'med-' + Date.now() };
    setMedications(prev => [...prev, newMed]);
  };

  const updateMedication = (m: Medication) => {
    setMedications(prev => prev.map(item => item.id === m.id ? m : item));
  };

  const deleteMedication = (id: string) => {
    setMedications(prev => prev.filter(item => item.id !== id));
    setDoseLogs(prev => prev.filter(item => item.medicationId !== id));
  };

  const toggleDoseTaken = (
    medicationId: string,
    scheduledTime: string,
    dateStr: string = formatDateIso(new Date()),
    administeredBy?: string
  ) => {
    const med = medications.find(m => m.id === medicationId);
    if (!med) return;

    const existingIndex = doseLogs.findIndex(
      l => l.medicationId === medicationId && l.scheduledTime === scheduledTime && l.date === dateStr
    );

    if (existingIndex >= 0) {
      const existing = doseLogs[existingIndex];
      if (existing.taken) {
        setMedications(prev => prev.map(m => {
          if (m.id === medicationId) {
            return { ...m, currentStock: m.currentStock + existing.dose };
          }
          return m;
        }));
      }
      setDoseLogs(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      const slot = med.frequency.doseSlots.find(s => s.time === scheduledTime);
      const dose = slot ? slot.dose : 1;

      const newLog: DoseLog = {
        id: 'dose-' + Date.now(),
        medicationId,
        patientId: med.patientId,
        date: dateStr,
        scheduledTime,
        actualTakenTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        dose,
        taken: true,
        administeredBy: administeredBy || 'Caregiver'
      };

      setMedications(prev => prev.map(m => {
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

      setDoseLogs(prev => [...prev, newLog]);
    }
  };

  const addVital = (v: Omit<VitalSign, 'id'>) => {
    const newVital: VitalSign = { ...v, id: 'vital-' + Date.now() };
    setVitals(prev => [newVital, ...prev]);
  };

  const deleteVital = (id: string) => {
    setVitals(prev => prev.filter(v => v.id !== id));
  };

  const addCampaign = (c: Omit<MonitoringCampaign, 'id'>) => {
    const newCamp: MonitoringCampaign = { ...c, id: 'camp-' + Date.now() };
    setCampaigns(prev => [...prev, newCamp]);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const addFamilyMember = (f: Omit<FamilyMember, 'id'>) => {
    const newFam: FamilyMember = { ...f, id: 'fam-' + Date.now() };
    setFamilies(prev => [...prev, newFam]);
  };

  const updateFamilyMember = (f: FamilyMember) => {
    setFamilies(prev => prev.map(item => item.id === f.id ? f : item));
  };

  const addExpense = (e: Omit<HealthExpense, 'id'>) => {
    const newExp: HealthExpense = { ...e, id: 'exp-' + Date.now() };
    setExpenses(prev => [newExp, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
  };

  const addAppointment = (a: Omit<MedicalAppointment, 'id'>) => {
    const newApp: MedicalAppointment = { ...a, id: 'app-' + Date.now() };
    setAppointments(prev => [...prev, newApp]);
  };

  const toggleAppointmentCompleted = (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a));
  };

  const addStudy = (s: Omit<MedicalStudy, 'id'>) => {
    const newStudy: MedicalStudy = { ...s, id: 'study-' + Date.now() };
    setStudies(prev => [newStudy, ...prev]);
  };

  const deleteStudy = (id: string) => {
    setStudies(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        patients,
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
