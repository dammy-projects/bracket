import React, { useState } from 'react';
import { Tournament } from '../types/tournament';
import { X, Download, Upload, Copy, Check, Printer, Link, Eye } from 'lucide-react';

interface ExportShareModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onImportJson: (data: Tournament) => void;
  onPrint: () => void;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onImportJson,
  onPrint,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const spectatorUrl = `${baseUrl}?view=readonly`;
  const embedCode = `<iframe src="${spectatorUrl}" width="100%" height="650" frameborder="0" allowfullscreen></iframe>`;

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(tournament, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.settings.title.toLowerCase().replace(/\s+/g, '_')}_bracket.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.participants && parsed.matches) {
            onImportJson(parsed);
            onClose();
          } else {
            alert('Invalid bracket file structure');
          }
        } catch (err) {
          alert('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(spectatorUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Export, Share & Embed</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Spectator Shareable Link */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} color="#60a5fa" />
              <span>Spectator / View-Only Link</span>
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={spectatorUrl}
                readOnly
                style={{ fontSize: '0.85rem' }}
              />
              <button
                className="icon-btn primary"
                onClick={handleCopyLink}
                style={{ whiteSpace: 'nowrap' }}
              >
                {copiedLink ? <Check size={16} /> : <Link size={16} />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Print & PDF */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#f3f4f6' }}>
              Print & PDF Export
            </h4>
            <button className="icon-btn" onClick={onPrint} style={{ width: '100%' }}>
              <Printer size={16} />
              <span>Print or Save as PDF</span>
            </button>
          </div>

          {/* JSON Backup & Restore */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#f3f4f6' }}>
              Save & Restore Tournament Data
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button className="icon-btn" onClick={handleDownloadJson}>
                <Download size={16} />
                <span>Export JSON File</span>
              </button>
              <label className="icon-btn" style={{ cursor: 'pointer' }}>
                <Upload size={16} />
                <span>Import JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Embed Code Snippet */}
          <div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#f3f4f6' }}>
              Embed Spectator Bracket HTML
            </h4>
            <div style={{ position: 'relative' }}>
              <textarea className="embed-code-area" value={embedCode} readOnly />
              <button
                className="icon-btn"
                onClick={handleCopyEmbed}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                }}
              >
                {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="icon-btn primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
