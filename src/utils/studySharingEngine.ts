import { Patient, MedicalStudy } from '../types';

export function buildStudyWhatsAppMessage(patient: Patient, study: MedicalStudy): string {
  const lines: string[] = [];

  lines.push('🔬 *ESTUDIO DE LABORATORIO - ' + patient.name.toUpperCase() + '*');
  lines.push('📋 *Estudio:* ' + study.title);
  lines.push('📅 *Fecha:* ' + study.date);
  if (study.laboratory) {
    lines.push('🏥 *Laboratorio:* ' + study.laboratory);
  }
  lines.push('');

  if (study.resultsSummary) {
    lines.push('📊 *Resumen de Resultados:*');
    lines.push(study.resultsSummary);
    lines.push('');
  }

  if (patient.primaryDiagnosis) {
    lines.push('👤 *Diagnóstico:* ' + patient.primaryDiagnosis + (patient.age ? ` (${patient.age} años)` : ''));
  }

  lines.push('');
  lines.push('_FamHealth • Expediente Clínico Digital_');

  return lines.join('\n');
}

export function buildStudyEmailLink(
  patient: Patient,
  study: MedicalStudy,
  doctorEmail: string = ''
): string {
  const subject = `[Estudio Médico] ${patient.name} - ${study.title} (${study.date})`;

  const bodyLines: string[] = [];
  bodyLines.push(`Estimado Doctor / Especialista,\n`);
  bodyLines.push(`Le comparto el reporte de estudio de laboratorio de ${patient.name}:\n`);
  bodyLines.push(`• Estudio: ${study.title}`);
  bodyLines.push(`• Fecha del Estudio: ${study.date}`);
  if (study.laboratory) {
    bodyLines.push(`• Laboratorio: ${study.laboratory}`);
  }
  if (patient.primaryDiagnosis) {
    bodyLines.push(`• Diagnóstico Principal: ${patient.primaryDiagnosis}`);
  }
  bodyLines.push('');
  if (study.resultsSummary) {
    bodyLines.push(`Resultados Clave:`);
    bodyLines.push(study.resultsSummary);
    bodyLines.push('');
  }
  bodyLines.push(`Atentamente,`);
  bodyLines.push(`Familia y Cuidadores de ${patient.name}`);
  bodyLines.push(`Generado desde FamHealth App`);

  const body = encodeURIComponent(bodyLines.join('\n'));
  const encodedSubject = encodeURIComponent(subject);

  return `mailto:${doctorEmail}?subject=${encodedSubject}&body=${body}`;
}
