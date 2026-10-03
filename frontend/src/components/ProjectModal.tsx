import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { SampleTemplate } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [samples, setSamples] = useState<SampleTemplate[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setFile(null);
      setSelectedSample('');
      setError(null);
      api.getSampleTemplates().then(setSamples).catch(() => { });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (f: File) => {
    const validExts = ['.pdf', '.png', '.jpg', '.jpeg'];
    const hasValidExt = validExts.some(ext => f.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Please upload a PDF, PNG, or JPG certificate template.');
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setError('Template file size must be under 25MB.');
      return;
    }
    setFile(f);
    setSelectedSample('');
    setError(null);
    if (!name.trim()) {
      setName(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }
    if (!file && !selectedSample) {
      setError('Please upload a certificate template or choose a sample template.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create project
      const project = await api.createProject(name.trim());

      // 2. Upload template or use sample
      if (file) {
        await api.uploadTemplate(project.id, file);
      } else if (selectedSample) {
        await api.useSampleTemplate(project.id, selectedSample);
      }

      onProjectCreated(project.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create certificate project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1.5px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-teal)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-marine)' }}>
              Create New Certificate Project
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Upload your certificate template (PDF, PNG, JPG) to get started
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-marine)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#991B1B',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div className="input-group">
            <label className="input-label" htmlFor="projectName">
              <span style={{ fontWeight: 700, color: 'var(--color-marine)' }}>Project Name <span style={{ color: '#991B1B' }}>*</span></span>
            </label>
            <input
              id="projectName"
              type="text"
              className="input-text"
              placeholder="e.g. Web Development Hackathon 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* File Upload Zone */}
          <div className="input-group">
            <label className="input-label">
              <span style={{ fontWeight: 700, color: 'var(--color-marine)' }}>Certificate Template <span style={{ color: '#991B1B' }}>*</span></span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF, PNG, JPG (up to 25MB)</span>
            </label>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--color-seafoam)' : file ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: dragActive ? 'var(--color-seafoam-subtle)' : 'var(--bg-surface-teal)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onClick={() => document.getElementById('templateFileInput')?.click()}
            >
              <input
                id="templateFileInput"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)',
                    color: 'var(--color-seafoam)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(17, 45, 50, 0.2)'
                  }}>
                    {file.name.endsWith('.pdf') ? <FileText size={24} /> : <ImageIcon size={24} />}
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--color-marine)', fontSize: '0.95rem' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '0.5rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Change Template
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)',
                    color: 'var(--color-seafoam)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(17, 45, 50, 0.2)'
                  }}>
                    <Upload size={24} />
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-marine)', fontSize: '0.95rem' }}>
                    Click to browse or drag & drop template here
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Placeholders like <span className="code-tag">{`{{name}}`}</span> and <span className="code-tag">{`{{year}}`}</span> will be automatically detected!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sample Templates Quick-Pick */}
          {samples.length > 0 && !file && (
            <div style={{
              background: 'var(--bg-surface-teal)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--color-marine)',
                marginBottom: '0.65rem'
              }}>
                <Sparkles size={14} color="var(--color-teal)" />
                <span>Or select a ready-to-test sample template:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {samples.map((s) => (
                  <button
                    type="button"
                    key={s.filename}
                    onClick={() => {
                      setSelectedSample(s.filename);
                      setFile(null);
                      if (!name.trim()) {
                        setName(s.title);
                      }
                    }}
                    style={{
                      background: selectedSample === s.filename ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)' : 'var(--bg-surface)',
                      border: `1.5px solid ${selectedSample === s.filename ? 'var(--color-seafoam)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.6rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: selectedSample === s.filename ? 'var(--color-seafoam)' : 'var(--color-marine)',
                      transition: 'all 0.15s',
                      boxShadow: selectedSample === s.filename ? '0 4px 12px rgba(17, 45, 50, 0.25)' : 'none'
                    }}
                  >
                    <FileText size={16} color={selectedSample === s.filename ? 'var(--color-seafoam)' : 'var(--color-teal)'} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: selectedSample === s.filename ? 'rgba(212, 234, 233, 0.85)' : 'var(--text-muted)' }}>
                        Format: {s.file_type.toUpperCase()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name.trim() || (!file && !selectedSample)}
              style={{ minWidth: '160px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Create & Configure</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
