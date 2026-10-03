import React from 'react';
import { Award, ChevronRight, Plus, Home } from 'lucide-react';

interface NavbarProps {
  currentProjectName?: string;
  onNavigateHome: () => void;
  onOpenNewProjectModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProjectName,
  onNavigateHome,
  onOpenNewProjectModal,
}) => {
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'inherit',
              padding: 0,
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, var(--color-marine) 0%, var(--color-teal) 100%)',
              border: '1.5px solid var(--color-seafoam)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(17, 45, 50, 0.25), 0 0 10px rgba(136, 189, 188, 0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <Award size={22} color="var(--color-seafoam)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-marine)' }}>
                <span>Arjava Certify</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Automated Certificate Studio</div>
            </div>
          </button>

          {currentProjectName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <ChevronRight size={16} />
              <button
                onClick={onNavigateHome}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  transition: 'color 0.15s',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
    </header>
  );
};
