import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { MedicalStudy } from '../../types';
import {
  FileText,
  Plus,
  Trash2,
  Paperclip,
  Eye,
  Calendar,
  Building2,
  X,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { formatDateIso } from '../../utils/frequencyEngine';

export const StudiesView: React.FC = () => {
  const { activePatient, studies, addStudy, deleteStudy } = useApp();
  const { t, language } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewFileUrl, setViewFileUrl] = useState<{ url: string; title: string; type: 'pdf' | 'image' } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalStudy['category']>('blood_test');
  const [date, setDate] = useState(formatDateIso(new Date()));
  const [laboratory, setLaboratory] = useState('');
  const [resultsSummary, setResultsSummary] = useState('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'pdf' | 'image'>('pdf');

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
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

    const isPdf = file.type === 'application/pdf';
    setFileType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
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
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
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
            {language === 'es' ? `${t('studiesTitle')} ${activePatient.name}` : `${activePatient.name}${t('studiesTitle')}`}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('studiesSubtitle')}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> {t('uploadStudy')}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory('all')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('allStudies')} ({patientStudies.length})
        </button>
        <button
          className={`btn btn-sm ${selectedCategory === 'blood_test' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory('blood_test')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('bloodTests')}
        </button>
        <button
          className={`btn btn-sm ${selectedCategory === 'imaging' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory('imaging')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('imagingTests')}
        </button>
        <button
          className={`btn btn-sm ${selectedCategory === 'cardiology' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory('cardiology')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('cardioTests')}
        </button>
      </div>

      {/* Studies Grid */}
      {filteredStudies.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <FileText size={48} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {t('noStudiesLogged')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            {t('noStudiesLoggedDesc')}
          </p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ margin: '0 auto' }}>
            <Plus size={18} /> {t('uploadStudy')}
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
                padding: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                      {study.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>📅 {study.date}</span>
                      {study.laboratory && <span>• 🔬 {study.laboratory}</span>}
                    </div>
                  </div>

                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    {study.category === 'blood_test' ? '🩸 Blood' : study.category === 'imaging' ? '🩻 Imaging' : '🔬 Study'}
                  </span>
                </div>

                {study.resultsSummary && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                    {study.resultsSummary}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                {study.fileUrl ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setViewFileUrl({ url: study.fileUrl!, title: study.title, type: study.fileType || 'pdf' })}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)' }}
                  >
                    <Eye size={14} /> {t('viewAttached')}
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {language === 'es' ? 'Sin archivo digital' : 'No digital file'}
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
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('uploadStudy')}</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">{t('studyTitle')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Química Sanguínea 6 Elementos + HbA1c"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('studyCategory')}</label>
                  <select className="form-select" value={category} onChange={e => setCategory(e.target.value as any)}>
                    <option value="blood_test">🩸 {language === 'es' ? 'Química Sanguínea' : 'Blood Test'}</option>
                    <option value="imaging">🩻 {language === 'es' ? 'Rayos X / Imagen' : 'Imaging / X-Ray'}</option>
                    <option value="cardiology">🫀 {language === 'es' ? 'Cardiología / ECG' : 'Cardiology / ECG'}</option>
                    <option value="pathology">🔬 {language === 'es' ? 'Patología / Biopsia' : 'Pathology'}</option>
                    <option value="other">📄 {language === 'es' ? 'Otro Estudio' : 'Other'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('studyDate')}</label>
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
                <label className="form-label">{t('studyLab')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Laboratorios Chopo, Salud Digna"
                  value={laboratory}
                  onChange={e => setLaboratory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('resultsSummary')}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Glucosa: 112 mg/dL, HbA1c: 6.8%, Creatinina: 0.9"
                  value={resultsSummary}
                  onChange={e => setResultsSummary(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('attachPdfOrPhoto')}</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flex: 1, justifyContent: 'center' }}>
                    <Camera size={14} color="var(--primary)" /> {t('takePhotoCamera')}
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flex: 1, justifyContent: 'center' }}>
                    <Paperclip size={14} color="var(--secondary)" /> {t('attachGalleryPdf')}
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                {fileUrl && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, display: 'block', marginTop: '0.375rem' }}>
                    ✓ {language === 'es' ? 'Archivo adjuntado correctamente' : 'File attached successfully'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {language === 'es' ? 'Guardar Estudio' : 'Save Study'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF / Image Viewer Modal */}
      {viewFileUrl && (
        <div className="modal-backdrop" onClick={() => setViewFileUrl(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', textAlign: 'center', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '1.05rem' }}>{viewFileUrl.title}</strong>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewFileUrl(null)}>
                <X size={16} />
              </button>
            </div>

            {viewFileUrl.type === 'image' ? (
              <img
                src={viewFileUrl.url}
                alt="Medical Study Document"
                style={{ maxWidth: '100%', maxHeight: '520px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
              />
            ) : (
              <iframe
                src={viewFileUrl.url}
                title="Study PDF"
                style={{ width: '100%', height: '520px', border: 'none', borderRadius: 'var(--radius-md)' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
