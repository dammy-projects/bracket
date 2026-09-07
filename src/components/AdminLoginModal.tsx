import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (passcode: string) => boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const success = onLogin(passcode);
    if (success) {
      setPasscode('');
      onClose();
    } else {
      setErrorMessage('Incorrect passcode. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck color="#3b82f6" size={22} />
            <h3 className="modal-title">Organizer Admin Login</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '18px' }}>
              Enter the admin passcode to unlock full tournament editing capabilities, team management, and match score inputs.
            </p>

            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={14} color="#60a5fa" />
                <span>Admin Passcode</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '42px', letterSpacing: showPassword ? 'normal' : '2px' }}
                  placeholder="Enter passcode..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>


          </div>

          <div className="modal-footer">
            <button type="button" className="danger-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="icon-btn primary">
              <Lock size={16} />
              <span>Unlock Admin Mode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
