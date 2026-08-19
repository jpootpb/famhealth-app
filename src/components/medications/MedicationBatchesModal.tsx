import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Medication, MedicationBatch } from '../../types';
import {
  Layers,
  X,
  Plus,
  CheckCircle2,
  Package,
  Flag,
  RotateCcw,
  Camera,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Edit2,
  Check
} from 'lucide-react';
import { ensureBatches, getActiveBatch } from '../../utils/medicationBatchEngine';
import { compressImage } from '../../utils/imageCompressor';

interface MedicationBatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
  onOpenZoomImage?: (url: string, title: string) => void;
}

export const MedicationBatchesModal: React.FC<MedicationBatchesModalProps> = ({
  isOpen,
  onClose,
  medication,
  onOpenZoomImage
}) => {
  const {
    switchActiveMedicationBatch,
    finishActiveMedicationBox,
    adjustMedicationBatchStock,
    addMedicationBatch,
    customPharmacies,
    addCustomPharmacy
  } = useApp();
  const { t, language } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<'manage' | 'add_promo'>('manage');

  // Add Promo Batch Form State
  const [newLab, setNewLab] = useState('');
  const [newBoxesCount, setNewBoxesCount] = useState<number>(3);
  const [newUnitsPerBox, setNewUnitsPerBox] = useState<number>(28);
  const [newCost, setNewCost] = useState<number | ''>('');
  const [newExpDate, setNewExpDate] = useState('');
  const [newStore, setNewStore] = useState('Farmacia Regina (Muestras Médicas)');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newIsSample, setNewIsSample] = useState(false);
  const [newSampleNotes, setNewSampleNotes] = useState('');
  const [activateImmediately, setActivateImmediately] = useState(false);

  // Adjustment Modal State
  const [adjustingBatch, setAdjustingBatch] = useState<MedicationBatch | null>(null);
  const [adjustedUnits, setAdjustedUnits] = useState<number>(0);
  const [adjustedBoxes, setAdjustedBoxes] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<'count_correction' | 'lost' | 'damaged' | 'expired'>('count_correction');

  if (!isOpen || !medication) return null;

  const preparedMed = ensureBatches(medication);
  const batches = preparedMed.batches || [];
  const activeBatch = getActiveBatch(preparedMed);
  const reserveBatches = batches.filter(b => b.id !== activeBatch?.id && !b.finishedAt && b.remainingUnits > 0);
  const finishedBatches = batches.filter(b => b.finishedAt || b.remainingUnits <= 0);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 0.75);
        setNewImageUrl(compressed);
      } catch (err) {
        console.warn('Error compressing batch photo:', err);
      }
    }
  };

  const handleCreatePromoBatch = (e: React.FormEvent) => {
    e.preventDefault();
    addMedicationBatch(medication.id, {
      laboratory: newLab.trim() || undefined,
      boxesCount: Number(newBoxesCount),
      unitsPerBox: Number(newUnitsPerBox),
      cost: newCost !== '' ? Number(newCost) : undefined,
      expirationDate: newExpDate || undefined,
      imageUrl: newImageUrl || undefined,
      preferredStore: newStore.trim() || undefined,
      isMedicalSample: newIsSample,
      sampleNotes: newIsSample ? newSampleNotes.trim() : undefined,
      activateNow: activateImmediately
    });

    setActiveSubTab('manage');
    setNewLab('');
    setNewImageUrl('');
    setNewCost('');
  };

  const handleOpenAdjust = (batch: MedicationBatch) => {
    setAdjustingBatch(batch);
    setAdjustedUnits(batch.remainingUnits);
    setAdjustedBoxes(batch.remainingBoxes || 1);
    setAdjustReason('count_correction');
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingBatch) return;

    adjustMedicationBatchStock(
      medication.id,
      adjustingBatch.id,
      Number(adjustedUnits),
      adjustReason,
      Number(adjustedBoxes)
    );

    setAdjustingBatch(null);
  };

  const handleFinishCurrentBox = () => {
    const res = finishActiveMedicationBox(medication.id, 'manual_box_finish');
    if (res.transitioned && res.nextBatch) {
      alert(
        language === 'es'
          ? `🏁 Caja terminada. ¡Se activó automáticamente la siguiente caja de ${res.nextBatch.laboratory || 'reserva'} con su foto correspondiente!`
          : `🏁 Finished box. Activated next batch (${res.nextBatch.laboratory || 'reserve'}).`
      );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={22} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {language === 'es' ? 'Control de Cajas, Lotes y Laboratorios' : 'Batches & Box Inventory'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                💊 {medication.name} ({medication.currentStock} {medication.presentation}s totales)
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Subtabs: Manage vs Add Promo */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeSubTab === 'manage' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('manage')}
            style={{ fontWeight: 700, borderRadius: 'var(--radius-full)' }}
          >
            📦 {language === 'es' ? 'Lotes y Cajas en Botiquín' : 'Active & Reserve Batches'}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSubTab === 'add_promo' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('add_promo')}
            style={{ fontWeight: 700, borderRadius: 'var(--radius-full)', color: '#0284c7', borderColor: '#bae6fd', backgroundColor: activeSubTab === 'add_promo' ? undefined : '#f0f9ff' }}
          >
            + {language === 'es' ? 'Registrar Otra Marca / Promoción' : 'Add New Promo Batch'}
          </button>
        </div>

        {activeSubTab === 'manage' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 🟢 CURRENT ACTIVE BATCH IN USE */}
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #22c55e',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                    🟢 {language === 'es' ? 'EN USO ACTUAL (En la Agenda Diaria)' : 'CURRENTLY IN USE'}
                  </span>
                  {activeBatch?.isMedicalSample && (
                    <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                      🧪 Muestra Médica
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {activeBatch && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenAdjust(activeBatch)}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      title={language === 'es' ? 'Ajustar piezas físicas o registrar merma' : 'Adjust units'}
                    >
                      <Edit2 size={13} /> {language === 'es' ? 'Ajustar' : 'Adjust'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                {activeBatch?.imageUrl ? (
                  <img
                    src={activeBatch.imageUrl}
                    alt={activeBatch.laboratory || medication.name}
                    onClick={() => onOpenZoomImage?.(activeBatch.imageUrl!, `${medication.name} - ${activeBatch.laboratory || 'Lote en Uso'}`)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: '1.5px solid #22c55e'
                    }}
                    title={language === 'es' ? 'Click para ampliar foto de esta caja' : 'Zoom box photo'}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#166534'
                    }}
                  >
                    <Package size={28} />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                    {activeBatch?.laboratory || activeBatch?.name || (language === 'es' ? 'Lote Activo Principal' : 'Primary Batch')}
                  </h3>

                  <div style={{ fontSize: '0.8125rem', color: '#15803d', fontWeight: 600, marginTop: '0.15rem' }}>
                    📦 {activeBatch?.remainingBoxes || 1} {language === 'es' ? 'caja(s) disponible(s)' : 'boxes'} • <strong>{activeBatch?.remainingUnits} {medication.presentation}s restantes</strong>
                  </div>

                  {activeBatch?.preferredStore && (
                    <div style={{ fontSize: '0.75rem', color: '#14532d', marginTop: '0.15rem' }}>
                      🏪 {activeBatch.preferredStore} {activeBatch.unitCost ? `($${activeBatch.unitCost} MXN)` : ''}
                    </div>
                  )}

                  {activeBatch?.sampleNotes && (
                    <div style={{ fontSize: '0.72rem', color: '#854d0e', fontStyle: 'italic', marginTop: '0.15rem' }}>
                      💡 {activeBatch.sampleNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action: Finish active box */}
              <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                  {language === 'es'
                    ? '¿Se terminó físicamente la caja abierta en el pastillero?'
                    : 'Did the open box run out?'}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleFinishCurrentBox}
                  style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#ffffff', borderColor: '#ea580c', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Flag size={14} />
                  <span>{language === 'es' ? '🏁 Terminar Esta Caja (Consumida)' : 'Finish This Box'}</span>
                </button>
              </div>
            </div>

            {/* 📦 RESERVE BATCHES (Cajas cerradas en el botiquín) */}
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
                <Package size={16} color="var(--primary)" />
                {language === 'es' ? `Cajas en Reserva en Botiquín (${reserveBatches.length})` : `Reserve Batches (${reserveBatches.length})`}
              </h3>

              {reserveBatches.length === 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                    textAlign: 'center',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {language === 'es'
                    ? 'No hay otros lotes ni cajas de otras marcas en reserva. Si compraste una promoción de otro laboratorio, agrégala arriba.'
                    : 'No reserve batches. Click "Add New Promo Batch" if you bought a promotion.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {reserveBatches.map(batch => (
                    <div
                      key={batch.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {batch.imageUrl ? (
                          <img
                            src={batch.imageUrl}
                            alt={batch.laboratory || batch.name}
                            onClick={() => onOpenZoomImage?.(batch.imageUrl!, `${medication.name} - ${batch.laboratory || 'Reserva'}`)}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: 'var(--radius-md)',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: '1px solid var(--border-color)'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)'
                            }}
                          >
                            <Package size={22} />
                          </div>
                        )}

                        <div>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {batch.laboratory || batch.name}
                          </strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            📦 {batch.remainingBoxes || 1} {language === 'es' ? 'cajas' : 'boxes'} • <strong>{batch.remainingUnits} {medication.presentation}s</strong>
                            {batch.preferredStore && ` • ${batch.preferredStore}`}
                          </div>
                          {batch.expirationDate && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              📅 Cad: {batch.expirationDate}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenAdjust(batch)}
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                        >
                          <Edit2 size={12} /> {language === 'es' ? 'Ajustar' : 'Adjust'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => switchActiveMedicationBatch(medication.id, batch.id)}
                          style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#0284c7', borderColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Check size={14} />
                          <span>{language === 'es' ? '🟢 Activar para Hoy' : 'Activate Today'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🏁 CONSUMED / FINISHED BATCHES HISTORY */}
            {finishedBatches.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  🏁 {language === 'es' ? `Historial de Lotes y Cajas Agotadas (${finishedBatches.length})` : `Finished Batches (${finishedBatches.length})`}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {finishedBatches.map(b => (
                    <div
                      key={b.id}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#64748b'
                      }}
                    >
                      <span>{b.laboratory || b.name} ({b.totalUnits} {medication.presentation}s)</span>
                      <span>{language === 'es' ? `Agotado el ${b.finishedAt || 'recientemente'}` : `Finished ${b.finishedAt}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ADD NEW PROMO BATCH FORM */
          <form onSubmit={handleCreatePromoBatch} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: '0.8125rem',
                color: '#1e40af'
              }}
            >
              <strong>💡 {language === 'es' ? '¿Compraste una promoción de otro laboratorio / marca?' : 'Bought a promotion of a different brand?'}</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem' }}>
                {language === 'es'
                  ? 'Registra las cajas con su propia foto y laboratorio. No se duplicará la toma en la agenda; cuando se agote la caja actual, la app activará esta nueva en automático.'
                  : 'Add promo boxes with their own photo without duplicating daily schedule doses.'}
              </p>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                🏭 {language === 'es' ? 'Laboratorio o Marca de la Promoción:' : 'Laboratory / Brand:'}
              </label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Silanes (Genérico), Farmacias del Ahorro, Bayer"
                value={newLab}
                onChange={e => setNewLab(e.target.value)}
              />
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  📦 {language === 'es' ? 'Número de Cajas Compradas:' : 'Boxes count:'}
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={newBoxesCount}
                  onChange={e => setNewBoxesCount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  💊 {language === 'es' ? 'Pastillas por caja:' : 'Units per box:'}
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={newUnitsPerBox}
                  onChange={e => setNewUnitsPerBox(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>
              ✨ Total a ingresar: {newBoxesCount * newUnitsPerBox} {medication.presentation}s en reserva.
            </div>

            {/* Photo of new box */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                📷 {language === 'es' ? 'Foto de esta nueva caja (Para que el cuidador la reconozca):' : 'Box photo:'}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Camera size={15} />
                  <span>{language === 'es' ? 'Tomar / Subir Foto' : 'Upload Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleImageCapture} style={{ display: 'none' }} />
                </label>

                {newImageUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <img src={newImageUrl} alt="Preview" style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover' }} />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setNewImageUrl('')} style={{ color: 'var(--danger)', padding: '0.15rem 0.35rem' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Store & Cost */}
            <div className="grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  🏬 {language === 'es' ? 'Lugar de Compra:' : 'Store:'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newStore}
                  onChange={e => setNewStore(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  💰 {language === 'es' ? 'Costo Total de la Promo ($ MXN):' : 'Total Promo Cost:'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  placeholder="e.g. 510"
                  value={newCost}
                  onChange={e => setNewCost(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            {/* Store Presets */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {customPharmacies.map(st => (
                <button
                  key={st}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setNewStore(st)}
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: newStore === st ? '#dbeafe' : undefined,
                    borderColor: newStore === st ? '#3b82f6' : undefined
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Activate Now Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.625rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              <input
                type="checkbox"
                checked={activateImmediately}
                onChange={e => setActivateImmediately(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>
                {language === 'es'
                  ? '🟢 Abrir esta caja y activarla de inmediato en la agenda diaria hoy (Pone la anterior en reserva)'
                  : 'Activate this box today (puts current in reserve)'}
              </span>
            </label>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setActiveSubTab('manage')}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 800 }}
              >
                📦 {language === 'es' ? 'Guardar Lote de Promoción' : 'Save Promo Batch'}
              </button>
            </div>
          </form>
        )}

        {/* ADJUSTMENT SUB-MODAL */}
        {adjustingBatch && (
          <div className="modal-backdrop" onClick={() => setAdjustingBatch(null)} style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Edit2 size={16} color="var(--primary)" />
                  {language === 'es' ? 'Ajuste Manual de Inventario' : 'Manual Stock Adjustment'}
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdjustingBatch(null)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Ajustando: <strong>{adjustingBatch.laboratory || adjustingBatch.name}</strong>
                </div>

                <div className="grid-2">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">
                      📦 {language === 'es' ? 'Cajas reales:' : 'Real boxes:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={adjustedBoxes}
                      onChange={e => {
                        const b = Number(e.target.value);
                        setAdjustedBoxes(b);
                        setAdjustedUnits(b * (adjustingBatch.unitsPerBox || 1));
                      }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">
                      💊 {language === 'es' ? 'Pastillas totales:' : 'Total units:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={adjustedUnits}
                      onChange={e => setAdjustedUnits(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {language === 'es' ? 'Motivo del Ajuste:' : 'Adjustment Reason:'}
                  </label>
                  <select
                    className="form-select"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value as any)}
                  >
                    <option value="count_correction">🖐️ {language === 'es' ? 'Conteo físico de corrección' : 'Manual physical count'}</option>
                    <option value="lost">🔍 {language === 'es' ? 'Extravío o pérdida de cajas/piezas' : 'Lost / misplaced items'}</option>
                    <option value="damaged">💧 {language === 'es' ? 'Dañado / Mojado / Desechado' : 'Damaged / Discarded'}</option>
                    <option value="expired">📅 {language === 'es' ? 'Caducado' : 'Expired'}</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setAdjustingBatch(null)}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 800 }}>
                    ✓ {language === 'es' ? 'Guardar Ajuste' : 'Save Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
