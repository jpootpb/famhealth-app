import { describe, it, expect } from 'vitest';
import { UserAccount, FamilyCircle } from '../src/types';
import { getUserVisibleFamilyCircles, joinFamilyWithCode, isUserAuthenticated } from '../src/utils/authEngine';

describe('User Authentication & Auth Gate Isolation (TDD)', () => {
  const allSystemCircles: FamilyCircle[] = [
    { id: 'fam-poot', name: 'Familia Poot', inviteCode: 'POOT-7821', createdAt: '2026-08-01' },
    { id: 'fam-gomez', name: 'Familia Gómez', inviteCode: 'GOME-3390', createdAt: '2026-08-10' },
    { id: 'fam-personal', name: 'Mi Cuidado Personal (Laura)', inviteCode: 'LAUR-9912', createdAt: '2026-08-15' }
  ];

  it('1. Unauthenticated guest user should NOT have authenticated status and see 0 circles', () => {
    const guestUser: UserAccount = {
      id: 'guest',
      name: 'Invitado',
      email: 'guest@famhealth.app',
      activeFamilyId: '',
      joinedFamilyIds: []
    };

    expect(isUserAuthenticated(guestUser)).toBe(false);
    const visibleCircles = getUserVisibleFamilyCircles(guestUser, allSystemCircles);
    expect(visibleCircles.length).toBe(0);
  });

  it('2. Logged-in user should be authenticated and see only their joined family spaces', () => {
    const mariaUser: UserAccount = {
      id: 'u-maria',
      name: 'María Poot',
      email: 'maria@gmail.com',
      activeFamilyId: 'fam-poot',
      joinedFamilyIds: ['fam-poot']
    };

    expect(isUserAuthenticated(mariaUser)).toBe(true);
    const visibleCircles = getUserVisibleFamilyCircles(mariaUser, allSystemCircles);
    expect(visibleCircles.length).toBe(1);
    expect(visibleCircles[0].name).toBe('Familia Poot');
    expect(visibleCircles.find(c => c.id === 'fam-gomez')).toBeUndefined();
  });

  it('3. Caregiver of 2 families (Carlos) should see both after login', () => {
    const carlosCaregiver: UserAccount = {
      id: 'u-carlos',
      name: 'Carlos Poot (Dual Caregiver)',
      email: 'carlos@famhealth.app',
      activeFamilyId: 'fam-poot',
      joinedFamilyIds: ['fam-poot', 'fam-gomez']
    };

    expect(isUserAuthenticated(carlosCaregiver)).toBe(true);
    const visibleCircles = getUserVisibleFamilyCircles(carlosCaregiver, allSystemCircles);
    expect(visibleCircles.length).toBe(2);
    expect(visibleCircles.map(c => c.id)).toEqual(['fam-poot', 'fam-gomez']);
  });

  it('4. User joining with code should get access to that family', () => {
    const newUser: UserAccount = {
      id: 'u-new',
      name: 'Doctor Juan',
      email: 'juan@clinica.com',
      activeFamilyId: '',
      joinedFamilyIds: []
    };

    expect(isUserAuthenticated(newUser)).toBe(true);
    const result = joinFamilyWithCode(newUser, 'POOT-7821', allSystemCircles);
    expect(result.success).toBe(true);
    expect(result.updatedUser.joinedFamilyIds).toEqual(['fam-poot']);
    expect(result.updatedUser.activeFamilyId).toBe('fam-poot');
  });
});
