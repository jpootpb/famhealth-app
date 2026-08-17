import { describe, it, expect } from 'vitest';
import { getExpirationStatus } from '../src/utils/formatters';
import { getCurrentShiftCaregiver, buildDoseTakenWhatsAppMessage } from '../src/lib/whatsapp';
import { FamilyMember, Patient, Medication, DoseSlot } from '../src/types';

describe('Caregiver Shifts, Expiration & Family Dose Notifications (3 Enhancements)', () => {
  describe('1. Medication Expiration Date Status', () => {
    it('Should detect expired medication', () => {
      const today = new Date('2026-08-17');
      const expiredStatus = getExpirationStatus('2026-07-01', today);
      expect(expiredStatus.status).toBe('expired');
      expect(expiredStatus.badgeClass).toBe('badge-red');
      expect(expiredStatus.label).toContain('Expired');
    });

    it('Should detect medication expiring soon (within 30 days)', () => {
      const today = new Date('2026-08-17');
      const expiringSoon = getExpirationStatus('2026-09-05', today);
      expect(expiringSoon.status).toBe('expiring_soon');
      expect(expiringSoon.badgeClass).toBe('badge-yellow');
      expect(expiringSoon.label).toContain('Expires in');
    });

    it('Should identify medication with valid expiration (>30 days)', () => {
      const today = new Date('2026-08-17');
      const validStatus = getExpirationStatus('2027-12-31', today);
      expect(validStatus.status).toBe('valid');
      expect(validStatus.badgeClass).toBe('badge-green');
    });
  });

  describe('2. Caregiver Shift Automatic Resolution', () => {
    const caregivers: FamilyMember[] = [
      { id: '1', name: 'Carlos Poot', shift: 'morning', phone: '5219991234567', splitPercentage: 50, isActive: true, isDefaultCaregiver: true },
      { id: '2', name: 'Lucia Poot', shift: 'night', phone: '5219997654321', splitPercentage: 50, isActive: true }
    ];

    it('Should pick morning caregiver at 08:30 AM', () => {
      const morningTime = new Date('2026-08-17T08:30:00');
      const caregiver = getCurrentShiftCaregiver(caregivers, morningTime);
      expect(caregiver?.name).toBe('Carlos Poot');
      expect(caregiver?.phone).toBe('5219991234567');
    });

    it('Should pick night caregiver at 20:00 (8:00 PM)', () => {
      const nightTime = new Date('2026-08-17T20:00:00');
      const caregiver = getCurrentShiftCaregiver(caregivers, nightTime);
      expect(caregiver?.name).toBe('Lucia Poot');
      expect(caregiver?.phone).toBe('5219997654321');
    });
  });

  describe('3. Family Dose Confirmation Notification Message', () => {
    const patient: Patient = { id: 'p-1', name: 'Don Manuel Poot', type: 'chronic' };
    const medication: Medication = {
      id: 'm-1',
      patientId: 'p-1',
      name: 'Metformin',
      presentation: 'tablet',
      frequency: { type: 'daily_fixed', doseSlots: [{ time: '08:00', dose: 1 }], startDate: '2026-01-01' },
      currentStock: 20,
      minimumStockAlert: 5
    };
    const slot: DoseSlot = { time: '08:00', dose: 1, instruction: 'With breakfast' };

    it('Should format dose administration confirmation with caregiver name and progress', () => {
      const message = buildDoseTakenWhatsAppMessage(
        patient,
        medication,
        slot,
        'Carlos Poot (Morning Caregiver)',
        '3 of 4 doses completed today'
      );

      expect(message).toContain('DOSE ADMINISTERED - DON MANUEL POOT');
      expect(message).toContain('Metformin');
      expect(message).toContain('1 tablet');
      expect(message).toContain('Carlos Poot');
      expect(message).toContain('3 of 4 doses completed');
    });
  });
});
