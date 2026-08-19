export interface ExtractedPrescriptionMed {
  name: string;
  activeIngredient?: string; // Compuesto activo / Sustancia activa (e.g. Dapagliflozina, Metformina, Rivaroxabán)
  dosageStrength?: string; // Gramaje / Concentración (e.g. 10 mg, 500 mg, 100 ml)
  presentation?: string; // tablet, capsule, syrup, etc.
  dose?: number; // 1, 0.5, etc.
  frequencyHours?: number; // e.g. 8, 12, 24
  scheduledTimes?: string[]; // e.g. ["08:00", "20:00"]
  durationDays?: number;
  instructions?: string;
  laboratory?: string;
  imageUrl?: string;
}

export type AIProvider = 'gemini' | 'openai';

export function buildPrescriptionScanPrompt(): string {
  return `You are an expert medical transcription assistant. Analyze this doctor's prescription image and extract the prescribed medications with extreme clinical accuracy.

Return ONLY a valid JSON object matching this exact schema:
{
  "medications": [
    {
      "name": "Commercial / Brand Name (e.g. Forxiga, Tempra, Janumet, Xarelto)",
      "activeIngredient": "Active chemical compound / Generic substance (e.g. Dapagliflozina, Paracetamol, Metformina/Sitagliptina, Rivaroxabán)",
      "dosageStrength": "Grammage, concentration, or volume (e.g. 10 mg, 500 mg, 2.5 mg, 100 ml)",
      "presentation": "tablet" | "capsule" | "ml" | "drops" | "inhalation" | "injection" | "patch",
      "dose": 1,
      "frequencyHours": 12,
      "scheduledTimes": ["08:00", "20:00"],
      "durationDays": 7,
      "instructions": "e.g. Tomar con alimentos cada 12 horas",
      "laboratory": "e.g. Silanes, Bayer, Genérico GI, AstraZeneca"
    }
  ]
}

Ensure scheduledTimes are reasonable 24-hour HH:MM format times matching the doctor's frequency (e.g., every 12 hours -> ["08:00", "20:00"], every 8 hours -> ["08:00", "16:00", "00:00"]).
If handwritten text is difficult to read, provide the most probable clinical match.`;
}

export function parsePrescriptionAIResponse(rawText: string): ExtractedPrescriptionMed[] {
  try {
    let cleanText = rawText.trim();

    // Strip markdown code fences if present (```json ... ```)
    if (cleanText.includes('```')) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      }
    }

    const parsed = JSON.parse(cleanText);
    if (parsed && Array.isArray(parsed.medications)) {
      return parsed.medications;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse AI prescription response:', err, rawText);
    return [];
  }
}

/**
 * Call Gemini Vision API (Client-side with user-provided or environment API Key)
 */
export async function scanPrescriptionWithGemini(
  imageBase64: string,
  apiKey: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<ExtractedPrescriptionMed[]> {
  const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: buildPrescriptionScanPrompt() },
          {
            inlineData: {
              mimeType,
              data: cleanBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parsePrescriptionAIResponse(rawText);
}

/**
 * Call OpenAI ChatGPT Vision API (GPT-4o / GPT-4o-mini)
 */
export async function scanPrescriptionWithOpenAI(
  imageBase64: string,
  apiKey: string,
  modelName: string = 'gpt-4o-mini'
): Promise<ExtractedPrescriptionMed[]> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const payload = {
    model: modelName,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildPrescriptionScanPrompt() },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64
            }
          }
        ]
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI ChatGPT Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  return parsePrescriptionAIResponse(rawText);
}
