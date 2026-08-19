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
  FutureBookingReminder,
  FamilyCircle
} from '../types';

export const initialFamilyCircles: FamilyCircle[] = [
  {
    id: 'circle-poot-ibarra',
    name: 'Familia Poot Ibarra',
    inviteCode: 'IBARRA-2026',
    createdAt: '2026-08-18'
  },
  {
    id: 'circle-poot',
    name: 'Familia Poot Burgos',
    inviteCode: 'POOT-7821',
    createdAt: '2026-08-01'
  },
  {
    id: 'circle-demo-sandbox',
    name: '🧪 Laboratorio de Pruebas (Demo Sandbox)',
    inviteCode: 'DEMO-9999',
    createdAt: '2026-08-10'
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'patient-sara-burgos',
    familyId: 'circle-poot',
    name: 'Sara Burgos Uc (Mamá)',
    type: 'chronic',
    primaryDiagnosis: 'Control Médico Integral',
    notes: 'Tratamiento continuo con seguimiento familiar.'
  },
  {
    id: 'patient-demo-manuel',
    familyId: 'circle-demo-sandbox',
    name: 'Don Manuel Poot (Demo Pruebas)',
    birthDate: '1948-03-15',
    age: 78,
    type: 'chronic',
    primaryDiagnosis: 'Diabetes Tipo 2 e Hipertensión (Pruebas)',
    notes: 'Paciente demo para probar nuevas funcionalidades.'
  },
  {
    id: 'patient-demo-maria',
    familyId: 'circle-demo-sandbox',
    name: 'Doña María (Demo Pruebas)',
    birthDate: '1952-06-20',
    age: 74,
    type: 'temporary',
    primaryDiagnosis: 'Tratamiento Antibiótico (Pruebas)',
    treatmentStartDate: '2026-08-15',
    durationDays: 7,
    notes: 'Medicamento con alimentos. Control demo.'
  }
];

export const initialMedications: Medication[] = [
  {
    id: 'med-sara-rivaroxaban',
    familyId: 'circle-poot',
    patientId: 'patient-sara-burgos',
    name: 'Rivaroxaban',
    activeIngredient: 'Rivaroxabán',
    dosageStrength: '2.5 mg',
    presentation: 'tablet',
    indication: 'Prevenir y tratar la formación de coágulos de sangre en las venas y arterias',
    laboratory: 'Camber',
    expirationDate: '2027-10-15',
    isImssCovered: false,
    source: 'private_pharmacy',
    unitCost: 450,
    preferredStore: 'Farmacias Guadalajara',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Con alimentos' }
      ],
      startDate: '2026-08-01'
    },
    currentStock: 56,
    minimumStockAlert: 5
  },
  {
    id: 'med-sara-kryntantek',
    familyId: 'circle-poot',
    patientId: 'patient-sara-burgos',
    name: 'KRYNTANTEK oftteno',
    activeIngredient: 'Dorzolamida / Timolol / Brimonidina',
    dosageStrength: 'Solución Oftálmica 5 ml',
    presentation: 'drops',
    indication: 'Glaucoma y presión intraocular',
    laboratory: 'Sophia',
    stockTrackingMode: 'manual_bottle',
    bottlesCount: 2,
    isMedicalSample: true,
    sampleNotes: '2 muestras médicas de 3ml compradas en Farmacia Regina',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '09:00', dose: 1, instruction: '1 gota en ojo derecho' }
      ],
      startDate: '2026-08-01'
    },
    currentStock: 2,
    minimumStockAlert: 1
  },
  {
    id: 'med-sara-isox',
    familyId: 'circle-poot',
    patientId: 'patient-sara-burgos',
    name: 'Isox 15D',
    activeIngredient: 'Itraconazol / Secnidazol',
    dosageStrength: '100 mg / 166.6 mg',
    presentation: 'capsule',
    indication: 'Candidiasis vaginal aguda o recurrente',
    laboratory: 'Itra',
    isMedicalSample: true,
    sampleNotes: '4 cajas de 2 cápsulas (Farmacia Regina)',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '09:00', dose: 1, instruction: 'Con el desayuno' }
      ],
      startDate: '2026-08-01'
    },
    currentStock: 8,
    minimumStockAlert: 2
  },
  {
    id: 'med-metformin',
    familyId: 'circle-demo-sandbox',
    patientId: 'patient-demo-manuel',
    name: 'Metformina / Sitagliptina (500mg)',
    presentation: 'tablet',
    indication: 'Control glucémico en Diabetes Tipo 2',
    laboratory: 'MSD / Janumet',
    expirationDate: '2027-04-30',
    isImssCovered: true,
    source: 'imss',
    unitCost: 0,
    preferredStore: 'IMSS Clínica 59',
    purchaseNotes: 'Suministrado mensualmente sin costo por el IMSS ($0 MXN).',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Con el desayuno' },
        { time: '20:00', dose: 0.5, instruction: 'Con la cena (media pastilla)' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 28,
    minimumStockAlert: 6
  },
  {
    id: 'med-demo-rivaroxaban',
    familyId: 'circle-demo-sandbox',
    patientId: 'patient-demo-manuel',
    name: 'Rivaroxabán (20mg Demo)',
    presentation: 'tablet',
    indication: 'Anticoagulante preventivo',
    laboratory: 'Bayer / Xarelto',
    expirationDate: '2026-09-10',
    isImssCovered: false,
    source: 'online_store',
    unitCost: 510,
    preferredStore: 'Mercado Libre',
    purchaseNotes: 'Comprar genérico en Mercado Libre con misma sal (Rivaroxabán 20mg) a $510 MXN.',
    frequency: {
      type: 'alternate_days',
      doseSlots: [
        { time: '13:00', dose: 1, instruction: 'Un día sí y un día no con la comida' }
      ],
      startDate: '2026-08-16'
    },
    currentStock: 12,
    minimumStockAlert: 4
  },
  {
    id: 'med-krytantek',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    name: 'Krytantek Gotas Oftálmicas',
    presentation: 'drops',
    indication: 'Control de presión intraocular / Glaucoma',
    laboratory: 'Sophia',
    expirationDate: '2027-06-15',
    isImssCovered: false,
    source: 'medical_sample',
    unitCost: 600,
    preferredStore: 'Muestras Médicas / Consultorio',
    purchaseNotes: 'Conseguir muestras médicas a $600 MXN en lugar de pagar $890 MXN en farmacia (Ahorro de $290 MXN).',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: '1 gota en cada ojo' },
        { time: '20:00', dose: 1, instruction: '1 gota en cada ojo' }
      ],
      startDate: '2026-08-01'
    },
    currentStock: 2,
    minimumStockAlert: 1
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
    isImssCovered: false,
    source: 'private_pharmacy',
    unitCost: 210,
    preferredStore: 'Farmacias Guadalajara',
    purchaseNotes: 'Comprar en Farmacias Guadalajara los días de descuento.',
    frequency: {
      type: 'every_n_days',
      intervalDays: 4,
      doseSlots: [
        { time: '14:00', dose: 1, instruction: 'Cada 4 días' }
      ],
      startDate: '2026-08-14'
    },
    currentStock: 18,
    minimumStockAlert: 5
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
    isImssCovered: false,
    source: 'private_pharmacy',
    unitCost: 420,
    preferredStore: 'Farmacias del Ahorro',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Mañana' },
        { time: '20:00', dose: 1, instruction: 'Noche' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 4,
    minimumStockAlert: 6
  },
  {
    id: 'med-eyestil',
    familyId: 'circle-poot',
    patientId: 'patient-jose',
    name: 'Eyestil Plus Gotas Oftálmicas',
    presentation: 'drops',
    indication: 'Lubricación y protección ocular (Autocuidado)',
    laboratory: 'Sifi',
    expirationDate: '2027-12-01',
    isImssCovered: false,
    source: 'private_pharmacy',
    unitCost: 380,
    preferredStore: 'Farmacias Value',
    purchaseNotes: 'Comprar en Farmacias Value: Por cada 3era compra regalan 1 frasco (Promoción 3+1).',
    loyaltyPromo: {
      enabled: true,
      storeName: 'Farmacias Value',
      requiredPurchases: 3,
      currentPurchased: 2,
      rewardDescription: '1 Frasco Gratis por promoción 3+1'
    },
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '09:00', dose: 1, instruction: '1 gota en cada ojo' },
        { time: '21:00', dose: 1, instruction: '1 gota en cada ojo antes de dormir' }
      ],
      startDate: '2026-08-01'
    },
    currentStock: 1,
    minimumStockAlert: 1
  },
  {
    id: 'med-pregabalina-maria',
    familyId: 'circle-poot',
    patientId: 'patient-maria',
    name: 'Pregabalina (75mg)',
    presentation: 'capsule',
    indication: 'Dolor neuropático (Tratamiento completado)',
    laboratory: 'IMSS Genérico',
    expirationDate: '2027-08-30',
    isImssCovered: true,
    source: 'imss',
    unitCost: 0,
    preferredStore: 'IMSS',
    purchaseNotes: 'Suministrado por el IMSS. Doña María ya no lo usa activamente y está disponible para donación/traspaso solidario a familiares o suegros.',
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '21:00', dose: 1, instruction: '1 cápsula por la noche' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 28,
    minimumStockAlert: 5
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
    isImssCovered: false,
    unitCost: 220,
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
    minimumStockAlert: 2
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
    isImssCovered: true,
    unitCost: 0,
    frequency: {
      type: 'daily_fixed',
      doseSlots: [
        { time: '08:00', dose: 1, instruction: 'Por la mañana con agua' }
      ],
      startDate: '2026-01-01'
    },
    currentStock: 30,
    minimumStockAlert: 5
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
    isImssCovered: false,
    unitCost: 480,
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
    minimumStockAlert: 10
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
    id: 'fam-jose',
    familyId: 'circle-poot',
    name: 'José Manuel Poot',
    relationship: 'Hijo / Cuidador Principal de Papá y Mamá',
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
    concept: 'Rivaroxabán 20mg en Farmacia de Cadena',
    category: 'medication',
    amount: 1200,
    date: '2026-07-15',
    paidBy: 'Carlos Poot',
    store: 'Farmacias Guadalajara',
    medicationId: 'med-rivaroxaban'
  },
  {
    id: 'exp-2',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    concept: 'Rivaroxabán 20mg en Mercado Libre (Mismo compuesto)',
    category: 'medication',
    amount: 510,
    date: '2026-08-14',
    paidBy: 'Lucía Poot',
    store: 'Mercado Libre',
    medicationId: 'med-rivaroxaban'
  },
  {
    id: 'exp-3',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    concept: 'Krytantek Gotas (Muestras Médicas)',
    category: 'medication',
    amount: 600,
    date: '2026-08-12',
    paidBy: 'Jorge Poot',
    store: 'Muestras Médicas',
    medicationId: 'med-krytantek'
  },
  {
    id: 'exp-4',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    concept: 'Aspirina Protect 100mg (Compra con aumento)',
    category: 'medication',
    amount: 210,
    date: '2026-08-01',
    paidBy: 'Carlos Poot',
    store: 'Farmacias Guadalajara',
    medicationId: 'med-aspirin'
  },
  {
    id: 'exp-5',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    concept: 'Química Sanguínea y Perfil HbA1c (Laboratorios Chopo)',
    category: 'lab_study',
    amount: 1250,
    date: '2026-08-10',
    paidBy: 'Lucía Poot',
    store: 'Laboratorios Chopo'
  }
];

export const initialAppointments: MedicalAppointment[] = [
  {
    id: 'app-1',
    familyId: 'circle-poot',
    patientId: 'patient-grandfather',
    doctorName: 'Dr. Alejandro Hernández / Dr. Roberto Méndez',
    specialty: 'Medicina Interna y Geriatría',
    dateTime: '2026-08-25T11:00',
    location: 'Clínica CAMED - Av. Cupules x Calle 60, Mérida, Yucatán',
    doctorPhone: '9999254433',
    notes: 'Llevar bitácora de glucosa de 3 días y estudios de sangre recientes.',
    verbalRecommendations: [
      'Disminuir el consumo de sal a menos de media cucharadita al día.',
      'Caminar 20 minutos diarios por la tarde a paso suave sin agitarse.',
      'No suspender el anticoagulante (Rivaroxabán) antes de cualquier procedimiento sin avisar.',
      'Tomar 2 litros de agua al día para cuidar la función renal.',
      'Usar calzado cómodo sin costuras internas para proteger el pie diabético.'
    ],
    isCompleted: false
  },
  {
    id: 'app-2',
    familyId: 'circle-poot',
    patientId: 'patient-maria',
    doctorName: 'Dra. Patricia Canché',
    specialty: 'Medicina Familiar',
    dateTime: '2026-08-28T09:30',
    location: 'IMSS UMF 59 - Av. del Parque, Mérida',
    doctorPhone: '9999401200',
    notes: 'Cita de seguimiento para surtido de receta mensual y revisión de presión.',
    verbalRecommendations: [
      'Tomar el antibiótico siempre con alimentos para evitar irritación gástrica.',
      'Mantener reposo relativo durante los primeros 5 días.',
      'Evitar cambios bruscos de temperatura.'
    ],
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

export const initialBookingReminders: FutureBookingReminder[] = [
  {
    id: 'rem-angio-maria',
    familyId: 'circle-poot',
    patientId: 'patient-maria',
    patientName: 'Doña María Poot (Mamá)',
    doctorName: 'Dr. Alejandro Cantón',
    specialty: 'Angiología y Cirugía Vascular',
    targetConsultationDate: '2027-08-18',
    callClinicDate: '2027-07-18',
    clinicPhone: '9999254433',
    clinicAddress: 'Clínica CAMED - Av. Cupules, Mérida',
    notes: 'Revisión anual de circulación periférica. La asistente indicó llamar 1 mes antes para abrir la agenda anual.',
    status: 'waiting_agenda_open'
  }
];

