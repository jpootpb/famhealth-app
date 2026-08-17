import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Paciente,
  Medicamento,
  TomaRegistro,
  SignoVital,
  CampaniaMonitoreo,
  Familiar,
  GastoSalud,
  CitaMedica,
  EstudioMedico
} from '../types';
import { LocalStore } from '../lib/storage';
import { sendLocalNotification } from '../lib/notifications';
import { formatDateIso, tocaTomaHoy } from '../utils/frequencyEngine';

interface AppContextType {
  patients: Paciente[];
  activePatient: Paciente | undefined;
  setActivePatientId: (id: string) => void;
  addPatient: (p: Omit<Paciente, 'id'>) => void;
  updatePatient: (p: Paciente) => void;

  medications: Medicamento[];
  addMedication: (m: Omit<Medicamento, 'id'>) => void;
  updateMedication: (m: Medicamento) => void;
  deleteMedication: (id: string) => void;

  tomas: TomaRegistro[];
  toggleToma: (medicamentoId: string, horaProgramada: string, fecha?: string) => void;

  vitals: SignoVital[];
  addVital: (v: Omit<SignoVital, 'id'>) => void;
  deleteVital: (id: string) => void;

  campaigns: CampaniaMonitoreo[];
  addCampaign: (c: Omit<CampaniaMonitoreo, 'id'>) => void;
  toggleCampaignStatus: (id: string) => void;

  families: Familiar[];
  addFamilyMember: (f: Omit<Familiar, 'id'>) => void;
  updateFamilyMember: (f: Familiar) => void;

  expenses: GastoSalud[];
  addExpense: (e: Omit<GastoSalud, 'id'>) => void;
  deleteExpense: (id: string) => void;

  appointments: CitaMedica[];
  addAppointment: (a: Omit<CitaMedica, 'id'>) => void;
  toggleAppointmentCompleted: (id: string) => void;

  studies: EstudioMedico[];
  addStudy: (s: Omit<EstudioMedico, 'id'>) => void;
  deleteStudy: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Paciente[]>(() => LocalStore.getPatients());
  const [activePatientId, setActivePatientIdState] = useState<string>(() => LocalStore.getActivePatientId());
  const [medications, setMedications] = useState<Medicamento[]>(() => LocalStore.getMedications());
  const [tomas, setTomas] = useState<TomaRegistro[]>(() => LocalStore.getTomas());
  const [vitals, setVitals] = useState<SignoVital[]>(() => LocalStore.getVitals());
  const [campaigns, setCampaigns] = useState<CampaniaMonitoreo[]>(() => LocalStore.getCampaigns());
  const [families, setFamilies] = useState<Familiar[]>(() => LocalStore.getFamilies());
  const [expenses, setExpenses] = useState<GastoSalud[]>(() => LocalStore.getExpenses());
  const [appointments, setAppointments] = useState<CitaMedica[]>(() => LocalStore.getAppointments());
  const [studies, setStudies] = useState<EstudioMedico[]>(() => LocalStore.getStudies());

  // Auto-sync LocalStore
  useEffect(() => LocalStore.savePatients(patients), [patients]);
  useEffect(() => LocalStore.saveMedications(medications), [medications]);
  useEffect(() => LocalStore.saveTomas(tomas), [tomas]);
  useEffect(() => LocalStore.saveVitals(vitals), [vitals]);
  useEffect(() => LocalStore.saveCampaigns(campaigns), [campaigns]);
  useEffect(() => LocalStore.saveFamilies(families), [families]);
  useEffect(() => LocalStore.saveExpenses(expenses), [expenses]);
  useEffect(() => LocalStore.saveAppointments(appointments), [appointments]);
  useEffect(() => LocalStore.saveStudies(studies), [studies]);

  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  const setActivePatientId = (id: string) => {
    setActivePatientIdState(id);
    LocalStore.setActivePatientId(id);
  };

  const addPatient = (p: Omit<Paciente, 'id'>) => {
    const newP: Paciente = { ...p, id: 'paciente-' + Date.now() };
    setPatients(prev => [...prev, newP]);
    setActivePatientId(newP.id);
  };

  const updatePatient = (p: Paciente) => {
    setPatients(prev => prev.map(item => item.id === p.id ? p : item));
  };

  const addMedication = (m: Omit<Medicamento, 'id'>) => {
    const newMed: Medicamento = { ...m, id: 'med-' + Date.now() };
    setMedications(prev => [...prev, newMed]);
  };

  const updateMedication = (m: Medicamento) => {
    setMedications(prev => prev.map(item => item.id === m.id ? m : item));
  };

  const deleteMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const toggleToma = (medicamentoId: string, horaProgramada: string, fechaStr: string = formatDateIso(new Date())) => {
    const med = medications.find(m => m.id === medicamentoId);
    if (!med) return;

    const existingIndex = tomas.findIndex(
      t => t.medicamentoId === medicamentoId && t.horaProgramada === horaProgramada && t.fecha === fechaStr
    );

    if (existingIndex >= 0) {
      // Toggle off -> Restore stock
      const existing = tomas[existingIndex];
      if (existing.tomada) {
        setMedications(prev => prev.map(m => {
          if (m.id === medicamentoId) {
            return { ...m, stockActual: m.stockActual + existing.dosis };
          }
          return m;
        }));
      }
      setTomas(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      // Find dose for this hour
      const horario = med.frecuencia.horarios.find(h => h.hora === horaProgramada);
      const dosis = horario ? horario.dosis : 1;

      const nuevaToma: TomaRegistro = {
        id: 'toma-' + Date.now(),
        medicamentoId,
        pacienteId: med.pacienteId,
        fecha: fechaStr,
        horaProgramada,
        horaRealToma: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        dosis,
        tomada: true
      };

      // Deduct stock
      setMedications(prev => prev.map(m => {
        if (m.id === medicamentoId) {
          const nuevoStock = Math.max(0, m.stockActual - dosis);
          if (nuevoStock <= m.stockMinimoAlerta) {
            sendLocalNotification(
              '⚠️ Alerta de Stock Bajo: ' + m.nombre,
              'Quedan ' + nuevoStock + ' ' + m.presentacion + 's. Considera comprar más pronto.'
            );
          }
          return { ...m, stockActual: nuevoStock };
        }
        return m;
      }));

      setTomas(prev => [...prev, nuevaToma]);
    }
  };

  const addVital = (v: Omit<SignoVital, 'id'>) => {
    const newV: SignoVital = { ...v, id: 'vit-' + Date.now() };
    setVitals(prev => [newV, ...prev]);
  };

  const deleteVital = (id: string) => {
    setVitals(prev => prev.filter(v => v.id !== id));
  };

  const addCampaign = (c: Omit<CampaniaMonitoreo, 'id'>) => {
    const newC: CampaniaMonitoreo = { ...c, id: 'camp-' + Date.now() };
    setCampaigns(prev => [...prev, newC]);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, activa: !c.activa } : c));
  };

  const addFamilyMember = (f: Omit<Familiar, 'id'>) => {
    const newF: Familiar = { ...f, id: 'fam-' + Date.now() };
    setFamilies(prev => [...prev, newF]);
  };

  const updateFamilyMember = (f: Familiar) => {
    setFamilies(prev => prev.map(item => item.id === f.id ? f : item));
  };

  const addExpense = (e: Omit<GastoSalud, 'id'>) => {
    const newE: GastoSalud = { ...e, id: 'exp-' + Date.now() };
    setExpenses(prev => [newE, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addAppointment = (a: Omit<CitaMedica, 'id'>) => {
    const newA: CitaMedica = { ...a, id: 'cita-' + Date.now() };
    setAppointments(prev => [...prev, newA]);
  };

  const toggleAppointmentCompleted = (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, completada: !a.completada } : a));
  };

  const addStudy = (s: Omit<EstudioMedico, 'id'>) => {
    const newS: EstudioMedico = { ...s, id: 'est-' + Date.now() };
    setStudies(prev => [newS, ...prev]);
  };

  const deleteStudy = (id: string) => {
    setStudies(prev => prev.filter(s => s.id !== id));
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
        tomas,
        toggleToma,
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

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};