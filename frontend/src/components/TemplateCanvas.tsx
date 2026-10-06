import React, { useRef, useState, useEffect } from 'react';
import type { FieldMapping, ProjectDetail } from '../types';
import { api } from '../services/api';
import {
  Eye,
  Move,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Type,
  Plus,
  Trash2,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter
} from 'lucide-react';

interface TemplateCanvasProps {
  project: ProjectDetail;
  mappings: FieldMapping[];
  onSelectMapping: (mapping: FieldMapping) => void;
  selectedPlaceholder?: string;
  onUpdateCoordinates?: (placeholder: string, x: number, y: number) => void;
  sampleData?: Record<string, any>;
  showSamplePreview?: boolean;
  onToggleSamplePreview?: (val: boolean) => void;
  onAddText?: () => void;
  onCenterHorizontal?: (placeholder: string) => void;
  onCenterVertical?: (placeholder: string) => void;
  onDeleteField?: (placeholder: string) => void;
}

export const cleanFieldName = (ph: string) => {
  return ph.replace(/^\{\{|\}\}$/g, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
};

export const getTextShadowCss = (effect?: string) => {
  switch (effect) {
    case 'soft':
      return '0 2px 6px rgba(0, 0, 0, 0.35)';
    case 'drop':
      return '2px 2px 0px rgba(0, 0, 0, 0.65)';
    case 'glow':
      return '0 0 10px rgba(234, 179, 8, 0.8), 0 0 3px rgba(255, 255, 255, 0.9)';
    case 'outline':
      return '-1px -1px 0 #FFFFFF, 1px -1px 0 #FFFFFF, -1px 1px 0 #FFFFFF, 1px 1px 0 #FFFFFF';
    default:
      return 'none';
  }
};

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({
  project,
  mappings,
  onSelectMapping,
  selectedPlaceholder,
  onUpdateCoordinates,
  sampleData,
  showSamplePreview = true,
  onToggleSamplePreview,
  onAddText,
  onCenterHorizontal,
  onCenterVertical,
  onDeleteField,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPlaceholder, setDraggedPlaceholder] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showCenterGuides, setShowCenterGuides] = useState<boolean>(true);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 565,
  });

  const initialUrl = api.getTemplatePreviewUrl(project.id, project.updated_at);
  const [imgSrc, setImgSrc] = useState(initialUrl);

  const templateWidth = project.template_width || 842;
  const templateHeight = project.template_height || 595;
  const centerX = Math.round(templateWidth / 2);
  const centerY = Math.round(templateHeight / 2);

  // Measure container dimensions for proportional font sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update image source when project changes
  useEffect(() => {
    const url = api.getTemplatePreviewUrl(project.id, project.updated_at);
    setImgSrc(url);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
      setHasError(false);
    }
  }, [project.id, project.updated_at]);

  // Check cached image detection on imgSrc change
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
      setHasError(false);
    }
  }, [imgSrc]);

  const handleImageError = () => {
    const directUrl = api.getTemplateDirectUrl(project.id);
    if (imgSrc !== directUrl && !imgSrc.endsWith(directUrl)) {
      setImgSrc(directUrl);
    } else {
      setHasError(true);
    }
  };

  const handlePointerDown = (ph: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedPlaceholder(ph);
    const m = mappings.find((item) => item.placeholder === ph);
    if (m) onSelectMapping(m);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !draggedPlaceholder || !containerRef.current || !onUpdateCoordinates) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert DOM pixels to template point coordinates
    const scaleX = templateWidth / rect.width;
    const scaleY = templateHeight / rect.height;

    let newX = Math.round(clientX * scaleX);
    let newY = Math.round(clientY * scaleY);

    // Magnetic center snapping (within 10pt threshold)
    if (Math.abs(newX - centerX) < 10) {
      newX = centerX;
    }
    if (Math.abs(newY - centerY) < 10) {
      newY = centerY;
    }

    onUpdateCoordinates(
      draggedPlaceholder,
      Math.max(10, Math.min(templateWidth - 10, newX)),
      Math.max(10, Math.min(templateHeight - 10, newY))
    );
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDraggedPlaceholder(null);
  };

  // Helper to format sample text based on mapping settings
  const getDisplayText = (m: FieldMapping) => {
    let raw = '';
    if (m.sheet_column && sampleData && sampleData[m.sheet_column] !== undefined) {
      raw = String(sampleData[m.sheet_column]);
    }
    if (!raw) {
      const clean = m.placeholder.replace(/[{}]/g, '').trim().toLowerCase();
      if (clean.includes('name')) raw = 'Alexander Wright';
      else if (clean.includes('course') || clean.includes('event')) raw = 'Full Stack Development';
      else if (clean.includes('date')) raw = 'October 24, 2026';
      else if (clean.includes('grade') || clean.includes('score')) raw = 'Grade: Distinction';
      else if (clean.includes('id') || clean.includes('cert')) raw = 'CERT-2026-0894';
      else raw = m.placeholder;
    }

    // Apply text case
    if (m.text_case === 'uppercase') return raw.toUpperCase();
    if (m.text_case === 'lowercase') return raw.toLowerCase();
    if (m.text_case === 'capitalize') {
      return raw.replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return raw;
  };

  // Proportional scale factor for typography display
  const scaleRatio = containerDimensions.width > 0 ? containerDimensions.width / templateWidth : 0.85;

  const activeMapping = mappings.find((m) => m.placeholder === selectedPlaceholder);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.85rem',
        width: '100%',
      }}
    >
      {/* Canvas Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          flexWrap: 'wrap',
          gap: '0.65rem',
          padding: '0.5rem 0.85rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Left: Resolution & Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 700,
            color: 'var(--color-marine)',
          }}>
            <Eye size={15} color="var(--color-teal)" />
            <span>Canvas: {templateWidth} × {templateHeight} pt</span>
          </div>
          {project.template_original_name && (
            <span
              className="badge badge-seafoam"
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                maxWidth: '160px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={project.template_original_name}
            >
              {project.template_original_name}
            </span>
          )}
        </div>

        {/* Right: Controls & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onAddText && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onAddText}
              style={{
                padding: '0.35rem 0.8rem',
                fontSize: '0.775rem',
                gap: '0.35rem',
                boxShadow: '0 2px 6px rgba(17, 45, 50, 0.25)'
              }}
              title="Add a new custom text element directly to this certificate"
            >
              <Plus size={14} />
              <span>Add Text</span>
            </button>
          )}

          {/* Preview Mode Switch */}
          {onToggleSamplePreview && (
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface-teal)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-subtle)',
            }}>
              <button
                type="button"
                onClick={() => onToggleSamplePreview(true)}
                style={{
                  border: 'none',
                  background: showSamplePreview ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)' : 'transparent',
                  color: showSamplePreview ? 'var(--color-seafoam)' : 'var(--text-secondary)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
                title="Preview live rendered typography"
              >
                <Type size={13} />
                <span>Live Typography</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleSamplePreview(false)}
                style={{
                  border: 'none',
                  background: !showSamplePreview ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)' : 'transparent',
                  color: !showSamplePreview ? 'var(--color-seafoam)' : 'var(--text-secondary)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
                title="View placeholder tag badges"
              >
                <Sparkles size={13} />
                <span>Field Tags</span>
              </button>
            </div>
          )}

          {/* Center Guides Toggle */}
          <button
            type="button"
            onClick={() => setShowCenterGuides(!showCenterGuides)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${showCenterGuides ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
              background: showCenterGuides ? 'rgba(37, 78, 88, 0.1)' : 'transparent',
              color: showCenterGuides ? 'var(--color-teal)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Toggle center alignment crosshairs"
          >
            <Crosshair size={13} />
            <span>Center Guides</span>
          </button>

          {/* Zoom controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'var(--bg-surface-teal)',
            padding: '2px 4px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '0.2rem',
                color: 'var(--color-marine)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '38px', textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(130, z + 15))}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '0.2rem',
                color: 'var(--color-marine)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '0.2rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '2px',
              }}
              title="Reset Zoom to 100%"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        style={{
          width: '100%',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          padding: '0.5rem 0',
        }}
      >
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            position: 'relative',
            width: `${zoomLevel}%`,
            maxWidth: '920px',
            aspectRatio: `${templateWidth} / ${templateHeight}`,
            backgroundColor: '#FFFFFF',
            border: '2px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md), 0 4px 20px rgba(17, 45, 50, 0.08)',
            userSelect: 'none',
            touchAction: 'none',
            transition: 'width 0.2s ease',
          }}
        >
          {/* Center Crosshair Alignment Guides */}
          {showCenterGuides && (
            <>
              {/* Vertical Center Line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '50%',
                  width: '1px',
                  borderLeft: '1.5px dashed rgba(37, 78, 88, 0.28)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
              {/* Horizontal Center Line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: '1px',
                  borderTop: '1.5px dashed rgba(37, 78, 88, 0.28)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            </>
          )}

          {/* Loading state indicator */}
          {!imageLoaded && !hasError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                zIndex: 5,
                background: 'rgba(240, 247, 247, 0.75)',
                pointerEvents: 'none',
              }}
            >
              <FileText size={32} color="var(--color-teal)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loading certificate canvas...</span>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                color: 'var(--text-primary)',
                zIndex: 15,
                background: 'var(--bg-surface-teal)',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <AlertCircle size={36} color="#991B1B" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#991B1B' }}>
                  Template image could not be loaded
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  The preview endpoint will regenerate from the uploaded template file.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setHasError(false);
                  setImageLoaded(false);
                  setImgSrc(`${api.getTemplateDirectUrl(project.id)}?retry=${Date.now()}`);
                }}
              >
                <RefreshCw size={13} />
                <span>Retry Load Template</span>
              </button>
            </div>
          )}

          {/* Template base image */}
          <img
            ref={(el) => {
              imgRef.current = el;
              if (el && el.complete && el.naturalWidth > 0) {
                if (!imageLoaded) setImageLoaded(true);
                if (hasError) setHasError(false);
              }
            }}
            src={imgSrc}
            alt="Certificate Template"
            onLoad={() => {
              setImageLoaded(true);
              setHasError(false);
            }}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              opacity: 1,
            }}
          />

          {/* Placeholders overlay */}
          {mappings.map((m) => {
            const isSelected = selectedPlaceholder === m.placeholder;
            const leftPct = (m.x_pos / templateWidth) * 100;
            const topPct = (m.y_pos / templateHeight) * 100;

            const displayText = getDisplayText(m);
            const domFontSize = Math.max(9, Math.round((m.font_size || 24) * scaleRatio));
            const opacityVal = m.opacity !== undefined ? m.opacity : 1.0;
            const letterSpacingPx = m.letter_spacing ? `${Math.round(m.letter_spacing * scaleRatio)}px` : 'normal';
            const textShadowVal = getTextShadowCss(m.text_effect);
            const displayName = cleanFieldName(m.placeholder);

            if (showSamplePreview) {
              // Real typography preview mode
              return (
                <div
                  key={m.placeholder}
                  onPointerDown={(e) => handlePointerDown(m.placeholder, e)}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: isSelected ? 35 : 25,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: isSelected
                      ? '2px dashed var(--color-teal)'
                      : '1px dashed transparent',
                    background: isSelected ? 'rgba(37, 78, 88, 0.08)' : 'transparent',
                    boxShadow: isSelected
                      ? '0 0 0 3px rgba(136, 189, 188, 0.35), 0 4px 12px rgba(17, 45, 50, 0.15)'
                      : 'none',
                    textAlign: m.alignment || 'center',
                    fontFamily: m.font_family || 'Helvetica, sans-serif',
                    fontSize: `${domFontSize}px`,
                    fontWeight: m.font_weight || 'normal',
                    fontStyle: m.is_italic ? 'italic' : 'normal',
                    color: m.font_color || '#112D32',
                    opacity: opacityVal,
                    letterSpacing: letterSpacingPx,
                    textShadow: textShadowVal,
                    textTransform: m.text_case || 'none',
                    whiteSpace: 'nowrap',
                    transition: isDragging ? 'none' : 'box-shadow 0.15s ease, border-color 0.15s ease',
                  }}
                  title={`Click & drag to reposition ${displayName} (${Math.round(m.x_pos)}, ${Math.round(m.y_pos)}) pt`}
                >
                  {/* Floating tag pill with quick actions when selected */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-32px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)',
                        color: 'var(--color-seafoam)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 3px 10px rgba(17, 45, 50, 0.35)',
                        whiteSpace: 'nowrap',
                        zIndex: 50,
                      }}
                    >
                      <span style={{ color: '#FFFFFF' }}>{displayName}</span>
                      <span style={{ opacity: 0.8, fontSize: '10px' }}>({Math.round(m.x_pos)}, {Math.round(m.y_pos)})</span>
                      {onCenterHorizontal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCenterHorizontal(m.placeholder);
                          }}
                          title="Center Horizontally"
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: 'none',
                            color: '#FFFFFF',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <AlignHorizontalJustifyCenter size={11} />
                        </button>
                      )}
                      {onCenterVertical && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCenterVertical(m.placeholder);
                          }}
                          title="Center Vertically"
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: 'none',
                            color: '#FFFFFF',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <AlignVerticalJustifyCenter size={11} />
                        </button>
                      )}
                      {onDeleteField && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteField(m.placeholder);
                          }}
                          title="Delete Field"
                          style={{
                            background: 'rgba(239, 68, 68, 0.35)',
                            border: 'none',
                            color: '#FCA5A5',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )}

                  {displayText}
                </div>
              );
            }

            // Badge tags mode
            return (
              <div
                key={m.placeholder}
                onPointerDown={(e) => handlePointerDown(m.placeholder, e)}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -50%)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  background: isSelected
                    ? 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)'
                    : '#FFFFFF',
                  color: isSelected ? 'var(--color-seafoam)' : 'var(--color-marine)',
                  border: isSelected
                    ? '2px solid var(--color-seafoam)'
                    : '1.5px solid var(--border-subtle)',
                  boxShadow: isSelected
                    ? '0 6px 18px rgba(17, 45, 50, 0.35), 0 0 14px rgba(136, 189, 188, 0.4)'
                    : '0 2px 6px rgba(17, 45, 50, 0.1)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: `${Math.max(11, Math.min(15, (m.font_size || 24) * 0.45))}px`,
                  fontWeight: 700,
                  opacity: opacityVal,
                  zIndex: isSelected ? 35 : 25,
                  transition: isDragging ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                title={`Drag to reposition ${displayName}`}
              >
                <Sparkles size={13} color={isSelected ? 'var(--color-seafoam)' : 'var(--color-teal)'} />
                <span style={{ fontWeight: 700 }}>{displayName}</span>
                {m.sheet_column ? (
                  <span
                    style={{
                      fontSize: '0.7em',
                      padding: '2px 7px',
                      background: isSelected ? 'rgba(136, 189, 188, 0.3)' : 'var(--color-seafoam-subtle)',
                      color: isSelected ? '#FFFFFF' : 'var(--color-teal)',
                      borderRadius: '4px',
                      fontWeight: 700,
                      border: isSelected ? '1px solid rgba(136, 189, 188, 0.5)' : '1px solid var(--color-seafoam)',
                    }}
                  >
                    ➔ {m.sheet_column}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.68em',
                      padding: '2px 6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#DC2626',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Unmapped
                  </span>
                )}
                {isSelected && onDeleteField && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteField(m.placeholder);
                    }}
                    title="Delete Field"
                    style={{
                      background: 'rgba(239, 68, 68, 0.35)',
                      border: 'none',
                      color: '#FCA5A5',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '2px'
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas Bottom Helper Bar */}
      {activeMapping && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.45rem 0.85rem',
            background: 'var(--bg-surface-teal)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Move size={14} color="var(--color-teal)" />
            <span>
              Active: <strong style={{ color: 'var(--color-marine)', fontFamily: 'var(--font-mono)' }}>{activeMapping.placeholder}</strong> at ({Math.round(activeMapping.x_pos)}, {Math.round(activeMapping.y_pos)}) pt
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onUpdateCoordinates && onUpdateCoordinates(activeMapping.placeholder, centerX, activeMapping.y_pos)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: '1px solid var(--border-subtle)',
                background: '#FFFFFF',
                color: 'var(--color-marine)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.55rem',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Snap horizontal position to template center"
            >
              <AlignHorizontalJustifyCenter size={13} color="var(--color-teal)" />
              <span>Center Horizontally</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateCoordinates && onUpdateCoordinates(activeMapping.placeholder, activeMapping.x_pos, centerY)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: '1px solid var(--border-subtle)',
                background: '#FFFFFF',
                color: 'var(--color-marine)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.55rem',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Snap vertical position to template center"
            >
              <AlignVerticalJustifyCenter size={13} color="var(--color-teal)" />
              <span>Center Vertically</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
