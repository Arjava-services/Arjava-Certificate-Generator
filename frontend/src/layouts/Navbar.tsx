import React, { useState } from 'react';
import { Award, ChevronRight, Plus, Home, Server } from 'lucide-react';
import { ServerSettingsModal } from '../components/ServerSettingsModal';

interface NavbarProps {
  currentProjectName?: string;
  onNavigateHome: () => void;
  onOpenNewProjectModal: () => void;
  onServerUpdated?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProjectName,
  onNavigateHome,
  onOpenNewProjectModal,
  onServerUpdated,
}) => {
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  return (
    <header style={{
      borderBottom: '1.5px solid var(--border-subtle)',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px 0 rgba(50, 50, 50, 0.04)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand & Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={onNavigateHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)',
              color: 'var(--color-seafoam)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(17, 45, 50, 0.25)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <Award size={20} />
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--color-marine)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap'
            }}>
              Arjava Certify Studio
            </div>
          </button>

          {currentProjectName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              marginLeft: '0.5rem',
              paddingLeft: '0.85rem',
              borderLeft: '1.5px solid var(--border-subtle)',
            }}>
              <button
                onClick={onNavigateHome}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  padding: 0,
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-teal)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <Home size={14} /> Projects
              </button>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--color-marine)', fontWeight: 700, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentProjectName}
              </span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => setIsServerModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            title="Configure Backend API Server URL"
          >
            <Server size={14} color="var(--color-teal)" />
            <span>API Server</span>
          </button>

          <button
            onClick={onOpenNewProjectModal}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.8125rem' }}
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      <ServerSettingsModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        onServerUpdated={() => {
          onServerUpdated?.();
          window.location.reload();
        }}
      />
    </header>
  );
};
