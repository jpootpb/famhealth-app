import { Paciente, Medicamento, SignoVital, Familiar, GastoSalud, CitaMedica, EstudioMedico } from '../types';

export const INITIAL_PATIENTS: Paciente[] = [
  {
    id: 'paciente-abuelo',
    nombre: 'Don Manuel (Adulto Mayor)',
    edad: 78,
    tipo: 'cronico',
    diagnosticoPrincipal: 'Diabetes Tipo 2, Hipertensión e Insuficiencia Venosa',
    notas: 'Vigilar tomas nocturnas (1/2 tableta) y niveles de glucosa en ayunas.'
  },
  {
    id: 'paciente-esposa',
    nombre: 'María (Tratamiento Temporal)',
    edad: 42,
    tipo: 'temporal',
    diagnosticoPrincipal: 'Infección gastrointestinal aguda',
    fechaInicioTratamiento: '2026-08-15',
    duracionDias: 7,
    notas: 'Antibiótico e hidratación oral.'
  }
];

export const INITIAL_MEDICATIONS: Medicamento[] = [
  {
    id: 'med-metformina',
    pacienteId: 'paciente-abuelo',
    nombre: 'Metformina / Sitagliptina (850mg/50mg)',
    presentacion: 'tableta',
    indicacion: 'Control de glucosa con alimentos',
    frecuencia: {
      tipo: 'diaria_fija',
      horarios: [
        { hora: '08:00', dosis: 1, instruccion: '1 tableta con desayuno' },
        { hora: '20:00', dosis: 0.5, instruccion: '1/2 tableta con cena' }
      ],
      fechaInicio: '2026-01-01'
    },
    stockActual: 24,
    stockMinimoAlerta: 8,
    costoUnitario: 450,
    colorBadge: '#0284c7'
  },
  {
    id: 'med-aspirina',
    pacienteId: 'paciente-abuelo',
    nombre: 'Aspirina Protect (100mg)',
    presentacion: 'tableta',
    indicacion: 'Prevención cardiovascular',
    frecuencia: {
      tipo: 'cada_n_dias',
      intervaloDias: 4,
      horarios: [
        { hora: '14:00', dosis: 1, instruccion: '1 tableta después de comida cada 4 días' }
      ],
      fechaInicio: '2026-08-14'
    },
    stockActual: 18,
    stockMinimoAlerta: 4,
    costoUnitario: 220,
    colorBadge: '#7c3aed'
  },
  {
    id: 'med-cilostazol',
    pacienteId: 'paciente-abuelo',
    nombre: 'Cilostazol (100mg)',
    presentacion: 'tableta',
    indicacion: 'Circulación periférica',
    frecuencia: {
      tipo: 'diaria_fija',
      horarios: [
        { hora: '09:00', dosis: 1, instruccion: '1 tableta en ayunas' }
      ],
      fechaInicio: '2026-01-01'
    },
    stockActual: 15,
    stockMinimoAlerta: 5,
    costoUnitario: 380,
    colorBadge: '#16a34a'
  },
  {
    id: 'med-rivaroxaban',
    pacienteId: 'paciente-abuelo',
    nombre: 'Rivaroxabán (20mg)',
    presentacion: 'tableta',
    indicacion: 'Anticoagulante',
    frecuencia: {
      tipo: 'dias_alternos',
      horarios: [
        { hora: '13:00', dosis: 1, instruccion: '1 tableta con la comida (Día alterno)' }
      ],
      fechaInicio: '2026-08-16'
    },
    stockActual: 14,
    stockMinimoAlerta: 4,
    costoUnitario: 1100,
    colorBadge: '#d97706'
  },
  {
    id: 'med-ciprofloxacino',
    pacienteId: 'paciente-esposa',
    nombre: 'Ciprofloxacino (500mg)',
    presentacion: 'tableta',
    indicacion: 'Antibiótico cada 12 horas por 7 días',
    frecuencia: {
      tipo: 'por_horas_temporal',
      intervaloHoras: 12,
      horarios: [
        { hora: '08:00', dosis: 1, instruccion: '1 tableta' },
        { hora: '20:00', dosis: 1, instruccion: '1 tableta' }
      ],
      fechaInicio: '2026-08-15',
      fechaFin: '2026-08-22'
    },
    stockActual: 10,
    stockMinimoAlerta: 2,
    costoUnitario: 180,
    colorBadge: '#dc2626'
  }
];

export const INITIAL_VITALS: SignoVital[] = [
  {
    id: 'vit-1',
    pacienteId: 'paciente-abuelo',
    tipo: 'glucosa',
    valorPrincipal: 108,
    contexto: 'Ayunas 08:00',
    fechaHora: '2026-08-17T08:05:00',
    notas: 'Nivel óptimo dentro de meta.'
  },
  {
    id: 'vit-2',
    pacienteId: 'paciente-abuelo',
    tipo: 'presion',
    valorPrincipal: 125,
    valorSecundario: 82,
    pulso: 72,
    contexto: 'Reposo matutino',
    fechaHora: '2026-08-17T08:10:00',
    notas: 'Presión controlada.'
  },
  {
    id: 'vit-3',
    pacienteId: 'paciente-abuelo',
    tipo: 'oxigenacion',
    valorPrincipal: 97,
    pulso: 74,
    fechaHora: '2026-08-17T08:15:00'
  }
];

export const INITIAL_FAMILIES: Familiar[] = [
  { id: 'fam-1', nombre: 'José Manuel (Cuidador Principal)', porcentajeDivision: 33.33, activo: true },
  { id: 'fam-2', nombre: 'Hermano Carlos', porcentajeDivision: 33.33, activo: true },
  { id: 'fam-3', nombre: 'Hermana Laura', porcentajeDivision: 33.34, activo: true }
];

export const INITIAL_EXPENSES: GastoSalud[] = [
  {
    id: 'exp-1',
    pacienteId: 'paciente-abuelo',
    concepto: 'Compra farmacia: Rivaroxabán y Metformina',
    categoria: 'medicamento',
    monto: 1550,
    fecha: '2026-08-15',
    pagadoPor: 'José Manuel'
  },
  {
    id: 'exp-2',
    pacienteId: 'paciente-abuelo',
    concepto: 'Química Sanguínea y Biometría Hemática',
    categoria: 'estudio',
    monto: 850,
    fecha: '2026-08-10',
    pagadoPor: 'Hermano Carlos'
  }
];

export const INITIAL_APPOINTMENTS: CitaMedica[] = [
  {
    id: 'cita-1',
    pacienteId: 'paciente-abuelo',
    medico: 'Dr. Roberto Mendoza',
    especialidad: 'Medicina Interna / Geriatría',
    lugar: 'Consultorio 204, Hospital Ángeles',
    fechaHora: '2026-08-25T17:00:00',
    costoConsulta: 900,
    motivo: 'Revisión semestral y ajuste de anticoagulante',
    indicacionesPrevias: 'Llevar resumen de glucosas de la última semana y estudios recientes.',
    completada: false
  }
];

export const INITIAL_STUDIES: EstudioMedico[] = [
  {
    id: 'est-1',
    pacienteId: 'paciente-abuelo',
    nombre: 'Química Sanguínea de 6 Elementos & HbA1c',
    tipo: 'Laboratorio de Sangre',
    laboratorio: 'Laboratorios Chopo',
    fecha: '2026-08-10',
    archivoNombre: 'quimica_sanguinea_agosto.pdf',
    archivoTipo: 'pdf',
    costo: 850,
    notas: 'Glucosa 112 mg/dL, HbA1c 6.8%. Buen control metabólico.'
  }
];