import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { MedicalStudy } from '../../types';
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  Building,
  Upload,
  X,
  Share2,
  Mail,
  Send,
  Check,
  Copy
} from 'lucide-react';
import { formatDateIso } from '../../utils/frequencyEngine';
import { buildStudyWhatsAppMessage, buildStudyEmailLink } from '../../utils/studySharingEngine';
import { shareViaWhatsApp } from '../../lib/whatsapp';

export const StudiesView: React.FC = () => {
  const { activePatient, studies, addStudy, deleteStudy } = useApp();
  const { t, language } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileStudy, setSelectedFileStudy] = useState<MedicalStudy | null>(null);
  const [studyToShare, setStudyToShare] = useState<MedicalStudy | null>(null);
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [copied, setCopied] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalStudy['category']>('blood_test');
  const [date, setDate] = useState(formatDateIso(new Date()));
  const [laboratory, setLaboratory] = useState('Laboratorios Chopo');
  const [resultsSummary, setResultsSummary] = useState('');
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [fileType, setFileType] = useState<'pdf' | 'image' | undefined>(undefined);

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
      </div>
    );
  }

  const patientStudies = studies.filter(s => s.patientId === activePatient.id);
  const filteredStudies = activeCategory === 'all'
    ? patientStudies
    : patientStudies.filter(s => s.category === activeCategory);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    setFileType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileUrl(event.target?.result as string);
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
      fileUrl,
      fileType
    });

    setTitle('');
    setResultsSummary('');
    setFileUrl(undefined);
    setFileType(undefined);
    setIsModalOpen(false);
  };

  const handleShareWhatsApp = (study: MedicalStudy) => {
    const msg = buildStudyWhatsAppMessage(activePatient, study);
    shareViaWhatsApp(msg, doctorPhone);
  };

  const handleShareEmail = (study: MedicalStudy) => {
    const mailto = buildStudyEmailLink(activePatient, study, doctorEmail);
    window.open(mailto, '_blank');
  };

  const handleCopySummary = async (study: MedicalStudy) => {
    const msg = buildStudyWhatsAppMessage(activePatient, study);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
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

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('all')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('allStudies')} ({patientStudies.length})
        </button>
        <button
          className={`btn btn-sm ${activeCategory === 'blood_test' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('blood_test')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('bloodTests')}
        </button>
        <button
          className={`btn btn-sm ${activeCategory === 'imaging' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('imaging')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('imagingTests')}
        </button>
        <button
          className={`btn btn-sm ${activeCategory === 'cardiology' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('cardiology')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('cardioTests')}
        </button>
      </div>

      {/* Studies List */}
      {filteredStudies.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {t('noStudiesLogged')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
            {t('noStudiesLoggedDesc')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredStudies.map(study => (
            <div
              key={study.id}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '260px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0
                  }}
                >
                  <FileText size={22} />
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                    {study.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span>📅 {study.date}</span>
                    {study.laboratory && <span>🏥 {study.laboratory}</span>}
                    <span className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>
                      {study.category}
                    </span>
                  </div>

                  {study.resultsSummary && (
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        margin: 0
                      }}
                    >
                      <strong>{language === 'es' ? 'Hallazgos / Resultados:' : 'Findings / Results:'}</strong> {study.resultsSummary}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions: View attached, Share to Doctor, Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {study.fileUrl && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedFileStudy(study)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <ExternalLink size={14} /> {t('viewAttached')}
                  </button>
                )}

                {/* Share to Doctor via WhatsApp or Email */}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setStudyToShare(study)}
                  style={{ color: '#16a34a', fontSize: '0.75rem' }}
                  title={t('shareStudy')}
                >
                  <Share2 size={14} /> {t('shareStudy')}
                </button>

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

      {/* Share to Doctor Modal */}
      {studyToShare && (
        <div className="modal-backdrop" onClick={() => setStudyToShare(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={22} color="#16a34a" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {t('shareStudy')}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setStudyToShare(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {language === 'es'
                ? `Envía el reporte del estudio de ${activePatient.name} directamente al médico o especialista:`
                : `Send ${activePatient.name}'s lab study report directly to the physician or specialist:`}
            </p>

            <div className="form-group">
              <label className="form-label">{t('doctorPhoneOptional')}</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 5219991234567"
                value={doctorPhone}
                onChange={e => setDoctorPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('doctorEmailOptional')}</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. dr.hernandez@hospital.com"
                value={doctorEmail}
                onChange={e => setDoctorEmail(e.target.value)}
              />
            </div>

            {/* Message Preview */}
            <div className="form-group">
              <label className="form-label">{t('previewMessage')}</label>
              <pre
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {buildStudyWhatsAppMessage(activePatient, studyToShare)}
              </pre>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', justifyContent: 'center' }}
                onClick={() => handleShareWhatsApp(studyToShare)}
              >
                <Send size={16} /> WhatsApp
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
                onClick={() => handleShareEmail(studyToShare)}
              >
                <Mail size={16} /> {language === 'es' ? 'Correo (Email)' : 'Email Doctor'}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              onClick={() => handleCopySummary(studyToShare)}
            >
              {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
              {copied ? (language === 'es' ? '¡Copiado al portapapeles!' : 'Copied to clipboard!') : (language === 'es' ? 'Copiar Texto del Estudio' : 'Copy Study Text')}
            </button>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {selectedFileStudy && (
        <div className="modal-backdrop" onClick={() => setSelectedFileStudy(null)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {selectedFileStudy.title}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedFileStudy(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'center', maxHeight: '70vh', overflowY: 'auto' }}>
              {selectedFileStudy.fileType === 'pdf' ? (
                <iframe
                  src={selectedFileStudy.fileUrl}
                  title="PDF Viewer"
                  style={{ width: '100%', height: '500px', border: 'none', borderRadius: 'var(--radius-md)' }}
                />
              ) : (
                <img
                  src={selectedFileStudy.fileUrl}
                  alt="Study Document"
                  style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setStudyToShare(selectedFileStudy);
                  setSelectedFileStudy(null);
                }}
                style={{ color: '#16a34a' }}
              >
                <Share2 size={16} /> {t('shareStudy')}
              </button>

              <a
                href={selectedFileStudy.fileUrl}
                download={`${selectedFileStudy.title.replace(/\s+/g, '_')}.${selectedFileStudy.fileType === 'pdf' ? 'pdf' : 'png'}`}
                className="btn btn-primary"
              >
                <Download size={16} /> {language === 'es' ? 'Descargar Archivo' : 'Download File'}
              </a>
            </div>
          </div>
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
                    <option value="blood_test">{t('bloodTests')}</option>
                    <option value="imaging">{t('imagingTests')}</option>
                    <option value="cardiology">{t('cardioTests')}</option>
                    <option value="pathology">🧪 {language === 'es' ? 'Patología y Biopsia' : 'Pathology & Biopsy'}</option>
                    <option value="other">📋 {language === 'es' ? 'Otro' : 'Other'}</option>
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
                  placeholder="e.g. Laboratorios Chopo, Salud Digna, Jenner"
                  value={laboratory}
                  onChange={e => setLaboratory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('resultsSummary')}</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Glucosa: 118 mg/dL, HbA1c: 6.8%, Creatinina: 1.0 mg/dL"
                  value={resultsSummary}
                  onChange={e => setResultsSummary(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('attachPdfOrPhoto')}</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="form-input"
                  onChange={handleFileUpload}
                />
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
    </div>
  );
};
