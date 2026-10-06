import React, { useState, useEffect } from 'react';
import type { SheetConnectResponse, SheetDataResponse, SheetTabInfo, ProjectDetail } from '../types';
import { api } from '../services/api';
import {
  Table,
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Eye,
  Plus,
  Layers,
} from 'lucide-react';

interface GoogleSheetStepProps {
  project: ProjectDetail;
  initialSheetUrl?: string;
  initialTabName?: string;
  existingTabs?: SheetTabInfo[];
  onTabsUpdated?: (tabs: SheetTabInfo[]) => void;
  existingHeaders?: string[];
  existingRows?: Record<string, any>[];
  onDataLoaded: (headers: string[], rows: Record<string, any>[], sheetUrl: string, tabName: string) => void;
  onProceedToMapping?: () => void;
}

export const GoogleSheetStep: React.FC<GoogleSheetStepProps> = ({
  project,
  initialSheetUrl = '',
  initialTabName = '',
  existingTabs = [],
  onTabsUpdated,
  existingHeaders = [],
  existingRows = [],
  onDataLoaded,
  onProceedToMapping,
}) => {
  const [sheetUrl, setSheetUrl] = useState(initialSheetUrl || project.sheet_url || '');
  const [connecting, setConnecting] = useState(false);
  const [readingData, setReadingData] = useState(false);
  const [loadingTab, setLoadingTab] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tabs, setTabs] = useState<SheetTabInfo[]>(existingTabs && existingTabs.length > 0 ? existingTabs : []);
  const [selectedTab, setSelectedTab] = useState<string>(initialTabName || project.sheet_tab_name || '');
  const [customTabInput, setCustomTabInput] = useState<string>('');
  const [showCustomTabInput, setShowCustomTabInput] = useState<boolean>(false);
  const [dataResponse, setDataResponse] = useState<SheetDataResponse | null>(() => {
    if (existingHeaders && existingHeaders.length > 0 && existingRows && existingRows.length > 0) {
      return {
        spreadsheet_id: project.sheet_id || '',
        tab_name: initialTabName || project.sheet_tab_name || '',
        total_rows: existingRows.length,
        headers: existingHeaders,
        preview_rows: existingRows.slice(0, 10),
        all_rows: existingRows,
      };
    }
    return null;
  });

  const [templateImgSrc, setTemplateImgSrc] = useState(
    api.getTemplatePreviewUrl(project.id, project.updated_at)
  );

  // Sync tabs from parent if updated
  useEffect(() => {
    if (existingTabs && existingTabs.length > 0) {
      setTabs(existingTabs);
    }
  }, [existingTabs]);

  // If sheetUrl exists and tabs is empty, automatically fetch tabs on mount
  useEffect(() => {
    const targetUrl = (sheetUrl || project.sheet_url || '').trim();
    if (targetUrl && tabs.length === 0 && !connecting) {
      setConnecting(true);
      api.connectSheet(targetUrl)
        .then((res) => {
          if (res?.tabs && res.tabs.length > 0) {
            setTabs(res.tabs);
            onTabsUpdated?.(res.tabs);
          }
        })
        .catch((e) => console.warn('Could not auto-fetch tabs:', e))
        .finally(() => setConnecting(false));
    }
  }, []);

  const handleConnect = async (urlToConnect = sheetUrl) => {
    const trimmed = urlToConnect.trim();
    if (!trimmed) {
      setError('Please enter a Google Sheet URL or ID.');
      return;
    }
    setError(null);
    setConnecting(true);

    try {
      const res: SheetConnectResponse = await api.connectSheet(trimmed);
      setTabs(res.tabs);
      onTabsUpdated?.(res.tabs);
      if (!res.tabs || res.tabs.length === 0) {
        setError('No sheet tabs were found in this spreadsheet. Please ensure the sheet is shared as "Anyone with the link can view".');
      } else {
        const found = res.tabs.find((t) => t.title.toLowerCase() === selectedTab.toLowerCase());
        if (found) {
          setSelectedTab(found.title);
        }
      }
      // Note: We do NOT auto-select tab 0 and do NOT auto-advance to next page!
      // The tabs will be displayed on screen so the user can choose which tab to use.
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google Sheet. Make sure the sheet is shared as "Anyone with the link can view".');
    } finally {
      setConnecting(false);
    }
  };

  const fetchTabDataAndAdvance = async (url: string, tab: string) => {
    if (!tab.trim()) return;
    setLoadingTab(tab.trim());
    setReadingData(true);
    setError(null);
    try {
      const data = await api.getSheetData(url, tab.trim());
      setDataResponse(data);
      setSelectedTab(tab.trim());
      // Persist to project
      await api.updateProject(project.id, {
        sheet_url: url,
        sheet_id: data.spreadsheet_id,
        sheet_tab_name: tab.trim(),
      });
      onDataLoaded(data.headers, data.all_rows || data.preview_rows, url, tab.trim());
    } catch (err: any) {
      setError(err.message || `Failed to read data from sheet tab '${tab}'. Make sure row 1 contains headers.`);
    } finally {
      setReadingData(false);
      setLoadingTab(null);
    }
  };

  const handleTabClick = async (newTab: string) => {
    const targetUrl = (sheetUrl || project.sheet_url || '').trim();
    if (!targetUrl) {
      setError('Please provide a Google Sheet URL first.');
      return;
    }
    setSelectedTab(newTab);
    await fetchTabDataAndAdvance(targetUrl, newTab);
  };

  const handleLoadCustomTab = async () => {
    const trimmed = customTabInput.trim();
    if (!trimmed) return;
    if (!tabs.some((t) => t.title.toLowerCase() === trimmed.toLowerCase())) {
      const newTabs = [...tabs, { title: trimmed, sheet_id: tabs.length, row_count: 0 }];
      setTabs(newTabs);
      onTabsUpdated?.(newTabs);
    }
    await handleTabClick(trimmed);
    setCustomTabInput('');
    setShowCustomTabInput(false);
  };

  const handleLoadDemo = async () => {
    setError(null);
    setReadingData(true);
    try {
      const demo = await api.getDemoParticipants();
      const demoUrl = 'https://docs.google.com/spreadsheets/d/demo-hackathon-2026/edit';
      setSheetUrl(demoUrl);
      const demoTabs = [{ title: 'Participants', row_count: demo.total_rows }];
      setTabs(demoTabs);
      onTabsUpdated?.(demoTabs);
      setSelectedTab('Participants');
      setDataResponse(demo);
      await api.updateProject(project.id, {
        sheet_url: demoUrl,
        sheet_id: demo.spreadsheet_id,
        sheet_tab_name: 'Participants',
      });
      onDataLoaded(demo.headers, demo.all_rows || demo.preview_rows, demoUrl, 'Participants');
    } catch (err: any) {
      setError('Failed to load demo participant data: ' + err.message);
    } finally {
      setReadingData(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Split: Active Template Card + Connect Instructions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
        gap: '1.25rem',
        alignItems: 'stretch'
      }}>
        {/* Left: Prominent Active Template Preview Card */}
        <div
          className="card card-interactive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            background: 'var(--bg-surface-teal)',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-marine)' }}>
              <Eye size={16} color="var(--color-teal)" />
              <span>Active Template</span>
            </div>
            <span className="badge badge-dark" style={{ fontSize: '0.675rem', padding: '0.15rem 0.5rem' }}>
              Step 1 Done ✓
            </span>
          </div>

          {/* Template Thumbnail Frame */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '160px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <img
              src={templateImgSrc}
              alt="Active Certificate Template"
              onError={() => {
                const directUrl = api.getTemplateDirectUrl(project.id);
                if (templateImgSrc !== directUrl && !templateImgSrc.endsWith(directUrl)) {
                  setTemplateImgSrc(directUrl);
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

          {/* Template Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.775rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-marine)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.template_original_name || 'Uploaded Certificate Template'}
            </div>
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{Math.round(project.template_width || 842)} × {Math.round(project.template_height || 595)} pt</span>
              <span>•</span>
              <span style={{ textTransform: 'uppercase' }}>{project.template_file_type || 'image'}</span>
            </div>
          </div>
        </div>

        {/* Right: Connect Instructions & Fast Demo */}
        <div
          className="card card-interactive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)',
                color: 'var(--color-seafoam)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(17, 45, 50, 0.2)'
              }}>
                <Table size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-marine)' }}>
                  Step 2: Connect Participant Data
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Provide a Google Sheet with participant records (Row 1 will be used as header names).
                </p>
              </div>
            </div>

            <div style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface-teal)',
              padding: '0.75rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginTop: '0.25rem'
            }}>
              💡 <strong>Tip:</strong> Ensure your Google Sheet is shared with <em>"Anyone with the link can view"</em>.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="btn btn-seafoam btn-sm"
              disabled={readingData}
            >
              <Sparkles size={14} />
              <span>Load 8 Demo Participants (Quick Test)</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FFF1F2',
          border: '1px solid #FECDD3',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          color: '#991B1B',
          fontSize: '0.875rem',
          whiteSpace: 'pre-line'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Input row */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="input-group">
          <label className="input-label" htmlFor="sheetUrl">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-marine)', fontWeight: 700 }}>
              <Link2 size={16} color="var(--color-teal)" />
              <span>Google Sheet URL</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Supports public link or Google Cloud Service Account
            </span>
          </label>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              id="sheetUrl"
              type="url"
              className="input-text"
              style={{ flex: 1, minWidth: '300px' }}
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConnect();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleConnect()}
              disabled={connecting || !sheetUrl.trim()}
              style={{ minWidth: '160px' }}
            >
              {connecting ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Fetching Tabs...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  <span>Fetch Sheet Tabs</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab selector and access section */}
        {tabs.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Layers size={18} color="var(--color-teal)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-marine)' }}>
                  Tabs in this Google Sheet:
                </span>
                <span className="badge badge-seafoam" style={{ fontSize: '0.725rem', padding: '0.2rem 0.6rem' }}>
                  Click a tab to load & proceed
                </span>
                {selectedTab && (
                  <span className="badge badge-dark" style={{ fontSize: '0.725rem', padding: '0.2rem 0.6rem' }}>
                    Active: {selectedTab}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCustomTabInput(!showCustomTabInput)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-teal)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '2px 6px',
                }}
              >
                <Plus size={13} />
                <span>{showCustomTabInput ? 'Cancel' : 'Enter Different Tab Name'}</span>
              </button>
            </div>

            {/* Discovered Tab Pills */}
            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {tabs.map((t) => {
                const isSelected = selectedTab.toLowerCase() === t.title.toLowerCase();
                const isLoadingThis = loadingTab === t.title;
                return (
                  <button
                    type="button"
                    key={t.title}
                    onClick={() => handleTabClick(t.title)}
                    disabled={readingData}
                    title={`Click to load "${t.title}" and proceed to Field Mapping`}
                    style={{
                      padding: '0.5rem 1.15rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isSelected ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                      background: isSelected
                        ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)'
                        : 'var(--bg-surface-teal)',
                      color: isSelected ? 'var(--color-seafoam)' : 'var(--color-marine)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: readingData ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(17, 45, 50, 0.25)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    {isLoadingThis ? (
                      <Loader2 size={14} className="spin-animation" />
                    ) : (
                      <Table size={14} />
                    )}
                    <span>{t.title}</span>
                    {t.row_count !== undefined && t.row_count > 0 && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        opacity: 0.85,
                        marginLeft: '2px'
                      }}>
                        ({t.row_count})
                      </span>
                    )}
                    {isSelected && !isLoadingThis && <span style={{ fontSize: '0.75rem' }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Custom Tab Input row if user wants a specific tab not listed */}
            {showCustomTabInput && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                background: 'var(--bg-surface-teal)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                marginTop: '0.25rem'
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Tab Name:
                </span>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. Sheet2, Finalists, Batch 1"
                  value={customTabInput}
                  onChange={(e) => setCustomTabInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLoadCustomTab();
                    }
                  }}
                  style={{ flex: 1, maxWidth: '280px', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleLoadCustomTab}
                  disabled={readingData || !customTabInput.trim()}
                  style={{ padding: '0.35rem 0.85rem' }}
                >
                  <span>Load Tab</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spreadsheet Preview Table */}
      {readingData && (
        <div style={{
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <Loader2 size={26} className="spin-animation" color="var(--color-teal)" />
          <span style={{ fontWeight: 600 }}>Reading spreadsheet rows and column headers...</span>
        </div>
      )}

      {dataResponse && !readingData && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} color="#1B5E20" />
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-marine)' }}>
                Spreadsheet Data Loaded
              </span>
              <span className="badge badge-dark" style={{ marginLeft: '0.25rem' }}>
                {dataResponse.total_rows} Participants
              </span>
            </div>

            {onProceedToMapping && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onProceedToMapping}
                style={{ padding: '0.5rem 1.15rem' }}
              >
                <span>Proceed to Step 3: Field Mapping</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Detected Columns:{' '}
            <span style={{ color: 'var(--color-marine)', fontWeight: 700 }}>
              {dataResponse.headers.join(', ')}
            </span>
          </div>

          {/* Table Container */}
          <div style={{
            overflowX: 'auto',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            background: '#FFFFFF',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, var(--color-marine) 0%, var(--color-teal) 100%)', color: '#FFFFFF' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, width: '60px', color: 'var(--color-seafoam)' }}>#</th>
                  {dataResponse.headers.map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 700, letterSpacing: '0.02em', color: '#FFFFFF' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataResponse.preview_rows.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? '#FFFFFF' : 'var(--bg-surface-teal)',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    {dataResponse.headers.map((h) => (
                      <td key={h} style={{ padding: '0.65rem 1rem', color: 'var(--color-marine)', fontWeight: 500 }}>
                        {row[h] || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dataResponse.total_rows > dataResponse.preview_rows.length && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Showing first {dataResponse.preview_rows.length} of {dataResponse.total_rows} participants
            </div>
          )}
        </div>
      )}
    </div>
  );
};
