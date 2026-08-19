import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
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

  // Filter out demo sandbox, keep ALL real user data for the family!
  const realPatients = patients.filter(p => p.familyId !== 'circle-demo-sandbox');
  const realPatientIds = new Set(realPatients.map(p => p.id));

  const payload: FamilySyncPayload = {
    version: 1,
    familyId: famId,
    familyName: familyCircle.name,
    syncedAt: new Date().toISOString(),
    patients: realPatients.map(p => ({ ...p, familyId: famId })),
    medications: medications.filter(m => m.familyId !== 'circle-demo-sandbox' || (m.patientId && realPatientIds.has(m.patientId))).map(m => ({ ...m, familyId: famId })),
    doseLogs: doseLogs.filter(d => d.familyId !== 'circle-demo-sandbox' || (d.patientId && realPatientIds.has(d.patientId))).map(d => ({ ...d, familyId: famId })),
    vitals: vitals.filter(v => v.familyId !== 'circle-demo-sandbox' || (v.patientId && realPatientIds.has(v.patientId))).map(v => ({ ...v, familyId: famId })),
    expenses: expenses.filter(e => e.familyId !== 'circle-demo-sandbox' || (e.patientId && realPatientIds.has(e.patientId))).map(e => ({ ...e, familyId: famId })),
    appointments: appointments.filter(a => a.familyId !== 'circle-demo-sandbox' || (a.patientId && realPatientIds.has(a.patientId))).map(a => ({ ...a, familyId: famId })),
    studies: studies.filter(s => s.familyId !== 'circle-demo-sandbox' || (s.patientId && realPatientIds.has(s.patientId))).map(s => ({ ...s, familyId: famId })),
    routineLogs: (routineLogs || []).filter(r => r.familyId !== 'circle-demo-sandbox' || (r.patientId && realPatientIds.has(r.patientId))).map(r => ({ ...r, familyId: famId }))
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
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase no está configurado (faltan credenciales).' };
  }

  try {
    const { error } = await client
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
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase no está configurado.' };
  }

  try {
    const { data, error } = await client
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

/**
 * Asynchronously pulls all family sync snapshots from Supabase cloud table
 */
export async function pullAllFamilySnapshotsFromCloud(): Promise<{
  success: boolean;
  snapshots?: FamilySyncPayload[];
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase no está configurado.' };
  }

  try {
    const { data, error } = await client
      .from('family_sync_snapshots')
      .select('payload');

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'No se encontraron datos en Supabase.' };
    }

    const payloads = data.map(d => d.payload).filter(Boolean) as FamilySyncPayload[];
    return { success: true, snapshots: payloads };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión con la nube.' };
  }
}

/**
 * Subscribes to Realtime updates for all families from Supabase
 */
export function subscribeToFamilyCloudUpdates(
  familyId: string,
  onUpdate: (payload: FamilySyncPayload) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const channel = client
      .channel('family-sync-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_sync_snapshots'
        },
        (payload: any) => {
          if (payload.new && payload.new.payload) {
            onUpdate(payload.new.payload as FamilySyncPayload);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return null;
  }
}
