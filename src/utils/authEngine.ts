import { UserAccount, FamilyCircle } from '../types';

export function isUserAuthenticated(user?: UserAccount | null): boolean {
  if (!user) return false;
  if (!user.id || user.id === 'guest') return false;
  if (user.email === 'guest@famhealth.app') return false;
  return true;
}

export function getUserVisibleFamilyCircles(user: UserAccount, allCircles: FamilyCircle[]): FamilyCircle[] {
  if (!isUserAuthenticated(user)) return [];
  return allCircles.filter(circle => user.joinedFamilyIds?.includes(circle.id));
}

export function joinFamilyWithCode(
  user: UserAccount,
  inviteCode: string,
  allCircles: FamilyCircle[]
): { updatedUser: UserAccount; joinedCircle?: FamilyCircle; success: boolean } {
  const cleanCode = inviteCode.trim().toUpperCase();
  const circle = allCircles.find(c => c.inviteCode.toUpperCase() === cleanCode);

  if (!circle) {
    return { updatedUser: user, success: false };
  }

  const updatedFamilyIds = user.joinedFamilyIds.includes(circle.id)
    ? user.joinedFamilyIds
    : [...user.joinedFamilyIds, circle.id];

  return {
    updatedUser: {
      ...user,
      joinedFamilyIds: updatedFamilyIds,
      activeFamilyId: circle.id
    },
    joinedCircle: circle,
    success: true
  };
}
