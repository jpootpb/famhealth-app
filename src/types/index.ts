export type PatientType = 'chronic' | 'temporary' | 'preventive';

export interface FamilyCircle {
  id: string;
  name: string;
  inviteCode: string; // e.g. "POOT-7821"
  createdAt: string;
  ownerEmail?: string;
  isPersonalSpace?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  activeFamilyId: string;
  joinedFamilyIds: string[];
}

export interface DailyCareRoutine {
  enabled?: boolean;
  breakfastTime?: string; // e.g. "08:30"
  breakfastNotes?: string; // e.g. "Dieta blanda / baja en sodio"
  lunchTime?: string; // e.g. "14:00"
  lunchNotes?: string; // e.g. "Comida normal sin grasas"
  dinnerTime?: string; // e.g. "20:00"
  dinnerNotes?: string; // e.g. "Cena ligera"
  bathTime?: string; // e.g. "10:00"
  bathNotes?: string; // e.g. "Baño asistido / evitar mojar herida"
  woundCareTime?: string; // e.g. "10:30"
  woundCareNotes?: string; // e.g. "Curación de herida con apósito estéril"
  exerciseTime?: string; // e.g. "17:00"
  exerciseNotes?: string; // e.g. "Caminata suave de 15 minutos"
}

export interface RoutineLog {
  id: string;
  familyId?: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  routineType: 'breakfast' | 'lunch' | 'dinner' | 'bath' | 'wound_care' | 'exercise';
  scheduledTime: string; // HH:MM
  actualTime?: string; // HH:MM
  completed: boolean;
  completedBy?: string; // Caregiver name
  notes?: string;
}

export interface Patient {
  id: string;
  familyId?: string;
  name: string;
  birthDate?: string; // YYYY-MM-DD for automatic dynamic age calculation
  age?: number; // Optional legacy or fallback approximate age
  type: PatientType;
  primaryDiagnosis?: string;
  treatmentStartDate?: string;
  durationDays?: number;
  notes?: string;
  dailyRoutines?: DailyCareRoutine;
}

export type FrequencyType =
  | 'daily_fixed'
  | 'alternate_days'
  | 'every_n_days'
  | 'temporary_hourly';

export interface DoseSlot {
  time: string; // HH:MM
  dose: number; // 1, 0.5, 0.25 pills
  instruction?: string;
}

export interface FrequencyRule {
  type: FrequencyType;
  doseSlots: DoseSlot[];
  startDate: string;
  endDate?: string;
  intervalDays?: number;
  intervalHours?: number;
}

export type MedicationSource =
  | 'imss'
  | 'issste'
  | 'private_pharmacy'
  | 'medical_sample'
  | 'online_store'
  | 'family_donation'
  | 'friend_donation'
  | 'dispensary_donation'
  | 'other';

export interface Medication {
  id: string;
  familyId?: string;
  patientId: string;
  name: string;
  presentation: string; // tablet, capsule, ml, drops, etc.
  indication?: string;
  laboratory?: string; // Brand or Lab manufacturer (e.g. MSD, Silanes, Farmacias del Ahorro)
  imageUrl?: string; // Photo of medicine box / blister pack (Base64 data URL)
  frequency: FrequencyRule;
  currentStock: number;
  minimumStockAlert: number;
  unitCost?: number;
  isImssCovered?: boolean; // Surtido gratuitamente por IMSS / ISSSTE / Sector Salud ($0)
  source?: MedicationSource;
  preferredStore?: string; // Farmacia o tienda recomendada (ej: Mercado Libre, Farmacias Guadalajara, Muestras Médicas)
  purchaseNotes?: string; // Notas de compra y tips de ahorro para la familia
  loyaltyPromo?: {
    enabled: boolean;
    storeName: string; // e.g. Farmacias Value (Promoción 3+1)
    requiredPurchases: number; // e.g. 3
    currentPurchased: number; // e.g. 2
    rewardDescription: string; // e.g. 1 Frasco / Caja Gratis
    isRewardReady?: boolean;
  };
  donationSource?: {
    fromPatientName: string;
    fromFamilyName?: string;
    donorType?: 'family' | 'known_person' | 'dispensary';
    date: string;
    notes?: string;
  };
  badgeColor?: string;
  expirationDate?: string; // YYYY-MM-DD
  stockTrackingMode?: 'pieces' | 'manual_bottle'; // 'pieces' = subtract units on each dose; 'manual_bottle' = eye drops/ointments/syrups managed manually until empty
  bottlesCount?: number; // Quantity of bottles or samples in stock (e.g. 2 bottles of 3ml)
  packageUnits?: number; // Standard units per box (e.g. 15, 28, 30 capsules)
  isMedicalSample?: boolean; // True if acquired as medical samples / loose capsules / muestrario
  sampleNotes?: string; // e.g. "Muestra médica 3ml" or "Cápsulas sueltas a $20 c/u"
  route?: 'oral' | 'ophthalmic' | 'topical' | 'nasal' | 'otic' | 'inhalation' | 'injectable' | 'other';
  status?: 'active' | 'completed' | 'suspended';
  completedAt?: string; // ISO date string when medicine was finished / stopped
  completionReason?: 'bottle_finished' | 'doctor_stopped' | 'treatment_completed' | 'other';
  completionNotes?: string;
  batches?: MedicationBatch[]; // Multi-batch / multi-box inventory with distinct laboratories, photos & stock
  activeBatchId?: string; // ID of the currently active batch being administered
}

export interface MedicationBatch {
  id: string;
  name?: string; // e.g. "Lote Bayer" or "Lote 3 Cajas Promo"
  laboratory?: string; // Brand or Lab manufacturer (e.g. "Bayer", "Silanes", "Farmacias del Ahorro")
  boxesCount?: number; // Initial total boxes in this batch
  remainingBoxes?: number; // Remaining boxes in this batch
  unitsPerBox?: number; // Standard units per box (e.g. 28 tabs, 15 caps)
  totalUnits: number; // Total units in this batch
  remainingUnits: number; // Remaining units in this batch
  unitCost?: number; // Cost paid for this batch or unit
  expirationDate?: string; // YYYY-MM-DD
  imageUrl?: string; // Specific photo of this box/batch
  preferredStore?: string; // e.g. "Farmacia del Ahorro", "Farmacia Regina"
  isMedicalSample?: boolean;
  sampleNotes?: string;
  isCurrentActive?: boolean; // True if this batch is currently in use in the medicine cabinet
  addedAt: string; // ISO date string or YYYY-MM-DD
  finishedAt?: string;
  finishReason?: 'depleted' | 'manual_box_finish' | 'expired' | 'damaged' | 'lost' | 'switched';
  notes?: string;
}

export interface DoseLog {
  id: string;
  familyId?: string;
  medicationId: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  actualTakenTime?: string; // HH:MM
  dose: number;
  taken: boolean;
  notes?: string;
  administeredBy?: string; // Name of caregiver who administered dose
}

export type VitalType = 'glucose' | 'blood_pressure' | 'spo2' | 'weight' | 'heart_rate';

export interface VitalSign {
  id: string;
  familyId?: string;
  patientId: string;
  type: VitalType;
  value: number; // For BP this can be systolic
  secondaryValue?: number; // Diastolic
  timing?: 'fasting' | 'postprandial' | 'random' | 'before_sleep';
  timestamp: string;
  notes?: string;
}

export interface MonitoringCampaign {
  id: string;
  familyId?: string;
  patientId: string;
  name: string;
  vitalTypes: VitalType[];
  startDate: string;
  durationDays: number;
  checksPerDay: number;
  targetNotes?: string;
  isActive: boolean;
}

export type CaregiverShift = 'morning' | 'evening' | 'night' | 'full_day' | 'weekend';

export interface FamilyMember {
  id: string;
  familyId?: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  shift?: CaregiverShift;
  isDefaultCaregiver?: boolean;
  splitPercentage: number;
  isActive: boolean;
}

export interface HealthExpense {
  id: string;
  familyId?: string;
  patientId: string;
  concept: string;
  category: 'medication' | 'lab_study' | 'doctor_appointment' | 'supplies' | 'other';
  amount: number;
  date: string;
  paidBy: string;
  store?: string; // Farmacia o tienda donde se compró (ej: Mercado Libre, Farmacias Guadalajara)
  medicationId?: string; // Enlace al medicamento para tracking de precios y aumentos
  receiptUrl?: string;
}

export interface MedicalAppointment {
  id: string;
  familyId?: string;
  patientId: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  location?: string; // e.g. "Clínica CAMED - Av. Cupules x Calle 60, Mérida"
  googleMapsUrl?: string; // Direct Google Maps pin / location link
  doctorPhone?: string;
  notes?: string;
  verbalRecommendations?: string[]; // Recomendaciones verbales dadas por el doctor que no vienen en la receta
  prescriptionUrl?: string; // Base64 data URL for doctor's prescription sheet photo / PDF
  prescriptionFileType?: 'image' | 'pdf';
  isCompleted: boolean;
}

export interface MedicalStudy {
  id: string;
  familyId?: string;
  patientId: string;
  title: string;
  category: 'blood_test' | 'imaging' | 'cardiology' | 'pathology' | 'nutrition_plan' | 'other';
  date: string;
  laboratory?: string;
  resultsSummary?: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'image';
  viewerUrl?: string; // Web PACS / DICOM / 3D CT/MRI Viewer URL (e.g. Eva Center, Cedir, PACS)
  reportUrl?: string; // Online Laboratory / Radiology Interpretation Portal URL
  accessCredentials?: string; // User/Pass/PIN instructions if requested by the radiology center
}

export interface FutureBookingReminder {
  id: string;
  familyId?: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  targetConsultationDate: string; // YYYY-MM-DD (e.g. 2027-08-18)
  callClinicDate: string; // YYYY-MM-DD (e.g. 2027-07-18, 1 month before)
  clinicPhone?: string;
  clinicAddress?: string;
  notes?: string;
  status: 'waiting_agenda_open' | 'call_now_ready' | 'booked_confirmed';
  confirmedAppointmentId?: string;
  createdAt?: string;
}
