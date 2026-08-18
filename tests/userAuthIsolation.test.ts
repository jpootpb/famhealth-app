import { describe, it, expect } from 'vitest';
import { UserAccount, FamilyCircle } from '../src/types';
import { getUserVisibleFamilyCircles, joinFamilyWithCode } from '../src/utils/authEngine';

describe('User Authentication & Multi-Family Access Isolation (TDD)', () => {
  const allSystemCircles: FamilyCircle[] = [
    { id: 'fam-poot', name: 'Familia Poot', inviteCode: 'POOT-7821', createdAt: '2026-08-01' },
    { id: 'fam-gomez', name: 'Familia Gómez', inviteCode: 'GOME-3390', createdAt: '2026-08-10' },
    { id: 'fam-personal', name: 'Mi Cuidado Personal (Laura)', inviteCode: 'LAUR-9912', createdAt: '2026-08-15' }
  ];

  it('1. Single-family user should only see their own family', () => {
    const mariaUser: UserAccount = {
      id: 'u-maria',
      name: 'María Poot',
      email: 'maria@gmail.com',
      activeFamilyId: 'fam-poot',
      joinedFamilyIds: ['fam-poot']
    };

    const visibleCircles = getUserVisibleFamilyCircles(mariaUser, allSystemCircles);
    expect(visibleCircles.length).toBe(1);
    expect(visibleCircles[0].name).toBe('Familia Poot');
    expect(visibleCircles.find(c => c.id === 'fam-gomez')).toBeUndefined();
  });

  it('2. Caregiver of 2 families (e.g. Carlos caring for Dad & In-laws) should see both', () => {
    const carlosCaregiver: UserAccount = {
      id: 'u-carlos',
      name: 'Carlos Poot (Dual Caregiver)',
      email: 'carlos@famhealth.app',
      activeFamilyId: 'fam-poot',
      joinedFamilyIds: ['fam-poot', 'fam-gomez']
    };

    const visibleCircles = getUserVisibleFamilyCircles(carlosCaregiver, allSystemCircles);
    expect(visibleCircles.length).toBe(2);
    expect(visibleCircles.map(c => c.id)).toEqual(['fam-poot', 'fam-gomez']);
  });

  it('3. Brand new user should start with 0 families until creating or joining', () => {
    const newUser: UserAccount = {
      id: 'u-new',
      name: 'Doctor Juan',
      email: 'juan@clinica.com',
      activeFamilyId: '',
      joinedFamilyIds: []
    };

    const visibleCircles = getUserVisibleFamilyCircles(newUser, allSystemCircles);
    expect(visibleCircles.length).toBe(0);

    // Now Juan is invited by Carlos to check Don Manuel Poot with code POOT-7821
    const result = joinFamilyWithCode(newUser, 'POOT-7821', allSystemCircles);
    expect(result.success).toBe(true);
    expect(result.updatedUser.joinedFamilyIds).toEqual(['fam-poot']);
    expect(result.updatedUser.activeFamilyId).toBe('fam-poot');
  });
});
