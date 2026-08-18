import { FamilyCircle } from '../types';

export function generateFamilyInviteCode(familyName: string): string {
  const clean = familyName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'FAM';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${clean}-${randomNum}`;
}

export function filterFamilyData<T extends { familyId?: string }>(items: T[], activeFamilyId: string): T[] {
  return items.filter(item => !item.familyId || item.familyId === activeFamilyId);
}
