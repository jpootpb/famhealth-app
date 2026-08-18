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

  // Web PACS Viewer & Online Report URLs
  if (study.viewerUrl) {
    lines.push('🖼️ *Visor de Imágenes PACS (Tomografía):*');
    lines.push(study.viewerUrl);
    lines.push('');
  }

  if (study.reportUrl) {
    lines.push('📑 *Reporte Radiológico Online:*');
    lines.push(study.reportUrl);
    lines.push('');
  }

  if (study.accessCredentials) {
    lines.push('🔑 *Instrucciones / Claves de Acceso:*');
    lines.push(study.accessCredentials);
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
  bodyLines.push(`Le comparto el estudio médico y reporte de ${patient.name}:\n`);
  bodyLines.push(`• Estudio: ${study.title}`);
  bodyLines.push(`• Fecha del Estudio: ${study.date}`);
  if (study.laboratory) {
    bodyLines.push(`• Laboratorio / Centro Radiológico: ${study.laboratory}`);
  }
  if (patient.primaryDiagnosis) {
    bodyLines.push(`• Diagnóstico Principal: ${patient.primaryDiagnosis}`);
  }
  bodyLines.push('');
  if (study.resultsSummary) {
    bodyLines.push(`Resumen Clínico / Hallazgos:`);
    bodyLines.push(study.resultsSummary);
    bodyLines.push('');
  }
  if (study.viewerUrl) {
    bodyLines.push(`Visor de Imágenes PACS (Tomografía / Resonancia / Rayos X):`);
    bodyLines.push(study.viewerUrl);
    bodyLines.push('');
  }
  if (study.reportUrl) {
    bodyLines.push(`Reporte Radiológico Online:`);
    bodyLines.push(study.reportUrl);
    bodyLines.push('');
  }
  if (study.accessCredentials) {
    bodyLines.push(`Claves de Acceso / PIN:`);
    bodyLines.push(study.accessCredentials);
    bodyLines.push('');
  }
  bodyLines.push(`Atentamente,`);
  bodyLines.push(`Familia y Cuidadores de ${patient.name}`);
  bodyLines.push(`Generado desde FamHealth App`);

  const body = encodeURIComponent(bodyLines.join('\n'));
  const encodedSubject = encodeURIComponent(subject);

  return `mailto:${doctorEmail}?subject=${encodedSubject}&body=${body}`;
}
