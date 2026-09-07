import React, { useState } from 'react';
import { Participant } from '../types/tournament';
import { PRESET_AVATARS } from '../utils/defaultData';
import { uploadLogoToSupabaseStorage } from '../services/supabaseService';
import { EditTeamModal } from './EditTeamModal';
import { X, Plus, Trash2, Upload, Shuffle, Pencil } from 'lucide-react';

interface ParticipantManagerModalProps {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateParticipants: (participants: Participant[]) => void;
}

export const ParticipantManagerModal: React.FC<ParticipantManagerModalProps> = ({
  participants,
  isOpen,
  onClose,
  onUpdateParticipants,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');

  // Editing state
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const publicUrl = await uploadLogoToSupabaseStorage(file, 'new_team_logo');
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

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newParticipant: Participant = {
      id: `p_${Date.now()}`,
      name: name.trim(),
      tag: tag.trim() || undefined,
      seed: participants.length + 1,
      logoUrl: logoUrl || undefined,
      avatarColor: selectedAvatar.color,
      avatarIcon: selectedAvatar.icon,
    };

    onUpdateParticipants([...participants, newParticipant]);
    setName('');
    setTag('');
    setLogoUrl('');
  };

  const handleBulkImport = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newParticipants: Participant[] = lines.map((line, idx) => {
      const parts = line.split('-');
      const teamName = parts[0].trim();
      const teamTag = parts[1] ? parts[1].trim() : undefined;
      const avatar = PRESET_AVATARS[idx % PRESET_AVATARS.length];

      return {
        id: `p_${Date.now()}_${idx}`,
        name: teamName,
        tag: teamTag,
        seed: participants.length + idx + 1,
        avatarColor: avatar.color,
        avatarIcon: avatar.icon,
      };
    });

    onUpdateParticipants([...participants, ...newParticipants]);
    setBulkText('');
  };

  const handleDelete = (id: string) => {
    const filtered = participants.filter((p) => p.id !== id);
    const reseeded = filtered.map((p, idx) => ({ ...p, seed: idx + 1 }));
    onUpdateParticipants(reseeded);
  };

  const handleShuffleSeeds = () => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const reseeded = shuffled.map((p, idx) => ({ ...p, seed: idx + 1 }));
    onUpdateParticipants(reseeded);
  };

  const handleEditTeam = (participant: Participant) => {
    setEditingParticipant(participant);
    setIsEditModalOpen(true);
  };

  const handleSaveTeamEdit = (updated: Participant) => {
    const updatedList = participants.map((p) => (p.id === updated.id ? updated : p));
    onUpdateParticipants(updatedList);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Manage Teams & Custom Logos</h3>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            {/* Mode Tabs */}
            <div className="tabs-container" style={{ marginBottom: '16px' }}>
              <button
                className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => setActiveTab('single')}
              >
                Add Team
              </button>
              <button
                className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
                onClick={() => setActiveTab('bulk')}
              >
                Bulk Import
              </button>
            </div>

            {activeTab === 'single' ? (
              <form onSubmit={handleAddSingle} style={{ marginBottom: '24px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Team Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Criminology Bulls"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tag / Dept (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. BSCJ"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                    />
                  </div>
                </div>

                {/* Logo Selection Options */}
                <div className="form-group">
                  <label className="form-label">Team Logo (Upload Image or Pick Icon)</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <label className="icon-btn" style={{ cursor: 'pointer' }}>
                      <Upload size={16} />
                      <span>Upload Custom Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {logoUrl && (
                      <span style={{ fontSize: '0.8rem', color: '#10b981', alignSelf: 'center' }}>
                        ✓ Image Uploaded!
                      </span>
                    )}
                  </div>

                  {!logoUrl && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        Or choose a preset mascot logo:
                      </span>
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

                <button type="submit" className="icon-btn primary" style={{ width: '100%' }}>
                  <Plus size={16} />
                  <span>Add Team to Bracket</span>
                </button>
              </form>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Paste Team List (1 per line)</label>
                  <textarea
                    className="embed-code-area"
                    style={{ height: '140px' }}
                    placeholder={`Criminology Bulls - BSCJ\nTech Python - BSIT\nBlazing Phoenix - BEED\nStrength Resurgence - BAP`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="icon-btn primary"
                  onClick={handleBulkImport}
                  style={{ width: '100%' }}
                >
                  <Plus size={16} />
                  <span>Import Teams</span>
                </button>
              </div>
            )}

            {/* Current Participant List */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <h4 style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                  Teams in Tournament ({participants.length})
                </h4>
                <button
                  className="icon-btn"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  onClick={handleShuffleSeeds}
                >
                  <Shuffle size={14} />
                  <span>Shuffle Seeds</span>
                </button>
              </div>

              {participants.map((p) => (
                <div key={p.id} className="participant-item-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="seed-badge">{p.seed}</span>
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="team-logo" />
                    ) : (
                      <span
                        className="team-logo"
                        style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                      >
                        {p.avatarIcon || '🏆'}
                      </span>
                    )}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {p.name} {p.tag ? `- ${p.tag}` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="icon-btn"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => handleEditTeam(p)}
                      title="Customize team logo & details"
                    >
                      <Pencil size={13} />
                      <span>Edit Logo</span>
                    </button>

                    <button
                      className="close-btn"
                      onClick={() => handleDelete(p.id)}
                      title="Remove team"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button className="icon-btn primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Team Editing Sub-Modal */}
      <EditTeamModal
        participant={editingParticipant}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTeamEdit}
      />
    </>
  );
};
