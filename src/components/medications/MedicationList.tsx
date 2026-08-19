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
  X,
  Gift,
  Award,
  Sparkles,
  ArrowRight,
  Flag,
  RotateCcw,
  Check,
  Archive,
  Info,
  Layers,
  FlaskConical,
  ShoppingCart,
  UserPlus
} from 'lucide-react';
import { getStockStatus, formatDose, getExpirationStatus } from '../../utils/formatters';
import { getFrequencyLabel } from '../../utils/frequencyEngine';
import { MedicationModal } from './MedicationModal';
import { AIPrescriptionScannerModal } from './AIPrescriptionScannerModal';
import { ExtractedPrescriptionMed } from '../../utils/aiPrescriptionEngine';
import { MedicationBatchesModal } from './MedicationBatchesModal';
import { PatientSelector } from '../layout/PatientSelector';
import { getActiveBatch } from '../../utils/medicationBatchEngine';
import {
  recordLoyaltyPurchase,
  claimLoyaltyReward,
  transferMedicationStock
} from '../../utils/medicationSolidarityEngine';

export const MedicationList: React.FC = () => {
  const {
    activePatient,
    patients,
    medications,
    updateMedication,
    deleteMedication,
    addMedication,
    completeMedication,
    consumeBottle,
    restockMedication,
    reactivateMedication,
    customPharmacies,
    addCustomPharmacy
  } = useApp();
  const { t, language } = useLanguage();

  const [statusTab, setStatusTab] = useState<'active' | 'completed'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [medicationToEdit, setMedicationToEdit] = useState<Medication | null>(null);
  const [batchesModalMed, setBatchesModalMed] = useState<Medication | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  // Manual Completion Modal State
  const [completeModalMed, setCompleteModalMed] = useState<Medication | null>(null);
  const [completionReason, setCompletionReason] = useState<'bottle_finished' | 'doctor_stopped' | 'treatment_completed' | 'other'>('bottle_finished');
  const [completionNotes, setCompletionNotes] = useState('');

  // Multi-Box / Samples Restock Modal State
  const [restockModalMed, setRestockModalMed] = useState<Medication | null>(null);
  const [restockMode, setRestockMode] = useState<'boxes' | 'loose_pieces' | 'bottles'>('boxes');
  const [restockBoxCount, setRestockBoxCount] = useState<number>(3);
  const [restockUnitsPerBox, setRestockUnitsPerBox] = useState<number>(28);
  const [restockLooseCount, setRestockLooseCount] = useState<number>(15);
  const [restockBottlesCount, setRestockBottlesCount] = useState<number>(2);
  const [restockCost, setRestockCost] = useState<number | ''>('');
  const [restockStore, setRestockStore] = useState<string>('Farmacia Regina (Muestras Médicas)');
  const [restockIsSample, setRestockIsSample] = useState<boolean>(false);
  const [restockSampleNotes, setRestockSampleNotes] = useState<string>('');

  // Reactivate / Restock Modal State
  const [reactivateModalMed, setReactivateModalMed] = useState<Medication | null>(null);
  const [reactivateStock, setReactivateStock] = useState<number>(30);
  const [isPatientSelectorOpen, setIsPatientSelectorOpen] = useState(false);

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Pill size={28} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {language === 'es' ? 'No hay personas registradas en esta familia' : 'No persons registered in this family yet'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
          {language === 'es'
            ? 'Para comenzar a capturar medicamentos o subir recetas en este círculo familiar, primero da de alta a la persona a cuidar.'
            : 'To start adding medications or prescriptions, please register a family member first.'}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsPatientSelectorOpen(true)}
          style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UserPlus size={18} />
          <span>{language === 'es' ? '+ Dar de Alta Persona a Cuidar' : '+ Register Person to Care For'}</span>
        </button>

        <PatientSelector
          isOpen={isPatientSelectorOpen}
          onClose={() => setIsPatientSelectorOpen(false)}
        />
      </div>
    );
  }

  const patientMeds = medications.filter(m => m.patientId === activePatient.id);
  const activeMeds = patientMeds.filter(m => m.status !== 'completed' && m.status !== 'suspended');
  const completedMeds = patientMeds.filter(m => m.status === 'completed' || m.status === 'suspended');

  const lowStockCount = activeMeds.filter(
    m => m.treatmentType !== 'temporary' && m.minimumStockAlert > 0 && m.currentStock > 0 && m.currentStock <= m.minimumStockAlert
  ).length;

  const depletedCount = activeMeds.filter(m => m.currentStock <= 0).length;
  const safeCount = activeMeds.filter(m => m.currentStock > m.minimumStockAlert).length;

  const handleOpenAdd = () => {
    setMedicationToEdit(null);
    setIsModalOpen(true);
  };

  const handleAiExtractedMed = (med: ExtractedPrescriptionMed) => {
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
  const [donationType, setDonationType] = useState<'family_member' | 'known_contact' | 'dispensary_or_stranger'>('family_member');
  const [targetPatientId, setTargetPatientId] = useState<string>('');
  const [customRecipientName, setCustomRecipientName] = useState<string>('');
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
        ? `🎁 ¡Recompensa Canjeada! Has obtenido ${med.loyaltyPromo?.rewardDescription} gratis en ${med.loyaltyPromo?.storeName}.`
        : `🎁 Free Reward Claimed! Earned ${med.loyaltyPromo?.rewardDescription} at ${med.loyaltyPromo?.storeName}.`
    );
    setTimeout(() => setTransferToast(null), 5000);
  };

  const handleOpenTransferModal = (med: Medication) => {
    setTransferModalMed(med);
    setTransferQty(Math.min(med.currentStock, 10));
    setTransferSavings(med.unitCost ? Math.round(med.unitCost * Math.min(med.currentStock, 10)) : 0);
    setTransferNote('');
    setCustomRecipientName('');
    const otherPatients = patients.filter(p => p.id !== activePatient.id);
    setTargetPatientId(otherPatients.length > 0 ? otherPatients[0].id : '');
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalMed) return;

    const targetPatient = patients.find(p => p.id === targetPatientId);

    const { updatedSourceMed, createdOrUpdatedTargetMed, transferLog } = transferMedicationStock({
      sourceMedication: transferModalMed,
      sourcePatientName: activePatient.name,
      recipientType: donationType,
      targetPatientId: donationType === 'family_member' ? targetPatient?.id : undefined,
      targetPatientName: donationType === 'family_member' ? targetPatient?.name : undefined,
      recipientName: donationType !== 'family_member' ? customRecipientName : undefined,
      quantityToTransfer: Number(transferQty),
      commercialEstimatedValue: Number(transferSavings),
      note: transferNote
    });

    updateMedication(updatedSourceMed);
    if (createdOrUpdatedTargetMed) {
      addMedication(createdOrUpdatedTargetMed);
    }

    setTransferToast(
      language === 'es'
        ? `🤝 ¡Donación solidaria registrada! Se donaron ${transferQty} ${transferModalMed.presentation}s a ${transferLog.toRecipient}.`
        : `🤝 Successful donation! Transferred ${transferQty} items to ${transferLog.toRecipient}.`
    );
    setTimeout(() => setTransferToast(null), 5000);
    setTransferModalMed(null);
  };

  const handleOpenEdit = (med: Medication) => {
    setMedicationToEdit(med);
    setIsModalOpen(true);
  };

  const handleOpenRestockModal = (med: Medication) => {
    setRestockModalMed(med);
    const isManual = med.stockTrackingMode === 'manual_bottle';
    setRestockMode(isManual ? 'bottles' : 'boxes');
    setRestockBoxCount(3);
    setRestockUnitsPerBox(med.packageUnits || 28);
    setRestockLooseCount(15);
    setRestockBottlesCount(2);
    setRestockCost(med.unitCost !== undefined ? med.unitCost : '');
    setRestockStore(med.preferredStore || 'Farmacia Regina (Muestras Médicas)');
    setRestockIsSample(Boolean(med.isMedicalSample));
    setRestockSampleNotes(med.sampleNotes || (isManual ? 'Muestra médica 3ml' : 'Cápsulas sueltas a $20 c/u'));
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalMed) return;

    let addedQty = 0;
    let addedBottles = 0;

    if (restockMode === 'boxes') {
      addedQty = Number(restockBoxCount) * Number(restockUnitsPerBox);
    } else if (restockMode === 'loose_pieces') {
      addedQty = Number(restockLooseCount);
    } else if (restockMode === 'bottles') {
      addedBottles = Number(restockBottlesCount);
      addedQty = addedBottles;
    }

    restockMedication(restockModalMed.id, {
      quantityToAdd: addedQty,
      boxesCount: restockMode === 'boxes' ? Number(restockBoxCount) : undefined,
      unitsPerBox: Number(restockUnitsPerBox),
      bottlesToAdd: addedBottles,
      cost: restockCost !== '' ? Number(restockCost) : undefined,
      preferredStore: restockStore.trim() || undefined,
      isMedicalSample: restockIsSample,
      sampleNotes: restockIsSample ? restockSampleNotes.trim() : undefined
    });

    const summaryText = restockMode === 'boxes'
      ? `${restockBoxCount} cajas (+${addedQty} ${restockModalMed.presentation}s)`
      : restockMode === 'loose_pieces'
      ? `${addedQty} cápsulas/piezas sueltas`
      : `${addedBottles} frascos/muestras de reserva`;

    setTransferToast(
      language === 'es'
        ? `📦 ¡Resurtido registrado! Se agregaron ${summaryText} para "${restockModalMed.name}".`
        : `📦 Restocked ${summaryText} for "${restockModalMed.name}".`
    );
    setTimeout(() => setTransferToast(null), 5000);
    setRestockModalMed(null);
  };

  const handleDelete = (med: Medication) => {
    if (window.confirm(`${t('deleteMedConfirm')} (${med.name})`)) {
      deleteMedication(med.id);
    }
  };

  const handleInitiateCompletion = (med: Medication) => {
    if (med.stockTrackingMode === 'manual_bottle' && (med.bottlesCount || 1) > 1) {
      consumeBottle(med.id, 'bottle_finished');
      const remaining = (med.bottlesCount || 1) - 1;
      setTransferToast(
        language === 'es'
          ? `🧴 Se terminó el frasco actual. ¡Se activó 1 frasco de muestra médica de tu reserva! Te queda(n) ${remaining} frasco(s) en uso.`
          : `🧴 Current bottle finished. Activated next reserve bottle (${remaining} left).`
      );
      setTimeout(() => setTransferToast(null), 5000);
      return;
    }

    setCompleteModalMed(med);
  };

  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalMed) return;

    completeMedication(completeModalMed.id, completionReason, completionNotes);
    setTransferToast(
      language === 'es'
        ? `🏁 "${completeModalMed.name}" marcado como terminado. Se archivó en el historial médico y dejó de generar alertas en la agenda diaria.`
        : `🏁 "${completeModalMed.name}" marked as completed. Archived in medical history.`
    );
    setTimeout(() => setTransferToast(null), 5000);
    setCompleteModalMed(null);
    setCompletionNotes('');
  };

  const handleConfirmReactivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reactivateModalMed) return;

    reactivateMedication(reactivateModalMed.id, Number(reactivateStock));
    setTransferToast(
      language === 'es'
        ? `🔄 "${reactivateModalMed.name}" reactivado en el tratamiento activo con ${reactivateStock} ${reactivateModalMed.presentation}s.`
        : `🔄 "${reactivateModalMed.name}" reactivated with ${reactivateStock} units.`
    );
    setTimeout(() => setTransferToast(null), 5000);
    setReactivateModalMed(null);
  };

  const getReasonLabel = (reason?: string) => {
    switch (reason) {
      case 'bottle_finished':
        return language === 'es' ? '🧴 Se terminó el frasco / medicamento físico' : '🧴 Finished bottle';
      case 'doctor_stopped':
        return language === 'es' ? '👨‍⚕️ Indicación médica de suspenderlo' : '👨‍⚕️ Doctor discontinued';
      case 'treatment_completed':
        return language === 'es' ? '✅ Tratamiento concluido con éxito' : '✅ Treatment completed';
      default:
        return language === 'es' ? '🏁 Concluido manualmente' : '🏁 Manually completed';
    }
  };

  const currentDisplayList = statusTab === 'active' ? activeMeds : completedMeds;

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
            style={{ color: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={16} />
            <span>{language === 'es' ? '📸 Subir / Escanear Receta' : '📸 Upload / Scan Prescription'}</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> {t('addNewMedication')}
          </button>
        </div>
      </div>

      {/* Status Filter Tabs (Activos vs Terminados / Historial) */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setStatusTab('active')}
          className={`btn btn-sm ${statusTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Pill size={15} />
          <span>{language === 'es' ? `💊 En Tratamiento Activo (${activeMeds.length})` : `💊 Active Medications (${activeMeds.length})`}</span>
        </button>

        <button
          onClick={() => setStatusTab('completed')}
          className={`btn btn-sm ${statusTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Archive size={15} />
          <span>{language === 'es' ? `🏁 Terminados / Concluidos (${completedMeds.length})` : `🏁 Completed / Finished (${completedMeds.length})`}</span>
        </button>
      </div>

      {/* Stock Traffic Light Summary Badges (Only shown in Active tab) */}
      {statusTab === 'active' && (
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
      )}

      {/* Medication Cards Grid */}
      {currentDisplayList.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <Pill size={48} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {statusTab === 'active'
              ? (language === 'es' ? 'No hay medicamentos activos en este momento' : 'No active medications registered')
              : (language === 'es' ? 'No hay medicamentos en el historial de terminados' : 'No completed medications in history')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            {statusTab === 'active'
              ? (language === 'es' ? 'Agrega medicamentos para coordinar sus tomas y horarios.' : 'Add medications to manage daily schedules.')
              : (language === 'es' ? 'Cuando un frasco se termine o el doctor suspenda un tratamiento, puedes marcarlo como terminado para que se archive aquí sin perder su historial.' : 'When a medicine is finished or discontinued, mark it complete to archive it here.')}
          </p>
          {statusTab === 'active' && (
            <button className="btn btn-primary" onClick={handleOpenAdd} style={{ margin: '0 auto' }}>
              <Plus size={18} /> {t('addFirstMed')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid-2">
          {currentDisplayList.map(med => {
            const activeBatch = getActiveBatch(med);
            const cardImg = activeBatch?.imageUrl || med.imageUrl;
            const cardLab = activeBatch?.laboratory || med.laboratory;

            const stockStatus = getStockStatus(
              med.currentStock,
              med.minimumStockAlert,
              med.stockTrackingMode,
              language as any,
              med.bottlesCount
            );
            const expStatus = getExpirationStatus(activeBatch?.expirationDate || med.expirationDate);
            const freqLabel = getFrequencyLabel(med.frequency);
            const isCompleted = med.status === 'completed' || med.status === 'suspended';

            return (
              <div
                key={med.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  backgroundColor: isCompleted ? '#f8fafc' : '#ffffff',
                  borderTop: `4px solid ${
                    isCompleted
                      ? '#94a3b8'
                      : med.stockTrackingMode === 'manual_bottle'
                      ? '#0284c7'
                      : stockStatus.status === 'ok'
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
                      {cardImg ? (
                        <img
                          src={cardImg}
                          alt={med.name}
                          onClick={() => setZoomImage({ url: cardImg, title: `${med.name} (${cardLab || t('boxPhoto')})` })}
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: '1.5px solid #22c55e',
                            boxShadow: 'var(--shadow-sm)',
                            opacity: isCompleted ? 0.75 : 1
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
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textDecoration: isCompleted ? 'line-through' : 'none' }}>
                          {med.name}
                        </h3>
                        {cardLab && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                            <Building2 size={12} /> {cardLab}
                          </div>
                        )}
                        {med.indication && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {med.indication}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {med.treatmentType === 'temporary' || med.frequency.type === 'temporary_hourly' ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                              <Clock size={11} />
                              <span>⏱️ {language === 'es' ? 'Temporal (Por Días)' : 'Temporary'}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#0369a1', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                              <RotateCcw size={11} />
                              <span>🔄 {language === 'es' ? 'Crónico Continuo' : 'Chronic'}</span>
                            </div>
                          )}

                          {med.isMedicalSample && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#b45309', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                              <FlaskConical size={11} />
                              <span>🧪 {language === 'es' ? 'Muestra Médica' : 'Medical Sample'}</span>
                              {med.sampleNotes && <span>• {med.sampleNotes}</span>}
                            </div>
                          )}

                          {med.batches && med.batches.length > 1 && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: '#4338ca', backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                              <Layers size={11} />
                              <span>{language === 'es' ? `${med.batches.length} Lotes / Laboratorios` : `${med.batches.length} Batches`}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      {isCompleted ? (
                        <span className="badge badge-purple" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                          🏁 {language === 'es' ? 'Tratamiento Concluido' : 'Completed'}
                        </span>
                      ) : (
                        <>
                          <span className={`badge ${stockStatus.badgeClass}`}>
                            {stockStatus.label}
                          </span>
                          {med.expirationDate && (
                            <span className={`badge ${expStatus.badgeClass}`} style={{ fontSize: '0.7rem' }}>
                              📅 {expStatus.label}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Completion Info Banner (If completed) */}
                  {isCompleted && (
                    <div
                      style={{
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.625rem 0.875rem',
                        marginBottom: '0.75rem',
                        fontSize: '0.75rem',
                        color: '#334155'
                      }}
                    >
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{getReasonLabel(med.completionReason)}</span>
                        {med.completedAt && <span>• {med.completedAt}</span>}
                      </div>
                      {med.completionNotes && (
                        <div style={{ marginTop: '0.2rem', color: '#64748b', fontStyle: 'italic' }}>
                          "{med.completionNotes}"
                        </div>
                      )}
                    </div>
                  )}

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
                          {slot.time} → {formatDose(slot.dose, med.presentation, language as any)}
                          {slot.instruction ? ` (${slot.instruction})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* IMSS or Recommended Store & Savings Badge */}
                  {!isCompleted && (
                    med.isImssCovered ? (
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
                            backgroundColor: '#eff6ff',
                            border: '1px solid #93c5fd',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                            color: '#1e3a8a',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}
                        >
                          {med.preferredStore && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>🏪 {language === 'es' ? 'Farmacia recomendada:' : 'Preferred Store:'} <strong>{med.preferredStore}</strong></span>
                              {med.unitCost && <span>~${med.unitCost} MXN</span>}
                            </div>
                          )}
                          {med.purchaseNotes && (
                            <div style={{ color: '#1d4ed8', fontSize: '0.72rem' }}>
                              💡 {med.purchaseNotes}
                            </div>
                          )}
                        </div>
                      )
                    )
                  )}
                </div>

                {/* Card Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {isCompleted ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setReactivateModalMed(med);
                          setReactivateStock(30);
                        }}
                        style={{ fontSize: '0.75rem', backgroundColor: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <RotateCcw size={14} />
                        <span>{language === 'es' ? '🔄 Reactivar / Resurtir' : '🔄 Reactivate / Restock'}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setBatchesModalMed(med)}
                          style={{ fontSize: '0.75rem', color: '#6366f1', borderColor: '#c7d2fe', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title={language === 'es' ? 'Ver lotes en reserva, marcas de promoción o ajustar cajas físicas' : 'Manage batches & boxes'}
                        >
                          <Layers size={14} />
                          <span>{language === 'es' ? `📦 Lotes (${med.batches?.length || 1})` : 'Batches'}</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenRestockModal(med)}
                          style={{ fontSize: '0.75rem', color: '#0369a1', borderColor: '#bae6fd', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title={language === 'es' ? 'Agregar cajas, cápsulas sueltas o frascos de muestra médica' : 'Restock boxes or medical samples'}
                        >
                          <PackagePlus size={14} />
                          <span>{language === 'es' ? '📦 Resurtir / Cajas' : '📦 Restock'}</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleInitiateCompletion(med)}
                          style={{ fontSize: '0.75rem', color: '#ea580c', borderColor: '#fed7aa', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title={language === 'es' ? 'Marcar cuando se termine el frasco o concluya el tratamiento' : 'Mark completed / bottle finished'}
                        >
                          <Flag size={14} />
                          <span>
                            {med.stockTrackingMode === 'manual_bottle' && (med.bottlesCount || 1) > 1
                              ? (language === 'es' ? '🏁 Terminar Frasco (Usar Reserva)' : '🏁 Finish Bottle')
                              : (language === 'es' ? '🏁 Terminado / Agotado' : '🏁 Finished')}
                          </span>
                        </button>

                        {med.currentStock > 0 && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenTransferModal(med)}
                            style={{ fontSize: '0.75rem', color: '#7c3aed', borderColor: '#ddd6fe', backgroundColor: '#f5f3ff' }}
                            title={language === 'es' ? 'Traspasar o donar sobrante a familiar' : 'Donate or transfer leftover stock'}
                          >
                            <Gift size={14} /> {language === 'es' ? 'Traspasar' : 'Transfer'}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(med)}
                      aria-label={language === 'es' ? 'Editar medicamento' : 'Edit medication'}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(med)}
                      style={{ color: 'var(--danger)' }}
                      aria-label={language === 'es' ? 'Eliminar medicamento' : 'Delete medication'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Box & Medical Sample Restock Modal */}
      {restockModalMed && (
        <div className="modal-backdrop" onClick={() => setRestockModalMed(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '540px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PackagePlus size={22} color="#0284c7" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {language === 'es' ? 'Resurtir Inventario / Cajas o Muestras' : 'Restock Medication'}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setRestockModalMed(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  fontSize: '0.85rem',
                  color: '#0369a1'
                }}
              >
                <strong>💊 {restockModalMed.name}</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem' }}>
                  {language === 'es'
                    ? 'Agrega varias cajas compradas a la vez, cápsulas sueltas o frascos de muestra médica sin dar de alta medicamentos duplicados.'
                    : 'Add multiple boxes, loose capsules or sample bottles without duplicate records.'}
                </p>
              </div>

              {/* Restock Mode Selector */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {language === 'es' ? '¿Cómo adquiriste este medicamento?' : 'Purchase Type:'}
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${restockMode === 'boxes' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setRestockMode('boxes');
                      setRestockIsSample(false);
                    }}
                    style={{ fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    📦 {language === 'es' ? 'Varias Cajas (ej. 3 cajas)' : 'Multiple Boxes'}
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${restockMode === 'loose_pieces' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setRestockMode('loose_pieces');
                      setRestockIsSample(true);
                      setRestockSampleNotes('Cápsulas sueltas a $20 c/u en Farmacia Regina');
                    }}
                    style={{ fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    🧪 {language === 'es' ? 'Cápsulas Sueltas / Muestra' : 'Loose Capsules'}
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${restockMode === 'bottles' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setRestockMode('bottles');
                      setRestockIsSample(true);
                      setRestockSampleNotes('2 muestras médicas de 3ml');
                    }}
                    style={{ fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    🧴 {language === 'es' ? 'Frascos / Goteros (Muestras)' : 'Sample Bottles'}
                  </button>
                </div>
              </div>

              {/* Mode: Multiple Boxes */}
              {restockMode === 'boxes' && (
                <div className="grid-2" style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">
                      📦 {language === 'es' ? 'Número de Cajas:' : 'Boxes count:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={restockBoxCount}
                      onChange={e => setRestockBoxCount(Number(e.target.value))}
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
                      value={restockUnitsPerBox}
                      onChange={e => setRestockUnitsPerBox(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#0369a1', fontWeight: 700, marginTop: '0.35rem' }}>
                    ✨ {language === 'es'
                      ? `Total a sumar: ${restockBoxCount * restockUnitsPerBox} pastillas al inventario.`
                      : `Total to add: ${restockBoxCount * restockUnitsPerBox} units.`}
                  </div>
                </div>
              )}

              {/* Mode: Loose pieces / Medical sample */}
              {restockMode === 'loose_pieces' && (
                <div className="form-group" style={{ backgroundColor: '#fffbeb', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                  <label className="form-label" style={{ color: '#92400e', fontWeight: 700 }}>
                    🧪 {language === 'es' ? 'Cantidad de Cápsulas / Pastillas Sueltas:' : 'Loose Capsules Count:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={restockLooseCount}
                    onChange={e => setRestockLooseCount(Number(e.target.value))}
                    required
                  />
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.72rem', color: '#b45309' }}>
                    {language === 'es' ? 'ej. Compraste 15 cápsulas sueltas a $20 c/u en Farmacia Regina.' : 'e.g. 15 capsules'}
                  </p>
                </div>
              )}

              {/* Mode: Bottles / Samples */}
              {restockMode === 'bottles' && (
                <div className="form-group" style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                  <label className="form-label" style={{ color: '#166534', fontWeight: 700 }}>
                    🧴 {language === 'es' ? 'Cantidad de Frascos o Goteros Comprados:' : 'Bottles Count:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={restockBottlesCount}
                    onChange={e => setRestockBottlesCount(Number(e.target.value))}
                    required
                  />
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.72rem', color: '#15803d' }}>
                    {language === 'es'
                      ? `ej. Compraste 2 muestras médicas de 3ml en Farmacia Regina. La app mantendrá 1 en uso y ${(restockBottlesCount || 1) - 1} en reserva.`
                      : 'e.g. 2 sample bottles'}
                  </p>
                </div>
              )}

              {/* Store & Cost Tracking */}
              <div className="grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    🏪 {language === 'es' ? 'Farmacia o Lugar de Compra:' : 'Pharmacy:'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={restockStore}
                    onChange={e => setRestockStore(e.target.value)}
                    placeholder="e.g. Farmacia Regina (Muestras Médicas)"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    💰 {language === 'es' ? 'Costo Total ($ MXN):' : 'Total Cost:'}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    placeholder="e.g. 300"
                    value={restockCost}
                    onChange={e => setRestockCost(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>

              {/* Quick Store Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {customPharmacies.map(st => (
                  <button
                    key={st}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRestockStore(st)}
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: restockStore === st ? '#dbeafe' : undefined,
                      borderColor: restockStore === st ? '#3b82f6' : undefined,
                      fontWeight: restockStore === st ? 700 : 500
                    }}
                  >
                    {st}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const name = window.prompt(language === 'es' ? 'Nombre de la nueva farmacia o tienda:' : 'Enter new pharmacy name:');
                    if (name && name.trim()) {
                      addCustomPharmacy(name.trim());
                      setRestockStore(name.trim());
                    }
                  }}
                  style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', color: '#0284c7', borderColor: '#bae6fd', backgroundColor: '#f0f9ff', fontWeight: 700 }}
                >
                  + {language === 'es' ? 'Nueva Farmacia' : 'New Pharmacy'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setRestockModalMed(null)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, fontWeight: 800, backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                >
                  📦 {language === 'es' ? 'Registrar Resurtido' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medication Add/Edit Modal */}
      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        medicationToEdit={medicationToEdit}
      />

      {/* AI Scanner Modal */}
      <AIPrescriptionScannerModal
        isOpen={isAiScannerOpen}
        onClose={() => setIsAiScannerOpen(false)}
        onSelectMedication={handleAiExtractedMed}
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

      {/* Manual Completion Modal */}
      {completeModalMed && (
        <div className="modal-backdrop" onClick={() => setCompleteModalMed(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '520px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flag size={22} color="#ea580c" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {language === 'es' ? 'Marcar Medicamento como Concluido' : 'Mark Medication as Completed'}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCompleteModalMed(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  fontSize: '0.85rem',
                  color: '#9a3412'
                }}
              >
                <strong>💊 {completeModalMed.name}</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem' }}>
                  {language === 'es'
                    ? 'Al marcarlo como terminado, se archivará en el historial médico sin borrar sus tomas pasadas y dejará de generar avisos en la agenda diaria.'
                    : 'It will be archived in medical history and stopped on daily timeline.'}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {language === 'es' ? 'Selecciona el motivo de conclusión:' : 'Select completion reason:'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { value: 'bottle_finished', label: language === 'es' ? '🧴 Se terminó el frasco / medicamento físico' : '🧴 Finished physical bottle/box' },
                    { value: 'doctor_stopped', label: language === 'es' ? '👨‍⚕️ Indicación médica de suspenderlo' : '👨‍⚕️ Discontinued by doctor' },
                    { value: 'treatment_completed', label: language === 'es' ? '✅ Tratamiento concluido con éxito' : '✅ Completed treatment course' },
                    { value: 'other', label: language === 'es' ? '📋 Otro motivo' : '📋 Other reason' }
                  ].map(opt => (
                    <label
                      key={opt.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 0.875rem',
                        backgroundColor: completionReason === opt.value ? '#ffedd5' : 'var(--bg-secondary)',
                        border: `1px solid ${completionReason === opt.value ? '#ea580c' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: completionReason === opt.value ? 700 : 500
                      }}
                    >
                      <input
                        type="radio"
                        name="completionReason"
                        value={opt.value}
                        checked={completionReason === opt.value}
                        onChange={() => setCompletionReason(opt.value as any)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {language === 'es' ? 'Notas adicionales (Opcional):' : 'Additional notes (Optional):'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'es' ? 'e.g. Se terminó el frasco de jarabe a la mitad de la semana' : 'e.g. Finished bottle'}
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setCompleteModalMed(null)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, fontWeight: 800, backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                >
                  🏁 {language === 'es' ? 'Archivar y Concluir' : 'Archive & Finish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reactivate / Restock Modal */}
      {reactivateModalMed && (
        <div className="modal-backdrop" onClick={() => setReactivateModalMed(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={22} color="#16a34a" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {language === 'es' ? 'Reactivar Tratamiento / Nuevo Frasco' : 'Reactivate Medication'}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setReactivateModalMed(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReactivate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {language === 'es'
                  ? `¿Deseas reactivar "${reactivateModalMed.name}" en la agenda diaria del paciente? Ingresa la cantidad del nuevo frasco o caja comprada:`
                  : `Reactivate "${reactivateModalMed.name}"? Enter newly purchased stock:`}
              </p>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  📦 {language === 'es' ? `Nuevo Stock (${reactivateModalMed.presentation}s):` : 'New Stock:'}
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={reactivateStock}
                  onChange={e => setReactivateStock(Number(e.target.value))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setReactivateModalMed(null)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, fontWeight: 800, backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                >
                  🔄 {language === 'es' ? 'Reactivar en Agenda' : 'Reactivate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Solidarity Stock Donation / Transfer Modal */}
      {transferModalMed && (
        <div className="modal-backdrop" onClick={() => setTransferModalMed(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gift size={22} color="#7c3aed" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {language === 'es' ? 'Traspaso Solidario / Donación de Sobrante' : 'Solidarity Stock Transfer'}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setTransferModalMed(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer}>
              <div
                style={{
                  backgroundColor: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem'
                }}
              >
                <strong style={{ color: '#5b21b6' }}>
                  💊 {transferModalMed.name} ({transferModalMed.currentStock} {transferModalMed.presentation}s disponibles)
                </strong>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6d28d9', fontSize: '0.78rem' }}>
                  {language === 'es'
                    ? 'Transfiere medicamentos que el paciente ya no utiliza a otro familiar o dónalos a personas que los necesiten.'
                    : 'Transfer unused medication stock to family members or donate to those in need.'}
                </p>
              </div>

              {/* Recipient Type Selector */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {language === 'es' ? '¿A quién deseas donar o transferir?' : 'Who is the recipient?'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${donationType === 'family_member' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDonationType('family_member')}
                    style={{ fontSize: '0.78rem' }}
                  >
                    👥 {language === 'es' ? 'Familiar del Hogar' : 'Household Member'}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${donationType === 'known_contact' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDonationType('known_contact')}
                    style={{ fontSize: '0.78rem' }}
                  >
                    🤝 {language === 'es' ? 'Familiar Externo / Amigo' : 'Relative / Friend'}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${donationType === 'dispensary_or_stranger' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDonationType('dispensary_or_stranger')}
                    style={{ fontSize: '0.78rem' }}
                  >
                    🏥 {language === 'es' ? 'Dispensario / Causa Social' : 'Dispensary / Charity'}
                  </button>
                </div>

                {/* Target Family Patient Dropdown */}
                {donationType === 'family_member' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>
                      {language === 'es' ? 'Selecciona el familiar receptor:' : 'Select family recipient:'}
                    </label>
                    <select
                      className="form-select"
                      value={targetPatientId}
                      onChange={e => setTargetPatientId(e.target.value)}
                      required
                    >
                      {patients.filter(p => p.id !== activePatient.id).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Known Contact Custom Name */}
                {donationType === 'known_contact' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>
                      {language === 'es' ? 'Nombre del receptor:' : 'Recipient Name:'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={customRecipientName}
                      onChange={e => setCustomRecipientName(e.target.value)}
                      placeholder="e.g. Doña Lupita (Tía), Roberto Gómez (Suegro)"
                      required
                    />
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      {['Suegra / Suegro', 'Tía / Tío', 'Vecino(a) Conocido', 'Compañero de Trabajo'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCustomRecipientName(preset)}
                          style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)' }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dispensary or Stranger text input */}
                {donationType === 'dispensary_or_stranger' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>
                      {language === 'es' ? 'Institución, Dispensario o Causa Social:' : 'Charity or Dispensary:'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={customRecipientName}
                      onChange={e => setCustomRecipientName(e.target.value)}
                      placeholder="e.g. Dispensario Parroquial, Cruz Roja, Persona en Sala de Espera"
                      required
                    />
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      {['Dispensario Parroquial San Judas', 'Cruz Roja / Centro de Salud', 'Persona en Necesidad (IMSS)', 'Banco de Medicinas Comunitario'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCustomRecipientName(preset)}
                          style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)' }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Multi-Batch, Multi-Lab & Box Inventory Modal */}
      <MedicationBatchesModal
        isOpen={Boolean(batchesModalMed)}
        onClose={() => setBatchesModalMed(null)}
        medication={batchesModalMed}
        onOpenZoomImage={(url, title) => setZoomImage({ url, title })}
      />
    </div>
  );
};
