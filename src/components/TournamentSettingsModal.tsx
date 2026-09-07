import React, { useState } from 'react';
import { TournamentSettings } from '../types/tournament';
import { uploadLogoToSupabaseStorage } from '../services/supabaseService';
import { X, Upload, Save, Loader2 } from 'lucide-react';

interface TournamentSettingsModalProps {
  settings: TournamentSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: TournamentSettings) => void;
}

export const TournamentSettingsModal: React.FC<TournamentSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
}) => {
  const [title, setTitle] = useState(settings.title);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [statusBadge, setStatusBadge] = useState(settings.statusBadge);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [hasThirdPlaceMatch, setHasThirdPlaceMatch] = useState(settings.hasThirdPlaceMatch ?? true);
  const [quarterfinalsBestOf, setQuarterfinalsBestOf] = useState(settings.quarterfinalsBestOf ?? 3);
  const [semifinalsBestOf, setSemifinalsBestOf] = useState(settings.semifinalsBestOf ?? 5);
  const [finalsBestOf, setFinalsBestOf] = useState(settings.finalsBestOf ?? 7);
  const [thirdPlaceBestOf, setThirdPlaceBestOf] = useState(settings.thirdPlaceBestOf ?? 3);
  const [adminPasscode, setAdminPasscode] = useState(settings.adminPasscode || 'admin123');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const publicUrl = await uploadLogoToSupabaseStorage(file, 'tournament_logo');
      if (publicUrl) {
        setLogoUrl(publicUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      title: title.trim() || 'Tournament Bracket',
      subtitle: subtitle.trim(),
      statusBadge,
      logoUrl,
      hasThirdPlaceMatch,
      quarterfinalsBestOf: Number(quarterfinalsBestOf),
      semifinalsBestOf: Number(semifinalsBestOf),
      finalsBestOf: Number(finalsBestOf),
      thirdPlaceBestOf: Number(thirdPlaceBestOf),
      adminPasscode: adminPasscode.trim() || 'admin123',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Tournament Settings & Series Rules</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Tournament Title</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subtitle / Description</label>
              <input
                type="text"
                className="form-input"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status Badge</label>
              <select
                className="form-input"
                value={statusBadge}
                onChange={(e) => setStatusBadge(e.target.value as any)}
              >
                <option value="LIVE">🔴 LIVE</option>
                <option value="UPCOMING">⏳ UPCOMING</option>
                <option value="COMPLETED">🏆 COMPLETED</option>
              </select>
            </div>

            {/* Best Of Series Formats */}
            <div
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '18px',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#60a5fa' }}>
                Round Series Formats (Best-Of Rules)
              </h4>

              <div className="form-row" style={{ marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Quarterfinals</label>
                  <select
                    className="form-input"
                    value={quarterfinalsBestOf}
                    onChange={(e) => setQuarterfinalsBestOf(Number(e.target.value))}
                  >
                    <option value="1">Best of 1</option>
                    <option value="3">Best of 3 (First to 2)</option>
                    <option value="5">Best of 5 (First to 3)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Semifinals</label>
                  <select
                    className="form-input"
                    value={semifinalsBestOf}
                    onChange={(e) => setSemifinalsBestOf(Number(e.target.value))}
                  >
                    <option value="1">Best of 1</option>
                    <option value="3">Best of 3 (First to 2)</option>
                    <option value="5">Best of 5 (First to 3)</option>
                    <option value="7">Best of 7 (First to 4)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Finals</label>
                  <select
                    className="form-input"
                    value={finalsBestOf}
                    onChange={(e) => setFinalsBestOf(Number(e.target.value))}
                  >
                    <option value="3">Best of 3</option>
                    <option value="5">Best of 5 (First to 3)</option>
                    <option value="7">Best of 7 (First to 4)</option>
                    <option value="9">Best of 9 (First to 5)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fighting for 3rd</label>
                  <select
                    className="form-input"
                    value={thirdPlaceBestOf}
                    onChange={(e) => setThirdPlaceBestOf(Number(e.target.value))}
                  >
                    <option value="1">Best of 1</option>
                    <option value="3">Best of 3 (First to 2)</option>
                    <option value="5">Best of 5 (First to 3)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={hasThirdPlaceMatch}
                    onChange={(e) => setHasThirdPlaceMatch(e.target.checked)}
                  />
                  <span>Enable 3rd Place Match (Bronze Medal Match)</span>
                </label>
              </div>
            </div>

            {/* Logo Uploader */}
            <div className="form-group">
              <label className="form-label">Tournament Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  className="brand-logo-container"
                  style={{ width: '50px', height: '50px' }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>🏆</span>
                  )}
                </div>
                <label className="icon-btn" style={{ cursor: 'pointer' }}>
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>{isUploading ? 'Uploading...' : 'Upload Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => setLogoUrl('')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>

            {/* Admin Security Settings */}
            <div className="form-group" style={{ marginTop: '18px' }}>
              <label className="form-label">Organizer Admin Passcode</label>
              <input
                type="text"
                className="form-input"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Default: admin123"
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                Used by tournament staff to log in and unlock admin editing controls.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="icon-btn primary" disabled={isUploading}>
              <Save size={16} />
              <span>Save Settings & Rules</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
