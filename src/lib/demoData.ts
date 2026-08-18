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
    name: 'Familia Poot (Cuidado Familiar)',
    inviteCode: 'POOT-7821',
    createdAt: '2026-08-01'
  },
  {
    id: 'circle-gomez',
    name: 'Familia Gómez (Suegros)',
    inviteCode: 'GOME-3390',
    createdAt: '2026-08-10'
  },
  {
    id: 'circle-personal-laura',
    name: 'Mi Cuidado Personal (Laura)',
    inviteCode: 'LAUR-9912',
    createdAt: '2026-08-15',
    isPersonalSpace: true
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'patient-grandfather',
    familyId: 'circle-poot',
    name: 'Don Manuel Poot',
    age: 78,
    type: 'chronic',
    primaryDiagnosis: 'Diabetes Tipo 2 e Hipertensión',
    notes: 'Dieta baja en sodio y control estricto de glucosa en ayunas.'
  },
  {
    id: 'patient-maria',
    familyId: 'circle-poot',
    name: 'Doña María Poot',
    age: 52,
    type: 'temporary',
    primaryDiagnosis: 'Bronquitis Aguda',
    treatmentStartDate: '2026-08-15',
    durationDays: 7,
    notes: 'Tomar antibiótico con alimentos. Reposo por 5 días.'
  },
  {
    id: 'patient-suegro',
    familyId: 'circle-gomez',
    name: 'Don Roberto Gómez',
    age: 74,
    type: 'chronic',
    primaryDiagnosis: 'Hipertensión y Artrosis',
    notes: 'Toma de presión arterial matutina.'
  },
  {
    id: 'patient-laura-self',
    familyId: 'circle-personal-laura',
    name: 'Laura Poot',
    age: 38,
    type: 'temporary',
    primaryDiagnosis: 'Control de Colesterol y Lípidos',
    treatmentStartDate: '2026-08-17',
    durationDays: 60,
    notes: 'Atorvastatina 20mg diarios por 60 días. Autocuidado.'
  }
];

export const initialMedications: Medication[] = [
  {
    id: 'med-metformin',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    name: 'Metformina / Sitagliptina (500mg)',
    presentation: 'tablet',
    indication: 'Control glucémico en Diabetes Tipo 2',
    laboratory: 'MSD / Janumet',
    expirationDate: '2027-04-30',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Con el desayuno' },
        { time: '20:00', dose: 0.5, instruction: 'Con la cena (media pastilla)' }
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
    name: 'Rivaroxabán (20mg)',
    presentation: 'tablet',
    indication: 'Anticoagulante preventivo',
    laboratory: 'Bayer / Xarelto',
    expirationDate: '2026-09-10',
    frequency: {
      type: 'alternate_days',
      doseSlots: [
        { time: '13:00', dose: 1, instruction: 'Un día sí y un día no con la comida' }
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
    name: 'Aspirina Protect (100mg)',
    presentation: 'tablet',
    indication: 'Protección cardiovascular',
    laboratory: 'Bayer',
    expirationDate: '2027-11-20',
    frequency: {
      type: 'every_n_days',
      intervalDays: 4,
      doseSlots: [
        { time: '14:00', dose: 1, instruction: 'Cada 4 días' }
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
    indication: 'Circulación periférica',
    laboratory: 'Silanes',
    expirationDate: '2026-08-01',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Mañana' },
        { time: '20:00', dose: 1, instruction: 'Noche' }
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
    name: 'Ciprofloxacino (500mg)',
    presentation: 'tablet',
    indication: 'Tratamiento de infección aguda',
    laboratory: 'Genérico GI',
    expirationDate: '2027-02-15',
    frequency: {
      type: 'temporary_hourly',
      intervalHours: 12,
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Cada 12 horas con vaso lleno de agua' },
        { time: '20:00', dose: 1, instruction: 'Toma de la noche' }
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
    name: 'Losartán Potásico (50mg)',
    presentation: 'tablet',
    indication: 'Control de presión arterial',
    laboratory: 'Silanes',
    expirationDate: '2027-09-01',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Por la mañana con agua' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 30,
    minimumStockAlert: 5,
    unitCost: 150
  },
  {
    id: 'med-atorvastatin-laura',
    familyId: 'circle-personal-laura',
    patientId: 'patient-laura-self',
    name: 'Atorvastatina (20mg)',
    presentation: 'tablet',
    indication: 'Control de colesterol y triglicéridos',
    laboratory: 'Pfizer / Lipitor',
    expirationDate: '2027-10-15',
    frequency: {
      type: 'temporary_hourly',
      intervalHours: 24,
      doseSlots: [
        { time: '21:00', dose: 1, instruction: 'Por la noche con la cena' }
      ],
      startDate: '2026-08-17',
      endDate: '2026-10-16'
    },
    currentStock: 60,
    minimumStockAlert: 10,
    unitCost: 480
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
    notes: 'Tomada con avena',
    administeredBy: 'Carlos Poot'
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
    notes: 'Glucosa en ayunas estable'
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
    notes: 'Presión en reposo adecuada'
  },
  {
    id: 'vit-3',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    type: 'spo2',
    value: 97,
    timestamp: '2026-08-17T07:40:00',
    notes: 'Oxigenación normal'
  }
];

export const initialCampaigns: MonitoringCampaign[] = [
  {
    id: 'camp-glucose-3d',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    name: 'Reto de 3 Días de Glucosa Pre-Consulta',
    vitalTypes: ['glucose'],
    startDate: '2026-08-16',
    durationDays: 3,
    checksPerDay: 2,
    targetNotes: 'Medir en ayunas (7:00 am) y 2 horas después de comer (3:00 pm)',
    isActive: true
  }
];

export const initialFamilies: FamilyMember[] = [
  {
    id: 'fam-carlos',
    familyId: 'circle-poot',
    name: 'Carlos Poot',
    relationship: 'Hijo / Cuidador Principal',
    shift: 'morning',
    isDefaultCaregiver: true,
    phone: '5219991234567',
    splitPercentage: 50,
    isActive: true
  },
  {
    id: 'fam-lucia',
    familyId: 'circle-poot',
    name: 'Lucía Poot',
    relationship: 'Hija / Turno Noche',
    shift: 'night',
    isDefaultCaregiver: false,
    phone: '5219997654321',
    splitPercentage: 33.3,
    isActive: true
  },
  {
    id: 'fam-jorge',
    familyId: 'circle-poot',
    name: 'Jorge Poot',
    relationship: 'Hijo / Turno Noche (Co-Cuidador)',
    shift: 'night',
    isDefaultCaregiver: false,
    phone: '5219995554433',
    splitPercentage: 33.3,
    isActive: true
  },
  {
    id: 'fam-esposa',
    familyId: 'circle-gomez',
    name: 'Claudia Gómez',
    relationship: 'Hija / Cuidadora Principal',
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
    concept: 'Surtido de Metformina 500mg y Cilostazol (Farmacias Guadalajara)',
    category: 'medication',
    amount: 770,
    date: '2026-08-14',
    paidBy: 'Carlos Poot'
  },
  {
    id: 'exp-2',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    concept: 'Química Sanguínea y Perfil HbA1c (Laboratorios Chopo)',
    category: 'lab_study',
    amount: 1250,
    date: '2026-08-10',
    paidBy: 'Lucía Poot'
  }
];

export const initialAppointments: MedicalAppointment[] = [
  {
    id: 'app-1',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    doctorName: 'Dr. Alejandro Hernández',
    specialty: 'Medicina Interna y Geriatría',
    dateTime: '2026-08-25T11:00',
    location: 'Clínica Mérida - Consultorio 402',
    notes: 'Llevar bitácora de glucosa de 3 días y estudios de sangre recientes',
    isCompleted: false
  }
];

export const initialStudies: MedicalStudy[] = [
  {
    id: 'study-1',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    title: 'Química Sanguínea 6 Elementos & HbA1c (6.8%)',
    category: 'blood_test',
    date: '2026-08-10',
    laboratory: 'Laboratorios Chopo',
    resultsSummary: 'HbA1c: 6.8% (Objetivo < 7.0%). Glucosa en ayunas: 115 mg/dL. Creatinina: 1.0 mg/dL.'
  },
  {
    id: 'study-2',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    title: 'Tomografía Computarizada / Angiotomografía de Miembros Inferiores',
    category: 'imaging',
    date: '2026-08-17',
    laboratory: 'Eva Center / Unirad Mérida',
    resultsSummary: 'Estudio tomográfico de arterias de miembro pélvico. Visualización DICOM en 3D disponible en portal PACS.',
    viewerUrl: 'https://pacs.evacenter.com/viewer/30b08ba1-be06-4459-ad48-ec455a42f147/?ac=dXNlcj11bmlyYWQtbWVyaWRhQHZpc2l0YW50LmNvbSZwYXNzd29yZD0xYzE5NmI4Ni1hNjc3LTQ5ZmQtOGMzMS0xOWM5ODc5YzkwMTkmZXh0cmFfdmFsaWRhdGlvbj04NDJlNGQ5NC01YjQ0LTQ1MDgtODAxNC00NWJiYTgzYmY2NDk===&mv=1&md=1',
    reportUrl: 'https://apps.evacenter.com/pacs/report-detail/30b08ba1-be06-4459-ad48-ec455a42f147/?ac=dXNlcj11bmlyYWQtbWVyaWRhQHZpc2l0YW50LmNvbSZwYXNzd29yZD0xYzE5NmI4Ni1hNjc3LTQ5ZmQtOGMzMS0xOWM5ODc5YzkwMTkmZXh0cmFfdmFsaWRhdGlvbj04NDJlNGQ5NC01YjQ0LTQ1MDgtODAxNC00NWJiYTgzYmY2NDk===&mv=1&md=1'
  }
];
