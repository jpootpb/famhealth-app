import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Medication, FrequencyType, DoseSlot } from '../../types';
import { X, Plus, Trash2, Pill, Clock, Calendar, AlertCircle } from 'lucide-react';
import { formatDateIso } from '../../utils/frequencyEngine';

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

  const [name, setName] = useState('');
  const [presentation, setPresentation] = useState('tablet');
  const [indication, setIndication] = useState('');
  const [currentStock, setCurrentStock] = useState<number>(30);
  const [minimumStockAlert, setMinimumStockAlert] = useState<number>(5);
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [expirationDate, setExpirationDate] = useState<string>('');

  // Frequency Configuration
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily_fixed');
  const [startDate, setStartDate] = useState<string>(formatDateIso(new Date()));
  const [endDate, setEndDate] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [intervalDays, setIntervalDays] = useState<number>(2);
  const [intervalHours, setIntervalHours] = useState<number>(8);

  // Dose Slots
  const [doseSlots, setDoseSlots] = useState<DoseSlot[]>([
    { time: '08:00', dose: 1, instruction: 'With breakfast' }
  ]);

  useEffect(() => {
    if (medicationToEdit) {
      setName(medicationToEdit.name);
      setPresentation(medicationToEdit.presentation);
      setIndication(medicationToEdit.indication || '');
      setCurrentStock(medicationToEdit.currentStock);
      setMinimumStockAlert(medicationToEdit.minimumStockAlert);
      setUnitCost(medicationToEdit.unitCost || '');
      setExpirationDate(medicationToEdit.expirationDate || '');
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
      setCurrentStock(30);
      setMinimumStockAlert(5);
      setUnitCost('');
      setExpirationDate('');
      setFrequencyType('daily_fixed');
      setStartDate(formatDateIso(new Date()));
      setEndDate('');
      setDurationDays(7);
      setIntervalDays(2);
      setIntervalHours(8);
      setDoseSlots([{ time: '08:00', dose: 1, instruction: 'With breakfast' }]);
    }
  }, [medicationToEdit, isOpen]);

  if (!isOpen || !activePatient) return null;

  const handleAddDoseSlot = () => {
    setDoseSlots(prev => [...prev, { time: '20:00', dose: 1, instruction: 'With dinner' }]);
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
      currentStock: Number(currentStock) || 0,
      minimumStockAlert: Number(minimumStockAlert) || 3,
      unitCost: unitCost ? Number(unitCost) : undefined,
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
        style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {medicationToEdit ? 'Edit Medication' : 'Add Medication / Schedule'}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Medication Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Metformin, Rivaroxaban, Aspirin"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Presentation</label>
              <select
                className="form-select"
                value={presentation}
                onChange={e => setPresentation(e.target.value)}
              >
                <option value="tablet">Tablet / Pill</option>
                <option value="capsule">Capsule</option>
                <option value="ml">Syrup / Liquid (ml)</option>
                <option value="drops">Drops</option>
                <option value="inhalation">Inhaler / Puffs</option>
                <option value="injection">Injection / Unit</option>
                <option value="patch">Patch</option>
                <option value="sachet">Sachet / Powder</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Indication / Medical Purpose</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Diabetes control, Blood thinner"
                value={indication}
                onChange={e => setIndication(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Box Expiration Date (Fecha de Caducidad)</label>
              <input
                type="date"
                className="form-input"
                value={expirationDate}
                onChange={e => setExpirationDate(e.target.value)}
                title="Printed expiration date on medication package"
              />
            </div>
          </div>

          {/* Stock & Inventory */}
          <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AlertCircle size={16} color="var(--primary)" /> Inventory & Restock Settings
            </h3>
            <div className="grid-3">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Current Stock</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={currentStock}
                  onChange={e => setCurrentStock(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Low Stock Alert at</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={minimumStockAlert}
                  onChange={e => setMinimumStockAlert(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cost per Box ($ MXN)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 250"
                  value={unitCost}
                  onChange={e => setUnitCost(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>
          </div>

          {/* Frequency Type Selector */}
          <div className="form-group">
            <label className="form-label">Frequency Rule</label>
            <select
              className="form-select"
              value={frequencyType}
              onChange={e => setFrequencyType(e.target.value as FrequencyType)}
            >
              <option value="daily_fixed">Daily (Fixed hours with custom doses, e.g. 1 morning, 1/2 night)</option>
              <option value="alternate_days">Alternate Days (Every other day / Un día sí, un día no)</option>
              <option value="every_n_days">Every N Days (e.g. Every 3 or 4 days)</option>
              <option value="temporary_hourly">Temporary Treatment (Antibiotics / Acute course for fixed days)</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Treatment Start Date</label>
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
                <label className="form-label">Interval (Every X Days)</label>
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
                <label className="form-label">Duration in Days</label>
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
                Scheduled Dosing Times & Fractional Pills
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddDoseSlot}
                style={{ fontSize: '0.75rem' }}
              >
                <Plus size={14} /> Add Dosing Hour
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
                    <option value={0.25}>1/4 {presentation}</option>
                    <option value={0.5}>1/2 {presentation}</option>
                    <option value={0.75}>3/4 {presentation}</option>
                    <option value={1}>1 {presentation}</option>
                    <option value={1.5}>1 1/2 {presentation}s</option>
                    <option value={2}>2 {presentation}s</option>
                    <option value={3}>3 {presentation}s</option>
                  </select>

                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Instructions (e.g. with meals)"
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
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {medicationToEdit ? 'Save Changes' : 'Create Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
