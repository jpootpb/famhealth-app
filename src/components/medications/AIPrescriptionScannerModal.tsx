import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Sparkles,
  Camera,
  Upload,
  X,
  Check,
  AlertCircle,
  FileText,
  Key,
  Pill,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  FolderPlus,
  Building2,
  CheckCircle2
} from 'lucide-react';
import {
  scanPrescriptionWithGemini,
  scanPrescriptionWithOpenAI,
  ExtractedPrescriptionMed,
  AIProvider
} from '../../utils/aiPrescriptionEngine';
import { formatDateIso } from '../../utils/frequencyEngine';
import { compressImage } from '../../utils/imageCompressor';

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
  const { activePatient, addStudy, patients } = useApp();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');

  // Manual Mode Fields
  const [manualTitle, setManualTitle] = useState('');
  const [manualDoctorClinic, setManualDoctorClinic] = useState('');
  const [manualDate, setManualDate] = useState(() => formatDateIso(new Date()));
  const [manualNotes, setManualNotes] = useState('');
  const [savedAsStudy, setSavedAsStudy] = useState(false);

  // AI Mode Fields
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('famhealth_ai_apikey') || '');
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extractedMeds, setExtractedMeds] = useState<ExtractedPrescriptionMed[]>([]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1200, 0.8);
      setImagePreview(compressed);
      setSavedAsStudy(false);
    } catch (err) {
      console.warn('Error compressing prescription photo:', err);
    }
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    if (newProvider === 'gemini') {
      setModelName('gemini-1.5-flash');
    } else {
      setModelName('gpt-4o-mini');
    }
  };

  const handleSaveToStudies = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview || !activePatient) return;

    addStudy({
      patientId: activePatient.id,
      title: manualTitle.trim() || `${language === 'es' ? 'Receta Médica' : 'Prescription'} - ${manualDoctorClinic.trim() || formatDateIso(new Date())}`,
      category: 'prescription',
      date: manualDate || formatDateIso(new Date()),
      laboratory: manualDoctorClinic.trim() || 'Consulta Médica',
      resultsSummary: manualNotes.trim() || (language === 'es' ? 'Receta física digitalizada' : 'Digitized prescription photo'),
      fileUrl: imagePreview,
      fileType: 'image'
    });

    setSavedAsStudy(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleCreateMedicationWithPhoto = () => {
    if (!imagePreview) return;

    onSelectMedication({
      name: '',
      presentation: 'tablet',
      imageUrl: imagePreview,
      instructions: manualNotes.trim() || undefined,
      laboratory: manualDoctorClinic.trim() || undefined
    });
    onClose();
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
        // Attach image preview to extracted meds
        setExtractedMeds(results.map(m => ({ ...m, imageUrl: imagePreview })));
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || 'Error al procesar la imagen con la IA.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = (med: ExtractedPrescriptionMed) => {
    onSelectMedication({
      ...med,
      imageUrl: imagePreview || undefined
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTab === 'manual' ? '#eff6ff' : '#ecfdf5',
                color: activeTab === 'manual' ? 'var(--primary)' : '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {activeTab === 'manual' ? <Camera size={22} /> : <Sparkles size={22} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {language === 'es' ? 'Receta Médica Digital' : 'Medical Prescription'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {activePatient ? (language === 'es' ? `Paciente: ${activePatient.name}` : `Patient: ${activePatient.name}`) : ''}
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher: Direct Manual vs AI Scanner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('manual'); setErrorMsg(''); }}
            style={{ justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Camera size={16} />
            <span>{language === 'es' ? '📸 Subir Foto Directa (Sin IA)' : '📸 Direct Photo (No AI)'}</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('ai'); setErrorMsg(''); }}
            style={{
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
              backgroundColor: activeTab === 'ai' ? '#059669' : undefined,
              borderColor: activeTab === 'ai' ? '#059669' : undefined
            }}
          >
            <Sparkles size={16} />
            <span>{language === 'es' ? '✨ Escanear con IA (Opcional)' : '✨ AI Scanner (Optional)'}</span>
          </button>
        </div>

        {/* Image Upload Dropzone (Shared by both modes) */}
        <div
          style={{
            border: `2px dashed ${imagePreview ? '#16a34a' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            backgroundColor: imagePreview ? '#f0fdf4' : 'var(--bg-secondary)',
            marginBottom: '1.25rem',
            transition: 'all 0.15s ease'
          }}
        >
          <input
            type="file"
            id="prescription-file-input"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {!imagePreview ? (
            <label
              htmlFor="prescription-file-input"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}
              >
                <Camera size={24} color="var(--primary)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.9375rem', display: 'block' }}>
                  {language === 'es' ? '📷 Tomar Foto o Subir Receta Médica' : '📷 Take Photo or Upload Prescription'}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {language === 'es' ? 'JPG, PNG o foto desde la cámara del celular' : 'JPG, PNG or mobile camera capture'}
                </span>
              </div>
            </label>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Check size={16} /> {language === 'es' ? 'Foto de la receta cargada con éxito' : 'Prescription photo ready'}
                </span>
                <label
                  htmlFor="prescription-file-input"
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  <Camera size={14} /> {language === 'es' ? 'Cambiar Foto' : 'Change Photo'}
                </label>
              </div>

              <img
                src={imagePreview}
                alt="Prescription Preview"
                style={{
                  maxHeight: '220px',
                  maxWidth: '100%',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  objectFit: 'contain',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          )}
        </div>

        {/* ----------------- TAB 1: MANUAL DIRECT (NO AI NEEDED) ----------------- */}
        {activeTab === 'manual' && (
          <div>
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem',
                color: '#1e40af'
              }}
            >
              💡 {language === 'es' ? 'Sube la foto de tu receta y guárdala directamente en el expediente digital de tu paciente o úsala para registrar tu medicamento sin necesidad de claves técnicas ni IA.' : 'Upload your prescription and save it directly in your patient records without technical keys.'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>
                  {language === 'es' ? 'Título / Consulta:' : 'Title:'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'es' ? 'ej. Receta Consulta Cardiología' : 'e.g. Cardiology Prescription'}
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>
                  {language === 'es' ? 'Doctor o Clínica:' : 'Doctor or Clinic:'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'es' ? 'ej. Dr. Jesús Castillo (IMSS 59)' : 'e.g. Dr. Castillo'}
                  value={manualDoctorClinic}
                  onChange={e => setManualDoctorClinic(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>
                  {language === 'es' ? 'Fecha de la Receta:' : 'Date:'}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>
                  {language === 'es' ? 'Notas / Diagnóstico (Opcional):' : 'Notes (Optional):'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'es' ? 'ej. Tratamiento para 3 meses...' : 'e.g. 3-month treatment...'}
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons for Manual Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9375rem', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                onClick={handleSaveToStudies}
                disabled={!imagePreview}
              >
                {savedAsStudy ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>{language === 'es' ? '✓ ¡Receta Guardada en Expediente y Estudios!' : '✓ Saved to Studies & Records!'}</span>
                  </>
                ) : (
                  <>
                    <FolderPlus size={18} />
                    <span>{language === 'es' ? '📁 Guardar Foto en Expediente de Recetas y Estudios' : '📁 Save Photo to Medical Records & Studies'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9375rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                onClick={handleCreateMedicationWithPhoto}
                disabled={!imagePreview}
              >
                <Pill size={18} />
                <span>{language === 'es' ? '💊 Crear Nuevo Medicamento con esta Foto Adjunta' : '💊 Create Medication with this Photo'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: AI SCANNER (GEMINI / OPENAI) ----------------- */}
        {activeTab === 'ai' && (
          <div>
            {/* AI Provider Switcher */}
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
                />
              </div>
            </div>

            {/* Scan Action Button */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9375rem', backgroundColor: '#059669', borderColor: '#059669' }}
              onClick={handleScan}
              disabled={isScanning || !imagePreview}
            >
              {isScanning ? (
                <span>⏳ {language === 'es' ? 'La IA está leyendo la receta...' : 'AI is reading prescription...'}</span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>{language === 'es' ? 'Analizar y Extraer Medicamentos con IA' : 'Scan & Extract Medications with AI'}</span>
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
        )}
      </div>
    </div>
  );
};
