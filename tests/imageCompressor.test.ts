import { describe, it, expect } from 'vitest';
import { compressImage } from '../src/utils/imageCompressor';

describe('Image Compressor Utility', () => {
  it('1. Compresses string base64 gracefully', async () => {
    const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await compressImage(mockBase64, 500, 0.7);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('2. Compresses a File object without throwing errors', async () => {
    const blob = new Blob(['fake image content'], { type: 'image/jpeg' });
    const file = new File([blob], 'test-med.jpg', { type: 'image/jpeg' });

    const result = await compressImage(file, 800, 0.75);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
