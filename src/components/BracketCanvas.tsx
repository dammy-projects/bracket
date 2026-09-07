import React, { useEffect, useState, useRef } from 'react';
import { Match, Round } from '../types/tournament';
import { MatchCard } from './MatchCard';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface BracketCanvasProps {
  matches: Match[];
  rounds: Round[];
  activeRoundIndex: number | 'all';
  highlightedParticipantId: string | null;
  onSelectMatch: (match: Match) => void;
  onHoverParticipant: (id: string | null) => void;
}

interface ConnectorLine {
  id: string;
  d: string;
  isHighlighted: boolean;
}

export const BracketCanvas: React.FC<BracketCanvasProps> = ({
  matches,
  rounds,
  activeRoundIndex,
  highlightedParticipantId,
  onSelectMatch,
  onHoverParticipant,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connectors, setConnectors] = useState<ConnectorLine[]>([]);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Recalculate connector SVG paths
  const updateConnectors = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const lines: ConnectorLine[] = [];

    const isPrintMedia = window.matchMedia('print').matches;
    const currentScale = isPrintMedia ? 1 : zoomScale;

    matches.forEach((m) => {
      if (!m.nextMatchId) return;

      const currentEl = document.getElementById(`match-${m.id}`);
      const nextEl = document.getElementById(`match-${m.nextMatchId}`);

      if (currentEl && nextEl) {
        const sourceCard = currentEl.querySelector('.match-card') || currentEl;
        const targetCard = nextEl.querySelector('.match-card') || nextEl;

        const r1 = sourceCard.getBoundingClientRect();
        const r2 = targetCard.getBoundingClientRect();

        const targetRows = targetCard.querySelectorAll('.participant-row');
        let targetY = r2.top + r2.height / 2;
        if (m.nextMatchSlot === 'participant1' && targetRows[0]) {
          const rowRect = targetRows[0].getBoundingClientRect();
          targetY = rowRect.top + rowRect.height / 2;
        } else if (m.nextMatchSlot === 'participant2' && targetRows[1]) {
          const rowRect = targetRows[1].getBoundingClientRect();
          targetY = rowRect.top + rowRect.height / 2;
        }

        // Calculate relative coordinates to container canvas
        const x1 = (r1.right - containerRect.left) / currentScale;
        const y1 = (r1.top + r1.height / 2 - containerRect.top) / currentScale;

        const x2 = (r2.left - containerRect.left) / currentScale;
        const y2 = (targetY - containerRect.top) / currentScale;

        const midX = x1 + (x2 - x1) / 2;

        const d = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;

        const isHighlighted =
          Boolean(highlightedParticipantId) &&
          Boolean(
            (m.participant1 && m.participant1.id === highlightedParticipantId) ||
              (m.participant2 && m.participant2.id === highlightedParticipantId)
          ) &&
          Boolean(m.winnerId && m.winnerId === highlightedParticipantId);

        lines.push({
          id: `${m.id}->${m.nextMatchId}`,
          d,
          isHighlighted,
        });
      }
    });

    setConnectors(lines);
  };

  useEffect(() => {
    updateConnectors();
    const timer = setTimeout(updateConnectors, 100);
    const timer2 = setTimeout(updateConnectors, 400);

    const handleBeforePrint = () => {
      updateConnectors();
    };

    const handleAfterPrint = () => {
      updateConnectors();
    };

    window.addEventListener('resize', updateConnectors);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateConnectors);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [matches, activeRoundIndex, highlightedParticipantId, zoomScale]);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.15, 1.8));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.15, 0.6));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
  };

  // Group matches by round
  const filteredRounds =
    activeRoundIndex === 'all'
      ? rounds
      : rounds.filter((r) => r.index === activeRoundIndex);

  return (
    <div className="bracket-container">
      {/* Zoom Toolbar */}
      <div
        className="zoom-toolbar no-print"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(30, 34, 45, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '6px 10px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <button
          className="icon-btn"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          style={{ padding: '6px 10px' }}
        >
          <ZoomIn size={16} />
        </button>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#d1d5db',
            minWidth: '45px',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {Math.round(zoomScale * 100)}%
        </span>
        <button
          className="icon-btn"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          style={{ padding: '6px 10px' }}
        >
          <ZoomOut size={16} />
        </button>
        <button
          className="icon-btn"
          onClick={handleResetZoom}
          title="Reset Zoom (100%)"
          style={{ padding: '6px 10px' }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div
        className="bracket-columns"
        ref={containerRef}
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* SVG Connectors Canvas Layer */}
        {activeRoundIndex === 'all' && (
          <svg className="connectors-svg">
            {connectors.map((line) => (
              <path
                key={line.id}
                d={line.d}
                fill="none"
                stroke={line.isHighlighted ? '#60a5fa' : 'var(--border-connector)'}
                strokeWidth={line.isHighlighted ? '3.5' : '2.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease' }}
              />
            ))}
          </svg>
        )}

        {/* Round Columns */}
        {filteredRounds.map((round) => {
          const roundMatches = matches.filter((m) => m.roundIndex === round.index);
          return (
            <div key={round.index} className="round-column">
              <div className="round-header-label">{round.name}</div>
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  highlightedParticipantId={highlightedParticipantId}
                  onSelectMatch={onSelectMatch}
                  onHoverParticipant={onHoverParticipant}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
