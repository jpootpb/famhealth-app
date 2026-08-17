import { Paciente, Medicamento, TomaRegistro } from '../types';
import { formatDosis } from '../utils/formatters';
import { obtenerHorariosDelDia } from '../utils/frequencyEngine';

export function buildWhatsAppSummary(
  paciente: Paciente,
  medicamentos: Medicamento[],
  tomas: TomaRegistro[],
  fecha: Date = new Date()
): string {
  const fechaStr = fecha.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let text = '📋 *AGENDA DE MEDICAMENTOS - ' + paciente.nombre.toUpperCase() + '*\n';
  text += '📅 *Fecha:* ' + fechaStr + '\n\n';
  text += '🩺 *Indicaciones del Día:*\n';

  const tomasDelDia: Array<{ hora: string; medName: string; dosisText: string; tomada: boolean }> = [];

  medicamentos.forEach(med => {
    const horarios = obtenerHorariosDelDia(med, fecha);
    horarios.forEach(h => {
      const dosisText = formatDosis(h.dosis, med.presentacion);
      const isTomada = tomas.some(t => t.medicamentoId === med.id && t.horaProgramada === h.hora && t.tomada);
      tomasDelDia.push({
        hora: h.hora,
        medName: med.nombre,
        dosisText,
        tomada: isTomada
      });
    });
  });

  tomasDelDia.sort((a, b) => a.hora.localeCompare(b.hora));

  if (tomasDelDia.length === 0) {
    text += '✨ _No hay medicamentos programados para hoy._\n\n';
  } else {
    tomasDelDia.forEach(item => {
      const check = item.tomada ? '✅' : '⏳';
      text += check + ' *' + item.hora + '* → ' + item.medName + ' (' + item.dosisText + ')\n';
    });
    text += '\n';
  }

  if (paciente.notas) {
    text += '⚠️ *Notas Importantes:* ' + paciente.notas + '\n\n';
  }

  text += '🔗 _Pase de Relevo Web:_ ' + window.location.origin + '?mode=relevo&pacienteId=' + paciente.id + '\n';
  text += '👨‍⚕️ _SaludFamiliar PWA_';

  return text;
}

export function shareViaWhatsApp(text: string, phone: string = ''): void {
  const encoded = encodeURIComponent(text);
  const url = phone ? 'https://wa.me/' + phone + '?text=' + encoded : 'https://wa.me/?text=' + encoded;
  window.open(url, '_blank');
}