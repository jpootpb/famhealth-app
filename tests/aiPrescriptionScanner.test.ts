import { describe, it, expect } from 'vitest';
import {
  parsePrescriptionAIResponse,
  buildPrescriptionScanPrompt,
  ExtractedPrescriptionMed
} from '../src/utils/aiPrescriptionEngine';

describe('AI Prescription Scanner Engine (Gemini & ChatGPT Dual Support) (TDD)', () => {
  it('1. Should generate clear vision prompt for Gemini and ChatGPT', () => {
    const prompt = buildPrescriptionScanPrompt();
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('medications');
    expect(prompt).toContain('frequency');
    expect(prompt).toContain('dose');
  });

  it('2. Should parse structured JSON response from Gemini Vision', () => {
    const mockGeminiJson = JSON.stringify({
      medications: [
        {
          name: 'Metformina',
          presentation: 'tablet',
          dose: 1,
          frequencyHours: 12,
          scheduledTimes: ['08:00', '20:00'],
          durationDays: 30,
          instructions: 'Tomar con el desayuno y la cena',
          laboratory: 'Silanes / Genérico'
        },
        {
          name: 'Cilostazol',
          presentation: 'tablet',
          dose: 1,
          frequencyHours: 24,
          scheduledTimes: ['08:00'],
          durationDays: 60,
          instructions: '1 tableta en la mañana',
          laboratory: 'Laboratorios Silanes'
        }
      ]
    });

    const parsed = parsePrescriptionAIResponse(mockGeminiJson);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('Metformina');
    expect(parsed[0].scheduledTimes).toEqual(['08:00', '20:00']);
    expect(parsed[1].name).toBe('Cilostazol');
    expect(parsed[1].durationDays).toBe(60);
  });

  it('3. Should handle markdown-wrapped JSON code blocks (common in ChatGPT/Gemini outputs)', () => {
    const rawMarkdownOutput = `\`\`\`json
{
  "medications": [
    {
      "name": "Ciprofloxacino",
      "presentation": "tablet",
      "dose": 1,
      "frequencyHours": 12,
      "scheduledTimes": ["08:00", "20:00"],
      "durationDays": 7,
      "instructions": "Tomar cada 12 horas por 7 días"
    }
  ]
}
\`\`\``;

    const parsed = parsePrescriptionAIResponse(rawMarkdownOutput);
    expect(parsed.length).toBe(1);
    expect(parsed[0].name).toBe('Ciprofloxacino');
    expect(parsed[0].durationDays).toBe(7);
  });
});
