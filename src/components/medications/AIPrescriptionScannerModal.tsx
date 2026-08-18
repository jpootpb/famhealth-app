import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Sparkles,
  Camera,
  Upload,
  X,
  Check,
  AlertCircle,
  Cpu,
  Key,
  Pill,
  Clock,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  scanPrescriptionWithGemini,
  scanPrescriptionWithOpenAI,
  ExtractedPrescriptionMed,
  AIProvider
} from '../../utils/aiPrescriptionEngine';

interface AIPrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedication: (med: ExtractedPrescriptionMed) => void;
}

export const AIPrescriptionScannerModal: React.FC<AIPrescriptionScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectMedication
}) => {
  const { t, language } = useLanguage();

  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('famhealth_ai_apikey') || '');
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extractedMeds, setExtractedMeds] = useState<ExtractedPrescriptionMed[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    if (newProvider === 'gemini') {
      setModelName('gemini-1.5-flash');
    } else {
      setModelName('gpt-4o-mini');
    }
  };

  const handleScan = async () => {
    if (!imagePreview) {
      setErrorMsg(language === 'es' ? 'Por favor sube o toma la foto de la receta' : 'Please upload or capture a prescription photo');
      return;
    }

    if (!apiKey.trim()) {
      setErrorMsg(
        language === 'es'
          ? `Ingresa tu API Key de ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI ChatGPT'}. Es gratuita para desarrollo.`
          : `Please enter your ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI ChatGPT'} API Key.`
      );
      return;
    }

    // Save key in localStorage for convenience
    localStorage.setItem('famhealth_ai_apikey', apiKey.trim());

    setIsScanning(true);
    setErrorMsg('');
    setExtractedMeds([]);

    try {
      let results: ExtractedPrescriptionMed[] = [];
      if (provider === 'gemini') {
        results = await scanPrescriptionWithGemini(imagePreview, apiKey, modelName);
      } else {
        results = await scanPrescriptionWithOpenAI(imagePreview, apiKey, modelName);
      }

      if (results.length === 0) {
        setErrorMsg(
          language === 'es'
            ? 'No se pudieron detectar medicamentos legibles. Intenta con una foto más clara o con mejor iluminación.'
            : 'No readable medications detected. Please try a clearer or better-lit photo.'
        );
      } else {
        setExtractedMeds(results);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || 'Error al procesar la imagen con la IA.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = (med: ExtractedPrescriptionMed) => {
    onSelectMedication(med);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {language === 'es' ? 'Escáner de Recetas con IA' : 'AI Prescription Scanner'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {language === 'es' ? 'Transcripción inteligente de recetas médicas manuscritas o impresas' : 'Smart transcription of doctor prescriptions'}
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* AI Provider Switcher (Gemini vs OpenAI ChatGPT) */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '0.875rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-color)'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
            🤖 {language === 'es' ? 'Selecciona el Motor de Inteligencia Artificial:' : 'Select AI Vision Engine:'}
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${provider === 'gemini' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleProviderChange('gemini')}
              style={{ justifyContent: 'center', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}
            >
              🌟 Google Gemini (1.5 / 2.0)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${provider === 'openai' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleProviderChange('openai')}
              style={{ justifyContent: 'center', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}
            >
              🟢 OpenAI ChatGPT (GPT-4o)
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Key size={13} color="var(--primary)" />
              {provider === 'gemini' ? 'Gemini API Key (Google AI Studio)' : 'OpenAI API Key (Platform OpenAI)'}
            </label>
            <input
              type="password"
              className="form-input"
              placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Prescription Photo Capture / Upload */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.8125rem' }}>
            📷 {language === 'es' ? 'Foto de la Receta del Médico:' : 'Doctor Prescription Photo:'}
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <label
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'center', cursor: 'pointer', padding: '0.625rem' }}
            >
              <Camera size={16} color="var(--primary)" />
              <span>{language === 'es' ? 'Tomar con Cámara' : 'Take with Camera'}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>

            <label
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'center', cursor: 'pointer', padding: '0.625rem' }}
            >
              <Upload size={16} />
              <span>{language === 'es' ? 'Subir de Galería / PDF' : 'Upload File'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {imagePreview && (
            <div style={{ textAlign: 'center', position: 'relative', marginTop: '0.5rem' }}>
              <img
                src={imagePreview}
                alt="Prescription preview"
                style={{
                  maxHeight: '200px',
                  maxWidth: '100%',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}
        </div>

        {/* Scan Action Button */}
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9375rem' }}
          onClick={handleScan}
          disabled={isScanning || !imagePreview}
        >
          {isScanning ? (
            <span>⏳ {language === 'es' ? 'La IA está leyendo la receta...' : 'AI is reading prescription...'}</span>
          ) : (
            <>
              <Sparkles size={18} />
              <span>{language === 'es' ? 'Analizar y Extraer Medicamentos' : 'Scan & Extract Medications'}</span>
            </>
          )}
        </button>

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Extracted Medications List */}
        {extractedMeds.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', display: 'block', marginBottom: '0.625rem' }}>
              ✓ {language === 'es' ? `¡${extractedMeds.length} medicamento(s) detectado(s)! Clic para importar:` : `Detected ${extractedMeds.length} medication(s)! Click to import:`}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {extractedMeds.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #059669',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'block' }}>
                      💊 {med.name} {med.laboratory ? `(${med.laboratory})` : ''}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>Dosis: {med.dose || 1} {med.presentation || 'tableta'}</span>
                      {med.scheduledTimes && (
                        <span> • Horarios: <strong>{med.scheduledTimes.join(', ')}</strong></span>
                      )}
                      {med.durationDays && (
                        <span> • Duración: {med.durationDays} días</span>
                      )}
                    </div>
                    {med.instructions && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                        "{med.instructions}"
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                    onClick={() => handleImport(med)}
                  >
                    <Check size={14} /> {language === 'es' ? 'Importar a Formulario' : 'Import'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
