import {
  Patient,
  Medication,
  DoseLog,
  VitalSign,
  MonitoringCampaign,
  FamilyMember,
  HealthExpense,
  MedicalAppointment,
  MedicalStudy,
  FamilyCircle
} from '../types';

export const initialFamilyCircles: FamilyCircle[] = [
  {
    id: 'circle-poot',
    name: 'Familia Poot (Elderly Care)',
    inviteCode: 'POOT-7821',
    createdAt: '2026-08-01'
  },
  {
    id: 'circle-gomez',
    name: 'Familia Gómez (In-Laws / Suegros)',
    inviteCode: 'GOME-3390',
    createdAt: '2026-08-10'
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'patient-grandfather',
    familyId: 'circle-poot',
    name: 'Don Manuel Poot (Grandfather)',
    age: 78,
    type: 'chronic',
    primaryDiagnosis: 'Type 2 Diabetes & Hypertension',
    notes: 'Elderly care. Low sodium diet. Monitor fasting glucose closely.'
  },
  {
    id: 'patient-maria',
    familyId: 'circle-poot',
    name: 'Maria (Mother)',
    age: 52,
    type: 'temporary',
    primaryDiagnosis: 'Acute Bronchitis',
    treatmentStartDate: '2026-08-15',
    durationDays: 7,
    notes: 'Take antibiotic with food. Rest for 5 days.'
  },
  {
    id: 'patient-suegro',
    familyId: 'circle-gomez',
    name: 'Don Roberto Gómez (Father-in-law)',
    age: 74,
    type: 'chronic',
    primaryDiagnosis: 'Hypertension & Osteoarthritis',
    notes: 'Check blood pressure every morning'
  }
];

export const initialMedications: Medication[] = [
  {
    id: 'med-metformin',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    name: 'Metformin / Sitagliptin (500mg)',
    presentation: 'tablet',
    indication: 'Type 2 Diabetes glycemic control',
    laboratory: 'MSD / Janumet',
    expirationDate: '2027-04-30',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'With breakfast' },
        { time: '20:00', dose: 0.5, instruction: 'With dinner (half pill)' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 28,
    minimumStockAlert: 6,
    unitCost: 350
  },
  {
    id: 'med-rivaroxaban',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    name: 'Rivaroxaban (20mg)',
    presentation: 'tablet',
    indication: 'Anticoagulant / Blood Thinner',
    laboratory: 'Bayer / Xarelto',
    expirationDate: '2026-09-10',
    frequency: {
      type: 'alternate_days',
      doseSlots: [
        { time: '13:00', dose: 1, instruction: 'Every other day with lunch' }
      ],
      startDate: '2026-08-16'
    },
    currentStock: 12,
    minimumStockAlert: 4,
    unitCost: 890
  },
  {
    id: 'med-aspirin',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    name: 'Aspirin Protect (100mg)',
    presentation: 'tablet',
    indication: 'Cardiovascular protection',
    laboratory: 'Bayer',
    expirationDate: '2027-11-20',
    frequency: {
      type: 'every_n_days',
      intervalDays: 4,
      doseSlots: [
        { time: '14:00', dose: 1, instruction: 'Every 4 days' }
      ],
      startDate: '2026-08-14'
    },
    currentStock: 18,
    minimumStockAlert: 5,
    unitCost: 180
  },
  {
    id: 'med-cilostazol',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    name: 'Cilostazol (100mg)',
    presentation: 'tablet',
    indication: 'Peripheral circulation',
    laboratory: 'Silanes',
    expirationDate: '2026-08-01',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Morning' },
        { time: '20:00', dose: 1, instruction: 'Night' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 4,
    minimumStockAlert: 6,
    unitCost: 420
  },
  {
    id: 'med-ciprofloxacin',
    familyId: 'circle-poot',
    patientId: 'patient-maria',
    name: 'Ciprofloxacin (500mg)',
    presentation: 'tablet',
    indication: 'Acute infection treatment',
    laboratory: 'Genérico GI',
    expirationDate: '2027-02-15',
    frequency: {
      type: 'temporary_hourly',
      intervalHours: 12,
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Every 12 hours with full glass of water' },
        { time: '20:00', dose: 1, instruction: 'Night dose' }
      ],
      startDate: '2026-08-15',
      endDate: '2026-08-22'
    },
    currentStock: 10,
    minimumStockAlert: 2,
    unitCost: 220
  },
  {
    id: 'med-losartan-gomez',
    familyId: 'circle-gomez',
    patientId: 'patient-suegro',
    name: 'Losartan Potásico (50mg)',
    presentation: 'tablet',
    indication: 'Blood pressure control',
    laboratory: 'Silanes',
    expirationDate: '2027-09-01',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Morning with water' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 30,
    minimumStockAlert: 5,
    unitCost: 150
  }
];

export const initialDoseLogs: DoseLog[] = [
  {
    id: 'log-1',
    familyId: 'circle-poot',
    medicationId: 'med-metformin',
    patientId: 'patient-grandfather',
    date: '2026-08-17',
    scheduledTime: '08:00',
    actualTakenTime: '08:15',
    dose: 1,
    taken: true,
    notes: 'Taken with oatmeal',
    administeredBy: 'Carlos Poot (Morning Shift)'
  }
];

export const initialVitals: VitalSign[] = [
  {
    id: 'vit-1',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    type: 'glucose',
    value: 118,
    timing: 'fasting',
    timestamp: '2026-08-17T07:30:00',
    notes: 'Optimal fasting range'
  },
  {
    id: 'vit-2',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    type: 'blood_pressure',
    value: 125,
    secondaryValue: 82,
    timing: 'fasting',
    timestamp: '2026-08-17T07:35:00',
    notes: 'Stable resting BP'
  },
  {
    id: 'vit-3',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    type: 'spo2',
    value: 97,
    timestamp: '2026-08-17T07:40:00',
    notes: 'Normal oxygenation'
  }
];

export const initialCampaigns: MonitoringCampaign[] = [
  {
    id: 'camp-glucose-3d',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    name: '3-Day Pre-Consultation Glucose Challenge',
    vitalTypes: ['glucose'],
    startDate: '2026-08-16',
    durationDays: 3,
    checksPerDay: 2,
    targetNotes: 'Measure fasting (7am) and 2 hours after lunch (3pm)',
    isActive: true
  }
];

export const initialFamilies: FamilyMember[] = [
  {
    id: 'fam-carlos',
    familyId: 'circle-poot',
    name: 'Carlos Poot',
    relationship: 'Son / Main Caregiver',
    shift: 'morning',
    isDefaultCaregiver: true,
    phone: '5219991234567',
    splitPercentage: 50,
    isActive: true
  },
  {
    id: 'fam-lucia',
    familyId: 'circle-poot',
    name: 'Lucia Poot',
    relationship: 'Daughter / Night Shift',
    shift: 'night',
    isDefaultCaregiver: false,
    phone: '5219997654321',
    splitPercentage: 50,
    isActive: true
  },
  {
    id: 'fam-esposa',
    familyId: 'circle-gomez',
    name: 'Claudia Gómez',
    relationship: 'Daughter / Main Caregiver',
    shift: 'full_day',
    isDefaultCaregiver: true,
    phone: '5219998887766',
    splitPercentage: 100,
    isActive: true
  }
];

export const initialExpenses: HealthExpense[] = [
  {
    id: 'exp-1',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    concept: 'Metformin 500mg & Cilostazol restock (Farmacias Guadalajara)',
    category: 'medication',
    amount: 770,
    date: '2026-08-14',
    paidBy: 'Carlos Poot'
  },
  {
    id: 'exp-2',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    concept: 'Monthly Blood Chem & HbA1c Lab Panel (Chopo)',
    category: 'lab_study',
    amount: 1250,
    date: '2026-08-10',
    paidBy: 'Lucia Poot'
  }
];

export const initialAppointments: MedicalAppointment[] = [
  {
    id: 'app-1',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    doctorName: 'Dr. Alejandro Hernandez',
    specialty: 'Internal Medicine & Geriatrics',
    dateTime: '2026-08-25T11:00',
    location: 'Clinica Merida - Suite 402',
    notes: 'Bring 3-day glucose log and latest blood test results',
    isCompleted: false
  }
];

export const initialStudies: MedicalStudy[] = [
  {
    id: 'study-1',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    title: 'Complete Metabolic Panel & HbA1c (6.8%)',
    category: 'blood_test',
    date: '2026-08-10',
    laboratory: 'Laboratorios Chopo',
    resultsSummary: 'HbA1c: 6.8% (Target < 7.0%). Fasting Glucose: 115 mg/dL. Creatinine: 1.0 mg/dL.'
  }
];
