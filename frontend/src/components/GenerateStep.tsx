import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { ProjectDetail, JobStatus, CertificateItem } from '../types';
import { api } from '../services/api';
import {
  Download,
  Eye,
  FileArchive,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  FileText
} from 'lucide-react';

interface GenerateStepProps {
  project: ProjectDetail;
  rows: Record<string, any>[];
  outputFormat: 'pdf' | 'png' | 'jpg';
  namingPattern: string;
  onRefreshProject: () => void;
}

export const GenerateStep: React.FC<GenerateStepProps> = ({
  project,
  rows,
  outputFormat,
  namingPattern,
  onRefreshProject,
}) => {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadExistingCertificates();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const loadExistingCertificates = async () => {
    setLoadingCerts(true);
    try {
      const res = await api.getCertificates(project.id);
      if (res && Array.isArray(res.certificates)) {
        setCertificates(res.certificates);
      }
    } catch (err: any) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoadingCerts(false);
    }
  };

  const startGeneration = async () => {
    if (generating) return;
    setError(null);
    setGenerating(true);

    try {
      const initialJob = await api.startGeneration(
        project.id,
        rows,
        outputFormat,
        namingPattern
      );
      setJob(initialJob);

      // Poll job status every 750ms
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await api.getJobStatus(initialJob.id);
          setJob(status);

          if (status.status === 'completed' || status.status === 'partial' || status.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setGenerating(false);
            await loadExistingCertificates();
            onRefreshProject();

            // Additional refresh to ensure fresh state is displayed
            setTimeout(() => {
              loadExistingCertificates();
            }, 600);

            if (status.status === 'completed' || status.status === 'partial') {
              // Celebrate!
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 }
              });
            }
          }
        } catch (err) {
          console.error('Job polling error:', err);
        }
      }, 750);
    } catch (err: any) {
      setError(err.message || 'Failed to start generation.');
      setGenerating(false);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (!searchQuery.trim()) return true;
    return (
      c.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Header & Actions Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)',
          color: '#FFFFFF',
          border: '1.5px solid var(--color-teal)',
          boxShadow: 'var(--shadow-lg), 0 0 25px rgba(136, 189, 188, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="var(--color-seafoam)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Batch Certificate Generator
              </h2>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(212, 234, 233, 0.9)', marginTop: '0.25rem' }}>
              Format: <span style={{ color: 'var(--color-seafoam)', fontWeight: 700, textTransform: 'uppercase' }}>{outputFormat}</span> • Target: <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{rows.length} Participants</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {certificates.length > 0 && (
              <a
                href={api.getAllCertificatesZipUrl(project.id)}
                download="certificates.zip"
                className="btn btn-seafoam btn-lg"
                style={{ textDecoration: 'none', fontWeight: 800 }}
              >
                <FileArchive size={18} />
                <span>Download All as ZIP</span>
              </a>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={startGeneration}
              disabled={generating}
              style={{ minWidth: '220px', fontWeight: 800 }}
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="spin-animation" color="var(--color-teal)" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} color="var(--color-teal)" />
                  <span>{certificates.length > 0 ? 'Regenerate Certificates' : 'Generate Certificates'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Box if generating or recently completed */}
        {(generating || (job && job.status === 'completed')) && (
          <div style={{
            background: 'rgba(10, 28, 31, 0.45)',
            border: '1px solid rgba(136, 189, 188, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {generating ? (
                  <Loader2 size={18} className="spin-animation" color="var(--color-seafoam)" />
                ) : (
                  <CheckCircle size={18} color="var(--color-seafoam)" />
                )}
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>
                  {generating ? 'Generating certificates...' : 'Batch Generation Finished!'}
                </span>
                {job?.current_participant && generating && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-seafoam)', fontWeight: 600 }}>
                    ({job.current_participant})
                  </span>
                )}
              </div>

              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-seafoam)' }}>
                {job?.progress_percentage ?? 0}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
              <div
                className="progress-fill"
                style={{ width: `${job?.progress_percentage ?? 0}%` }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(212, 234, 233, 0.85)' }}>
              <span>
                Processed {job?.processed_rows ?? 0} / {job?.total_rows ?? rows.length}
              </span>
              <span>
                Success: {job?.successful_count ?? 0} • Failed: {job?.failed_count ?? 0}
              </span>
            </div>
          </div>
        )}

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
      </div>

      {/* 2. Generated Certificates Table */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-marine)' }}>
              Generated Certificates ({certificates.length})
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Inspect and download individual certificates or download all as a single ZIP archive
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-text"
                placeholder="Filter by name..."
                style={{ paddingLeft: '2rem', fontSize: '0.8125rem', width: '200px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadExistingCertificates}
              disabled={loadingCerts}
              title="Refresh certificate list"
            >
              <RefreshCw size={14} className={loadingCerts ? 'spin-animation' : ''} />
            </button>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '13px',
              background: 'var(--bg-surface-teal)',
              border: '1.5px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-teal)'
            }}>
              <FileText size={24} />
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-marine)', fontSize: '1rem' }}>
              No certificates generated yet
            </div>
            <div style={{ fontSize: '0.8125rem', maxWidth: '380px' }}>
              Click the "Generate Certificates" button above to batch produce certificates for all {rows.length} participants.
            </div>
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            background: '#FFFFFF'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, var(--color-marine) 0%, var(--color-teal) 100%)', color: '#FFFFFF' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, width: '50px', color: 'var(--color-seafoam)' }}>#</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#FFFFFF' }}>Participant Name</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#FFFFFF' }}>Generated Filename</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#FFFFFF' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#FFFFFF' }}>Size</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'right', color: '#FFFFFF' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? '#FFFFFF' : 'var(--bg-surface-teal)',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{c.row_index}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-marine)' }}>
                      {c.participant_name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="code-tag">{c.filename}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {c.status === 'generated' ? (
                        <span className="badge badge-emerald">
                          <CheckCircle size={12} /> Generated
                        </span>
                      ) : (
                        <span className="badge badge-rose">
                          <AlertCircle size={12} /> Failed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {c.file_size ? `${(c.file_size / 1024).toFixed(1)} KB` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <a
                          href={api.getCertificatePreviewUrl(c.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Open preview in new tab"
                          style={{ padding: '0.35rem 0.65rem' }}
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </a>

                        <a
                          href={api.getCertificateDownloadUrl(c.id)}
                          download={c.filename}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.35rem 0.65rem' }}
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
