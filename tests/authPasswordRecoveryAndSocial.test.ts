import { describe, it, expect } from 'vitest';
import { initialUsers } from '../src/lib/storage';

describe('Auth Password Recovery and Social Accounts', () => {
  it('1. Initial users list includes jpoot@outlook.com with default password 123', () => {
    const jpoot = initialUsers.find(u => u.email === 'jpoot@outlook.com');
    expect(jpoot).toBeDefined();
    expect(jpoot?.name).toContain('José Manuel Poot');
    expect(jpoot?.password).toBe('123');
  });

  it('2. Main seeded accounts all have easy password 123', () => {
    initialUsers.forEach(u => {
      expect(u.password).toBe('123');
    });
  });
});
