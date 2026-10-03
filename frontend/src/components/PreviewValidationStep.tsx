import React, { useState, useEffect } from 'react';
import type { ProjectDetail, FieldMapping, SheetValidationResult } from '../types';
import { api } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileType,
  ArrowRight
} from 'lucide-react';

interface PreviewValidationStepProps {
  project: ProjectDetail;
  mappings: FieldMapping[];
  rows: Record<string, any>[];
  onProceedToGenerate: (format: 'pdf' | 'png' | 'jpg', namingPattern: string) => void;
}

export const PreviewValidationStep: React.FC<PreviewValidationStepProps> = ({
  project,
  mappings,
  rows,
  onProceedToGenerate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Settings
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'png' | 'jpg'>(
    project.output_format || 'pdf'
  );
  const [namingPattern, setNamingPattern] = useState(
    project.naming_pattern || '{{name}}_Certificate_{{year}}'
  );

  // Validation
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<SheetValidationResult | null>(null);
  const [showIssuesModal, setShowIssuesModal] = useState(false);

  const currentRow = rows[currentIndex] || rows[0] || {};
  const totalParticipants = rows.length;

  // Run validation on mount
  useEffect(() => {
    runValidation();
  }, []);

  // Update preview when participant index or format/naming changes
  useEffect(() => {
    if (rows.length > 0) {
      loadSinglePreview(currentIndex);
    } else {
      // No rows yet, show base template
      setPreviewImageUri(api.getTemplatePreviewUrl(project.id, project.updated_at));
    }
  }, [currentIndex, outputFormat, namingPattern, rows.length, mappings]);

  const runValidation = async () => {
    setValidating(true);
    try {
      const result = await api.validateSheet(project.id, rows);
      setValidationResult(result);
    } catch (err: any) {
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const loadSinglePreview = async (idx: number) => {
    const row = rows[idx];
    if (!row) {
      setPreviewImageUri(api.getTemplatePreviewUrl(project.id, project.updated_at));
      return;
    }

    setLoadingPreview(true);
    try {
      const res = await api.previewSingle(project.id, row, outputFormat, mappings);
      setPreviewImageUri(res.preview_url);
      setPreviewFilename(res.filename);
    } catch (err: any) {
      console.error('Single-row preview rendering error:', err);
      // Fallback: Always display base template preview so canvas is NEVER blank!
      setPreviewImageUri(api.getTemplatePreviewUrl(project.id, project.updated_at));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalParticipants - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Base fallback URL for certificate template image
  const baseTemplateUrl = api.getTemplatePreviewUrl(project.id, project.updated_at);
  const activeDisplaySrc = previewImageUri || baseTemplateUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Data Validation Banner */}
      <div
        className="card"
        style={{
          background: validationResult?.is_valid ? '#F4F7F4' : '#FFF5F5',
          border: `1.5px solid ${validationResult?.is_valid ? '#C8E6C9' : '#FECACA'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {validating ? (
              <Loader2 size={24} className="spin-animation" color="var(--color-teal)" />
            ) : validationResult?.is_valid ? (
              <CheckCircle2 size={24} color="#1B5E20" />
            ) : (
              <AlertTriangle size={24} color="#991B1B" />
            )}

            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: validationResult?.is_valid ? '#1B5E20' : '#991B1B' }}>
                {validating
                  ? 'Validating spreadsheet data...'
                  : validationResult?.is_valid
                    ? 'Data Validation Passed!'
                    : 'Data Validation Issues Detected'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {validationResult
                  ? `${validationResult.valid_rows_count} of ${validationResult.total_rows} rows ready for generation • ${validationResult.error_count} errors • ${validationResult.warning_count} warnings`
                  : 'Checking rows for missing names, blank cells, and duplicates...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={runValidation}
              disabled={validating}
            >
              <RefreshCw size={13} className={validating ? 'spin-animation' : ''} />
              <span>Re-check</span>
            </button>

            {validationResult && validationResult.issues.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => setShowIssuesModal(!showIssuesModal)}
              >
                <span>{showIssuesModal ? 'Hide Details' : `Review ${validationResult.issues.length} Issues`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Issue List */}
        {showIssuesModal && validationResult && validationResult.issues.length > 0 && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            maxHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '0.5rem'
          }}>
            {validationResult.issues.map((issue, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  color: issue.severity === 'error' ? '#991B1B' : '#B45309'
                }}
              >
                {issue.severity === 'error' ? <AlertCircle size={15} /> : <AlertTriangle size={15} />}
                <span style={{ fontWeight: 600 }}>{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Interactive Certificate Preview Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(300px, 1fr)',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Left: Certificate Preview Stage */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Participant Carousel Navigator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-teal)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1rem'
          }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrevious}
              disabled={currentIndex <= 0 || loadingPreview}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-marine)' }}>
                {totalParticipants > 0 ? `Participant ${currentIndex + 1} of ${totalParticipants}` : 'Base Certificate Template'}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-teal)', fontWeight: 700 }}>
                {currentRow['Name'] || currentRow['name'] || currentRow['Participant Name'] || project.template_original_name || 'Preview'}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleNext}
              disabled={currentIndex >= totalParticipants - 1 || loadingPreview}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Visual Preview Box */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: `${project.template_width || 842} / ${project.template_height || 595}`,
            backgroundColor: 'var(--bg-surface-teal)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md), 0 2px 10px rgba(17, 45, 50, 0.08)',
          }}>
            {loadingPreview && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(243, 247, 247, 0.85)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--color-marine)',
                zIndex: 10
              }}>
                <Loader2 size={32} className="spin-animation" color="var(--color-teal)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Rendering personalized certificate...</span>
              </div>
            )}

            {/* Certificate Template Image Display */}
            <img
              src={activeDisplaySrc}
              alt="Certificate Preview"
              onError={(e) => {
                const target = e.currentTarget;
                const directUrl = api.getTemplateDirectUrl(project.id);
                if (target.src !== directUrl && !target.src.endsWith(directUrl)) {
                  target.src = directUrl;
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          {/* Target Filename Badge */}
          {previewFilename && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface-teal)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span>Target Filename:</span>
              <span className="code-tag">{previewFilename}</span>
            </div>
          )}
        </div>

        {/* Right: Output Format & File Naming Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-marine)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              Export & Filename Settings
            </div>

            {/* Output Format */}
            <div className="input-group">
              <label className="input-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--color-marine)' }}>
                  <FileType size={15} color="var(--color-teal)" />
                  <span>Download Format</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default: PDF</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {(['pdf', 'png', 'jpg'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setOutputFormat(fmt)}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${outputFormat === fmt ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                      background: outputFormat === fmt ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)' : 'var(--bg-surface-teal)',
                      color: outputFormat === fmt ? 'var(--color-seafoam)' : 'var(--color-marine)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      transition: 'all 0.15s',
                      boxShadow: outputFormat === fmt ? '0 2px 8px rgba(17, 45, 50, 0.25)' : 'none'
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* File Naming Pattern */}
            <div className="input-group">
              <label className="input-label" htmlFor="namingPattern">
                <span style={{ fontWeight: 700, color: 'var(--color-marine)' }}>File Naming Pattern</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Variables supported</span>
              </label>
              <input
                id="namingPattern"
                type="text"
                className="input-text"
                placeholder="{{name}}_Certificate_{{year}}"
                value={namingPattern}
                onChange={(e) => setNamingPattern(e.target.value)}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Examples: <span className="code-tag">{'{{name}}'}</span>, <span className="code-tag">{'{{year}}'}</span>, <span className="code-tag">{'{{position}}'}</span>
              </div>
            </div>

            {/* Quick jump to participant */}
            {totalParticipants > 0 && (
              <div className="input-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <label className="input-label" htmlFor="quickJump">
                  <span style={{ fontWeight: 700, color: 'var(--color-marine)' }}>Quick Jump to Participant</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalParticipants} records</span>
                </label>
                <select
                  id="quickJump"
                  className="select-input"
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(parseInt(e.target.value, 10))}
                >
                  {rows.map((r, i) => (
                    <option key={i} value={i}>
                      #{i + 1} - {r['Name'] || r['name'] || r['Participant Name'] || `Participant ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Proceed to Batch Generation Button */}
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => onProceedToGenerate(outputFormat, namingPattern)}
              style={{ width: '100%', gap: '0.75rem', marginTop: '0.5rem' }}
            >
              <span>Proceed to Batch Generation</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
