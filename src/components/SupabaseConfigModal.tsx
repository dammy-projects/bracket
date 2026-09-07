import React, { useState, useEffect } from 'react';
import { getSupabaseCredentials, resetSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { saveTournamentToCloud, fetchTournamentFromCloud } from '../services/supabaseService';
import { Tournament } from '../types/tournament';
import { X, Cloud, CloudOff, RefreshCw, Save, Database, Copy, Check } from 'lucide-react';

interface SupabaseConfigModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onLoadCloudTournament: (tournament: Tournament) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onLoadCloudTournament,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadId, setLoadId] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setKey(creds.key);
      setStatus(isSupabaseConfigured());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('supabase_custom_url', url.trim());
    localStorage.setItem('supabase_custom_key', key.trim());
    resetSupabaseClient();
    const configured = isSupabaseConfigured();
    setStatus(configured);

    if (configured) {
      setMessage({ text: 'Supabase credentials saved successfully!', type: 'success' });
    } else {
      setMessage({ text: 'Could not connect. Please check URL and Key.', type: 'error' });
    }
  };

  const handleSyncToCloud = async () => {
    if (!isSupabaseConfigured()) {
      setMessage({ text: 'Please configure Supabase credentials first.', type: 'error' });
      return;
    }

    setIsSyncing(true);
    setMessage(null);
    const success = await saveTournamentToCloud(tournament);
    setIsSyncing(false);

    if (success) {
      setMessage({
        text: `Tournament synced live to Supabase Cloud! (ID: ${tournament.id})`,
        type: 'success',
      });
    } else {
      setMessage({ text: 'Failed to sync tournament to Supabase Cloud.', type: 'error' });
    }
  };

  const handleLoadFromCloud = async () => {
    if (!loadId.trim()) return;
    setIsSyncing(true);
    setMessage(null);

    const fetched = await fetchTournamentFromCloud(loadId.trim());
    setIsSyncing(false);

    if (fetched) {
      onLoadCloudTournament(fetched);
      setMessage({ text: `Successfully loaded tournament "${fetched.settings.title}"!`, type: 'success' });
      onClose();
    } else {
      setMessage({ text: `Tournament ID "${loadId}" not found in cloud database.`, type: 'error' });
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('supabase_custom_url');
    localStorage.removeItem('supabase_custom_key');
    resetSupabaseClient();
    setUrl('');
    setKey('');
    setStatus(false);
    setMessage({ text: 'Disconnected from Supabase. App is in LocalStorage mode.', type: 'success' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database color="#3b82f6" size={22} />
            <h3 className="modal-title">Supabase Cloud Sync Settings</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Connection Status Banner */}
          <div
            style={{
              background: status ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${status ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              padding: '12px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {status ? <Cloud color="#10b981" size={20} /> : <CloudOff color="#f59e0b" size={20} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {status ? '⚡ Supabase Cloud Connected' : '⚡ Disconnected (LocalStorage Mode)'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {status
                    ? 'Realtime subscriptions active for live score updates.'
                    : 'Configure Supabase credentials below to enable multi-device live sync.'}
                </div>
              </div>
            </div>

            {status && (
              <button className="danger-btn" onClick={handleDisconnect} style={{ fontSize: '0.75rem' }}>
                Disconnect
              </button>
            )}
          </div>

          {message && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: message.type === 'success' ? '#34d399' : '#f87171',
                border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {message.text}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSaveCredentials} style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Supabase Project URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Anon Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="icon-btn primary" style={{ width: '100%' }}>
              <Save size={16} />
              <span>Save & Connect Supabase</span>
            </button>
          </form>

          {/* Cloud Actions */}
          {status && (
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Cloud Operations</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <button
                  className="icon-btn"
                  style={{ background: '#2563eb', color: 'white', border: 'none' }}
                  onClick={handleSyncToCloud}
                  disabled={isSyncing}
                >
                  <Cloud size={16} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Current Bracket to Cloud'}</span>
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Tournament ID"
                    value={loadId}
                    onChange={(e) => setLoadId(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <button className="icon-btn" onClick={handleLoadFromCloud} disabled={isSyncing}>
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="icon-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
