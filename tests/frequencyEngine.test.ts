import { describe, it, expect } from 'vitest';
import { tocaTomaHoy, obtenerHorariosDelDia, formatDateIso, parseDateOnly } from '../src/utils/frequencyEngine';
import { Medicamento } from '../src/types';

describe('Motor de Frecuencias de Medicamentos (PDD)', () => {

  it('1. Metformina - Dosis variable diaria (1 tableta 8am y 0.5 tableta 8pm)', () => {
    const metformina: Medicamento = {
      id: 'med-1',
      pacienteId: 'pac-1',
      nombre: 'Metformina / Sitagliptina',
      presentacion: 'tableta',
      frecuencia: {
        tipo: 'diaria_fija',
        horarios: [
          { hora: '08:00', dosis: 1 },
          { hora: '20:00', dosis: 0.5 }
        ],
        fechaInicio: '2026-01-01'
      },
      stockActual: 20,
      stockMinimoAlerta: 5
    };

    const hoy = new Date(2026, 7, 17, 9, 0, 0);
    expect(tocaTomaHoy(metformina.frecuencia, hoy)).toBe(true);

    const horarios = obtenerHorariosDelDia(metformina, hoy);
    expect(horarios.length).toBe(2);
    expect(horarios[0].dosis).toBe(1);
    expect(horarios[1].dosis).toBe(0.5);
  });

  it('2. Rivaroxabán - Días alternos (un día sí, un día no)', () => {
    const rivaroxaban: Medicamento = {
      id: 'med-2',
      pacienteId: 'pac-1',
      nombre: 'Rivaroxabán',
      presentacion: 'tableta',
      frecuencia: {
        tipo: 'dias_alternos',
        horarios: [{ hora: '13:00', dosis: 1 }],
        fechaInicio: '2026-08-16' // Día 0 (toca)
      },
      stockActual: 10,
      stockMinimoAlerta: 3
    };

    const dia16 = parseDateOnly('2026-08-16'); // Día 0 (diff 0) -> SI
    const dia17 = parseDateOnly('2026-08-17'); // Día 1 (diff 1) -> NO
    const dia18 = parseDateOnly('2026-08-18'); // Día 2 (diff 2) -> SI

    expect(tocaTomaHoy(rivaroxaban.frecuencia, dia16)).toBe(true);
    expect(tocaTomaHoy(rivaroxaban.frecuencia, dia17)).toBe(false);
    expect(tocaTomaHoy(rivaroxaban.frecuencia, dia18)).toBe(true);
  });

  it('3. Aspirina - Cada 4 días', () => {
    const aspirina: Medicamento = {
      id: 'med-3',
      pacienteId: 'pac-1',
      nombre: 'Aspirina Protect',
      presentacion: 'tableta',
      frecuencia: {
        tipo: 'cada_n_dias',
        intervaloDias: 4,
        horarios: [{ hora: '14:00', dosis: 1 }],
        fechaInicio: '2026-08-14' // Día 0 (toca)
      },
      stockActual: 15,
      stockMinimoAlerta: 3
    };

    const dia14 = parseDateOnly('2026-08-14'); // Diff 0 -> SI
    const dia15 = parseDateOnly('2026-08-15'); // Diff 1 -> NO
    const dia16 = parseDateOnly('2026-08-16'); // Diff 2 -> NO
    const dia17 = parseDateOnly('2026-08-17'); // Diff 3 -> NO
    const dia18 = parseDateOnly('2026-08-18'); // Diff 4 -> SI

    expect(tocaTomaHoy(aspirina.frecuencia, dia14)).toBe(true);
    expect(tocaTomaHoy(aspirina.frecuencia, dia15)).toBe(false);
    expect(tocaTomaHoy(aspirina.frecuencia, dia16)).toBe(false);
    expect(tocaTomaHoy(aspirina.frecuencia, dia17)).toBe(false);
    expect(tocaTomaHoy(aspirina.frecuencia, dia18)).toBe(true);
  });

  it('4. Tratamiento Temporal - Antibiótico por 7 días', () => {
    const antibiotico: Medicamento = {
      id: 'med-4',
      pacienteId: 'pac-2',
      nombre: 'Ciprofloxacino',
      presentacion: 'tableta',
      frecuencia: {
        tipo: 'por_horas_temporal',
        intervaloHoras: 12,
        horarios: [
          { hora: '08:00', dosis: 1 },
          { hora: '20:00', dosis: 1 }
        ],
        fechaInicio: '2026-08-15',
        fechaFin: '2026-08-22'
      },
      stockActual: 10,
      stockMinimoAlerta: 2
    };

    const durante = parseDateOnly('2026-08-17');
    const despues = parseDateOnly('2026-08-23');

    expect(tocaTomaHoy(antibiotico.frecuencia, durante)).toBe(true);
    expect(tocaTomaHoy(antibiotico.frecuencia, despues)).toBe(false);
  });
});
