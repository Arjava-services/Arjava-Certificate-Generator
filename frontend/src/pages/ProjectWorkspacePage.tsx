import React, { useState, useEffect } from 'react';
import type { ProjectDetail, FieldMapping } from '../types';
import { api } from '../services/api';
import { TemplateCanvas } from '../components/TemplateCanvas';
import { GoogleSheetStep } from '../components/GoogleSheetStep';
import { FieldMappingStep } from '../components/FieldMappingStep';
import { PreviewValidationStep } from '../components/PreviewValidationStep';
import { GenerateStep } from '../components/GenerateStep';
import {
  FileText,
  Table,
  Layers,
  Eye,
  Download,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface ProjectWorkspacePageProps {
  projectId: string;
  onNavigateHome: () => void;
}

export const ProjectWorkspacePage: React.FC<ProjectWorkspacePageProps> = ({
  projectId,
  onNavigateHome,
}) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Settings
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'png' | 'jpg'>('pdf');
  const [namingPattern, setNamingPattern] = useState('{{name}}_Certificate_{{year}}');

  useEffect(() => {
    loadProjectWorkspace(true);
  }, [projectId]);

  const loadProjectWorkspace = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const proj = await api.getProject(projectId);
      setProject(proj);
      setOutputFormat(proj.output_format || 'pdf');
      setNamingPattern(proj.naming_pattern || '{{name}}_Certificate_{{year}}');

      const maps = await api.getMappings(projectId);
      setMappings(maps);

      // If project has sheet connected, attempt to load sheet data
      if (proj.sheet_url && proj.sheet_tab_name) {
        try {
          if (proj.sheet_url === 'https://docs.google.com/spreadsheets/d/demo-hackathon-2026/edit' || proj.sheet_id?.startsWith('demo-')) {
            const demo = await api.getDemoParticipants();
            setHeaders(demo.headers);
            setRows(demo.all_rows || demo.preview_rows);
          } else {
            const sheetData = await api.getSheetData(proj.sheet_url, proj.sheet_tab_name);
            setHeaders(sheetData.headers);
            setRows(sheetData.all_rows || sheetData.preview_rows);
          }
        } catch (e) {
          console.warn('Could not auto-fetch sheet data:', e);
        }
      }

      // Default step selection ONLY on initial mount:
      // If template uploaded and no sheet -> Step 2
      // If sheet is connected and fields mapped -> Step 3 or 4
      if (isInitial) {
        if (proj.template_filename) {
          if (!proj.sheet_url) {
            setActiveStep(2);
          } else if (maps.length > 0 && maps.some(m => m.sheet_column)) {
            setActiveStep(3);
          } else {
            setActiveStep(2);
          }
        } else {
          setActiveStep(1);
        }
      }
    } catch (err: any) {
      alert('Failed to load project: ' + err.message);
      onNavigateHome();
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  const handleRefreshProject = () => {
    loadProjectWorkspace(false);
  };

  const handleDataLoaded = (
    newHeaders: string[],
    newRows: Record<string, any>[],
    sheetUrl: string,
    tabName: string
  ) => {
    setHeaders(newHeaders);
    setRows(newRows);
    if (project) {
      setProject(prev => prev ? {
        ...prev,
        sheet_url: sheetUrl,
        sheet_tab_name: tabName,
      } : prev);
    }
    // Also fetch latest mappings from backend so Step 3 has all placeholders immediately
    api.getMappings(projectId).then((maps) => {
      if (maps && maps.length > 0) setMappings(maps);
    }).catch(console.error);

    // Auto advance to Step 3 (Field Mapping)
    setActiveStep(3);
  };

  const steps = [
    { num: 1, title: 'Template', icon: FileText, desc: 'Design & Placeholders' },
    { num: 2, title: 'Google Sheet', icon: Table, desc: 'Connect Data' },
    { num: 3, title: 'Field Mapping', icon: Layers, desc: 'Column Matching' },
    { num: 4, title: 'Preview & Validate', icon: Eye, desc: 'Row-by-row Check' },
    { num: 5, title: 'Generate & Export', icon: Download, desc: 'Batch Production' },
  ];

  if (loading || !project) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: 'var(--text-muted)'
      }}>
        <Loader2 size={36} className="spin-animation" color="var(--color-teal)" />
        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading project workspace...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onNavigateHome}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <ArrowLeft size={15} />
            <span>Dashboard</span>
          </button>

          {/* Template Mini Thumbnail */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1.5px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img
              src={api.getTemplatePreviewUrl(project.id, project.updated_at)}
              alt="Template"
              onError={(e) => {
                const target = e.currentTarget;
                const directUrl = api.getTemplateDirectUrl(project.id);
                if (target.src !== directUrl && !target.src.endsWith(directUrl)) {
                  target.src = directUrl;
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-marine)', letterSpacing: '-0.02em' }}>
              {project.name}
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
              <span>Template: {project.template_original_name || 'Uploaded'}</span>
              <span>•</span>
              <span>{rows.length > 0 ? `${rows.length} participants loaded` : 'No spreadsheet data connected yet'}</span>
            </div>
          </div>
        </div>

        {/* Step Indicator / Wizard Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'var(--bg-surface)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-subtle)',
          overflowX: 'auto',
          maxWidth: '100%',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.num;
            const isCompleted = activeStep > s.num;

            return (
              <button
                key={s.num}
                onClick={() => {
                  if (activeStep === 3 && s.num === 4 && mappings.length > 0) {
                    api.saveMappings(project.id, mappings).catch(console.error);
                  }
                  setActiveStep(s.num);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)' : 'transparent',
                  color: isActive ? 'var(--color-seafoam)' : isCompleted ? 'var(--color-marine)' : 'var(--text-muted)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 2px 8px rgba(17, 45, 50, 0.25)' : 'none'
                }}
              >
                {isCompleted ? <CheckCircle size={15} color="var(--color-teal)" /> : <Icon size={15} />}
                <span>{s.num}. {s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Area */}
      <div>
        {/* Step 1: Template & Placeholders */}
        {activeStep === 1 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-marine)' }}>Template Layout & Placeholders</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  View your certificate template and detected dynamic placeholders
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveStep(2)}
              >
                <span>Continue to Google Sheet</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <TemplateCanvas
              project={project}
              mappings={mappings}
              onSelectMapping={() => { }}
              onUpdateCoordinates={(ph, x, y) => {
                const updated = mappings.map(m => m.placeholder === ph ? { ...m, x_pos: x, y_pos: y } : m);
                setMappings(updated);
                api.saveMappings(project.id, updated).catch(console.error);
              }}
            />
          </div>
        )}

        {/* Step 2: Google Sheet Connection */}
        {activeStep === 2 && (
          <GoogleSheetStep
            project={project}
            initialSheetUrl={project.sheet_url || ''}
            initialTabName={project.sheet_tab_name || ''}
            onDataLoaded={handleDataLoaded}
            onProceedToMapping={() => setActiveStep(3)}
          />
        )}

        {/* Step 3: Field Mapping */}
        {activeStep === 3 && (
          <FieldMappingStep
            project={project}
            mappings={mappings}
            headers={headers}
            sampleRow={rows && rows.length > 0 ? rows[0] : undefined}
            onMappingsUpdated={setMappings}
            onProceedToPreview={() => setActiveStep(4)}
          />
        )}

        {/* Step 4: Preview & Validate */}
        {activeStep === 4 && (
          <PreviewValidationStep
            project={project}
            mappings={mappings}
            rows={rows}
            onProceedToGenerate={(fmt, pattern) => {
              setOutputFormat(fmt);
              setNamingPattern(pattern);
              setActiveStep(5);
            }}
          />
        )}

        {/* Step 5: Generate & Export */}
        {activeStep === 5 && (
          <GenerateStep
            project={project}
            rows={rows}
            outputFormat={outputFormat}
            namingPattern={namingPattern}
            onRefreshProject={handleRefreshProject}
          />
        )}
      </div>
    </div>
  );
};
