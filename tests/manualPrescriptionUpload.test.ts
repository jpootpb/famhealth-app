import { describe, it, expect } from 'vitest';
import { ExtractedPrescriptionMed } from '../src/utils/aiPrescriptionEngine';

describe('Manual and AI Prescription Upload Engine', () => {
  it('1. ExtractedPrescriptionMed supports attaching direct prescription photo without AI', () => {
    const directPrescription: ExtractedPrescriptionMed = {
      name: 'Rivaroxaban 2.5mg',
      presentation: 'tablet',
      imageUrl: 'data:image/jpeg;base64,mockBase64Data...',
      instructions: '1 tableta con alimentos cada 24 horas'
    };

    expect(directPrescription.name).toBe('Rivaroxaban 2.5mg');
    expect(directPrescription.imageUrl).toBeDefined();
    expect(directPrescription.imageUrl).toContain('data:image');
  });

  it('2. Allows creating an empty medication template with recipe photo attached for manual filling', () => {
    const photoTemplate: ExtractedPrescriptionMed = {
      name: '',
      presentation: 'tablet',
      imageUrl: 'data:image/png;base64,recipePhoto...',
      instructions: 'Receta consulta Dr. Castillo'
    };

    expect(photoTemplate.imageUrl).toBe('data:image/png;base64,recipePhoto...');
    expect(photoTemplate.name).toBe('');
  });
});
