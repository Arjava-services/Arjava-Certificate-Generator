import React, { useState } from 'react';
import type { FieldMapping, ProjectDetail } from '../types';
import { api } from '../services/api';
import { TemplateCanvas } from './TemplateCanvas';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Loader2,
  Layers,
  ArrowRight,
  Bold,
  Italic,
  Type,
  Move,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
} from 'lucide-react';

interface FieldMappingStepProps {
  project: ProjectDetail;
  mappings: FieldMapping[];
  headers: string[];
  sampleRow?: Record<string, any>;
  onMappingsUpdated: (mappings: FieldMapping[]) => void;
  onProceedToPreview: () => void;
}

const FONT_OPTIONS = [
  // Formal Serif
  { name: 'Playfair Display', category: 'Formal Serif (Certificates & Honors)', family: "'Playfair Display', Georgia, serif" },
  { name: 'Cinzel', category: 'Formal Serif (Classical Luxury)', family: "'Cinzel', 'Times New Roman', serif" },
  { name: 'Cinzel Decorative', category: 'Formal Serif (Ornate Roman)', family: "'Cinzel Decorative', 'Cinzel', serif" },
  { name: 'Bodoni Moda', category: 'Formal Serif (High-Fashion Luxury)', family: "'Bodoni Moda', Georgia, serif" },
  { name: 'Prata', category: 'Formal Serif (Graceful Teardrop)', family: "'Prata', Georgia, serif" },
  { name: 'Marcellus', category: 'Formal Serif (Classical Roman Inscriptional)', family: "'Marcellus', Georgia, serif" },
  { name: 'Cormorant Garamond', category: 'Formal Serif (Traditional Diploma)', family: "'Cormorant Garamond', Garamond, serif" },
  { name: 'EB Garamond', category: 'Formal Serif (Renaissance Classical)', family: "'EB Garamond', Garamond, serif" },
  { name: 'Lora', category: 'Formal Serif (Contemporary Editorial)', family: "'Lora', Georgia, serif" },
  { name: 'Merriweather', category: 'Formal Serif (Warm Book Serif)', family: "'Merriweather', Georgia, serif" },
  { name: 'Georgia', category: 'Formal Serif (Standard System)', family: "Georgia, serif" },
  { name: 'Times New Roman', category: 'Formal Serif (Classic System)', family: "'Times New Roman', Times, serif" },

  // Modern Sans-Serif
  { name: 'Inter', category: 'Modern Sans (Ultra-Crisp Universal)', family: "'Inter', sans-serif" },
  { name: 'Outfit', category: 'Modern Sans (Geometric Display)', family: "'Outfit', sans-serif" },
  { name: 'Poppins', category: 'Modern Sans (Friendly Clean)', family: "'Poppins', sans-serif" },
  { name: 'Raleway', category: 'Modern Sans (Elegant High-Fashion)', family: "'Raleway', sans-serif" },
  { name: 'Montserrat', category: 'Modern Sans (Clean & Contemporary)', family: "'Montserrat', sans-serif" },
  { name: 'Roboto', category: 'Modern Sans (Neutral Clean)', family: "'Roboto', sans-serif" },
  { name: 'Plus Jakarta Sans', category: 'Modern Sans (Geometric)', family: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Oswald', category: 'Modern Sans (Bold & Condensed)', family: "'Oswald', sans-serif" },
  { name: 'Helvetica', category: 'Modern Sans (System Clean)', family: "Helvetica, Arial, sans-serif" },

  // Calligraphy & Script
  { name: 'Dancing Script', category: 'Calligraphy (Lively Flowing Script)', family: "'Dancing Script', cursive" },
  { name: 'Great Vibes', category: 'Calligraphy (Flowing Signature)', family: "'Great Vibes', cursive" },
  { name: 'Allura', category: 'Calligraphy (Smooth Flowing Script)', family: "'Allura', cursive" },
  { name: 'Alex Brush', category: 'Calligraphy (Formal Cursive)', family: "'Alex Brush', cursive" },
  { name: 'Tangerine', category: 'Calligraphy (Delicate Slender Script)', family: "'Tangerine', cursive" },
  { name: 'Sacramento', category: 'Calligraphy (Monoline Graceful)', family: "'Sacramento', cursive" },
  { name: 'Pinyon Script', category: 'Calligraphy (Aristocratic Script)', family: "'Pinyon Script', cursive" },
  { name: 'Parisienne', category: 'Calligraphy (Graceful Script)', family: "'Parisienne', cursive" },
  { name: 'Italianno', category: 'Calligraphy (Classic Certificate Script)', family: "'Italianno', cursive" },

  // Display & Titling
  { name: 'Abril Fatface', category: 'Display (Bold Vintage Award Titling)', family: "'Abril Fatface', serif" },

  // Monospace
  { name: 'JetBrains Mono', category: 'Monospace (Certificate Numbers & IDs)', family: "'JetBrains Mono', monospace" },
  { name: 'Space Mono', category: 'Monospace (Modern Tech Code)', family: "'Space Mono', monospace" },
  { name: 'Courier New', category: 'Monospace (Typewriter Standard)', family: "'Courier New', Courier, monospace" },
];

const COLOR_SWATCHES = [
  { label: 'Deep Marine', hex: '#112D32' },
  { label: 'Classic Teal', hex: '#254E58' },
  { label: 'Royal Bronze / Gold', hex: '#B45309' },
  { label: 'Midnight Navy', hex: '#0F172A' },
  { label: 'Noble Wine', hex: '#7F1D1D' },
  { label: 'Warm Taupe', hex: '#4F4A41' },
  { label: 'Slate Gray', hex: '#475569' },
  { label: 'Jet Black', hex: '#000000' },
  { label: 'Pure White', hex: '#FFFFFF' },
];

const QUICK_FONT_SIZES = [16, 20, 24, 30, 36, 44, 56, 72];

const COMMON_PLACEHOLDERS = [
  '{{name}}',
  '{{course}}',
  '{{date}}',
  '{{grade}}',
  '{{cert_id}}',
  '{{organization}}'
];

export const FieldMappingStep: React.FC<FieldMappingStepProps> = ({
  project,
  mappings,
  headers,
  sampleRow,
  onMappingsUpdated,
  onProceedToPreview,
}) => {
  const [currentMappings, setCurrentMappings] = useState<FieldMapping[]>(() => {
    // Ensure all fields have sensible default style values
    return mappings.map((m) => ({
      ...m,
      font_family: m.font_family || 'Playfair Display',
      font_weight: m.font_weight || 'normal',
      is_italic: m.is_italic !== undefined ? m.is_italic : false,
      opacity: m.opacity !== undefined ? m.opacity : 1.0,
      text_case: m.text_case || 'none',
      letter_spacing: m.letter_spacing !== undefined ? m.letter_spacing : 0,
    }));
  });

  // Sync mappings if loaded asynchronously
  React.useEffect(() => {
    if (mappings && mappings.length > 0 && currentMappings.length === 0) {
      setCurrentMappings(mappings.map((m) => ({
        ...m,
        font_family: m.font_family || 'Playfair Display',
        font_weight: m.font_weight || 'normal',
        is_italic: m.is_italic !== undefined ? m.is_italic : false,
        opacity: m.opacity !== undefined ? m.opacity : 1.0,
        text_case: m.text_case || 'none',
        letter_spacing: m.letter_spacing !== undefined ? m.letter_spacing : 0,
      })));
      if (mappings[0]) {
        setSelectedPlaceholder(mappings[0].placeholder);
      }
    }
  }, [mappings]);

  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string>(
    mappings[0]?.placeholder || '{{name}}'
  );
  const [newPlaceholderInput, setNewPlaceholderInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [customTestText, setCustomTestText] = useState('');

  const templateWidth = project.template_width || 842;
  const templateHeight = project.template_height || 595;
  const centerX = Math.round(templateWidth / 2);
  const centerY = Math.round(templateHeight / 2);

  const selectedMapping = currentMappings.find(
    (m) => m.placeholder === selectedPlaceholder
  ) || currentMappings[0];

  // Auto-save changes to backend after 800ms debounce
  const saveTimeoutRef = React.useRef<any>(null);
  React.useEffect(() => {
    if (currentMappings.length > 0) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        api.saveMappings(project.id, currentMappings).catch(console.error);
      }, 800);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentMappings, project.id]);

  const updateMappingField = (
    placeholder: string,
    field: keyof FieldMapping,
    val: any
  ) => {
    const updated = currentMappings.map((m) => {
      if (m.placeholder === placeholder) {
        return { ...m, [field]: val };
      }
      return m;
    });
    setCurrentMappings(updated);
    onMappingsUpdated(updated);
    setSavedSuccess(false);
  };

  const updateCoordinates = (placeholder: string, x: number, y: number) => {
    const updated = currentMappings.map((m) => {
      if (m.placeholder === placeholder) {
        return { ...m, x_pos: x, y_pos: y };
      }
      return m;
    });
    setCurrentMappings(updated);
    onMappingsUpdated(updated);
    setSavedSuccess(false);
  };

  const nudgeSelected = (dx: number, dy: number) => {
    if (!selectedMapping) return;
    const newX = Math.max(10, Math.min(templateWidth - 10, Math.round(selectedMapping.x_pos + dx)));
    const newY = Math.max(10, Math.min(templateHeight - 10, Math.round(selectedMapping.y_pos + dy)));
    updateCoordinates(selectedMapping.placeholder, newX, newY);
  };

  const centerHorizontally = () => {
    if (!selectedMapping) return;
    updateCoordinates(selectedMapping.placeholder, centerX, selectedMapping.y_pos);
  };

  const centerVertically = () => {
    if (!selectedMapping) return;
    updateCoordinates(selectedMapping.placeholder, selectedMapping.x_pos, centerY);
  };

  const handleAddPlaceholder = (placeholderName?: string) => {
    let ph = (placeholderName || newPlaceholderInput).trim();
    if (!ph) return;
    if (!ph.startsWith('{{')) ph = `{{${ph}`;
    if (!ph.endsWith('}}')) ph = `${ph}}}`;

    if (currentMappings.some((m) => m.placeholder.toLowerCase() === ph.toLowerCase())) {
      setSelectedPlaceholder(ph);
      setNewPlaceholderInput('');
      return;
    }

    // Try auto-matching with headers
    const innerName = ph.replace(/[{}]/g, '').toLowerCase();
    const matchedCol = headers.find(
      (h) => h.toLowerCase() === innerName || h.toLowerCase().includes(innerName)
    );

    // Stagger new fields nicely down the center of the canvas
    const offsetY = 200 + (currentMappings.length % 5) * 50;

    const newMapping: FieldMapping = {
      placeholder: ph,
      sheet_column: matchedCol || null,
      font_family: innerName.includes('name') ? 'Playfair Display' : 'Montserrat',
      font_size: innerName.includes('name') ? 32 : 22,
      font_color: '#112D32',
      font_weight: innerName.includes('name') ? 'bold' : 'normal',
      is_italic: false,
      opacity: 1.0,
      text_case: 'none',
      letter_spacing: 0,
      x_pos: centerX,
      y_pos: Math.min(templateHeight - 60, offsetY),
      width: 320,
      height: 44,
      alignment: 'center',
      is_auto_detected: false,
      is_required: true,
    };

    const next = [...currentMappings, newMapping];
    setCurrentMappings(next);
    onMappingsUpdated(next);
    setSelectedPlaceholder(ph);
    setNewPlaceholderInput('');
  };

  const handleDuplicatePlaceholder = (m: FieldMapping) => {
    const baseName = m.placeholder.replace(/[{}]/g, '');
    let counter = 2;
    let newPh = `{{${baseName}_${counter}}}`;
    while (currentMappings.some((item) => item.placeholder === newPh)) {
      counter++;
      newPh = `{{${baseName}_${counter}}}`;
    }

    const duplicated: FieldMapping = {
      ...m,
      placeholder: newPh,
      x_pos: Math.min(templateWidth - 20, m.x_pos + 15),
      y_pos: Math.min(templateHeight - 20, m.y_pos + 25),
    };

    const next = [...currentMappings, duplicated];
    setCurrentMappings(next);
    onMappingsUpdated(next);
    setSelectedPlaceholder(newPh);
  };

  const handleRemovePlaceholder = (ph: string) => {
    const next = currentMappings.filter((m) => m.placeholder !== ph);
    setCurrentMappings(next);
    onMappingsUpdated(next);
    if (selectedPlaceholder === ph && next.length > 0) {
      setSelectedPlaceholder(next[0].placeholder);
    }
  };

  const handleSmartAutoMatch = () => {
    let matchCount = 0;
    const updated = currentMappings.map((m) => {
      const cleanKey = m.placeholder.replace(/[{}]/g, '').trim().toLowerCase();
      const matched = headers.find((h) => {
        const hClean = h.trim().toLowerCase();
        return hClean === cleanKey || hClean.includes(cleanKey) || cleanKey.includes(hClean);
      });
      if (matched && matched !== m.sheet_column) matchCount++;
      return {
        ...m,
        sheet_column: matched || m.sheet_column || null,
      };
    });
    setCurrentMappings(updated);
    onMappingsUpdated(updated);
    alert(`Smart Auto-Match processed! ${matchCount} new column links assigned.`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await api.saveMappings(project.id, currentMappings);
      onMappingsUpdated(saved);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save layout mappings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndProceed = async () => {
    setSaving(true);
    try {
      const saved = await api.saveMappings(project.id, currentMappings);
      onMappingsUpdated(saved);
      onProceedToPreview();
    } catch (err: any) {
      alert('Failed to save mappings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Preview text for currently selected mapping
  const previewSampleText = customTestText || (() => {
    if (!selectedMapping) return 'Sample Text';
    if (selectedMapping.sheet_column && sampleRow && sampleRow[selectedMapping.sheet_column]) {
      return String(sampleRow[selectedMapping.sheet_column]);
    }
    const clean = selectedMapping.placeholder.replace(/[{}]/g, '').toLowerCase();
    if (clean.includes('name')) return 'Alexander James Wright';
    if (clean.includes('course') || clean.includes('award')) return 'Excellence in Cloud Engineering';
    if (clean.includes('date')) return 'October 24, 2026';
    if (clean.includes('grade')) return 'Grade: Distinction (98%)';
    return selectedMapping.placeholder;
  })();

  const getTransformedSampleText = (raw: string) => {
    if (!selectedMapping) return raw;
    if (selectedMapping.text_case === 'uppercase') return raw.toUpperCase();
    if (selectedMapping.text_case === 'lowercase') return raw.toLowerCase();
    if (selectedMapping.text_case === 'capitalize') {
      return raw.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return raw;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Top Banner & Primary Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-surface-teal)',
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.1rem 1.4rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)',
              color: 'var(--color-seafoam)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(17, 45, 50, 0.25)',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-marine)' }}>
              Step 3: Field Mapping & Visual Layout
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Map template placeholders to Google Sheet columns and style typography with live visual positioning
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSmartAutoMatch}
            title="Automatically matches placeholders like {{name}} to sheet column 'Name'"
          >
            <Sparkles size={14} color="var(--color-teal)" />
            <span>Smart Auto-Match</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={14} className="spin-animation" />
            ) : savedSuccess ? (
              <Check size={14} color="var(--color-teal)" />
            ) : (
              <Save size={14} />
            )}
            <span>{savedSuccess ? 'Layout Saved!' : 'Save Layout'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSaveAndProceed}
            disabled={saving}
          >
            <span>Preview & Validate</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas on Left, Studio Inspector on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 1.25fr) minmax(340px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left: Interactive Canvas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
          <TemplateCanvas
            project={project}
            mappings={currentMappings}
            selectedPlaceholder={selectedPlaceholder}
            onSelectMapping={(m) => setSelectedPlaceholder(m.placeholder)}
            onUpdateCoordinates={updateCoordinates}
            sampleData={sampleRow}
            showSamplePreview={showLivePreview}
            onToggleSamplePreview={setShowLivePreview}
          />
        </div>

        {/* Right: Studio Controls (Field Mapping List + Advanced Typography Inspector) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Card 1: Fields & Column Mapping */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Layers size={16} color="var(--color-teal)" />
                <span style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--color-marine)' }}>
                  Placeholders & Data Columns ({currentMappings.length})
                </span>
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Click a field to edit typography
              </span>
            </div>

            {/* Quick Suggestions for Add Field */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quick Add:</span>
              {COMMON_PLACEHOLDERS.map((ph) => {
                const alreadyExists = currentMappings.some((m) => m.placeholder === ph);
                if (alreadyExists) return null;
                return (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => handleAddPlaceholder(ph)}
                    style={{
                      background: 'var(--bg-surface-teal)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-teal)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                    title={`Add ${ph}`}
                  >
                    <Plus size={10} />
                    <span>{ph}</span>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Field Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddPlaceholder();
              }}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <input
                type="text"
                className="input-text"
                placeholder="Custom placeholder, e.g. {{award_title}}"
                value={newPlaceholderInput}
                onChange={(e) => setNewPlaceholderInput(e.target.value)}
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
              />
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={!newPlaceholderInput.trim()}
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </form>

            {/* List of Mapped Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
              {currentMappings.map((m) => {
                const isSelected = selectedPlaceholder === m.placeholder;
                const isMapped = Boolean(m.sheet_column);

                return (
                  <div
                    key={m.placeholder}
                    onClick={() => setSelectedPlaceholder(m.placeholder)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.75rem',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(17, 45, 50, 0.08) 0%, rgba(37, 78, 88, 0.12) 100%)'
                        : '#FFFFFF',
                      border: `1.5px solid ${isSelected ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(37, 78, 88, 0.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Placeholder name & font badge */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '0.825rem',
                            color: isSelected ? 'var(--color-teal)' : 'var(--color-marine)',
                          }}
                        >
                          {m.placeholder}
                        </span>
                        {!isMapped && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: '#B45309',
                              background: 'rgba(245, 158, 11, 0.12)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <AlertTriangle size={10} />
                            <span>Unmapped</span>
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.font_family} • {m.font_size}pt {m.font_weight === 'bold' ? '• Bold' : ''} {m.is_italic ? '• Italic' : ''}
                      </div>
                    </div>

                    {/* Column Select Dropdown */}
                    <div style={{ width: '150px' }} onClick={(e) => e.stopPropagation()}>
                      <select
                        className="select-input"
                        value={m.sheet_column || ''}
                        onChange={(e) => updateMappingField(m.placeholder, 'sheet_column', e.target.value || null)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          fontSize: '0.775rem',
                          background: isMapped ? 'var(--bg-surface)' : 'rgba(245, 158, 11, 0.08)',
                          borderColor: isMapped ? 'var(--border-subtle)' : '#F59E0B',
                          color: 'var(--color-marine)',
                        }}
                      >
                        <option value="">-- Unmapped --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Actions: Duplicate & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDuplicatePlaceholder(m)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                        }}
                        title="Duplicate Field"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePlaceholder(m.placeholder)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                        }}
                        title="Remove Field"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Advanced Typography & Visual Text Editor Inspector */}
          {selectedMapping && (
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem',
                padding: '1.25rem',
                border: '1.5px solid var(--border-light)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {/* Header with Active Field identifier */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Type size={17} color="var(--color-teal)" />
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-marine)' }}>
                    Text Editor for <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-teal)' }}>{selectedMapping.placeholder}</span>
                  </span>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Pos: ({Math.round(selectedMapping.x_pos)}, {Math.round(selectedMapping.y_pos)}) pt
                </div>
              </div>

              {/* Real-time Mini Text Preview Box */}
              <div
                style={{
                  background: 'var(--bg-surface-teal)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Live Text Style Preview
                  </span>
                  <input
                    type="text"
                    value={customTestText}
                    onChange={(e) => setCustomTestText(e.target.value)}
                    placeholder="Type test text..."
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      background: '#FFFFFF',
                      width: '130px',
                    }}
                    title="Type custom preview text to see how it renders"
                  />
                </div>
                <div
                  style={{
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: selectedMapping.alignment === 'center' ? 'center' : selectedMapping.alignment === 'right' ? 'flex-end' : 'flex-start',
                    fontFamily: selectedMapping.font_family,
                    fontSize: `${Math.min(32, Math.max(14, selectedMapping.font_size))}px`,
                    fontWeight: selectedMapping.font_weight || 'normal',
                    fontStyle: selectedMapping.is_italic ? 'italic' : 'normal',
                    color: selectedMapping.font_color || '#112D32',
                    opacity: selectedMapping.opacity !== undefined ? selectedMapping.opacity : 1.0,
                    letterSpacing: selectedMapping.letter_spacing ? `${selectedMapping.letter_spacing}px` : 'normal',
                    textAlign: selectedMapping.alignment || 'center',
                    wordBreak: 'break-word',
                    padding: '4px',
                  }}
                >
                  {getTransformedSampleText(previewSampleText)}
                </div>
              </div>

              {/* 1. Font Family & Style Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    <span>Font Family & Typography Style</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{selectedMapping.font_family}</span>
                  </label>
                  <select
                    className="select-input"
                    value={selectedMapping.font_family || 'Playfair Display'}
                    onChange={(e) => updateMappingField(selectedMapping.placeholder, 'font_family', e.target.value)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      fontFamily: selectedMapping.font_family,
                    }}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.name} value={font.name} style={{ fontFamily: font.family }}>
                        {font.name} — {font.category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Weight & Italic & Alignment Segmented Toolbar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {/* Style Toggles: Bold & Italic */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem' }}>Font Style</label>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {/* Bold Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const isBold = selectedMapping.font_weight === 'bold' || selectedMapping.font_weight === '700';
                          updateMappingField(selectedMapping.placeholder, 'font_weight', isBold ? 'normal' : 'bold');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${selectedMapping.font_weight === 'bold' ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                          background: selectedMapping.font_weight === 'bold' ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)' : '#FFFFFF',
                          color: selectedMapping.font_weight === 'bold' ? 'var(--color-seafoam)' : 'var(--color-marine)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                        }}
                        title="Toggle Bold"
                      >
                        <Bold size={15} />
                        <span>Bold</span>
                      </button>

                      {/* Italic Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          updateMappingField(selectedMapping.placeholder, 'is_italic', !selectedMapping.is_italic);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${selectedMapping.is_italic ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                          background: selectedMapping.is_italic ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)' : '#FFFFFF',
                          color: selectedMapping.is_italic ? 'var(--color-seafoam)' : 'var(--color-marine)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          fontStyle: 'italic',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                        }}
                        title="Toggle Italic"
                      >
                        <Italic size={15} />
                        <span>Italic</span>
                      </button>
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem' }}>Alignment</label>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateMappingField(selectedMapping.placeholder, 'alignment', align)}
                          style={{
                            flex: 1,
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            border: `1.5px solid ${selectedMapping.alignment === align ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                            background: selectedMapping.alignment === align ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)' : '#FFFFFF',
                            color: selectedMapping.alignment === align ? 'var(--color-seafoam)' : 'var(--color-marine)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={`Align ${align}`}
                        >
                          {align === 'left' && <AlignLeft size={16} />}
                          {align === 'center' && <AlignCenter size={16} />}
                          {align === 'right' && <AlignRight size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text Case / Transform */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Text Case</label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[
                      { val: 'none', label: 'As-Is', display: 'Aa' },
                      { val: 'uppercase', label: 'UPPER', display: 'AA' },
                      { val: 'lowercase', label: 'lower', display: 'aa' },
                      { val: 'capitalize', label: 'Title Case', display: 'Ab' },
                    ].map((c) => {
                      const isActive = (selectedMapping.text_case || 'none') === c.val;
                      return (
                        <button
                          key={c.val}
                          type="button"
                          onClick={() => updateMappingField(selectedMapping.placeholder, 'text_case', c.val)}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${isActive ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                            background: isActive ? 'var(--bg-surface-teal)' : '#FFFFFF',
                            color: isActive ? 'var(--color-teal)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 800 : 500,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                          title={c.label}
                        >
                          <span style={{ fontSize: '0.85rem' }}>{c.display}</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Font Size with Slider + Stepper + Quick Chips */}
              <div className="input-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="input-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                    Font Size
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => updateMappingField(selectedMapping.placeholder, 'font_size', Math.max(8, selectedMapping.font_size - 1))}
                      style={{
                        padding: '2px 7px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                      title="Decrease font size by 1pt"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="8"
                      max="120"
                      value={selectedMapping.font_size}
                      onChange={(e) => updateMappingField(selectedMapping.placeholder, 'font_size', parseInt(e.target.value) || 24)}
                      style={{
                        width: '54px',
                        padding: '2px 4px',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>pt</span>
                    <button
                      type="button"
                      onClick={() => updateMappingField(selectedMapping.placeholder, 'font_size', Math.min(120, selectedMapping.font_size + 1))}
                      style={{
                        padding: '2px 7px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                      title="Increase font size by 1pt"
                    >
                      +
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="8"
                  max="96"
                  step="1"
                  value={selectedMapping.font_size}
                  onChange={(e) => updateMappingField(selectedMapping.placeholder, 'font_size', parseInt(e.target.value))}
                  style={{ accentColor: 'var(--color-teal)', cursor: 'pointer', width: '100%', marginTop: '0.4rem' }}
                />

                {/* Quick Font Size Preset Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                  {QUICK_FONT_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => updateMappingField(selectedMapping.placeholder, 'font_size', sz)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.725rem',
                        fontWeight: selectedMapping.font_size === sz ? 700 : 500,
                        border: `1px solid ${selectedMapping.font_size === sz ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                        background: selectedMapping.font_size === sz ? 'var(--bg-surface-teal)' : '#FFFFFF',
                        color: selectedMapping.font_size === sz ? 'var(--color-teal)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {sz}pt
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Text Color & Opacity (Transparency) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Font Color */}
                <div className="input-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="input-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                      Text Color
                    </label>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {selectedMapping.font_color}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
                    <input
                      type="color"
                      value={selectedMapping.font_color}
                      onChange={(e) => updateMappingField(selectedMapping.placeholder, 'font_color', e.target.value)}
                      style={{
                        width: '42px',
                        height: '36px',
                        padding: 0,
                        border: '1.5px solid var(--border-subtle)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                      title="Open color picker"
                    />
                    <input
                      type="text"
                      className="input-text"
                      value={selectedMapping.font_color}
                      onChange={(e) => updateMappingField(selectedMapping.placeholder, 'font_color', e.target.value)}
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  {/* Palette Swatches */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => updateMappingField(selectedMapping.placeholder, 'font_color', swatch.hex)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: swatch.hex,
                          border: `2px solid ${selectedMapping.font_color.toLowerCase() === swatch.hex.toLowerCase() ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                          boxShadow: selectedMapping.font_color.toLowerCase() === swatch.hex.toLowerCase() ? '0 0 0 2px var(--color-seafoam)' : 'none',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease',
                        }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Opacity Slider */}
                <div className="input-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="input-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                      Text Opacity (Transparency)
                    </label>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                      {Math.round((selectedMapping.opacity !== undefined ? selectedMapping.opacity : 1.0) * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={Math.round((selectedMapping.opacity !== undefined ? selectedMapping.opacity : 1.0) * 100)}
                    onChange={(e) => updateMappingField(selectedMapping.placeholder, 'opacity', parseInt(e.target.value) / 100)}
                    style={{ accentColor: 'var(--color-teal)', cursor: 'pointer', width: '100%', marginTop: '0.4rem' }}
                  />

                  {/* Quick Opacity Presets */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                    {[
                      { label: 'Solid 100%', val: 1.0 },
                      { label: 'Soft 85%', val: 0.85 },
                      { label: 'Muted 60%', val: 0.6 },
                      { label: 'Watermark 30%', val: 0.3 },
                    ].map((op) => {
                      const curr = selectedMapping.opacity !== undefined ? selectedMapping.opacity : 1.0;
                      const isActive = Math.abs(curr - op.val) < 0.05;
                      return (
                        <button
                          key={op.label}
                          type="button"
                          onClick={() => updateMappingField(selectedMapping.placeholder, 'opacity', op.val)}
                          style={{
                            flex: 1,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            fontSize: '0.675rem',
                            fontWeight: isActive ? 700 : 500,
                            border: `1px solid ${isActive ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                            background: isActive ? 'var(--bg-surface-teal)' : '#FFFFFF',
                            color: isActive ? 'var(--color-teal)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          {op.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Letter Spacing (Kerning) */}
                <div className="input-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="input-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                      Letter Spacing (Kerning)
                    </label>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-teal)' }}>
                      {selectedMapping.letter_spacing || 0} px
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={selectedMapping.letter_spacing || 0}
                    onChange={(e) => updateMappingField(selectedMapping.placeholder, 'letter_spacing', parseInt(e.target.value) || 0)}
                    style={{ accentColor: 'var(--color-teal)', cursor: 'pointer', width: '100%', marginTop: '0.4rem' }}
                  />
                </div>
              </div>

              {/* 4. Precision Positioning & Alignment Helpers */}
              <div
                style={{
                  background: 'var(--bg-surface-teal)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Move size={14} color="var(--color-teal)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-marine)' }}>
                      Precision Position & Centering
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Coordinates in Points
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>X:</span>
                    <input
                      type="number"
                      value={Math.round(selectedMapping.x_pos)}
                      onChange={(e) => updateCoordinates(selectedMapping.placeholder, parseInt(e.target.value) || 0, selectedMapping.y_pos)}
                      style={{
                        width: '100%',
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.8125rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        background: '#FFFFFF',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>Y:</span>
                    <input
                      type="number"
                      value={Math.round(selectedMapping.y_pos)}
                      onChange={(e) => updateCoordinates(selectedMapping.placeholder, selectedMapping.x_pos, parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.8125rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        background: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                {/* Quick Center Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={centerHorizontally}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: '#FFFFFF',
                      color: 'var(--color-marine)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Center field horizontally on template canvas"
                  >
                    <AlignHorizontalJustifyCenter size={14} color="var(--color-teal)" />
                    <span>Center Horiz</span>
                  </button>

                  <button
                    type="button"
                    onClick={centerVertically}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: '#FFFFFF',
                      color: 'var(--color-marine)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Center field vertically on template canvas"
                  >
                    <AlignVerticalJustifyCenter size={14} color="var(--color-teal)" />
                    <span>Center Vert</span>
                  </button>
                </div>

                {/* Nudge D-Pad Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', paddingTop: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.35rem' }}>Nudge:</span>
                  <button
                    type="button"
                    onClick={() => nudgeSelected(-1, 0)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#FFFFFF', cursor: 'pointer' }}
                    title="Nudge Left 1pt (or drag on canvas)"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeSelected(0, -1)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#FFFFFF', cursor: 'pointer' }}
                    title="Nudge Up 1pt"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeSelected(0, 1)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#FFFFFF', cursor: 'pointer' }}
                    title="Nudge Down 1pt"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeSelected(1, 0)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#FFFFFF', cursor: 'pointer' }}
                    title="Nudge Right 1pt"
                  >
                    <ChevronRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeSelected(-10, 0)}
                    style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#FFFFFF', cursor: 'pointer', fontSize: '0.675rem', fontWeight: 600 }}
                    title="Nudge Left 10pt"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeSelected(10, 0)}
                    style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: '#FFFFFF', cursor: 'pointer', fontSize: '0.675rem', fontWeight: 600 }}
                    title="Nudge Right 10pt"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Proceed Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleSaveAndProceed}
              disabled={saving}
              style={{ width: '100%', gap: '0.75rem' }}
            >
              <span>Continue to Step 4: Preview & Validate</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
