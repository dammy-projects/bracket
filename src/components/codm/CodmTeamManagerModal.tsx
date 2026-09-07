import React, { useState } from 'react';
import { CodmTeam, CodmPlayer } from '../../types/codm';
import { PRESET_AVATARS } from '../../utils/defaultData';
import { uploadLogoToSupabaseStorage } from '../../services/supabaseService';
import { X, Users, Upload, Shield, UserCheck, ChevronRight, Save } from 'lucide-react';

interface CodmTeamManagerModalProps {
  teams: CodmTeam[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTeams: (updatedTeams: CodmTeam[]) => void;
}

export const CodmTeamManagerModal: React.FC<CodmTeamManagerModalProps> = ({
  teams,
  isOpen,
  onClose,
  onUpdateTeams,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);

  // Local copy of teams for editing
  const [localTeams, setLocalTeams] = useState<CodmTeam[]>(teams);

  if (!isOpen) return null;

  const currentTeam = localTeams.find((t) => t.id === selectedTeamId) || localTeams[0];

  const handleUpdateTeamField = (field: keyof CodmTeam, value: any) => {
    if (!currentTeam) return;
    const updated = localTeams.map((t) => (t.id === currentTeam.id ? { ...t, [field]: value } : t));
    setLocalTeams(updated);
  };

  const handleUpdatePlayer = (
    playerIndex: number,
    field: keyof CodmPlayer,
    value: string
  ) => {
    if (!currentTeam) return;
    const currentPlayers = [...(currentTeam.players || [])];

    // Ensure 5 slots exist
    while (currentPlayers.length < 5) {
      const idx = currentPlayers.length;
      currentPlayers.push({
        id: `p_${currentTeam.id}_${idx + 1}`,
        name: `Player ${idx + 1}`,
        ign: '',
        role: idx === 4 ? 'reserve' : 'main',
      });
    }

    currentPlayers[playerIndex] = {
      ...currentPlayers[playerIndex],
      [field]: value,
    };

    handleUpdateTeamField('players', currentPlayers);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentTeam) {
      setIsUploading(true);
      const publicUrl = await uploadLogoToSupabaseStorage(file, `codm_team_${currentTeam.id}`);
      if (publicUrl) {
        handleUpdateTeamField('logoUrl', publicUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleUpdateTeamField('logoUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      setIsUploading(false);
    }
  };

  const handleSaveAll = () => {
    onUpdateTeams(localTeams);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '850px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="#3b82f6" />
            <div>
              <h3 className="modal-title">CODM Team Rosters & Squads</h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Each team requires 4 Main Players + 1 Reserve Player (5 registered players total)
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body codm-team-modal-layout" style={{ overflowY: 'auto' }}>
          {/* Left Sidebar: Team List */}
          <div className="codm-team-nav-list">
            {localTeams.map((team, idx) => (
              <button
                key={team.id}
                type="button"
                className={`codm-team-nav-item ${selectedTeamId === team.id ? 'active' : ''}`}
                onClick={() => setSelectedTeamId(team.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="seed-badge">{idx + 1}</span>
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="team-logo-small" />
                  ) : (
                    <span
                      className="team-logo-small"
                      style={{ backgroundColor: team.avatarColor || '#3b82f6' }}
                    >
                      {team.avatarIcon || '🛡️'}
                    </span>
                  )}
                  <div style={{ textAlign: 'left' }}>
                    <div className="team-nav-name">{team.name}</div>
                    {team.tag && <div className="team-nav-tag">{team.tag}</div>}
                  </div>
                </div>
                <ChevronRight size={14} className="nav-chevron" />
              </button>
            ))}
          </div>

          {/* Right Panel: Selected Team Details & 5-Player Roster */}
          {currentTeam && (
            <div className="codm-team-detail-panel">
              <div className="team-meta-header">
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div
                    className="brand-logo-container"
                    style={{
                      width: '56px',
                      height: '56px',
                      backgroundColor: currentTeam.avatarColor || '#3b82f6',
                    }}
                  >
                    {currentTeam.logoUrl ? (
                      <img
                        src={currentTeam.logoUrl}
                        alt="Logo"
                        style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.8rem' }}>{currentTeam.avatarIcon || '🛡️'}</span>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                        <label className="form-label">Team Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={currentTeam.name}
                          onChange={(e) => handleUpdateTeamField('name', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="form-label">Tag / Dept</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. BSCJ"
                          value={currentTeam.tag || ''}
                          onChange={(e) => handleUpdateTeamField('tag', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo & Avatar Pickers */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
                  <label className="icon-btn" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                    <Upload size={14} />
                    <span>{isUploading ? 'Uploading...' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <div className="avatar-grid-compact">
                    {PRESET_AVATARS.slice(0, 8).map((avatar) => (
                      <div
                        key={avatar.id}
                        className={`avatar-option-small ${
                          currentTeam.avatarIcon === avatar.icon ? 'selected' : ''
                        }`}
                        style={{ backgroundColor: avatar.color }}
                        onClick={() => {
                          handleUpdateTeamField('avatarIcon', avatar.icon);
                          handleUpdateTeamField('avatarColor', avatar.color);
                          handleUpdateTeamField('logoUrl', '');
                        }}
                        title={avatar.label}
                      >
                        {avatar.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Roster: 4 Main + 1 Reserve */}
              <div className="roster-section">
                <div className="roster-header">
                  <h4 style={{ fontSize: '0.85rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Registered 5-Player Squad
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Slots 1–4: Main Squad • Slot 5: Reserve
                  </span>
                </div>

                <div className="roster-cards-list">
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const player = currentTeam.players?.[idx] || {
                      id: `p_${currentTeam.id}_${idx + 1}`,
                      name: `Player ${idx + 1}`,
                      ign: '',
                      role: idx === 4 ? 'reserve' : 'main',
                    };
                    const isReserve = idx === 4;

                    return (
                      <div
                        key={idx}
                        className={`roster-player-card ${isReserve ? 'reserve-card' : ''}`}
                      >
                        <div className="player-slot-badge">
                          {isReserve ? (
                            <span className="role-tag reserve">
                              <Shield size={12} /> RESERVE
                            </span>
                          ) : (
                            <span className="role-tag main">
                              <UserCheck size={12} /> SQUAD #{idx + 1}
                            </span>
                          )}
                        </div>

                        <div className="player-inputs">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Full Name (e.g. John Doe)"
                            value={player.name}
                            onChange={(e) => handleUpdatePlayer(idx, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="In-Game Name / IGN"
                            value={player.ign || ''}
                            onChange={(e) => handleUpdatePlayer(idx, 'ign', e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="icon-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="icon-btn primary" onClick={handleSaveAll}>
            <Save size={16} />
            <span>Save Team Rosters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
