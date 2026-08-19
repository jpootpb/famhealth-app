import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Patient,
  Medication,
  DoseLog,
  VitalSign,
  HealthExpense,
  MedicalAppointment,
  MedicalStudy,
  FamilyCircle,
  RoutineLog
} from '../types';

export interface FamilySyncPayload {
  version: number;
  familyId: string;
  familyName: string;
  syncedAt: string;
  patients: Patient[];
  medications: Medication[];
  doseLogs: DoseLog[];
  vitals: VitalSign[];
  expenses: HealthExpense[];
  appointments: MedicalAppointment[];
  studies: MedicalStudy[];
  routineLogs?: RoutineLog[];
}

/**
 * Exports all data for a specific family circle into a clean, portable JSON package
 */
export function exportFamilySyncPayload(params: {
  familyCircle: FamilyCircle;
  patients: Patient[];
  medications: Medication[];
  doseLogs: DoseLog[];
  vitals: VitalSign[];
  expenses: HealthExpense[];
  appointments: MedicalAppointment[];
  studies: MedicalStudy[];
  routineLogs?: RoutineLog[];
}): string {
  const { familyCircle, patients, medications, doseLogs, vitals, expenses, appointments, studies, routineLogs } = params;
  const famId = familyCircle.id;

  const payload: FamilySyncPayload = {
    version: 1,
    familyId: famId,
    familyName: familyCircle.name,
    syncedAt: new Date().toISOString(),
    patients: patients.filter(p => (p.familyId || 'circle-poot') === famId),
    medications: medications.filter(m => (m.familyId || 'circle-poot') === famId),
    doseLogs: doseLogs.filter(d => {
      const med = medications.find(m => m.id === d.medicationId);
      return (med?.familyId || 'circle-poot') === famId;
    }),
    vitals: vitals.filter(v => {
      const pat = patients.find(p => p.id === v.patientId);
      return (pat?.familyId || 'circle-poot') === famId;
    }),
    expenses: expenses.filter(e => (e.familyId || 'circle-poot') === famId),
    appointments: appointments.filter(a => {
      const pat = patients.find(p => p.id === a.patientId);
      return (pat?.familyId || 'circle-poot') === famId;
    }),
    studies: studies.filter(s => (s.familyId || 'circle-poot') === famId),
    routineLogs: (routineLogs || []).filter(r => {
      const pat = patients.find(p => p.id === r.patientId);
      return (pat?.familyId || 'circle-poot') === famId;
    })
  };

  return JSON.stringify(payload);
}

/**
 * Validates and merges an imported family sync package into the local state
 */
export function parseAndValidateFamilySyncPayload(rawJson: string): {
  success: boolean;
  payload?: FamilySyncPayload;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson.trim()) as FamilySyncPayload;
    if (!parsed.familyId || !Array.isArray(parsed.patients) || !Array.isArray(parsed.medications)) {
      return { success: false, error: 'Formato de respaldo no válido o incompleto.' };
    }
    return { success: true, payload: parsed };
  } catch (err) {
    return { success: false, error: 'Código o archivo JSON no válido.' };
  }
}

/**
 * Asynchronously pushes family sync payload to Supabase cloud table if configured
 */
export async function pushFamilyDataToCloud(payload: FamilySyncPayload): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase no está configurado.' };
  }

  try {
    const { error } = await supabase
      .from('family_sync_snapshots')
      .upsert({
        family_id: payload.familyId,
        family_name: payload.familyName,
        payload: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'family_id' });

    if (error) {
      console.warn('Error pushing to Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de red con Supabase.' };
  }
}

/**
 * Asynchronously pulls family sync payload from Supabase cloud table if configured
 */
export async function pullFamilyDataFromCloud(familyId: string): Promise<{
  success: boolean;
  payload?: FamilySyncPayload;
  error?: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase no está configurado.' };
  }

  try {
    const { data, error } = await supabase
      .from('family_sync_snapshots')
      .select('payload')
      .eq('family_id', familyId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || !data.payload) {
      return { success: false, error: 'No se encontraron datos en la nube para esta familia.' };
    }

    return { success: true, payload: data.payload as FamilySyncPayload };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión con la nube.' };
  }
}
