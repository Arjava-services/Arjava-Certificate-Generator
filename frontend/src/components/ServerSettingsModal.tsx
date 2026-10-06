import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Globe, RotateCcw } from 'lucide-react';
import { getRawApiHost, checkApiHealth } from '../services/api';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerUpdated: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  onServerUpdated,
}) => {
  const [apiUrl, setApiUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getRawApiHost();
      setApiUrl(current);
      setStatus(null);
      setTesting(true);
      checkApiHealth(current).then(res => {
        setStatus(res);
        setTesting(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    const res = await checkApiHealth(apiUrl);
    setStatus(res);
    setTesting(false);
  };

  const handleSave = () => {
    if (apiUrl.trim()) {
      localStorage.setItem('CUSTOM_API_URL', apiUrl.trim());
    } else {
      localStorage.removeItem('CUSTOM_API_URL');
    }
    onServerUpdated();
    onClose();
  };

  const handleReset = () => {
    localStorage.removeItem('CUSTOM_API_URL');
    const defaultUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || window.location.origin;
    setApiUrl(defaultUrl);
    setTesting(true);
    checkApiHealth(defaultUrl).then(res => {
      setStatus(res);
      setTesting(false);
    });
    onServerUpdated();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(17, 45, 50, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1.5px solid var(--border-subtle, #e2e8f0)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-marine, #112d32) 0%, var(--color-teal, #254e58) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#88bdbc',
            }}>
              <Server size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-marine, #112d32)' }}>
                API Backend Connection
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                Configure where this web app sends API requests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Backend Server URL
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Globe size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-tunnel.trycloudflare.com or http://localhost:8000"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <RefreshCw size={14} className={testing ? 'spin-animation' : ''} />
                Test
              </button>
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Enter your Cloudflare tunnel, ngrok URL, or cloud API address without <code>/api/v1</code>.
            </p>
          </div>

          {/* Status Message */}
          {status && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.8125rem',
              background: status.ok ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${status.ok ? '#86efac' : '#fca5a5'}`,
              color: status.ok ? '#166534' : '#991b1b',
            }}>
              {status.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span style={{ fontWeight: 500 }}>{status.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 500,
            }}
          >
            <RotateCcw size={14} /> Reset Default
          </button>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-marine, #112d32) 0%, var(--color-teal, #254e58) 100%)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
