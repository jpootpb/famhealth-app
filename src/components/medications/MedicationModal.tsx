import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Medication, FrequencyType, DoseSlot } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Pill,
  Clock,
  Calendar,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Building2
} from 'lucide-react';
import { AIPrescriptionScannerModal } from './AIPrescriptionScannerModal';
import { ExtractedPrescriptionMed } from '../../utils/aiPrescriptionEngine';
import { formatDateIso } from '../../utils/frequencyEngine';
import { Sparkles } from 'lucide-react';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicationToEdit?: Medication | null;
}

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  onClose,
  medicationToEdit
}) => {
  const { activePatient, addMedication, updateMedication } = useApp();
  const { t, language } = useLanguage();

  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);

  const [name, setName] = useState('');
  const [presentation, setPresentation] = useState('tablet');
  const [indication, setIndication] = useState('');
  const [laboratory, setLaboratory] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<number>(30);
  const [minimumStockAlert, setMinimumStockAlert] = useState<number>(5);
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [isImssCovered, setIsImssCovered] = useState(false);
  const [preferredStore, setPreferredStore] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Frequency Configuration
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily_fixed');
  const [startDate, setStartDate] = useState<string>(formatDateIso(new Date()));
  const [endDate, setEndDate] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [intervalDays, setIntervalDays] = useState<number>(2);
  const [intervalHours, setIntervalHours] = useState<number>(8);

  const handleAiExtractedMed = (med: ExtractedPrescriptionMed) => {
    setName(med.name);
    if (med.presentation) setPresentation(med.presentation);
    if (med.laboratory) setLaboratory(med.laboratory);
    if (med.instructions) setIndication(med.instructions);
    if (med.durationDays) {
      setDurationDays(med.durationDays);
      setFrequencyType('temporary_hourly');
      const end = new Date();
      end.setDate(end.getDate() + med.durationDays);
      setEndDate(formatDateIso(end));
    }
    if (med.scheduledTimes && med.scheduledTimes.length > 0) {
      setDoseSlots(
        med.scheduledTimes.map(time => ({
          time,
          dose: med.dose || 1,
          instruction: med.instructions
        }))
      );
    }
  };

  // Dose Slots
  const [doseSlots, setDoseSlots] = useState<DoseSlot[]>([
    { time: '08:00', dose: 1, instruction: 'Con el desayuno' }
  ]);

  useEffect(() => {
    if (medicationToEdit) {
      setName(medicationToEdit.name);
      setPresentation(medicationToEdit.presentation);
      setIndication(medicationToEdit.indication || '');
      setLaboratory(medicationToEdit.laboratory || '');
      setImageUrl(medicationToEdit.imageUrl || '');
      setCurrentStock(medicationToEdit.currentStock);
      setMinimumStockAlert(medicationToEdit.minimumStockAlert);
      setUnitCost(medicationToEdit.unitCost !== undefined ? medicationToEdit.unitCost : '');
      setExpirationDate(medicationToEdit.expirationDate || '');
      setIsImssCovered(Boolean(medicationToEdit.isImssCovered || medicationToEdit.source === 'imss'));
      setPreferredStore(medicationToEdit.preferredStore || '');
      setPurchaseNotes(medicationToEdit.purchaseNotes || '');
      setFrequencyType(medicationToEdit.frequency.type);
      setStartDate(medicationToEdit.frequency.startDate);
      setEndDate(medicationToEdit.frequency.endDate || '');
      setIntervalDays(medicationToEdit.frequency.intervalDays || 2);
      setIntervalHours(medicationToEdit.frequency.intervalHours || 8);
      setDoseSlots(medicationToEdit.frequency.doseSlots.length > 0 ? medicationToEdit.frequency.doseSlots : [{ time: '08:00', dose: 1 }]);
    } else {
      setName('');
      setPresentation('tablet');
      setIndication('');
      setLaboratory('');
      setImageUrl('');
      setCurrentStock(30);
      setMinimumStockAlert(5);
      setUnitCost('');
      setExpirationDate('');
      setIsImssCovered(false);
      setPreferredStore('');
      setPurchaseNotes('');
      setFrequencyType('daily_fixed');
      setStartDate(formatDateIso(new Date()));
      setEndDate('');
      setDurationDays(7);
      setIntervalDays(2);
      setIntervalHours(8);
      setDoseSlots([{ time: '08:00', dose: 1, instruction: language === 'es' ? 'Con el desayuno' : 'With breakfast' }]);
    }
  }, [medicationToEdit, isOpen, language]);

  if (!isOpen || !activePatient) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddDoseSlot = () => {
    setDoseSlots(prev => [...prev, { time: '20:00', dose: 1, instruction: language === 'es' ? 'Con la cena' : 'With dinner' }]);
  };

  const handleRemoveDoseSlot = (index: number) => {
    if (doseSlots.length <= 1) return;
    setDoseSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDoseSlot = (index: number, field: keyof DoseSlot, value: any) => {
    setDoseSlots(prev =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let computedEndDate = endDate;
    if (frequencyType === 'temporary_hourly' && !computedEndDate && durationDays > 0) {
      const end = new Date(startDate);
      end.setDate(end.getDate() + durationDays);
      computedEndDate = formatDateIso(end);
    }

    const payload = {
      patientId: activePatient.id,
      name: name.trim(),
      presentation,
      indication: indication.trim() || undefined,
      laboratory: laboratory.trim() || undefined,
      imageUrl: imageUrl || undefined,
      currentStock: Number(currentStock) || 0,
      minimumStockAlert: Number(minimumStockAlert) || 3,
      unitCost: isImssCovered ? 0 : (unitCost ? Number(unitCost) : undefined),
      isImssCovered,
      source: (isImssCovered ? 'imss' : (preferredStore ? 'private_pharmacy' : undefined)) as any,
      preferredStore: preferredStore.trim() || undefined,
      purchaseNotes: purchaseNotes.trim() || undefined,
      expirationDate: expirationDate || undefined,
      frequency: {
        type: frequencyType,
        doseSlots: doseSlots.map(s => ({
          time: s.time,
          dose: Number(s.dose) || 1,
          instruction: s.instruction?.trim() || undefined
        })),
        startDate,
        endDate: computedEndDate || undefined,
        intervalDays: frequencyType === 'every_n_days' ? intervalDays : undefined,
        intervalHours: frequencyType === 'temporary_hourly' ? intervalHours : undefined
      }
    };

    if (medicationToEdit) {
      updateMedication({ ...payload, id: medicationToEdit.id });
    } else {
      addMedication(payload);
    }

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {medicationToEdit ? t('editMedTitle') : t('addMedTitle')}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* AI Prescription Auto-Fill Banner */}
        {!medicationToEdit && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px dashed #059669',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#059669" />
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#065f46' }}>
                  {language === 'es' ? '¿Tienes la receta médica en foto?' : 'Have a photo of the prescription?'}
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                  {language === 'es' ? 'La IA (Gemini / ChatGPT) puede leerla y llenar este formulario automáticamente.' : 'AI (Gemini / ChatGPT) can transcribe and auto-fill this form.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAiScannerOpen(true)}
              style={{ backgroundColor: '#059669', borderColor: '#059669', fontSize: '0.75rem' }}
            >
              <Sparkles size={14} /> {language === 'es' ? 'Escanear Receta con IA' : 'Scan with AI'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('medName')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('medNamePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('presentation')}</label>
              <select
                className="form-select"
                value={presentation}
                onChange={e => setPresentation(e.target.value)}
              >
                <option value="tablet">{t('presTablet')}</option>
                <option value="capsule">{t('presCapsule')}</option>
                <option value="ml">{t('presMl')}</option>
                <option value="drops">{t('presDrops')}</option>
                <option value="inhalation">{t('presInhalation')}</option>
                <option value="injection">{t('presInjection')}</option>
                <option value="patch">{t('presPatch')}</option>
                <option value="sachet">{t('presSachet')}</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('labBrand')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('labBrandPlaceholder')}
                value={laboratory}
                onChange={e => setLaboratory(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('medicalIndication')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('medicalIndicationPlaceholder')}
                value={indication}
                onChange={e => setIndication(e.target.value)}
              />
            </div>
          </div>

          {/* Photo Upload & Live Thumbnail */}
          <div
            className="card"
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              {imageUrl ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imageUrl}
                    alt="Medicine Box Preview"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      border: '2px solid var(--primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      backgroundColor: 'var(--danger)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8'
                  }}
                >
                  <Camera size={26} />
                </div>
              )}

              <div>
                <strong style={{ fontSize: '0.875rem', display: 'block' }}>
                  {t('boxPhoto')}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {t('boxPhotoHint')}
                </span>
              </div>
            </div>

            <div>
              <label
                className="btn btn-secondary btn-sm"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Camera size={14} /> {imageUrl ? t('changePhoto') : t('uploadPhoto')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Stock, Expiration & Cost Settings */}
          <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AlertCircle size={16} color="var(--primary)" /> {t('inventorySettings')}
            </h3>
            <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('currentStockCount')}</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={currentStock}
                  onChange={e => setCurrentStock(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('lowStockThreshold')}</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={minimumStockAlert}
                  onChange={e => setMinimumStockAlert(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('expirationDate')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={expirationDate}
                  onChange={e => setExpirationDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('costPerBox')}</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={isImssCovered ? 'Surtido por IMSS ($0)' : 'e.g. 510'}
                  disabled={isImssCovered}
                  value={isImssCovered ? 0 : unitCost}
                  onChange={e => setUnitCost(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            {/* IMSS / Institutional Supply Toggle */}
            <div
              style={{
                backgroundColor: isImssCovered ? '#ecfdf5' : '#ffffff',
                border: isImssCovered ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => {
                const next = !isImssCovered;
                setIsImssCovered(next);
                if (next) {
                  setUnitCost(0);
                  if (!preferredStore) setPreferredStore('IMSS / Sector Salud');
                }
              }}
            >
              <div>
                <strong style={{ fontSize: '0.8125rem', color: isImssCovered ? '#065f46' : 'var(--text-primary)' }}>
                  🏥 {language === 'es' ? 'Medicamento Suministrado Gratis por el IMSS / ISSSTE' : 'Supplied Free by IMSS / Public Healthcare'}
                </strong>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {language === 'es'
                    ? 'No genera costo de compra ni división de gastos ($0 MXN).'
                    : 'Zero financial cost ($0 MXN). Excluded from family expense split.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isImssCovered}
                onChange={() => {}} // Controlled by div onClick
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Preferred Store & Purchase Notes for Siblings */}
            {!isImssCovered && (
              <div>
                <div className="form-group" style={{ marginBottom: '0.625rem' }}>
                  <label className="form-label">
                    🏬 {language === 'es' ? 'Farmacia o Tienda Recomendada (Mejor Precio)' : 'Recommended Store / Pharmacy'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mercado Libre, Farmacias Guadalajara, Muestras Médicas"
                    value={preferredStore}
                    onChange={e => setPreferredStore(e.target.value)}
                  />

                  {/* Quick Store Pill Presets */}
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                    {['Mercado Libre', 'Farmacias Guadalajara', 'Muestras Médicas', 'Farmacia del Ahorro', 'Farmacias Similares'].map(store => (
                      <button
                        key={store}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPreferredStore(store)}
                        style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}
                      >
                        {store}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    💡 {language === 'es' ? 'Tips de Compra y Ahorro para la Familia' : 'Purchase Tips & Savings for Family'}
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Comprar genérico con mismo compuesto y gramaje a $510 en Mercado Libre (ahorro de $690 vs $1200 en farmacia)."
                    value={purchaseNotes}
                    onChange={e => setPurchaseNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Frequency Type Selector */}
          <div className="form-group">
            <label className="form-label">{t('frequencyRule')}</label>
            <select
              className="form-select"
              value={frequencyType}
              onChange={e => setFrequencyType(e.target.value as FrequencyType)}
            >
              <option value="daily_fixed">{t('dailyFixedOpt')}</option>
              <option value="alternate_days">{t('alternateDaysOpt')}</option>
              <option value="every_n_days">{t('everyNDaysOpt')}</option>
              <option value="temporary_hourly">{t('temporaryHourlyOpt')}</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('startDate')}</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>

            {frequencyType === 'every_n_days' && (
              <div className="form-group">
                <label className="form-label">{t('intervalDays')}</label>
                <input
                  type="number"
                  className="form-input"
                  min="2"
                  max="30"
                  value={intervalDays}
                  onChange={e => setIntervalDays(Number(e.target.value))}
                />
              </div>
            )}

            {frequencyType === 'temporary_hourly' && (
              <div className="form-group">
                <label className="form-label">{t('durationDays')}</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={durationDays}
                  onChange={e => setDurationDays(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Dosing Times & Fractional Multipliers */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                {t('dosingHoursFractional')}
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddDoseSlot}
                style={{ fontSize: '0.75rem' }}
              >
                <Plus size={14} /> {t('addDosingHour')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {doseSlots.map((slot, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <input
                    type="time"
                    className="form-input"
                    style={{ width: '120px' }}
                    value={slot.time}
                    onChange={e => handleUpdateDoseSlot(idx, 'time', e.target.value)}
                    required
                  />

                  <select
                    className="form-select"
                    style={{ width: '130px' }}
                    value={slot.dose}
                    onChange={e => handleUpdateDoseSlot(idx, 'dose', Number(e.target.value))}
                  >
                    <option value={0.25}>1/4</option>
                    <option value={0.5}>1/2</option>
                    <option value={0.75}>3/4</option>
                    <option value={1}>1</option>
                    <option value={1.5}>1 1/2</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>

                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder={t('instructionsPlaceholder')}
                    value={slot.instruction || ''}
                    onChange={e => handleUpdateDoseSlot(idx, 'instruction', e.target.value)}
                  />

                  {doseSlots.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRemoveDoseSlot(idx)}
                      aria-label="Remove slot"
                    >
                      <Trash2 size={16} color="var(--danger)" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {medicationToEdit ? t('saveChanges') : t('createMedication')}
            </button>
          </div>
        </form>
      </div>

      <AIPrescriptionScannerModal
        isOpen={isAiScannerOpen}
        onClose={() => setIsAiScannerOpen(false)}
        onSelectMedication={handleAiExtractedMed}
      />
    </div>
  );
};
