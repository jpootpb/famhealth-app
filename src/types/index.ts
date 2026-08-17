export type TipoPaciente = 'cronico' | 'temporal';

export interface Paciente {
  id: string;
  nombre: string;
  edad?: number;
  tipo: TipoPaciente;
  diagnosticoPrincipal?: string;
  notas?: string;
  fechaInicioTratamiento?: string;
  duracionDias?: number;
}

export type TipoFrecuencia = 'diaria_fija' | 'dias_alternos' | 'cada_n_dias' | 'por_horas_temporal';

export interface HorarioToma {
  hora: string;
  dosis: number;
  instruccion?: string;
}

export interface ReglaFrecuencia {
  tipo: TipoFrecuencia;
  horarios: HorarioToma[];
  intervaloDias?: number;
  intervaloHoras?: number;
  fechaInicio: string;
  fechaFin?: string;
}

export interface Medicamento {
  id: string;
  pacienteId: string;
  nombre: string;
  presentacion: string;
  indicacion?: string;
  frecuencia: ReglaFrecuencia;
  stockActual: number;
  stockMinimoAlerta: number;
  costoUnitario?: number;
  colorBadge?: string;
}

export interface TomaRegistro {
  id: string;
  medicamentoId: string;
  pacienteId: string;
  fecha: string;
  horaProgramada: string;
  horaRealToma?: string;
  dosis: number;
  tomada: boolean;
  notas?: string;
}

export type TipoSigno = 'glucosa' | 'presion' | 'oxigenacion' | 'pulso';

export interface SignoVital {
  id: string;
  pacienteId: string;
  tipo: TipoSigno;
  valorPrincipal: number;
  valorSecundario?: number;
  pulso?: number;
  contexto?: string;
  fechaHora: string;
  notas?: string;
  campaniaId?: string;
}

export interface CampaniaMonitoreo {
  id: string;
  pacienteId: string;
  nombre: string;
  tiposSigno: TipoSigno[];
  fechaInicio: string;
  duracionDias: number;
  tomasPorDia: number;
  objetivo?: string;
  activa: boolean;
}

export interface EstudioMedico {
  id: string;
  pacienteId: string;
  nombre: string;
  tipo: string;
  laboratorio?: string;
  fecha: string;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: 'pdf' | 'imagen';
  costo?: number;
  notas?: string;
}

export interface CitaMedica {
  id: string;
  pacienteId: string;
  medico: string;
  especialidad: string;
  lugar?: string;
  fechaHora: string;
  costoConsulta?: number;
  motivo?: string;
  indicacionesPrevias?: string;
  completada: boolean;
}

export interface GastoSalud {
  id: string;
  pacienteId: string;
  concepto: string;
  categoria: 'medicamento' | 'estudio' | 'consulta' | 'insumos' | 'otro';
  monto: number;
  fecha: string;
  pagadoPor: string;
  comprobanteUrl?: string;
  notas?: string;
}

export interface Familiar {
  id: string;
  nombre: string;
  telefono?: string;
  porcentajeDivision: number;
  activo: boolean;
}
