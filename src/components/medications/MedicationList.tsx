import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  X
} from 'lucide-react';
import { getStockStatus, formatDose, getExpirationStatus } from '../../utils/formatters';
import { getFrequencyLabel } from '../../utils/frequencyEngine';
import { MedicationModal } from './MedicationModal';

export const MedicationList: React.FC = () => {
  const { activePatient, medications, updateMedication, deleteMedication } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [medicationToEdit, setMedicationToEdit] = useState<Medication | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please select a patient profile to manage medications.</p>
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
    if (window.confirm(`Are you sure you want to delete "${med.name}" from active treatment?`)) {
      deleteMedication(med.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
            {activePatient.name}'s Medication Cabinet
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Track active prescriptions, box photos, laboratory brands, expiration dates, and stock alerts.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Add New Medication
        </button>
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
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Adequate Stock</div>
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
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Low Stock Alert</div>
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
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Depleted (0 remaining)</div>
          </div>
        </div>
      </div>

      {/* Medication Cards Grid */}
      {patientMeds.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <Pill size={48} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No medications registered yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Add your loved one's medications to automate schedules, fractional doses, and stock alerts.
          </p>
          <button className="btn btn-primary" onClick={handleOpenAdd} style={{ margin: '0 auto' }}>
            <Plus size={18} /> Add First Medication
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
                          onClick={() => setZoomImage({ url: med.imageUrl!, title: `${med.name} (${med.laboratory || 'Box Photo'})` })}
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                          title="Click to zoom medicine box"
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
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickRestock(med, 30)}
                      title="Add 30 units (1 Box)"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <PackagePlus size={14} /> +30 Units
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickRestock(med, 15)}
                      title="Add 15 units (Half Box)"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <PackagePlus size={14} /> +15
                    </button>
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
    </div>
  );
};
