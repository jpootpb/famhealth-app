import { Patient, Medication, VitalSign, FamilyMember, HealthExpense, MedicalAppointment, MedicalStudy } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'patient-grandfather',
    name: 'Don Manuel (Elderly Patient)',
    age: 78,
    type: 'chronic',
    primaryDiagnosis: 'Type 2 Diabetes, Hypertension & Chronic Venous Insufficiency',
    notes: 'Monitor night doses (1/2 tablet) and morning fasting glucose levels.'
  },
  {
    id: 'patient-wife',
    name: 'Maria (Temporary Treatment)',
    age: 42,
    type: 'temporary',
    primaryDiagnosis: 'Acute Gastrointestinal Infection',
    treatmentStartDate: '2026-08-15',
    durationDays: 7,
    notes: 'Antibiotics and oral rehydration.'
  }
];

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-metformin',
    patientId: 'patient-grandfather',
    name: 'Metformin / Sitagliptin (850mg/50mg)',
    presentation: 'tablet',
    indication: 'Blood glucose control with meals',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: '1 pill with breakfast' },
        { time: '20:00', dose: 0.5, instruction: '1/2 pill with dinner' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 24,
    minimumStockAlert: 8,
    unitCost: 450,
    badgeColor: '#0284c7'
  },
  {
    id: 'med-aspirin',
    patientId: 'patient-grandfather',
    name: 'Aspirin Protect (100mg)',
    presentation: 'tablet',
    indication: 'Cardiovascular prevention',
    frequency: {
      type: 'every_n_days',
      intervalDays: 4,
      doseSlots: [
        { time: '14:00', dose: 1, instruction: '1 pill after lunch every 4 days' }
      ],
      startDate: '2026-08-14'
    },
    currentStock: 18,
    minimumStockAlert: 4,
    unitCost: 220,
    badgeColor: '#7c3aed'
  },
  {
    id: 'med-cilostazol',
    patientId: 'patient-grandfather',
    name: 'Cilostazol (100mg)',
    presentation: 'tablet',
    indication: 'Peripheral vascular circulation',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '09:00', dose: 1, instruction: '1 pill on an empty stomach' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 15,
    minimumStockAlert: 5,
    unitCost: 380,
    badgeColor: '#16a34a'
    },
  {
    id: 'med-rivaroxaban',
    patientId: 'patient-grandfather',
    name: 'Rivaroxaban (20mg)',
    presentation: 'tablet',
    indication: 'Anticoagulant',
    frequency: {
      type: 'alternate_days',
      doseSlots: [
        { time: '13:00', dose: 1, instruction: '1 pill with lunch (Alternate days)' }
      ],
      startDate: '2026-08-16'
    },
    currentStock: 14,
    minimumStockAlert: 4,
    unitCost: 1100,
    badgeColor: '#d97706'
  },
  {
    id: 'med-ciprofloxacin',
    patientId: 'patient-wife',
    name: 'Ciprofloxacin (500mg)',
    presentation: 'tablet',
    indication: 'Antibiotic every 12 hours for 7 days',
    frequency: {
      type: 'temporary_hourly',
      intervalHours: 12,
      doseSlots: [
        { time: '08:00', dose: 1, instruction: '1 pill' },
        { time: '20:00', dose: 1, instruction: '1 pill' }
      ],
      startDate: '2026-08-15',
      endDate: '2026-08-22'
    },
    currentStock: 10,
    minimumStockAlert: 2,
    unitCost: 180,
    badgeColor: '#dc2626'
  }
];

export const INITIAL_VITALS: VitalSign[] = [
  {
    id: 'vit-1',
    patientId: 'patient-grandfather',
    type: 'glucose',
    primaryValue: 108,
    context: 'Fasting (8:00 AM)',
    dateTime: '2026-08-17T08:05:00',
    notes: 'Optimal target range.'
  },
  {
    id: 'vit-2',
    patientId: 'patient-grandfather',
    type: 'blood_pressure',
    primaryValue: 125,
    secondaryValue: 82,
    pulse: 72,
    context: 'Morning rest',
    dateTime: '2026-08-17T08:10:00',
    notes: 'Well controlled pressure.'
  },
  {
    id: 'vit-3',
    patientId: 'patient-grandfather',
    type: 'oxygen_saturation',
    primaryValue: 97,
    pulse: 74,
    dateTime: '2026-08-17T08:15:00'
  }
];

export const INITIAL_FAMILIES: FamilyMember[] = [
  { id: 'fam-1', name: 'Jose Manuel (Primary Caregiver)', splitPercentage: 33.33, isActive: true },
  { id: 'fam-2', name: 'Carlos (Brother)', splitPercentage: 33.33, isActive: true },
  { id: 'fam-3', name: 'Laura (Sister)', splitPercentage: 33.34, isActive: true }
];

export const INITIAL_EXPENSES: HealthExpense[] = [
  {
    id: 'exp-1',
    patientId: 'patient-grandfather',
    concept: 'Pharmacy: Rivaroxaban & Metformin',
    category: 'medication',
    amount: 1550,
    date: '2026-08-15',
    paidBy: 'Jose Manuel'
  },
  {
    id: 'exp-2',
    patientId: 'patient-grandfather',
    concept: 'Blood Chemistry 6 & Hematology Panel',
    category: 'lab_study',
    amount: 850,
    date: '2026-08-10',
    paidBy: 'Carlos'
  }
];

export const INITIAL_APPOINTMENTS: MedicalAppointment[] = [
  {
    id: 'app-1',
    patientId: 'patient-grandfather',
    doctorName: 'Dr. Roberto Mendoza',
    specialty: 'Internal Medicine / Geriatrics',
    location: 'Angeles Hospital, Suite 204',
    dateTime: '2026-08-25T17:00:00',
    cost: 900,
    reason: 'Semi-annual checkup and anticoagulant adjustment',
    preparationInstructions: 'Bring glucose logs from past week and recent lab studies.',
    isCompleted: false
  }
];

export const INITIAL_STUDIES: MedicalStudy[] = [
  {
    id: 'study-1',
    patientId: 'patient-grandfather',
    title: 'Blood Chemistry 6 & HbA1c',
    category: 'Blood Laboratory',
    laboratory: 'Chopo Laboratories',
    date: '2026-08-10',
    fileName: 'blood_chemistry_august.pdf',
    fileType: 'pdf',
    cost: 850,
    keyFindings: 'Glucose 112 mg/dL, HbA1c 6.8%. Excellent metabolic control.'
  }
];
