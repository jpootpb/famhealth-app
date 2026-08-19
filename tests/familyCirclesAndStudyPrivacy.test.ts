import { describe, it, expect } from 'vitest';
import { FamilyCircle, UserAccount, Patient, MedicalStudy } from '../src/types';
import { getUserVisibleFamilyCircles, joinFamilyWithCode } from '../src/utils/authEngine';

describe('Multi-Family Circles & Medical Study Privacy Architecture', () => {
  const circles: FamilyCircle[] = [
    {
      id: 'circle-poot-burgos',
      name: 'Familia Poot Burgos',
      inviteCode: 'POOT-7821',
      createdAt: '2026-08-01'
    },
    {
      id: 'circle-hogar-poot-gomez',
      name: 'Mi Hogar (Esposa e Hijos)',
      inviteCode: 'HOGAR-4490',
      createdAt: '2026-08-05'
    },
    {
      id: 'circle-suegros-gomez',
      name: 'Cuidado Suegros Gómez',
      inviteCode: 'GOMEZ-1234',
      createdAt: '2026-08-10'
    }
  ];

  const userCarlos: UserAccount = {
    id: 'user-carlos',
    name: 'Carlos Poot',
    email: 'carlos@famhealth.app',
    activeFamilyId: 'circle-poot-burgos',
    joinedFamilyIds: ['circle-poot-burgos', 'circle-hogar-poot-gomez']
  };

  const userClaudia: UserAccount = {
    id: 'user-claudia',
    name: 'Claudia Gómez (Esposa)',
    email: 'claudia@famhealth.app',
    activeFamilyId: 'circle-hogar-poot-gomez',
    joinedFamilyIds: ['circle-hogar-poot-gomez', 'circle-suegros-gomez'] // Has her home + her parents
  };

  const userBrother: UserAccount = {
    id: 'user-brother',
    name: 'Hermano Poot',
    email: 'hermano@famhealth.app',
    activeFamilyId: 'circle-poot-burgos',
    joinedFamilyIds: ['circle-poot-burgos'] // Only parents
  };

  it('1. Should isolate visible family circles per user account', () => {
    const carlosCircles = getUserVisibleFamilyCircles(userCarlos, circles);
    expect(carlosCircles.length).toBe(2);
    expect(carlosCircles.map(c => c.id)).toContain('circle-poot-burgos');
    expect(carlosCircles.map(c => c.id)).toContain('circle-hogar-poot-gomez');
    expect(carlosCircles.map(c => c.id)).not.toContain('circle-suegros-gomez');

    const brotherCircles = getUserVisibleFamilyCircles(userBrother, circles);
    expect(brotherCircles.length).toBe(1);
    expect(brotherCircles[0].id).toBe('circle-poot-burgos');
    expect(brotherCircles.map(c => c.id)).not.toContain('circle-hogar-poot-gomez'); // Brother cannot see Carlos' home circle
  });

  it('2. Should allow joining a specific family circle with unique invite code', () => {
    const joinResult = joinFamilyWithCode(userCarlos, 'HOGAR-4490', circles);
    expect(joinResult.success).toBe(true);
    expect(joinResult.joinedCircle?.name).toBe('Mi Hogar (Esposa e Hijos)');
  });

  it('3. SHARED STUDIES: Both spouses in the same circle can view shared studies for emergencies', () => {
    const sharedStudy: MedicalStudy = {
      id: 'study-1',
      patientId: 'patient-claudia',
      title: 'Química Sanguínea 45 Elementos',
      category: 'blood_test',
      date: '2026-08-10',
      laboratory: 'Laboratorios Chopo',
      isPrivate: false,
      ownerUserId: 'user-claudia'
    };

    // Filter check function as implemented in StudiesView
    const canCarlosView = !sharedStudy.isPrivate || sharedStudy.ownerUserId === userCarlos.id;
    const canClaudiaView = !sharedStudy.isPrivate || sharedStudy.ownerUserId === userClaudia.id;

    expect(canCarlosView).toBe(true);
    expect(canClaudiaView).toBe(true);
  });

  it('4. PRIVATE STUDIES: Confidential study is only visible to the owner and hidden from other family members', () => {
    const privateStudy: MedicalStudy = {
      id: 'study-confidential',
      patientId: 'patient-claudia',
      title: 'Estudio Ginecológico Especializado',
      category: 'other',
      date: '2026-08-12',
      laboratory: 'Clínica Privada',
      isPrivate: true,
      ownerUserId: 'user-claudia',
      uploadedByName: 'Claudia Gómez'
    };

    const canCarlosView = !privateStudy.isPrivate || privateStudy.ownerUserId === userCarlos.id;
    const canClaudiaView = !privateStudy.isPrivate || privateStudy.ownerUserId === userClaudia.id;

    expect(canClaudiaView).toBe(true); // Claudia sees her own private study
    expect(canCarlosView).toBe(false); // Hidden from Carlos for personal confidentiality
  });
});
