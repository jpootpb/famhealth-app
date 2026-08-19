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
import { formatDateIso, calculateTemporaryTreatmentSchedule } from '../../utils/frequencyEngine';
import { compressImage } from '../../utils/imageCompressor';
import { getPresentationConfig } from '../../utils/presentationHelper';
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
  const { activePatient, patients, addMedication, updateMedication, customPharmacies, addCustomPharmacy, currentFamilyId } = useApp();
  const { t, language } = useLanguage();

  const [assignedPatientId, setAssignedPatientId] = useState<string>('');
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);

  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [dosageStrength, setDosageStrength] = useState('');
  const [treatmentType, setTreatmentType] = useState<'chronic' | 'temporary'>('chronic');
  const [presentation, setPresentation] = useState('tablet');
  const [indication, setIndication] = useState('');
  const [laboratory, setLaboratory] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [stockTrackingMode, setStockTrackingMode] = useState<'pieces' | 'manual_bottle'>('pieces');
  const [bottlesCount, setBottlesCount] = useState<number>(1);
  const [packageUnits, setPackageUnits] = useState<number>(30);
  const [isMedicalSample, setIsMedicalSample] = useState<boolean>(false);
  const [sampleNotes, setSampleNotes] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<number>(30);
  const [minimumStockAlert, setMinimumStockAlert] = useState<number>(5);
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [isImssCovered, setIsImssCovered] = useState(false);
  const [preferredStore, setPreferredStore] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Loyalty Program State (e.g. Farmacia Value 3+1)
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyStore, setLoyaltyStore] = useState('Farmacias Value');
  const [loyaltyRequired, setLoyaltyRequired] = useState(3);
  const [loyaltyPurchased, setLoyaltyPurchased] = useState(0);
  const [loyaltyReward, setLoyaltyReward] = useState('1 Frasco / Caja Gratis');

  // Frequency Configuration
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily_fixed');
  const [startDate, setStartDate] = useState<string>(formatDateIso(new Date()));
  const [endDate, setEndDate] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [intervalDays, setIntervalDays] = useState<number>(2);
  const [intervalHours, setIntervalHours] = useState<number>(8);
  const [startFirstDoseTime, setStartFirstDoseTime] = useState<string>('08:00');
  const [firstDoseTiming, setFirstDoseTiming] = useState<'breakfast' | 'lunch' | 'dinner' | 'custom'>('breakfast');
  const [endDoseTime, setEndDoseTime] = useState<string>('20:00');
  const [totalPrescribedDoses, setTotalPrescribedDoses] = useState<number>(21);

  const handleAiExtractedMed = (med: ExtractedPrescriptionMed) => {
    setName(med.name);
    if (med.activeIngredient) setActiveIngredient(med.activeIngredient);
    if (med.dosageStrength) setDosageStrength(med.dosageStrength);
    if (med.presentation) setPresentation(med.presentation);
    if (med.laboratory) setLaboratory(med.laboratory);
    if (med.instructions) setIndication(med.instructions);
    if (med.imageUrl) setImageUrl(med.imageUrl);
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
      const isTemp = medicationToEdit.treatmentType === 'temporary' || medicationToEdit.frequency?.type === 'temporary_hourly';
      setTreatmentType(isTemp ? 'temporary' : 'chronic');
      setAssignedPatientId(medicationToEdit.patientId || activePatient?.id || '');
      setName(medicationToEdit.name || '');
      setActiveIngredient(medicationToEdit.activeIngredient || '');
      setDosageStrength(medicationToEdit.dosageStrength || '');
      setPresentation(medicationToEdit.presentation || 'tablet');
      setIndication(medicationToEdit.indication || '');
      setLaboratory(medicationToEdit.laboratory || '');
      setImageUrl(medicationToEdit.imageUrl || '');
      const isManual = medicationToEdit.stockTrackingMode === 'manual_bottle' || ['drops', 'ear_drops', 'nasal_spray', 'syrup', 'cream', 'inhalation'].includes(medicationToEdit.presentation);
      setStockTrackingMode(isManual ? 'manual_bottle' : 'pieces');
      setBottlesCount(medicationToEdit.bottlesCount !== undefined ? medicationToEdit.bottlesCount : 1);
      setPackageUnits(medicationToEdit.packageUnits || 30);
      setIsMedicalSample(Boolean(medicationToEdit.isMedicalSample));
      setSampleNotes(medicationToEdit.sampleNotes || '');
      setCurrentStock(medicationToEdit.currentStock !== undefined ? medicationToEdit.currentStock : 30);
      setMinimumStockAlert(isTemp ? 0 : (medicationToEdit.minimumStockAlert !== undefined ? medicationToEdit.minimumStockAlert : 5));
      setUnitCost(medicationToEdit.unitCost !== undefined ? medicationToEdit.unitCost : '');
      setExpirationDate(medicationToEdit.expirationDate || '');
      setIsImssCovered(Boolean(medicationToEdit.isImssCovered || medicationToEdit.source === 'imss'));
      setPreferredStore(medicationToEdit.preferredStore || '');
      setPurchaseNotes(medicationToEdit.purchaseNotes || '');
      if (medicationToEdit.loyaltyPromo) {
        setLoyaltyEnabled(Boolean(medicationToEdit.loyaltyPromo.enabled));
        setLoyaltyStore(medicationToEdit.loyaltyPromo.storeName || 'Farmacia');
        setLoyaltyRequired(medicationToEdit.loyaltyPromo.requiredPurchases || 3);
        setLoyaltyPurchased(medicationToEdit.loyaltyPromo.currentPurchased || 0);
        setLoyaltyReward(medicationToEdit.loyaltyPromo.rewardDescription || '1 Frasco Gratis');
      } else {
        setLoyaltyEnabled(false);
        setLoyaltyStore('Farmacias Value');
        setLoyaltyRequired(3);
        setLoyaltyPurchased(0);
        setLoyaltyReward('1 Frasco / Caja Gratis');
      }
      const freq = medicationToEdit.frequency || ({} as any);
      setFrequencyType(freq.type || (isTemp ? 'temporary_hourly' : 'daily_fixed'));
      setStartDate(freq.startDate || formatDateIso(new Date()));
      setEndDate(freq.endDate || '');
      setDurationDays(freq.durationDays || 7);
      setIntervalDays(freq.intervalDays || 2);
      setIntervalHours(freq.intervalHours || 8);
      const editDoseSlots = Array.isArray(freq.doseSlots) && freq.doseSlots.length > 0
        ? freq.doseSlots
        : [{ time: '08:00', dose: 1, instruction: language === 'es' ? 'Con el desayuno' : 'With breakfast' }];
      setDoseSlots(editDoseSlots);
      setStartFirstDoseTime(freq.startFirstDoseTime || editDoseSlots[0]?.time || '08:00');
      setFirstDoseTiming(freq.firstDoseTiming || 'breakfast');
      setEndDoseTime(freq.endDoseTime || editDoseSlots[editDoseSlots.length - 1]?.time || '20:00');
      setTotalPrescribedDoses(freq.totalPrescribedDoses || (editDoseSlots.length * (freq.durationDays || 7)));
    } else {
      const isPatientTemp = activePatient?.type === 'temporary';
      setTreatmentType(isPatientTemp ? 'temporary' : 'chronic');
      setAssignedPatientId(activePatient?.id || '');
      setName('');
      setActiveIngredient('');
      setDosageStrength('');
      setPresentation('tablet');
      setIndication('');
      setLaboratory('');
      setImageUrl('');
      setStockTrackingMode('pieces');
      setBottlesCount(1);
      setPackageUnits(30);
      setIsMedicalSample(false);
      setSampleNotes('');
      setCurrentStock(30);
      setMinimumStockAlert(isPatientTemp ? 0 : 5);
      setUnitCost('');
      setExpirationDate('');
      setIsImssCovered(false);
      setPreferredStore('');
      setPurchaseNotes('');
      setLoyaltyEnabled(false);
      setLoyaltyStore('Farmacias Value');
      setLoyaltyRequired(3);
      setLoyaltyPurchased(0);
      setLoyaltyReward('1 Frasco / Caja Gratis');
      setFrequencyType(isPatientTemp ? 'temporary_hourly' : 'daily_fixed');
      setStartDate(formatDateIso(new Date()));
      setEndDate('');
      setDurationDays(7);
      setIntervalDays(2);
      setIntervalHours(8);
      setStartFirstDoseTime('08:00');
      setFirstDoseTiming('breakfast');
      setEndDoseTime('20:00');
      setTotalPrescribedDoses(21);
      setDoseSlots([{ time: '08:00', dose: 1, instruction: language === 'es' ? 'Con el desayuno' : 'With breakfast' }]);
    }
  }, [medicationToEdit, isOpen, language, activePatient?.id]);

  const currentPatient = activePatient || (patients.length > 0 ? patients[0] : null);
  if (!isOpen || !currentPatient) return null;

  const presConfig = getPresentationConfig(presentation, language);
  const isTemporaryTreatment = treatmentType === 'temporary' || frequencyType === 'temporary_hourly';

  const tempSchedule = calculateTemporaryTreatmentSchedule({
    startDate,
    durationDays: Number(durationDays) || 7,
    doseSlots,
    startFirstDoseTime,
    lang: language as any
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.75);
      setImageUrl(compressed);
    } catch (err) {
      console.warn('Error compressing medicine photo:', err);
    }
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

    const schedule = isTemporaryTreatment
      ? calculateTemporaryTreatmentSchedule({
          startDate,
          durationDays: Number(durationDays) || 7,
          doseSlots,
          startFirstDoseTime,
          lang: language as any
        })
      : null;

    const computedEndDate = schedule ? schedule.endDate : (endDate || undefined);
    const computedEndDoseTime = schedule ? schedule.endDoseTime : undefined;
    const computedTotalDoses = schedule ? schedule.totalPrescribedDoses : undefined;
    const computedFirstDoseTime = schedule ? schedule.startFirstDoseTime : undefined;

    const payload = {
      patientId: assignedPatientId || currentPatient.id,
      name: name.trim(),
      activeIngredient: activeIngredient.trim() || undefined,
      dosageStrength: dosageStrength.trim() || undefined,
      treatmentType,
      presentation,
      stockTrackingMode,
      bottlesCount: stockTrackingMode === 'manual_bottle' ? (Number(bottlesCount) || 1) : undefined,
      packageUnits: Number(packageUnits) || 30,
      isMedicalSample,
      sampleNotes: sampleNotes.trim() || undefined,
      indication: indication.trim() || undefined,
      laboratory: laboratory.trim() || undefined,
      imageUrl: imageUrl || undefined,
      currentStock: stockTrackingMode === 'manual_bottle' ? (Number(bottlesCount) || 1) : (Number(currentStock) || 0),
      minimumStockAlert: treatmentType === 'temporary' ? 0 : (stockTrackingMode === 'manual_bottle' ? 0 : (Number(minimumStockAlert) || 0)),
      unitCost: isImssCovered ? 0 : (unitCost ? Number(unitCost) : undefined),
      isImssCovered,
      source: (isImssCovered ? 'imss' : (preferredStore ? 'private_pharmacy' : undefined)) as any,
      preferredStore: preferredStore.trim() || undefined,
      purchaseNotes: purchaseNotes.trim() || undefined,
      loyaltyPromo: loyaltyEnabled
        ? {
            enabled: true,
            storeName: loyaltyStore.trim() || 'Farmacia',
            requiredPurchases: Number(loyaltyRequired) || 3,
            currentPurchased: Number(loyaltyPurchased) || 0,
            rewardDescription: loyaltyReward.trim() || '1 Frasco / Caja Gratis',
            isRewardReady: (Number(loyaltyPurchased) || 0) >= (Number(loyaltyRequired) || 3)
          }
        : undefined,
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
        durationDays: isTemporaryTreatment ? (Number(durationDays) || 7) : undefined,
        startFirstDoseTime: isTemporaryTreatment ? computedFirstDoseTime : undefined,
        firstDoseTiming: isTemporaryTreatment ? firstDoseTiming : undefined,
        endDoseTime: isTemporaryTreatment ? computedEndDoseTime : undefined,
        totalPrescribedDoses: isTemporaryTreatment ? computedTotalDoses : undefined,
        intervalDays: frequencyType === 'every_n_days' ? intervalDays : undefined,
        intervalHours: frequencyType === 'temporary_hourly' ? intervalHours : undefined
      }
    };

    if (medicationToEdit) {
      updateMedication({
        ...medicationToEdit,
        ...payload,
        id: medicationToEdit.id,
        familyId: medicationToEdit.familyId || currentFamilyId
      });
    } else {
      addMedication({
        ...payload,
        familyId: currentFamilyId
      });
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
          {/* Assigned Patient / Family Member Selector */}
          <div className="form-group" style={{ marginBottom: '1rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)' }}>
            <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 800 }}>
              👤 {language === 'es' ? '¿A quién pertenece este medicamento? (Paciente / Familiar):' : 'Assigned Patient:'}
            </label>
            <select
              className="form-select"
              value={assignedPatientId}
              onChange={e => setAssignedPatientId(e.target.value)}
              style={{ fontWeight: 700, backgroundColor: '#ffffff' }}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id === 'patient-jose' ? '👤 ' : p.id === 'patient-grandfather' ? '👴 ' : p.id === 'patient-maria' ? '👵 ' : '🩺 '}
                  {p.name} ({p.primaryDiagnosis || 'Cuidado Familiar'})
                </option>
              ))}
            </select>
          </div>

          {/* Basic Details */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                {language === 'es' ? 'Nombre Comercial / Marca:' : 'Brand / Commercial Name:'} <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'ej. Forxiga, Janumet, Xarelto, Tempra' : 'e.g. Forxiga, Tempra, Janumet'}
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
                onChange={e => {
                  const val = e.target.value;
                  setPresentation(val);
                  const cfg = getPresentationConfig(val, language);
                  setStockTrackingMode(cfg.defaultTrackingMode);
                  if (cfg.defaultTrackingMode === 'manual_bottle') {
                    setBottlesCount(1);
                  }
                  if (cfg.doseOptions.length > 0 && !cfg.doseOptions.some(opt => opt.value === doseSlots[0]?.dose)) {
                    setDoseSlots(prev => prev.map(s => ({ ...s, dose: cfg.doseOptions[0].value })));
                  }
                }}
              >
                <option value="tablet">💊 {language === 'es' ? 'Tableta / Pastilla' : 'Tablet'}</option>
                <option value="capsule">💊 {language === 'es' ? 'Cápsula' : 'Capsule'}</option>
                <option value="drops">👁️ {language === 'es' ? 'Gotas Oftálmicas (Ojos) / Gotero (ej. Krytantek)' : 'Eye Drops'}</option>
                <option value="ear_drops">👂 {language === 'es' ? 'Gotas Óticas (Oídos)' : 'Ear Drops'}</option>
                <option value="nasal_spray">👃 {language === 'es' ? 'Spray / Gotas Nasales' : 'Nasal Spray'}</option>
                <option value="syrup">🥄 {language === 'es' ? 'Jarabe / Suspensión Líquida' : 'Syrup'}</option>
                <option value="cream">🧴 {language === 'es' ? 'Crema / Pomada / Gel / Ungüento' : 'Cream / Ointment'}</option>
                <option value="sachet">🍵 {language === 'es' ? 'Sobre / Polvo soluble (ej. Electrolitos, Mucolítico)' : 'Sachet / Powder'}</option>
                <option value="inhalation">🫁 {language === 'es' ? 'Inhalador / Aerosol (Disparos)' : 'Inhaler / Puffs'}</option>
                <option value="injection">💉 {language === 'es' ? 'Inyectable / Ampolleta' : 'Injection'}</option>
                <option value="patch">🩹 {language === 'es' ? 'Parche Transdérmico' : 'Patch'}</option>
              </select>
            </div>
          </div>

          {/* Active Ingredient (Compuesto) & Dosage Strength (Gramaje / Concentración) */}
          <div className="grid-2" style={{ marginTop: '0.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🧪</span>
                <span>{language === 'es' ? 'Compuesto Activo / Sustancia (Genérico):' : 'Active Compound / Generic:'}</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'ej. Dapagliflozina, Metformina, Paracetamol' : 'e.g. Dapagliflozin, Metformin'}
                value={activeIngredient}
                onChange={e => setActiveIngredient(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'block' }}>
                {language === 'es' ? 'Fórmula química o nombre genérico del fármaco' : 'Generic compound formula'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>⚖️</span>
                <span>{language === 'es' ? 'Gramaje / Concentración / Volumen:' : 'Dosage Strength / Volume:'}</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'es' ? 'ej. 10 mg, 500 mg / 50 mg, 2.5 mg, 100 ml, 5 ml' : 'e.g. 10 mg, 500 mg, 100 ml'}
                value={dosageStrength}
                onChange={e => setDosageStrength(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'block' }}>
                {language === 'es' ? 'Concentración indicada en la caja o receta' : 'Strength indicated on the medicine box'}
              </span>
            </div>
          </div>

          {/* Stock Tracking Mode Switcher */}
          <div
            className="card"
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: stockTrackingMode === 'manual_bottle' ? '#f0f9ff' : '#ffffff',
              border: `1.5px solid ${stockTrackingMode === 'manual_bottle' ? '#0284c7' : 'var(--border-color)'}`,
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', color: stockTrackingMode === 'manual_bottle' ? '#0369a1' : 'var(--text-primary)' }}>
                  📦 {language === 'es' ? 'Modo de Control de Inventario / Stock:' : 'Stock Control Mode:'}
                </strong>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {stockTrackingMode === 'manual_bottle'
                    ? (language === 'es' ? '🧴 Control Manual de Frasco / Gotero (ideal para gotas, jarabes o pomadas sin restar pastillas).' : 'Manual bottle control.')
                    : (language === 'es' ? '🔢 Control por Pastillas / Piezas (resta cada dosis tomada con alerta de poco stock).' : 'Unit subtraction mode.')}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${stockTrackingMode === 'pieces' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStockTrackingMode('pieces')}
                  style={{ fontSize: '0.75rem', fontWeight: 700 }}
                >
                  🔢 {language === 'es' ? 'Por Pastillas / Piezas' : 'By Pieces'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${stockTrackingMode === 'manual_bottle' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStockTrackingMode('manual_bottle')}
                  style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: stockTrackingMode === 'manual_bottle' ? '#0284c7' : undefined, borderColor: '#0284c7' }}
                >
                  🧴 {language === 'es' ? 'Frasco / Gotero Manual' : 'Manual Bottle'}
                </button>
              </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <AlertCircle size={16} color="var(--primary)" /> {t('inventorySettings')}
              </h3>

              {/* Treatment Type Switcher (Crónico vs Temporal) */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${treatmentType === 'chronic' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setTreatmentType('chronic');
                    if (minimumStockAlert <= 0) setMinimumStockAlert(5);
                  }}
                  style={{ fontSize: '0.75rem', fontWeight: 700 }}
                >
                  🔄 {language === 'es' ? 'Crónico (Continuo)' : 'Chronic'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${treatmentType === 'temporary' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setTreatmentType('temporary');
                    setMinimumStockAlert(0);
                  }}
                  style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: treatmentType === 'temporary' ? '#d97706' : undefined, borderColor: treatmentType === 'temporary' ? '#d97706' : undefined }}
                >
                  ⏱️ {language === 'es' ? 'Temporal (Por Días)' : 'Temporary (Acute)'}
                </button>
              </div>
            </div>

            {/* Explanatory banner based on treatmentType */}
            {treatmentType === 'temporary' && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                ⏱️ {language === 'es' ? 'Tratamiento Temporal (ej. Antibiótico o analgésico por días): No requiere stock mínimo de recompra ya que concluye al terminar la caja o tomas programadas.' : 'Temporary treatment: No repurchase threshold needed.'}
              </div>
            )}

            {/* Inventory count based on mode */}
            {stockTrackingMode === 'manual_bottle' ? (
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {presConfig.icon} {presConfig.bottleCountLabel}
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={bottlesCount}
                  onChange={e => setBottlesCount(Number(e.target.value))}
                />
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {presConfig.bottleHint}
                </p>
              </div>
            ) : (
              <div className="grid-3" style={{ marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    {presConfig.icon} {presConfig.stockCountLabel}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={currentStock}
                    onChange={e => setCurrentStock(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    📦 {presConfig.unitsPerBoxLabel}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={packageUnits}
                    onChange={e => setPackageUnits(Number(e.target.value))}
                    placeholder="30"
                  />
                </div>

                {treatmentType === 'chronic' ? (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">
                      ⚠️ {presConfig.lowStockLabel} ({presConfig.unitNounPlural})
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={minimumStockAlert}
                      onChange={e => setMinimumStockAlert(Number(e.target.value))}
                      placeholder="5"
                    />
                  </div>
                ) : (
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
                      ⏱️ Sin Alerta de Recompra
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {language === 'es' ? 'Ciclo único.' : 'Single cycle.'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Medical Sample / Muestrario Toggle */}
            <div
              style={{
                backgroundColor: isMedicalSample ? '#fef3c7' : '#ffffff',
                border: `1.5px solid ${isMedicalSample ? '#f59e0b' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                cursor: 'pointer'
              }}
              onClick={() => setIsMedicalSample(!isMedicalSample)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: isMedicalSample ? '#92400e' : 'var(--text-primary)' }}>
                    🧪 {language === 'es' ? 'Adquirido como Muestra Médica / Piezas Sueltas' : 'Medical Sample / Loose Blister'}
                  </strong>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {language === 'es'
                      ? 'Para medicamentos comprados por muestra, blister o frascos de 3ml en farmacias como Farmacia Regina.'
                      : 'For cost-saving medical samples or loose capsules.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isMedicalSample}
                  onChange={() => {}}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>

              {isMedicalSample && (
                <div style={{ marginTop: '0.5rem' }} onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.78rem', backgroundColor: '#fff' }}
                    placeholder={language === 'es' ? 'Detalle (ej. 2 muestras de 3ml, cápsula suelta a $20 c/u)' : 'Sample detail'}
                    value={sampleNotes}
                    onChange={e => setSampleNotes(e.target.value)}
                  />
                </div>
              )}
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

            {/* IMSS & Free Donation / Gift Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  backgroundColor: isImssCovered ? '#ecfdf5' : '#ffffff',
                  border: isImssCovered ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.625rem 0.75rem',
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
                  <strong style={{ fontSize: '0.78rem', color: isImssCovered ? '#065f46' : 'var(--text-primary)' }}>
                    🏥 {language === 'es' ? 'Surtido Gratis IMSS / ISSSTE' : 'IMSS Public Healthcare'}
                  </strong>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    $0 MXN
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isImssCovered}
                  onChange={() => {}}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>

              <div
                style={{
                  backgroundColor: !isImssCovered && unitCost === 0 ? '#fdf4ff' : '#ffffff',
                  border: !isImssCovered && unitCost === 0 ? '1.5px solid #c084fc' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.625rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (unitCost === 0 && !isImssCovered) {
                    setUnitCost('');
                  } else {
                    setIsImssCovered(false);
                    setUnitCost(0);
                    if (!preferredStore) setPreferredStore('Regalo / Donación Solidaria');
                  }
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.78rem', color: !isImssCovered && unitCost === 0 ? '#7e22ce' : 'var(--text-primary)' }}>
                    🤝 {language === 'es' ? 'Regalo / Donación Solidaria' : 'Gift / Solidarity Donation'}
                  </strong>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {language === 'es' ? 'Amigo, vecino o dispensario ($0)' : 'Friend, neighbor or charity ($0)'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!isImssCovered && unitCost === 0}
                  onChange={() => {}}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>
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
                    placeholder="e.g. Farmacia Regina (Muestras Médicas), Mercado Libre, Farmacias Guadalajara"
                    value={preferredStore}
                    onChange={e => setPreferredStore(e.target.value)}
                  />

                  {/* Quick Store Pill Presets */}
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {customPharmacies.map(store => (
                      <button
                        key={store}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPreferredStore(store)}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: preferredStore === store ? '#dbeafe' : undefined,
                          borderColor: preferredStore === store ? '#3b82f6' : undefined,
                          fontWeight: preferredStore === store ? 700 : 500
                        }}
                      >
                        {store}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const name = window.prompt(language === 'es' ? 'Nombre de la nueva farmacia o tienda:' : 'Enter new pharmacy name:');
                        if (name && name.trim()) {
                          addCustomPharmacy(name.trim());
                          setPreferredStore(name.trim());
                        }
                      }}
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', color: '#0284c7', borderColor: '#bae6fd', backgroundColor: '#f0f9ff', fontWeight: 700 }}
                    >
                      + {language === 'es' ? 'Nueva Farmacia' : 'New Pharmacy'}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0, marginBottom: '0.625rem' }}>
                  <label className="form-label">
                    💡 {language === 'es' ? 'Tips de Compra y Ahorro para la Familia' : 'Purchase Tips & Savings for Family'}
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. En Farmacia Regina venden la cápsula a $20 o las muestras de 3ml a mitad de precio que la caja comercial."
                    value={purchaseNotes}
                    onChange={e => setPurchaseNotes(e.target.value)}
                  />
                </div>

                {/* Loyalty Program / Recompensas de Farmacia (ej: 3+1 Farmacias Value) */}
                <div
                  style={{
                    backgroundColor: loyaltyEnabled ? '#eff6ff' : '#ffffff',
                    border: loyaltyEnabled ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem'
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={() => setLoyaltyEnabled(!loyaltyEnabled)}
                  >
                    <div>
                      <strong style={{ fontSize: '0.8125rem', color: loyaltyEnabled ? '#1e40af' : 'var(--text-primary)' }}>
                        🎁 {language === 'es' ? 'Promoción de Farmacia / Programa de Lealtad (ej: 3+1 Gratis)' : 'Pharmacy Loyalty Promo (e.g. 3+1 Free)'}
                      </strong>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {language === 'es'
                          ? 'Acumula sellos por compras en Farmacia Value, Ahorro, etc. para ganar frascos gratis.'
                          : 'Track loyalty stamps to get free reward boxes.'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={loyaltyEnabled}
                      onChange={() => {}}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  {loyaltyEnabled && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="grid-2">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>
                            {language === 'es' ? 'Farmacia de la Promoción' : 'Pharmacy'}
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={loyaltyStore}
                            onChange={e => setLoyaltyStore(e.target.value)}
                            placeholder="e.g. Farmacias Value"
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>
                            {language === 'es' ? 'Compras Requeridas' : 'Required Purchases'}
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            max="10"
                            value={loyaltyRequired}
                            onChange={e => setLoyaltyRequired(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>
                            {language === 'es' ? 'Sellos Acumulados' : 'Stamps Count'}
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            min="0"
                            max={loyaltyRequired}
                            value={loyaltyPurchased}
                            onChange={e => setLoyaltyPurchased(Number(e.target.value))}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>
                            {language === 'es' ? 'Premio / Bonificación' : 'Reward'}
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={loyaltyReward}
                            onChange={e => setLoyaltyReward(e.target.value)}
                            placeholder="e.g. 1 Frasco Gratis"
                          />
                        </div>
                      </div>
                    </div>
                  )}
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

            {/* Quick Frequency Presets for Surgery / Long-Interval Dosing */}
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: 600 }}>
                ⚡ {language === 'es' ? 'Preajustes rápidos:' : 'Quick Presets:'}
              </span>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFrequencyType('temporary_hourly');
                  setIntervalHours(1);
                  setDurationDays(3);
                  setDoseSlots([
                    { time: '08:00', dose: 1, instruction: 'Toma cada 1 hora post-cirugía' },
                    { time: '09:00', dose: 1, instruction: 'Toma cada 1 hora post-cirugía' },
                    { time: '10:00', dose: 1, instruction: 'Toma cada 1 hora post-cirugía' },
                    { time: '11:00', dose: 1, instruction: 'Toma cada 1 hora post-cirugía' },
                    { time: '12:00', dose: 1, instruction: 'Toma cada 1 hora post-cirugía' }
                  ]);
                }}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
              >
                🕒 {language === 'es' ? 'Cada 1 hora (Post-cirugía / 3 días)' : 'Every 1 hr (Post-surgery)'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFrequencyType('every_n_days');
                  setIntervalDays(10);
                  setDoseSlots([{ time: '08:00', dose: 1, instruction: 'Toma cada 10 días' }]);
                }}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
              >
                📆 {language === 'es' ? 'Cada 10 días' : 'Every 10 days'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFrequencyType('every_n_days');
                  setIntervalDays(15);
                  setDoseSlots([{ time: '08:00', dose: 1, instruction: 'Toma quincenal (cada 15 días)' }]);
                }}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', backgroundColor: '#ede9fe', color: '#6d28d9', borderColor: '#ddd6fe' }}
              >
                🗓️ {language === 'es' ? 'Cada 15 días (Quincenal)' : 'Every 15 days'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFrequencyType('alternate_days');
                  setDoseSlots([{ time: '13:00', dose: 1, instruction: 'Un día sí, un día no' }]);
                }}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)' }}
              >
                🔄 {language === 'es' ? 'Días alternos' : 'Alternate days'}
              </button>
            </div>
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

            {isTemporaryTreatment && (
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

          {/* First Dose Timing Selector for Partial First Day */}
          {isTemporaryTreatment && (
            <div
              className="card"
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: '#fffbeb',
                border: '1.5px solid #fde68a',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#92400e', margin: 0, fontSize: '0.8125rem' }}>
                  🕒 {language === 'es' ? '¿En cuál de tus horarios inicia la 1ra toma hoy (Día 1)?' : 'First dose timing on Day 1:'}
                </label>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.72rem', color: '#78350f' }}>
                {language === 'es'
                  ? 'Selecciona la toma con la que vas a empezar hoy para no marcar como atrasadas las horas anteriores.'
                  : 'Select first meal/time so prior morning doses are not marked overdue.'}
              </p>

              {/* Dynamic Buttons for configured dose slots */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {doseSlots.map((slot, sIdx) => {
                  const [h] = slot.time.split(':').map(Number);
                  const icon = h < 12 ? '🌅' : h < 18 ? '☀️' : '🌙';
                  const label = slot.instruction ? `${slot.time} • ${slot.instruction}` : slot.time;
                  const isSelected = startFirstDoseTime === slot.time;
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        setStartFirstDoseTime(slot.time);
                        setFirstDoseTiming(h < 12 ? 'breakfast' : h < 18 ? 'lunch' : 'dinner');
                      }}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isSelected ? undefined : '#fef9c3',
                        borderColor: isSelected ? undefined : '#fde047',
                        color: isSelected ? undefined : '#854d0e'
                      }}
                    >
                      {icon} {label} {sIdx === 0 ? (language === 'es' ? ' (1ra del Día)' : ' (1st)') : ''}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
                  {language === 'es' ? 'O especifica una hora exacta de 1ra toma:' : 'Or exact 1st dose time:'}
                </label>
                <input
                  type="time"
                  className="form-input"
                  style={{ width: '110px', padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}
                  value={startFirstDoseTime}
                  onChange={e => {
                    setStartFirstDoseTime(e.target.value);
                    setFirstDoseTiming('custom');
                  }}
                />
              </div>

              {/* Notice if the custom hour is not in dose slots */}
              {startFirstDoseTime && !doseSlots.some(s => s.time === startFirstDoseTime) && (
                <div style={{ margin: '0.35rem 0 0.5rem 0', padding: '0.45rem 0.65rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#166534' }}>
                    💡 {language === 'es' ? `¿Deseas que ${startFirstDoseTime} sea un horario fijo de toma diario?` : `Make ${startFirstDoseTime} a daily scheduled dose?`}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDoseSlots(prev => [...prev, { time: startFirstDoseTime, dose: 1, instruction: 'Toma programada' }].sort((a, b) => a.time.localeCompare(b.time)));
                    }}
                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#15803d', fontWeight: 700 }}
                  >
                    ➕ {language === 'es' ? `Agregar ${startFirstDoseTime} a los Horarios de Toma` : `Add ${startFirstDoseTime} to slots`}
                  </button>
                </div>
              )}

              {/* Live Intelligent Schedule Summary */}
              <div style={{ padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>
                ✨ {tempSchedule.summaryText}
              </div>
            </div>
          )}

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
                    style={{ width: '140px' }}
                    value={slot.dose}
                    onChange={e => handleUpdateDoseSlot(idx, 'dose', Number(e.target.value))}
                  >
                    {presConfig.doseOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder={language === 'es' ? 'ej: 1 gota en ojo derecho, con el desayuno' : t('instructionsPlaceholder')}
                      value={slot.instruction || ''}
                      onChange={e => handleUpdateDoseSlot(idx, 'instruction', e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {[
                        { label: '👁️ Ojo derecho', text: '1 gota en ojo derecho' },
                        { label: '👁️ Ojo izquierdo', text: '1 gota en ojo izquierdo' },
                        { label: '👁️ Ambos ojos', text: '1 gota en ambos ojos' },
                        { label: '👃 Fosa nasal', text: '1 disparo en cada fosa nasal' },
                        { label: '🍽️ Con alimentos', text: 'Con alimentos' },
                        { label: '🌙 Al dormir', text: 'Antes de dormir' }
                      ].map(chip => (
                        <button
                          key={chip.label}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUpdateDoseSlot(idx, 'instruction', chip.text)}
                          style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)' }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

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
