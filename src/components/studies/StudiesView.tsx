import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MedicalStudy } from '../../types';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  ExternalLink,
  Eye,
  X,
  Upload,
  FlaskConical,
  Activity,
  Layers
} from 'lucide-react';
import { formatDateIso } from '../../utils/frequencyEngine';

export const StudiesView: React.FC = () => {
  const { activePatient, studies, addStudy, deleteStudy } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewStudy, setPreviewStudy] = useState<MedicalStudy | null>(null);

  // Add form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalStudy['category']>('blood_test');
  const [date, setDate] = useState<string>(formatDateIso(new Date()));
  const [laboratory, setLaboratory] = useState('');
  const [resultsSummary, setResultsSummary] = useState('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'pdf' | 'image'>('image');

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please select a patient profile to manage lab studies.</p>
      </div>
    );
  }

  const patientStudies = studies.filter(s => s.patientId === activePatient.id);
  const filteredStudies = selectedCategory === 'all'
    ? patientStudies
    : patientStudies.filter(s => s.category === selectedCategory);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    setFileType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addStudy({
      patientId: activePatient.id,
      title: title.trim(),
      category,
      date,
      laboratory: laboratory.trim() || undefined,
      resultsSummary: resultsSummary.trim() || undefined,
      fileUrl: fileUrl || undefined,
      fileType: fileUrl ? fileType : undefined
    });

    setTitle('');
    setLaboratory('');
    setResultsSummary('');
    setFileUrl('');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Controls */}
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
            {activePatient.name}'s Digital Lab Studies Archive
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Store laboratory PDFs, blood chemistries, and radiological images offline.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Upload New Study / PDF
        </button>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'all', label: 'All Studies' },
          { id: 'blood_test', label: '🩸 Blood & Lab Chemistries' },
          { id: 'imaging', label: '🩻 Imaging & X-Rays' },
          { id: 'cardiology', label: '🫀 Cardiology & ECG' },
          { id: 'pathology', label: '🔬 Pathology & Other' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Studies Grid */}
      {filteredStudies.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <FlaskConical size={44} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No laboratory studies in this category
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Upload blood work or radiology reports to keep them handy during medical consults.
          </p>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ margin: '0 auto' }}>
            <Plus size={18} /> Add First Lab Study
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {filteredStudies.map(study => (
            <div
              key={study.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                borderLeft: '4px solid var(--primary)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                    {study.category.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    📅 {study.date}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {study.title}
                </h3>

                {study.laboratory && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    🏥 {study.laboratory}
                  </p>
                )}

                {study.resultsSummary && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.5rem'
                    }}
                  >
                    <strong>Key Findings:</strong> {study.resultsSummary}
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
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                {study.fileUrl ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPreviewStudy(study)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--primary)' }}
                  >
                    <Eye size={14} /> View Attached {study.fileType === 'pdf' ? 'PDF' : 'Image'}
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No file attached (summary only)
                  </span>
                )}

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => deleteStudy(study.id)}
                  aria-label="Delete study"
                >
                  <Trash2 size={14} color="var(--danger)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Study Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Upload Laboratory / Study</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Study Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Complete Blood Chemistry (24 Elements), Chest X-Ray"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                  >
                    <option value="blood_test">Blood / Urine Chemistry</option>
                    <option value="imaging">Imaging (X-Ray, Ultrasound, CT)</option>
                    <option value="cardiology">Cardiology (ECG, Holter)</option>
                    <option value="pathology">Pathology / Biopsy</option>
                    <option value="other">Other Medical Document</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date Taken</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Laboratory or Hospital Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chopo, Jenner, Faro del Mayab"
                  value={laboratory}
                  onChange={e => setLaboratory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Key Results & Summary</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Glucose: 110 mg/dL, HbA1c: 6.8%, Normal renal function"
                  value={resultsSummary}
                  onChange={e => setResultsSummary(e.target.value)}
                />
              </div>

              {/* Offline File Upload */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Upload size={14} /> Attach Local File (PDF or Photo)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="form-input"
                  onChange={handleFileUpload}
                />
                {fileUrl && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem', fontWeight: 600 }}>
                    ✓ File attached successfully for offline storage ({fileType.toUpperCase()})
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save to Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {previewStudy && (
        <div className="modal-backdrop" onClick={() => setPreviewStudy(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{previewStudy.title}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {previewStudy.laboratory} • {previewStudy.date}
                </span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewStudy(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: '350px', backgroundColor: '#000000', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewStudy.fileType === 'pdf' ? (
                <iframe
                  src={previewStudy.fileUrl}
                  title="PDF Preview"
                  style={{ width: '100%', height: '450px', border: 'none' }}
                />
              ) : (
                <img
                  src={previewStudy.fileUrl}
                  alt={previewStudy.title}
                  style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
