import React, { useState, useEffect } from 'react';
import { Participant } from '../types/tournament';
import { PRESET_AVATARS } from '../utils/defaultData';
import { uploadLogoToSupabaseStorage } from '../services/supabaseService';
import { compressImageFile } from '../utils/imageCompressor';
import { X, Upload, Save, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface EditTeamModalProps {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Participant) => void;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  participant,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [seed, setSeed] = useState<number>(1);
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (participant) {
      setName(participant.name);
      setTag(participant.tag || '');
      setSeed(participant.seed);
      setLogoUrl(participant.logoUrl || '');

      const foundAvatar = PRESET_AVATARS.find(
        (a) => a.icon === participant.avatarIcon
      );
      if (foundAvatar) {
        setSelectedAvatar(foundAvatar);
      }
    }
  }, [participant]);

  if (!isOpen || !participant) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      setIsUploading(true);
      // Auto-compress image to max 300x300 canvas
      const { file, dataUrl } = await compressImageFile(rawFile);
      const publicUrl = await uploadLogoToSupabaseStorage(file, `team_${participant.id}`);

      if (publicUrl) {
        setLogoUrl(publicUrl);
      } else {
        setLogoUrl(dataUrl);
      }
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...participant,
      name: name.trim() || participant.name,
      tag: tag.trim() || undefined,
      seed: Number(seed),
      logoUrl: logoUrl || undefined,
      avatarColor: selectedAvatar.color,
      avatarIcon: selectedAvatar.icon,
    });
    onClose();
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ImageIcon color="#3b82f6" size={22} />
            <h3 className="modal-title">Customize Team Logo & Details</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Logo Preview Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    border: '2px solid #3b82f6',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '10px',
                    backgroundColor: selectedAvatar.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {selectedAvatar.icon}
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {name || 'Team Name'}
                </h4>
                {tag && (
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    Department: {tag}
                  </span>
                )}
                <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '2px' }}>
                  Seed #{seed}
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tag / Dept</label>
                <input
                  type="text"
                  className="form-input"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </div>
            </div>

            {/* Custom Image Upload to Supabase Storage 'logo' */}
            <div className="form-group">
              <label className="form-label">Team Logo (Uploads to Supabase Storage 'logo')</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label className="icon-btn" style={{ cursor: 'pointer' }}>
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>{isUploading ? 'Uploading to Supabase...' : 'Upload Logo to Supabase'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                </label>

                {logoUrl && (
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={handleRemoveLogo}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <Trash2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Remove Image
                  </button>
                )}
              </div>
            </div>

            {/* Or Paste Image URL */}
            <div className="form-group">
              <label className="form-label">Or Image URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://lbnpirmqqoscawhpufuz.supabase.co/storage/v1/object/public/logo/..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            {/* Preset Mascot Selection */}
            {!logoUrl && (
              <div className="form-group">
                <label className="form-label">Preset Mascot Logo & Theme</label>
                <div className="avatar-grid">
                  {PRESET_AVATARS.map((avatar) => (
                    <div
                      key={avatar.id}
                      className={`avatar-option ${
                        selectedAvatar.id === avatar.id ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: avatar.color }}
                      onClick={() => setSelectedAvatar(avatar)}
                      title={avatar.label}
                    >
                      {avatar.icon}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="icon-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="icon-btn primary" disabled={isUploading}>
              <Save size={16} />
              <span>Save Team Logo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
