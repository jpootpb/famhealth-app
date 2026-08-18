import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Medication } from '../../types';
import {
  Pill,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  Clock,
  Building2,
  Image as ImageIcon,
  X,
  Gift,
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getStockStatus, formatDose, getExpirationStatus } from '../../utils/formatters';
import { getFrequencyLabel } from '../../utils/frequencyEngine';
import { MedicationModal } from './MedicationModal';
import { AIPrescriptionScannerModal } from './AIPrescriptionScannerModal';
import { ExtractedPrescriptionMed } from '../../utils/aiPrescriptionEngine';
import {
  recordLoyaltyPurchase,
  claimLoyaltyReward,
  transferMedicationStock
} from '../../utils/medicationSolidarityEngine';

export const MedicationList: React.FC = () => {
  const { activePatient, patients, medications, updateMedication, deleteMedication, addMedication } = useApp();
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [medicationToEdit, setMedicationToEdit] = useState<Medication | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
      </div>
    );
  }

  const patientMeds = medications.filter(m => m.patientId === activePatient.id);

  const lowStockCount = patientMeds.filter(
    m => m.currentStock > 0 && m.currentStock <= m.minimumStockAlert
  ).length;

  const depletedCount = patientMeds.filter(m => m.currentStock <= 0).length;
  const safeCount = patientMeds.filter(m => m.currentStock > m.minimumStockAlert).length;

  const handleOpenAdd = () => {
    setMedicationToEdit(null);
    setIsModalOpen(true);
  };

  const handleAiExtractedMed = (med: ExtractedPrescriptionMed) => {
    // Open medication modal with prefilled data
    setMedicationToEdit({
      id: '',
      patientId: activePatient.id,
      name: med.name,
      presentation: med.presentation || 'tablet',
      indication: med.instructions,
      laboratory: med.laboratory,
      currentStock: 30,
      minimumStockAlert: 5,
      frequency: {
        type: med.durationDays ? 'temporary_hourly' : 'daily_fixed',
        doseSlots: med.scheduledTimes ? med.scheduledTimes.map(time => ({ time, dose: med.dose || 1, instruction: med.instructions })) : [{ time: '08:00', dose: 1 }],
        startDate: new Date().toISOString().split('T')[0]
      }
    });
    setIsModalOpen(true);
  };

  const [transferModalMed, setTransferModalMed] = useState<Medication | null>(null);
  const [targetPatientId, setTargetPatientId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferNote, setTransferNote] = useState<string>('');
  const [transferSavings, setTransferSavings] = useState<number>(0);
  const [transferToast, setTransferToast] = useState<string | null>(null);

  const handleAddLoyaltyStamp = (med: Medication) => {
    const updated = recordLoyaltyPurchase(med);
    updateMedication(updated);
  };

  const handleClaimFreeReward = (med: Medication) => {
    const { updatedMed } = claimLoyaltyReward(med);
    updateMedication(updatedMed);
    setTransferToast(
      language === 'es'
        ? `🎉 ¡Frasco/Caja Gratis reclamada! Se agregó +1 a ${med.name} sin costo.`
        : `🎉 Free reward claimed! Added +1 to ${med.name} at $0 cost.`
    );
    setTimeout(() => setTransferToast(null), 5000);
  };

  const handleOpenTransferModal = (med: Medication) => {
    const otherPatients = patients.filter(p => p.id !== activePatient.id);
    setTransferModalMed(med);
    setTargetPatientId(otherPatients[0]?.id || '');
    setTransferQty(med.currentStock);
    setTransferSavings(med.unitCost || 450);
    setTransferNote(
      language === 'es'
        ? `Medicamento que ${activePatient.name} ya no utiliza y se traspasa solidariamente.`
        : `Unused medication transferred as family donation.`
    );
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalMed || !targetPatientId || transferQty <= 0) return;

    const targetPatient = patients.find(p => p.id === targetPatientId);
    if (!targetPatient) return;

    const { updatedSourceMed, createdOrUpdatedTargetMed } = transferMedicationStock({
      sourceMedication: transferModalMed,
      sourcePatientName: activePatient.name,
      targetPatientId: targetPatient.id,
      targetPatientName: targetPatient.name,
      quantityToTransfer: Number(transferQty),
      commercialEstimatedValue: Number(transferSavings),
      note: transferNote
    });

    updateMedication(updatedSourceMed);
    addMedication(createdOrUpdatedTargetMed);

    setTransferToast(
      language === 'es'
        ? `🤝 ¡Traspaso solidario exitoso! Se transfirieron ${transferQty} ${transferModalMed.presentation}s a ${targetPatient.name}.`
        : `🤝 Successful donation! Transferred ${transferQty} items to ${targetPatient.name}.`
    );
    setTimeout(() => setTransferToast(null), 5000);
    setTransferModalMed(null);
  };

  const handleOpenEdit = (med: Medication) => {
    setMedicationToEdit(med);
    setIsModalOpen(true);
  };

  const handleQuickRestock = (med: Medication, amount: number = 30) => {
    updateMedication({
      ...med,
      currentStock: med.currentStock + amount
    });
  };

  const handleDelete = (med: Medication) => {
    if (window.confirm(`${t('deleteMedConfirm')} (${med.name})`)) {
      deleteMedication(med.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Solidarity / Promo Toast Banner */}
      {transferToast && (
        <div
          style={{
            backgroundColor: '#065f46',
            color: '#ffffff',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <span>{transferToast}</span>
          <button
            onClick={() => setTransferToast(null)}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header & Quick Summary */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {language === 'es' ? `${t('cabinetTitle')} ${activePatient.name}` : `${activePatient.name}${t('cabinetTitle')}`}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('cabinetSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsAiScannerOpen(true)}
            style={{ color: '#059669', borderColor: '#059669' }}
          >
            <Sparkles size={18} /> {language === 'es' ? 'Escanear Receta con IA' : 'Scan with AI'}
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> {t('addNewMedication')}
          </button>
        </div>
      </div>

      {/* Stock Traffic Light Summary Badges */}
      <div className="grid-3">
        <div
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderLeft: '4px solid var(--success)'
          }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--success-light)' }}>
            <CheckCircle2 size={24} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{safeCount}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t('adequateStock')}</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderLeft: '4px solid var(--warning)'
          }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--warning-light)' }}>
            <AlertTriangle size={24} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{lowStockCount}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t('lowStockAlert')}</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderLeft: '4px solid var(--danger)'
          }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--danger-light)' }}>
            <Pill size={24} color="var(--danger)" />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{depletedCount}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t('depletedStock')}</div>
          </div>
        </div>
      </div>

      {/* Medication Cards Grid */}
      {patientMeds.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <Pill size={48} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {t('noMedsRegistered')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            {t('noMedsRegisteredDesc')}
          </p>
          <button className="btn btn-primary" onClick={handleOpenAdd} style={{ margin: '0 auto' }}>
            <Plus size={18} /> {t('addFirstMed')}
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {patientMeds.map(med => {
            const stockStatus = getStockStatus(med.currentStock, med.minimumStockAlert);
            const expStatus = getExpirationStatus(med.expirationDate);
            const freqLabel = getFrequencyLabel(med.frequency);

            return (
              <div
                key={med.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  borderTop: `4px solid ${
                    stockStatus.status === 'ok'
                      ? 'var(--success)'
                      : stockStatus.status === 'low'
                      ? 'var(--warning)'
                      : 'var(--danger)'
                  }`
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {med.imageUrl ? (
                        <img
                          src={med.imageUrl}
                          alt={med.name}
                          onClick={() => setZoomImage({ url: med.imageUrl!, title: `${med.name} (${med.laboratory || t('boxPhoto')})` })}
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                          title={t('clickToZoomBox')}
                        />
                      ) : (
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                          }}
                        >
                          <Pill size={24} />
                        </div>
                      )}

                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {med.name}
                        </h3>
                        {med.laboratory && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                            <Building2 size={12} /> {med.laboratory}
                          </div>
                        )}
                        {med.indication && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {med.indication}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span className={`badge ${stockStatus.badgeClass}`}>
                        {stockStatus.label}: {med.currentStock} {med.presentation}s
                      </span>
                      {med.expirationDate && (
                        <span className={`badge ${expStatus.badgeClass}`} style={{ fontSize: '0.7rem' }}>
                          📅 {expStatus.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Frequency & Hours */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
                      <Clock size={14} /> {freqLabel}
                    </div>

                    {/* Dosing slots list */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
                      {med.frequency.doseSlots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="badge badge-purple"
                          style={{ fontSize: '0.7rem' }}
                        >
                          {slot.time} → {formatDose(slot.dose, med.presentation)}
                          {slot.instruction ? ` (${slot.instruction})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* IMSS or Recommended Store & Savings Badge */}
                  {med.isImssCovered ? (
                    <div
                      style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #10b981',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#065f46'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>🏥 <strong>Surtido Gratis por IMSS / Sector Salud</strong></span>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                        $0 MXN
                      </span>
                    </div>
                  ) : (
                    (med.preferredStore || med.purchaseNotes || med.unitCost) && (
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {med.preferredStore && (
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                              🏬 {med.preferredStore}
                            </span>
                          )}
                          {med.unitCost !== undefined && (
                            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                              ${med.unitCost} MXN / caja
                            </span>
                          )}
                        </div>
                        {med.purchaseNotes && (
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.72rem', color: '#047857' }}>
                            💡 {med.purchaseNotes}
                          </p>
                        )}
                      </div>
                    )
                  )}

                  {/* Pharmacy Loyalty Program Stamp Card (ej: Farmacia Value 3+1) */}
                  {med.loyaltyPromo && med.loyaltyPromo.enabled && (
                    <div
                      style={{
                        backgroundColor: med.loyaltyPromo.isRewardReady ? '#ecfdf5' : '#eff6ff',
                        border: med.loyaltyPromo.isRewardReady ? '1.5px solid #10b981' : '1px solid #bfdbfe',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.625rem 0.75rem',
                        marginTop: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Award size={16} color={med.loyaltyPromo.isRewardReady ? '#059669' : '#2563eb'} />
                          <strong style={{ fontSize: '0.78rem', color: med.loyaltyPromo.isRewardReady ? '#065f46' : '#1e40af' }}>
                            🎁 {med.loyaltyPromo.storeName}: {med.loyaltyPromo.rewardDescription}
                          </strong>
                        </div>

                        {med.loyaltyPromo.isRewardReady ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: '#059669', borderColor: '#059669', fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => handleClaimFreeReward(med)}
                          >
                            🎉 {language === 'es' ? '¡Reclamar Caja Gratis!' : 'Claim Free Box!'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                            onClick={() => handleAddLoyaltyStamp(med)}
                          >
                            +1 {language === 'es' ? 'Sellar Compra' : 'Add Stamp'}
                          </button>
                        )}
                      </div>

                      {/* Visual Stamp Progress Bubbles */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                        {Array.from({ length: med.loyaltyPromo.requiredPurchases }).map((_, idx) => {
                          const isFilled = idx < (med.loyaltyPromo?.currentPurchased || 0);
                          return (
                            <div
                              key={idx}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: isFilled ? '#2563eb' : '#e2e8f0',
                                color: isFilled ? '#ffffff' : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.68rem',
                                fontWeight: 800
                              }}
                            >
                              {isFilled ? '✓' : idx + 1}
                            </div>
                          );
                        })}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                          ({med.loyaltyPromo.currentPurchased} {language === 'es' ? 'de' : 'of'} {med.loyaltyPromo.requiredPurchases} {language === 'es' ? 'sellos acumulados' : 'stamps'})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Inter-Family Solidarity Donation Badge */}
                  {med.donationSource && (
                    <div
                      style={{
                        backgroundColor: '#fdf4ff',
                        border: '1px solid #f0abfc',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.5rem 0.75rem',
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#86198f'
                      }}
                    >
                      🤝 <strong>{language === 'es' ? 'Donación Solidaria Familiar:' : 'Family Donation:'}</strong> {language === 'es' ? 'Recibido de' : 'Received from'} <strong>{med.donationSource.fromPatientName}</strong> ({med.donationSource.date})
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickRestock(med, 30)}
                      title={t('quickAdd30')}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <PackagePlus size={14} /> {t('quickAdd30')}
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickRestock(med, 15)}
                      title={t('quickAdd15')}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <PackagePlus size={14} /> {t('quickAdd15')}
                    </button>

                    {med.currentStock > 0 && patients.length > 1 && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenTransferModal(med)}
                        title={language === 'es' ? 'Traspasar o donar stock a otro familiar' : 'Donate to family member'}
                        style={{ fontSize: '0.75rem', color: '#7c3aed' }}
                      >
                        <Gift size={14} /> {language === 'es' ? 'Donar a Familiar' : 'Donate'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(med)}
                      aria-label="Edit medication"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(med)}
                      aria-label="Delete medication"
                    >
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Medication Edit/Create Modal */}
      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        medicationToEdit={medicationToEdit}
      />

      {/* Box Photo Zoom Modal */}
      {zoomImage && (
        <div className="modal-backdrop" onClick={() => setZoomImage(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '500px', textAlign: 'center', padding: '1rem' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '1rem' }}>{zoomImage.title}</strong>
              <button className="btn btn-secondary btn-sm" onClick={() => setZoomImage(null)}>
                <X size={16} />
              </button>
            </div>
            <img
              src={zoomImage.url}
              alt={zoomImage.title}
              style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* AI Prescription Scanner Modal */}
      <AIPrescriptionScannerModal
        isOpen={isAiScannerOpen}
        onClose={() => setIsAiScannerOpen(false)}
        onSelectMedication={handleAiExtractedMed}
      />

      {/* Inter-Family Solidarity Transfer Modal */}
      {transferModalMed && (
        <div className="modal-backdrop" onClick={() => setTransferModalMed(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gift size={22} color="#7c3aed" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {language === 'es' ? 'Donación / Traspaso Solidario a Familiar' : 'Family Medication Donation'}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setTransferModalMed(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {language === 'es'
                ? `Traspasa medicamento que ${activePatient.name} ya no utiliza (ej. sobrante del IMSS o tratamiento finalizado) a otro familiar que lo necesite a costo $0 MXN.`
                : `Transfer unused medication from ${activePatient.name} to another family member at $0 cost.`}
            </p>

            <form onSubmit={handleConfirmTransfer}>
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem'
                }}
              >
                <div><strong>💊 Medicamento:</strong> {transferModalMed.name}</div>
                <div><strong>📦 Stock Disponible en Botiquín:</strong> {transferModalMed.currentStock} {transferModalMed.presentation}s</div>
                {transferModalMed.isImssCovered && (
                  <div style={{ color: '#065f46', marginTop: '0.25rem' }}>
                    🏥 <em>Suministro original del IMSS ($0 MXN)</em>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  👤 {language === 'es' ? 'Familiar Receptor (A quién se lo donas)' : 'Receiving Family Member'}
                </label>
                <select
                  className="form-select"
                  value={targetPatientId}
                  onChange={e => setTargetPatientId(e.target.value)}
                  required
                >
                  {patients
                    .filter(p => p.id !== activePatient.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.primaryDiagnosis || 'Familiar'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    📦 {language === 'es' ? 'Cantidad a Traspasar' : 'Quantity to Transfer'}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max={transferModalMed.currentStock}
                    value={transferQty}
                    onChange={e => setTransferQty(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    💰 {language === 'es' ? 'Ahorro Estimado ($ MXN)' : 'Estimated Savings ($ MXN)'}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={transferSavings}
                    onChange={e => setTransferSavings(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  📝 {language === 'es' ? 'Nota o Motivo del Traspaso' : 'Transfer Note'}
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  placeholder="e.g. Doña María ya no toma pregabalina del seguro y se la regalamos a la suegra para su neuropatía."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setTransferModalMed(null)}>
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                >
                  🤝 {language === 'es' ? 'Confirmar Traspaso Solidario' : 'Confirm Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
