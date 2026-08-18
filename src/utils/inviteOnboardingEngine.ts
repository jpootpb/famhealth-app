import { FamilyCircle } from '../types';

export const RELATIONSHIP_OPTIONS = [
  { value: 'Hijo / Hija', labelEs: 'Hijo / Hija', labelEn: 'Son / Daughter', icon: '🧒' },
  { value: 'Hermano / Hermana', labelEs: 'Hermano / Hermana', labelEn: 'Brother / Sister', icon: '👫' },
  { value: 'Nieto / Nieta', labelEs: 'Nieto / Nieta', labelEn: 'Grandchild', icon: '👶' },
  { value: 'Sobrino / Sobrina', labelEs: 'Sobrino / Sobrina', labelEn: 'Nephew / Niece', icon: '👦' },
  { value: 'Pareja / Esposo(a)', labelEs: 'Pareja / Esposo(a)', labelEn: 'Partner / Spouse', icon: '❤️' },
  { value: 'Amigo / Amiga', labelEs: 'Amigo / Amiga', labelEn: 'Friend', icon: '🤝' },
  { value: 'Vecino / Vecina', labelEs: 'Vecino / Vecina', labelEn: 'Neighbor', icon: '🏡' },
  { value: 'Enfermero(a) / Cuidador(a)', labelEs: 'Enfermero(a) / Cuidador(a)', labelEn: 'Nurse / Caregiver', icon: '🩺' },
  { value: 'Familiar a Cuidar', labelEs: 'Otro Familiar', labelEn: 'Other Relative', icon: '👥' }
];

/**
 * Builds a direct, clean invite link for joining a family circle
 */
export function buildFamilyInviteUrl(inviteCode: string, origin: string = ''): string {
  const base = origin || (typeof window !== 'undefined' && window.location ? window.location.origin : 'https://famhealth-app-gamma.vercel.app');
  return `${base}?join=${encodeURIComponent(inviteCode)}`;
}

/**
 * Formats a clean WhatsApp message for inviting family members or caregivers
 */
export function formatFamilyInviteWhatsAppMessage(
  familyCircle: FamilyCircle,
  patientNames: string[] = [],
  inviterName: string = 'Tu familia',
  lang: 'es' | 'en' = 'es'
): string {
  const isEn = lang === 'en';
  const inviteUrl = buildFamilyInviteUrl(familyCircle.inviteCode);
  const patientText = patientNames.length > 0 ? patientNames.join(', ') : familyCircle.name;

  if (isEn) {
    let msg = `👋 *Hello! You've been invited to join the FamHealth Care Circle* ✨\n\n`;
    msg += `*${inviterName}* invited you to coordinate and track medications, doctor appointments, and care for *${patientText}*.\n\n`;
    msg += `🔑 *Family Invite Code:* ${familyCircle.inviteCode}\n\n`;
    msg += `👉 *Tap here to join with 1-click:*\n${inviteUrl}\n\n`;
    msg += `💬 _FamHealth Family Care System_`;
    return msg;
  }

  // Spanish
  let msg = `👋 *¡Hola! Te invitan a unirte al Círculo de Cuidado en FamHealth* ✨\n\n`;
  msg += `*${inviterName}* te ha invitado para coordinar los medicamentos, horarios, citas y cuidados de *${patientText}*.\n\n`;
  msg += `🔑 *Código de Familia:* ${familyCircle.inviteCode}\n\n`;
  msg += `👉 *Entra con 1 solo clic aquí:*\n${inviteUrl}\n\n`;
  msg += `💬 _FamHealth Control Médico Familiar_`;
  return msg;
}

/**
 * Formats a mailto: link for sending an email invitation
 */
export function buildFamilyInviteMailto(
  familyCircle: FamilyCircle,
  patientNames: string[] = [],
  inviterName: string = 'Tu familia',
  lang: 'es' | 'en' = 'es'
): string {
  const isEn = lang === 'en';
  const inviteUrl = buildFamilyInviteUrl(familyCircle.inviteCode);
  const patientText = patientNames.length > 0 ? patientNames.join(', ') : familyCircle.name;

  const subject = isEn
    ? `Invitation to join ${familyCircle.name} on FamHealth`
    : `Invitación para unirte al Círculo de Cuidado de ${familyCircle.name} en FamHealth`;

  let body = '';
  if (isEn) {
    body = `Hello!\n\n${inviterName} invited you to coordinate care, medication tracking, and doctor appointments for ${patientText}.\n\nFamily Code: ${familyCircle.inviteCode}\n\nClick the link below to join directly:\n${inviteUrl}\n\nFamHealth Family Care`;
  } else {
    body = `¡Hola!\n\n${inviterName} te ha invitado al Círculo de Cuidado Familiar para coordinar medicamentos, tomas diarias y consultas de ${patientText}.\n\nCódigo de Familia: ${familyCircle.inviteCode}\n\nEntra directamente con este enlace:\n${inviteUrl}\n\nFamHealth Control Médico Familiar`;
  }

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
