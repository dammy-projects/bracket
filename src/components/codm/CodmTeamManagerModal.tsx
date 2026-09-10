import React, { useState, useEffect } from 'react';
import { CodmTeam, CodmPlayer } from '../../types/codm';
import { PRESET_AVATARS } from '../../utils/defaultData';
import { uploadLogoToSupabaseStorage } from '../../services/supabaseService';
import { compressImageFile } from '../../utils/imageCompressor';
import { TeamBadge } from '../common/TeamBadge';
import { X, Users, Upload, Shield, UserCheck, ChevronRight, Save, Plus, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    setLocalTeams(teams);
    if (teams.length > 0 && !teams.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, isOpen]);

  if (!isOpen) return null;

  const currentTeam = localTeams.find((t) => t.id === selectedTeamId) || localTeams[0];

  const handleAddNewTeam = () => {
    const newIdx = localTeams.length + 1;
    const avatar = PRESET_AVATARS[(newIdx - 1) % PRESET_AVATARS.length];
    const newTeam: CodmTeam = {
      id: `ct_${Date.now()}`,
      name: `Team ${newIdx}`,
      tag: `T${newIdx}`,
      seed: newIdx,
      avatarColor: avatar.color,
      players: [
        { id: `p_${Date.now()}_1`, name: 'Player 1', ign: '', role: 'main' },
        { id: `p_${Date.now()}_2`, name: 'Player 2', ign: '', role: 'main' },
        { id: `p_${Date.now()}_3`, name: 'Player 3', ign: '', role: 'main' },
        { id: `p_${Date.now()}_4`, name: 'Player 4', ign: '', role: 'main' },
        { id: `p_${Date.now()}_5`, name: 'Player 5 (Sub)', ign: '', role: 'reserve' },
      ],
    };
    setLocalTeams([...localTeams, newTeam]);
    setSelectedTeamId(newTeam.id);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (localTeams.length <= 2) {
      alert('Tournament must have at least 2 teams.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this team?')) {
      const remaining = localTeams.filter((t) => t.id !== teamId);
      setLocalTeams(remaining);
      if (selectedTeamId === teamId && remaining.length > 0) {
        setSelectedTeamId(remaining[0].id);
      }
    }
  };

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
    const rawFile = e.target.files?.[0];
    if (rawFile && currentTeam) {
      setIsUploading(true);
      const { file, dataUrl } = await compressImageFile(rawFile);
      const publicUrl = await uploadLogoToSupabaseStorage(file, `codm_team_${currentTeam.id}`);
      if (publicUrl) {
        handleUpdateTeamField('logoUrl', publicUrl);
      } else {
        handleUpdateTeamField('logoUrl', dataUrl);
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
                  <TeamBadge
                    logoUrl={team.logoUrl}
                    name={team.name}
                    tag={team.tag}
                    color={team.avatarColor}
                    size={28}
                  />
                  <div style={{ textAlign: 'left' }}>
                    <div className="team-nav-name">{team.name}</div>
                    {team.tag && <div className="team-nav-tag">{team.tag}</div>}
                  </div>
                </div>
                <ChevronRight size={14} className="nav-chevron" />
              </button>
            ))}

            <button
              type="button"
              className="icon-btn"
              onClick={handleAddNewTeam}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                marginTop: '10px',
                border: '1px dashed #3b82f6',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.08)',
                color: '#60a5fa',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <Plus size={15} />
              <span>Add Team</span>
            </button>
          </div>

          {/* Right Panel: Selected Team Details & 5-Player Roster */}
          {currentTeam && (
            <div className="codm-team-detail-panel">
              <div className="team-meta-header">
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <TeamBadge
                    logoUrl={currentTeam.logoUrl}
                    name={currentTeam.name}
                    tag={currentTeam.tag}
                    color={currentTeam.avatarColor}
                    size={56}
                  />

                  <div style={{ flex: 1 }}>
                    <div className="form-row" style={{ alignItems: 'flex-end' }}>
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
                      {localTeams.length > 2 && (
                        <button
                          type="button"
                          className="icon-btn"
                          style={{
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.05)',
                            padding: '8px 10px',
                            fontSize: '0.75rem',
                            height: '38px',
                          }}
                          onClick={() => handleDeleteTeam(currentTeam.id)}
                          title="Remove team from tournament"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logo & Theme Color Controls */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="icon-btn" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                    <Upload size={14} />
                    <span>{isUploading ? 'Uploading...' : 'Upload Custom Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {currentTeam.logoUrl && (
                    <button
                      type="button"
                      className="danger-btn"
                      style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                      onClick={() => handleUpdateTeamField('logoUrl', '')}
                    >
                      <Trash2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Remove Custom Logo
                    </button>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Theme:</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {PRESET_AVATARS.slice(0, 8).map((avatar) => (
                        <button
                          key={avatar.id}
                          type="button"
                          className="avatar-option-small"
                          style={{
                            backgroundColor: avatar.color,
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: currentTeam.avatarColor === avatar.color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                          }}
                          onClick={() => {
                            handleUpdateTeamField('avatarColor', avatar.color);
                          }}
                          title={avatar.label}
                        >
                          {currentTeam.avatarColor === avatar.color && (
                            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
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
