import { Medicamento, ReglaFrecuencia, HorarioToma } from '../types';

export function parseDateOnly(dateStr: string): Date {
  const [partY, partM, partD] = dateStr.split('-').map(Number);
  return new Date(partY, partM - 1, partD, 0, 0, 0, 0);
}

export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function diffInDays(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function tocaTomaHoy(regla: ReglaFrecuencia, fechaEvaluacion: Date = new Date()): boolean {
  const fechaInicio = parseDateOnly(regla.fechaInicio);
  const evalDate = new Date(fechaEvaluacion.getFullYear(), fechaEvaluacion.getMonth(), fechaEvaluacion.getDate());
  
  const diasTranscurridos = diffInDays(fechaInicio, evalDate);
  if (diasTranscurridos < 0) return false;

  if (regla.fechaFin) {
    const fechaFin = parseDateOnly(regla.fechaFin);
    if (evalDate > fechaFin) return false;
  }

  switch (regla.tipo) {
    case 'diaria_fija':
      return true;
    case 'dias_alternos':
      return diasTranscurridos % 2 === 0;
    case 'cada_n_dias': {
      const n = regla.intervaloDias || 1;
      return diasTranscurridos % n === 0;
    }
    case 'por_horas_temporal':
      return true;
    default:
      return true;
  }
}

export function obtenerHorariosDelDia(med: Medicamento, fecha: Date = new Date()): HorarioToma[] {
  if (!tocaTomaHoy(med.frecuencia, fecha)) return [];
  return med.frecuencia.horarios;
}

export function getFrecuenciaLabel(regla: ReglaFrecuencia): string {
  switch (regla.tipo) {
    case 'diaria_fija':
      return 'Diario (' + regla.horarios.length + ' tomas/día)';
    case 'dias_alternos':
      return 'Días alternos (un día sí, un día no)';
    case 'cada_n_dias':
      return 'Cada ' + (regla.intervaloDias || 1) + ' días';
    case 'por_horas_temporal':
      return 'Cada ' + (regla.intervaloHoras || 8) + ' horas (Temporal)';
    default:
      return 'Personalizado';
  }
}
