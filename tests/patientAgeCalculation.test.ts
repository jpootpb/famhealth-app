import { describe, it, expect } from 'vitest';
import { calculateAge, formatPatientAge } from '../src/utils/formatters';

describe('Dynamic Patient Age Calculation from Birth Date (TDD)', () => {
  it('1. Should calculate exact age when birthday has already passed in the current year', () => {
    const birthDate = '1946-03-15'; // March 15, 1946
    const refDate = new Date(2026, 7, 18); // Aug 18, 2026
    const age = calculateAge(birthDate, undefined, refDate);
    expect(age).toBe(80);
  });

  it('2. Should not increment age if birthday has not arrived yet in the current year', () => {
    const birthDate = '1946-11-20'; // Nov 20, 1946
    const refDate = new Date(2026, 7, 18); // Aug 18, 2026 (before Nov 20)
    const age = calculateAge(birthDate, undefined, refDate);
    expect(age).toBe(79);
  });

  it('3. Should automatically update age in future years without manual user changes', () => {
    const birthDate = '1946-03-15';
    const year2026 = new Date(2026, 7, 18);
    const year2027 = new Date(2027, 7, 18);
    const year2030 = new Date(2030, 7, 18);

    expect(calculateAge(birthDate, undefined, year2026)).toBe(80);
    expect(calculateAge(birthDate, undefined, year2027)).toBe(81);
    expect(calculateAge(birthDate, undefined, year2030)).toBe(84);
  });

  it('4. Should use fallbackAge when birthDate is undefined or empty', () => {
    expect(calculateAge(undefined, 75)).toBe(75);
    expect(calculateAge('', 60)).toBe(60);
    expect(calculateAge(undefined, undefined)).toBeUndefined();
  });

  it('5. Should format patient age in Spanish and English properly', () => {
    const birthDate = '1946-03-15';
    expect(formatPatientAge(birthDate, undefined, 'es')).toContain('años');
    expect(formatPatientAge(birthDate, undefined, 'en')).toContain('years old');
  });
});
