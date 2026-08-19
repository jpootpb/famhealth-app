import { describe, it, expect } from 'vitest';
import { initialUsers } from '../src/lib/storage';
import { initialFamilyCircles, initialPatients, initialMedications } from '../src/lib/demoData';
import { getUserVisibleFamilyCircles } from '../src/utils/authEngine';

describe('Sandbox Demo Account & Real Production Account Isolation', () => {
  it('1. Provides clean separation between Real Jose Account and Demo Sandbox Account', () => {
    const userJose = initialUsers.find(u => u.id === 'user-jose');
    const userDemo = initialUsers.find(u => u.id === 'user-demo');

    expect(userJose).toBeDefined();
    expect(userDemo).toBeDefined();

    expect(userJose?.email).toBe('jose@famhealth.app');
    expect(userDemo?.email).toBe('demo@famhealth.app');
    expect(userDemo?.password).toBe('123');
  });

  it('2. Jose account only sees real family circle, while Demo account only sees demo sandbox circle', () => {
    const userJose = initialUsers.find(u => u.id === 'user-jose')!;
    const userDemo = initialUsers.find(u => u.id === 'user-demo')!;

    const joseCircles = getUserVisibleFamilyCircles(userJose, initialFamilyCircles);
    const demoCircles = getUserVisibleFamilyCircles(userDemo, initialFamilyCircles);

    expect(joseCircles.map(c => c.id)).toContain('circle-poot');
    expect(joseCircles.map(c => c.id)).not.toContain('circle-demo-sandbox');

    expect(demoCircles.map(c => c.id)).toContain('circle-demo-sandbox');
    expect(demoCircles.map(c => c.id)).not.toContain('circle-poot');
  });

  it('3. Real patient (Sara Burgos Uc) belongs to circle-poot without fake demo items', () => {
    const realPatients = initialPatients.filter(p => p.familyId === 'circle-poot');
    expect(realPatients.length).toBe(1);
    expect(realPatients[0].name).toBe('Sara Burgos Uc (Mamá)');

    const realMeds = initialMedications.filter(m => m.familyId === 'circle-poot');
    expect(realMeds.map(m => m.name)).toContain('Rivaroxaban 2.5 mg');
    expect(realMeds.map(m => m.name)).toContain('KRYNTANTEK oftteno');
    expect(realMeds.map(m => m.name)).toContain('Isox 15D');
  });

  it('4. Demo fake patients and meds belong strictly to circle-demo-sandbox', () => {
    const demoPatients = initialPatients.filter(p => p.familyId === 'circle-demo-sandbox');
    expect(demoPatients.length).toBe(2);
    expect(demoPatients.map(p => p.name)).toContain('Don Manuel Poot (Demo Pruebas)');

    const demoMeds = initialMedications.filter(m => m.familyId === 'circle-demo-sandbox');
    expect(demoMeds.length).toBeGreaterThan(0);
  });
});
