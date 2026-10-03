import React, { useState, useEffect } from 'react';
import type { ProjectListItem } from '../types';
import { api } from '../services/api';
import {
  Plus,
  FolderOpen,
  Trash2,
  Calendar,
  Award,
  FileCheck,
  Search,
  Sparkles,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface DashboardPageProps {
  onOpenProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenProject,
  onOpenNewProjectModal,
}) => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}" and all its certificates?`)) {
      return;
    }
    setDeletingId(projectId);
    try {
      await api.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err: any) {
      alert('Failed to delete project: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Modern, Professional Hero Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem',
        background: 'linear-gradient(135deg, var(--color-marine) 0%, #15383E 55%, var(--color-teal) 100%)',
        color: '#FFFFFF',
        border: '1px solid rgba(136, 189, 188, 0.28)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2.75rem',
        boxShadow: 'var(--shadow-lg), 0 4px 30px rgba(17, 45, 50, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle ambient light overlay */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(136, 189, 188, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--color-seafoam)',
            background: 'rgba(136, 189, 188, 0.12)',
            border: '1px solid rgba(136, 189, 188, 0.35)',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '0.75rem',
            width: 'fit-content',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            <Sparkles size={13} color="var(--color-seafoam)" />
            <span>Arjava Certify Studio</span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.25, color: '#FFFFFF' }}>
            Generate Custom Certificates from <span style={{ color: 'var(--color-seafoam)' }}>Google Sheets</span> with Precision
          </h1>

          <p style={{ color: 'rgba(212, 234, 233, 0.92)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '640px' }}>
            Connect your spreadsheet, align dynamic fields with real-time typography controls, preview each recipient's certificate, and batch-export print-ready PDFs and images effortlessly.
          </p>

          {/* Sleek inline feature highlights */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.25rem' }}>
            {[
              'PDF & Image Templates',
              'Google Sheets Sync',
              'Live Visual Canvas',
              'Instant Batch Export'
            ].map((feat) => (
              <div
                key={feat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.775rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  background: 'rgba(17, 45, 50, 0.4)',
                  border: '1px solid rgba(136, 189, 188, 0.2)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.65rem',
                  fontWeight: 500,
                }}
              >
                <CheckCircle size={12} color="var(--color-seafoam)" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <button
            onClick={onOpenNewProjectModal}
            className="btn btn-seafoam btn-lg"
            style={{
              fontSize: '0.925rem',
              padding: '0.85rem 1.65rem',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Plus size={18} />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Projects List Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-marine)' }}>Recent Projects</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Open, resume, or manage your certificate generation campaigns
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-text"
                placeholder="Search projects..."
                style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem', width: '220px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={onOpenNewProjectModal}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{
            padding: '4rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <Loader2 size={32} className="spin-animation" color="var(--color-teal)" />
            <span style={{ fontWeight: 600 }}>Loading certificate projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="card" style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            background: 'var(--bg-surface)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--color-seafoam-subtle)',
              color: 'var(--color-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid var(--color-seafoam)',
              boxShadow: '0 4px 12px rgba(136, 189, 188, 0.25)'
            }}>
              <Award size={32} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-marine)' }}>
                {search ? 'No projects match your search' : 'No certificate projects yet'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '420px', marginTop: '0.25rem' }}>
                {search
                  ? 'Try a different keyword or clear your search input.'
                  : 'Start by creating your first project! Upload a PDF or image template and link your Google Sheet.'}
              </div>
            </div>
            {!search && (
              <button
                onClick={onOpenNewProjectModal}
                className="btn btn-primary"
                style={{ marginTop: '0.5rem' }}
              >
                <Plus size={16} />
                <span>Create Your First Project</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredProjects.map((p) => {
              const formattedDate = new Date(p.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={p.id}
                  className="card card-interactive"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    cursor: 'pointer',
                    background: 'var(--bg-surface)'
                  }}
                  onClick={() => onOpenProject(p.id)}
                >
                  {/* Template Thumbnail Frame */}
                  <div style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-surface-teal)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <img
                      src={api.getTemplatePreviewUrl(p.id)}
                      alt="Certificate Template"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const directUrl = api.getTemplateDirectUrl(p.id);
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
                    {p.template_file_type && (
                      <span className="badge badge-dark" style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '0.65rem'
                      }}>
                        {p.template_file_type.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-marine)', wordBreak: 'break-word' }}>
                      {p.name}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileCheck size={14} color="var(--color-teal)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.template_original_name || 'Uploaded Template'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={14} color="var(--color-teal)" />
                        <span>{p.certificates_count} certificates generated</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} />
                        <span>Created: {formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProject(p.id);
                      }}
                      style={{ gap: '0.4rem', fontWeight: 700 }}
                    >
                      <FolderOpen size={14} />
                      <span>Open Workspace</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id, p.name);
                      }}
                      disabled={deletingId === p.id}
                      title="Delete project"
                    >
                      {deletingId === p.id ? <Loader2 size={14} className="spin-animation" /> : <Trash2 size={14} />}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
