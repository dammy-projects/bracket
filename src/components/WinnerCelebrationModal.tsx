import React, { useEffect } from 'react';
import { Participant } from '../types/tournament';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X } from 'lucide-react';

interface WinnerCelebrationModalProps {
  champion: Participant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  champion,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && champion) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, champion]);

  if (!isOpen || !champion) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '450px',
          textAlign: 'center',
          border: '2px solid #f59e0b',
          boxShadow: '0 0 40px rgba(245, 158, 11, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottom: 'none', justifyContent: 'flex-end' }}>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0 32px 32px 32px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 16px auto',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(245, 158, 11, 0.5)',
            }}
          >
            <Trophy size={44} color="#ffffff" />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f59e0b',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            <Sparkles size={16} />
            Tournament Champion
            <Sparkles size={16} />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '12px',
            }}
          >
            {champion.name}
          </h2>

          {champion.tag && (
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '4px 14px',
                borderRadius: '20px',
                color: '#d1d5db',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              Department: {champion.tag}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              marginTop: '12px',
            }}
          >
            {champion.logoUrl ? (
              <img
                src={champion.logoUrl}
                alt=""
                style={{ width: '48px', height: '48px', borderRadius: '10px' }}
              />
            ) : (
              <span
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: champion.avatarColor || '#3b82f6',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
              >
                {champion.avatarIcon || '🏆'}
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="icon-btn primary" onClick={onClose}>
            Celebrate Champion!
          </button>
        </div>
      </div>
    </div>
  );
};
