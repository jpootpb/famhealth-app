import { describe, it, expect } from 'vitest';
import { FamilyCircle } from '../src/types';
import {
  buildFamilyInviteUrl,
  formatFamilyInviteWhatsAppMessage,
  buildFamilyInviteMailto
} from '../src/utils/inviteOnboardingEngine';

describe('Family Circle Invitation & Relationship Onboarding Engine (TDD)', () => {
  const familyCircle: FamilyCircle = {
    id: 'fam-poot-1',
    name: 'Familia Poot (Don Manuel y Doña María)',
    inviteCode: 'POOT-7482',
    createdAt: '2026-08-18'
  };

  it('1. Should generate a valid 1-click join link with family invite code query parameter', () => {
    const link = buildFamilyInviteUrl(familyCircle.inviteCode, 'https://famhealth-app-gamma.vercel.app');
    expect(link).toBe('https://famhealth-app-gamma.vercel.app?join=POOT-7482');
  });

  it('2. Should format an empathetic, clean WhatsApp invitation message in Spanish', () => {
    const msg = formatFamilyInviteWhatsAppMessage(
      familyCircle,
      ['Don Manuel', 'Doña María'],
      'José Manuel Poot',
      'es'
    );

    expect(msg).toContain('José Manuel Poot');
    expect(msg).toContain('Don Manuel, Doña María');
    expect(msg).toContain('POOT-7482');
    expect(msg).toContain('https://famhealth-app-gamma.vercel.app?join=POOT-7482');
    expect(msg).toContain('Control Médico Familiar');
  });

  it('3. Should format mailto: link with pre-filled subject and body', () => {
    const mailto = buildFamilyInviteMailto(
      familyCircle,
      ['Don Manuel'],
      'José Manuel',
      'es'
    );

    expect(mailto).toContain('mailto:?subject=');
    expect(mailto).toContain(encodeURIComponent('Invitación para unirte al Círculo de Cuidado'));
    expect(mailto).toContain(encodeURIComponent('POOT-7482'));
  });
});
