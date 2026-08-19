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
  X,
  Share2,
  Mail,
  Send,
  Check,
  Copy,
  Layers,
  Maximize2,
  Eye,
  FileCheck,
  Lock,
  Users
} from 'lucide-react';
import { formatDateIso } from '../../utils/frequencyEngine';
import { buildStudyWhatsAppMessage, buildStudyEmailLink } from '../../utils/studySharingEngine';
import { shareViaWhatsApp } from '../../lib/whatsapp';
import { openDocumentInNewTab } from '../../utils/pdfHelper';

export const StudiesView: React.FC = () => {
  const { activePatient, studies, addStudy, deleteStudy, currentUser } = useApp();
  const { t, language } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileStudy, setSelectedFileStudy] = useState<MedicalStudy | null>(null);
  const [studyToShare, setStudyToShare] = useState<MedicalStudy | null>(null);
  const [studyToDelete, setStudyToDelete] = useState<MedicalStudy | null>(null);
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [copied, setCopied] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalStudy['category']>('imaging');
  const [date, setDate] = useState(formatDateIso(new Date()));
  const [laboratory, setLaboratory] = useState('Laboratorios Chopo / Eva Center');
  const [resultsSummary, setResultsSummary] = useState('');
  const [viewerUrl, setViewerUrl] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [accessCredentials, setAccessCredentials] = useState('');
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [fileType, setFileType] = useState<'pdf' | 'image' | undefined>(undefined);
  const [isPrivate, setIsPrivate] = useState(false);

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('selectPatientPrompt')}</p>
      </div>
    );
  }

  // Filter studies by active patient and privacy permissions
  const patientStudies = studies.filter(s => {
    if (s.patientId !== activePatient.id) return false;
    if (s.isPrivate) {
      return s.ownerUserId === currentUser.id || s.uploadedByName === currentUser.name || !s.ownerUserId;
    }
    return true;
  });

  const hiddenPrivateCount = studies.filter(
    s => s.patientId === activePatient.id && s.isPrivate && s.ownerUserId !== currentUser.id && s.uploadedByName !== currentUser.name
  ).length;

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
      viewerUrl: viewerUrl.trim() || undefined,
      reportUrl: reportUrl.trim() || undefined,
      accessCredentials: accessCredentials.trim() || undefined,
      fileUrl,
      fileType,
      isPrivate,
      ownerUserId: currentUser.id,
      uploadedByName: currentUser.name
    });

    setTitle('');
    setResultsSummary('');
    setViewerUrl('');
    setReportUrl('');
    setAccessCredentials('');
    setFileUrl(undefined);
    setFileType(undefined);
    setIsPrivate(false);
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
        <button
          className={`btn btn-sm ${activeCategory === 'nutrition_plan' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('nutrition_plan')}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {t('nutritionPlans')}
        </button>
      </div>

      {/* Hidden Private Studies Notice */}
      {hiddenPrivateCount > 0 && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            padding: '0.625rem 0.875rem',
            fontSize: '0.78rem',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Lock size={14} color="#64748b" />
          <span>
            {language === 'es'
              ? `Hay ${hiddenPrivateCount} estudio(s) médico(s) de este perfil protegidos con candado de privacidad individual.`
              : `${hiddenPrivateCount} medical study(ies) are marked as confidential and hidden by personal privacy.`}
          </span>
        </div>
      )}

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
                    backgroundColor: study.viewerUrl ? '#ecfdf5' : 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: study.viewerUrl ? '#059669' : 'var(--primary)',
                    flexShrink: 0
                  }}
                >
                  {study.viewerUrl ? <Layers size={22} /> : <FileText size={22} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                      {study.title}
                    </h4>
                    {study.isPrivate && (
                      <span className="badge badge-red" style={{ fontSize: '0.6875rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Lock size={10} />
                        <span>{language === 'es' ? 'Privado (Solo tú)' : 'Private (Only you)'}</span>
                      </span>
                    )}
                    {study.viewerUrl && (
                      <span className="badge badge-green" style={{ fontSize: '0.6875rem' }}>
                        🌐 Visor PACS 3D
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap', margin: '0.35rem 0 0.5rem' }}>
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
                        margin: '0 0 0.5rem 0'
                      }}
                    >
                      <strong>{language === 'es' ? 'Hallazgos / Resultados:' : 'Findings / Results:'}</strong> {study.resultsSummary}
                    </p>
                  )}

                  {/* PACS Viewer & Online Report Direct Badges */}
                  {(study.viewerUrl || study.reportUrl) && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
                      {study.viewerUrl && (
                        <a
                          href={study.viewerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            borderColor: '#059669',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.6rem'
                          }}
                        >
                          <Eye size={13} /> {t('openPacsViewer')}
                        </a>
                      )}
                      {study.reportUrl && (
                        <a
                          href={study.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.6rem'
                          }}
                        >
                          <FileCheck size={13} color="var(--primary)" /> {t('openOnlineReport')}
                        </a>
                      )}
                    </div>
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
                  onClick={() => setStudyToDelete(study)}
                  title={language === 'es' ? 'Eliminar estudio' : 'Delete study'}
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
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
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
                ? `Envía el reporte del estudio (y enlaces PACS si aplican) de ${activePatient.name} directamente al médico:`
                : `Send ${activePatient.name}'s lab study report (including PACS viewer links) directly to the physician:`}
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
                  fontSize: '0.78rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '180px',
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

      {/* Full-Resolution File & Nutrition Plan Viewer Modal */}
      {selectedFileStudy && (
        <div className="modal-backdrop" onClick={() => setSelectedFileStudy(null)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '1150px',
              width: '95vw',
              height: '92vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.25rem'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {selectedFileStudy.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  📅 {selectedFileStudy.date} {selectedFileStudy.laboratory ? `• ${selectedFileStudy.laboratory}` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedFileStudy.fileUrl && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openDocumentInNewTab(selectedFileStudy.fileUrl!, selectedFileStudy.title)}
                    title={language === 'es' ? 'Abrir en pestaña completa' : 'Open full window'}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Maximize2 size={15} /> {language === 'es' ? 'Pantalla Completa' : 'Full Screen'}
                  </button>
                )}

                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedFileStudy(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Content Area */}
            <div style={{ flex: 1, width: '100%', minHeight: 0, backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {selectedFileStudy.fileType === 'pdf' ? (
                <iframe
                  src={selectedFileStudy.fileUrl ? `${selectedFileStudy.fileUrl}#view=FitH&navpanes=0&toolbar=1` : undefined}
                  title="PDF Viewer"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <img
                  src={selectedFileStudy.fileUrl}
                  alt="Study Document"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setStudyToShare(selectedFileStudy);
                    setSelectedFileStudy(null);
                  }}
                  style={{ color: '#16a34a' }}
                >
                  <Share2 size={16} /> {t('shareStudy')}
                </button>

                {selectedFileStudy.fileUrl && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openDocumentInNewTab(selectedFileStudy.fileUrl!, selectedFileStudy.title)}
                  >
                    <Maximize2 size={14} /> {language === 'es' ? 'Abrir en Pestaña Nueva' : 'Open in New Tab'}
                  </button>
                )}
              </div>

              <a
                href={selectedFileStudy.fileUrl}
                download={`${selectedFileStudy.title.replace(/\s+/g, '_')}.${selectedFileStudy.fileType === 'pdf' ? 'pdf' : 'png'}`}
                className="btn btn-primary btn-sm"
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
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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
                  placeholder="e.g. Tomografía Computarizada de Abdomen / Angiotomografía"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('studyCategory')}</label>
                  <select className="form-select" value={category} onChange={e => setCategory(e.target.value as any)}>
                    <option value="nutrition_plan">{t('nutritionPlans')} (Menús, Dietas, Porciones)</option>
                    <option value="imaging">{t('imagingTests')} (Tomografía, TAC, Rayos X, Resonancia)</option>
                    <option value="blood_test">{t('bloodTests')}</option>
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
                  placeholder="e.g. Eva Center, Unirad Mérida, Laboratorios Chopo, Cedir"
                  value={laboratory}
                  onChange={e => setLaboratory(e.target.value)}
                />
              </div>

              {/* Online PACS Viewer URL & Report Links */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.875rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, display: 'block', marginBottom: '0.5rem' }}>
                  🌐 {language === 'es' ? 'Enlaces Web del Laboratorio / Centro de Imagen (PACS):' : 'Online PACS / Radiology Portal Links:'}
                </span>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    {t('pacsViewerUrl')}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://pacs.evacenter.com/viewer/..."
                    value={viewerUrl}
                    onChange={e => setViewerUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    {t('reportUrlLabel')}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://apps.evacenter.com/pacs/report-detail/..."
                    value={reportUrl}
                    onChange={e => setReportUrl(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    {language === 'es' ? 'Instrucciones o Claves de Acceso (Opcional)' : 'Access Instructions or PIN (Optional)'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Usuario y contraseña incluidos en el enlace"
                    value={accessCredentials}
                    onChange={e => setAccessCredentials(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('resultsSummary')}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Hallazgos principales, estenosis, calcificaciones o conclusiones del radiólogo"
                  value={resultsSummary}
                  onChange={e => setResultsSummary(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  📄 {language === 'es' ? 'Escaneo o Foto del Dictamen / Interpretación en Físico:' : 'Scanned Sheet or Photo of Physical Radiologist Report:'}
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="form-input"
                  onChange={handleFileUpload}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  {language === 'es'
                    ? '💡 Puedes tomarle foto directa con la cámara de tu celular a la hoja física que te entregaron o subir el archivo PDF.'
                    : '💡 Take a direct photo of the physical paper report using your phone camera or upload a scanned PDF.'}
                </span>
              </div>

              {/* Privacy & Confidentiality Toggle */}
              <div
                style={{
                  backgroundColor: isPrivate ? '#fef2f2' : '#f0fdf4',
                  border: `1.5px solid ${isPrivate ? '#f87171' : '#86efac'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  cursor: 'pointer'
                }}
                onClick={() => setIsPrivate(!isPrivate)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isPrivate ? <Lock size={18} color="#dc2626" /> : <Users size={18} color="#16a34a" />}
                    <div>
                      <strong style={{ fontSize: '0.8125rem', color: isPrivate ? '#991b1b' : '#166534' }}>
                        {isPrivate
                          ? (language === 'es' ? '🔒 Estudio Privado / Confidencial (Solo visible para mí)' : '🔒 Private / Confidential (Only visible to me)')
                          : (language === 'es' ? '👥 Compartido con el Círculo Familiar' : '👥 Shared with Family Circle')}
                      </strong>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {isPrivate
                          ? (language === 'es' ? 'Solo tú podrás ver este estudio con tu cuenta. Queda oculto para tu cónyuge o familiares.' : 'Only you will see this study. Hidden from other circle members.')
                          : (language === 'es' ? 'Todos los miembros del hogar podrán consultarlo en consultas médicas o emergencias.' : 'Visible to family members for medical care and emergencies.')}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={() => {}}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>
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

      {/* Accidental Study Deletion Safety Confirmation Modal */}
      {studyToDelete && (
        <div className="modal-backdrop" onClick={() => setStudyToDelete(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', borderTop: '4px solid var(--danger)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>
                  {language === 'es' ? '¿Eliminar Estudio de Laboratorio?' : 'Delete Laboratory Study?'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {language === 'es' ? 'Confirmación de seguridad requerida' : 'Safety confirmation required'}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.8125rem'
              }}
            >
              <div><strong>🔬 {studyToDelete.title}</strong></div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>📅 {studyToDelete.date} {studyToDelete.laboratory ? `• ${studyToDelete.laboratory}` : ''}</div>
            </div>

            {/* Warning if study has PACS links or attached files */}
            {(studyToDelete.viewerUrl || studyToDelete.fileUrl) && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #f87171',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                  color: '#991b1b'
                }}
              >
                <strong>⚠️ {language === 'es' ? '¡Atención! Contiene Archivos / Visor PACS 3D:' : 'Warning! Contains Files / PACS 3D Viewer:'}</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>
                  {language === 'es'
                    ? 'Este estudio tiene enlaces a imágenes tomográficas o archivos PDF adjuntos. Al eliminarlo, se borrarán definitivamente del expediente.'
                    : 'This study includes attached files or 3D PACS links. Deleting will permanently remove them from records.'}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={() => setStudyToDelete(null)}
              >
                {language === 'es' ? 'Cancelar / Conservar' : 'Cancel / Keep'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', justifyContent: 'center' }}
                onClick={() => {
                  deleteStudy(studyToDelete.id);
                  setStudyToDelete(null);
                }}
              >
                {language === 'es' ? 'Sí, Eliminar' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
