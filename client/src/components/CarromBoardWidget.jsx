import React, { useState } from 'react';

export default function CarromBoardWidget({ player1 = "Hafizur Rahman", player2 = "Shakil Ahmed", p1Score = 21, p2Score = 14, currentBoard = 7 }) {
  const [strikerPos, setStrikerPos] = useState({ x: 200, y: 330 });
  const [queenPocketed, setQueenPocketed] = useState(false);
  const [whitePocketed, setWhitePocketed] = useState(6);
  const [blackPocketed, setBlackPocketed] = useState(4);

  const handleBaseLineMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 400;
    // Constrain to bottom baseline (between 100 and 300)
    const clampedX = Math.max(105, Math.min(295, clickX));
    setStrikerPos({ x: clampedX, y: 330 });
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      padding: '24px',
      position: 'relative'
    }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div>
          <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
            Board View • Official 74x74cm ICF Standard
          </span>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Board #{currentBoard} Interactive Arena
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Board Status</span>
            <div style={{ fontSize: '13px', fontWeight: '600', color: queenPocketed ? '#10B981' : '#F59E0B' }}>
              {queenPocketed ? '★ Queen Covered (+3 pts)' : '● Queen in Play'}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Board Rendering */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '420px', aspectRatio: '1/1', position: 'relative' }}>
          <svg 
            viewBox="0 0 400 400" 
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              background: '#2B1A0E'
            }}
            onClick={handleBaseLineMove}
          >
            {/* Outer Wood Frame */}
            <rect x="0" y="0" width="400" height="400" rx="16" fill="#3D2314" stroke="#5A351E" strokeWidth="6" />

            {/* Inner Playing Surface (Natural Lacquered Ply) */}
            <rect x="25" y="25" width="350" height="350" rx="4" fill="#D8B589" stroke="#1F150B" strokeWidth="2" />

            {/* Corner Pockets with Mesh Nets */}
            <circle cx="42" cy="42" r="16" fill="#111" stroke="#000" strokeWidth="2" />
            <circle cx="358" cy="42" r="16" fill="#111" stroke="#000" strokeWidth="2" />
            <circle cx="42" cy="358" r="16" fill="#111" stroke="#000" strokeWidth="2" />
            <circle cx="358" cy="358" r="16" fill="#111" stroke="#000" strokeWidth="2" />

            {/* Baselines (Top, Bottom, Left, Right) */}
            {/* Bottom Baseline */}
            <line x1="90" y1="330" x2="310" y2="330" stroke="#880000" strokeWidth="2" />
            <line x1="90" y1="336" x2="310" y2="336" stroke="#880000" strokeWidth="2" />
            <circle cx="95" cy="333" r="10" fill="#CC0000" stroke="#880000" strokeWidth="1" />
            <circle cx="305" cy="333" r="10" fill="#CC0000" stroke="#880000" strokeWidth="1" />

            {/* Top Baseline */}
            <line x1="90" y1="70" x2="310" y2="70" stroke="#880000" strokeWidth="2" />
            <line x1="90" y1="64" x2="310" y2="64" stroke="#880000" strokeWidth="2" />
            <circle cx="95" cy="67" r="10" fill="#CC0000" stroke="#880000" strokeWidth="1" />
            <circle cx="305" cy="67" r="10" fill="#CC0000" stroke="#880000" strokeWidth="1" />

            {/* Left Baseline */}
            <line x1="70" y1="90" x2="70" y2="310" stroke="#880000" strokeWidth="2" />
            <line x1="64" y1="90" x2="64" y2="310" stroke="#880000" strokeWidth="2" />
            <circle cx="67" cy="95" r="10" fill="#CC0000" stroke="#880000" strokeWidth="1" />
            <circle cx="67" cy="305" r="10" fill="#CC0000" stroke="#880000" strokeWidth="1" />

            {/* Right Baseline */}
            <line x1="330" y1="90" x2="330" y2="310" stroke="#880000" strokeWidth="2" />
            <line x1="336" y1="90" x2="336" y2="310" stroke="#880000" strokeWidth="2" />
            <circle cx="333" cy="95" r="10" fill="#CC0000" stroke="#880000" strokeWidth="1" />
            <circle cx="333" cy="305" r="10" fill="#CC0000" stroke="#880000" strokeWidth="1" />

            {/* Corner Aiming Arrows */}
            <line x1="85" y1="85" x2="135" y2="135" stroke="#990000" strokeWidth="1.5" strokeDasharray="3,3" />
            <line x1="315" y1="85" x2="265" y2="135" stroke="#990000" strokeWidth="1.5" strokeDasharray="3,3" />
            <line x1="85" y1="315" x2="135" y2="265" stroke="#990000" strokeWidth="1.5" strokeDasharray="3,3" />
            <line x1="315" y1="315" x2="265" y2="265" stroke="#990000" strokeWidth="1.5" strokeDasharray="3,3" />

            {/* Center Outer Circle */}
            <circle cx="200" cy="200" r="32" fill="none" stroke="#880000" strokeWidth="1.5" />
            
            {/* Center Inner Circle */}
            <circle cx="200" cy="200" r="12" fill="#C43D2A" stroke="#5A150D" strokeWidth="1" />

            {/* Carrom Men (Pawns) in Center Formation */}
            {/* Queen (Red) */}
            {!queenPocketed ? (
              <circle cx="200" cy="200" r="8" fill="#E11D48" stroke="#881337" strokeWidth="1.5" />
            ) : (
              <circle cx="200" cy="200" r="8" fill="none" stroke="#E11D48" strokeWidth="1" strokeDasharray="2,2" />
            )}

            {/* White and Black Pieces Around Center */}
            {/* White pieces */}
            <circle cx="185" cy="195" r="7.5" fill="#FAFAFA" stroke="#A1A1AA" strokeWidth="1" />
            <circle cx="215" cy="205" r="7.5" fill="#FAFAFA" stroke="#A1A1AA" strokeWidth="1" />
            <circle cx="200" cy="182" r="7.5" fill="#FAFAFA" stroke="#A1A1AA" strokeWidth="1" />

            {/* Black pieces */}
            <circle cx="200" cy="218" r="7.5" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />
            <circle cx="215" cy="195" r="7.5" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />
            <circle cx="185" cy="205" r="7.5" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />

            {/* Aiming Line from Striker */}
            <line 
              x1={strikerPos.x} 
              y1={strikerPos.y} 
              x2={200} 
              y2={200} 
              stroke="rgba(59, 130, 246, 0.7)" 
              strokeWidth="1.5" 
              strokeDasharray="4,4" 
            />

            {/* Striker (Player's turn) */}
            <circle 
              cx={strikerPos.x} 
              cy={strikerPos.y} 
              r="12" 
              fill="#2563EB" 
              stroke="#93C5FD" 
              strokeWidth="2.5" 
              style={{ cursor: 'pointer' }}
            />
            <circle cx={strikerPos.x} cy={strikerPos.y} r="4" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Board Controls & Pawn Counter */}
      <div className="flex items-center justify-between" style={{
        marginTop: '16px',
        padding: '12px 16px',
        background: 'var(--bg-elevated)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FAFAFA', display: 'inline-block', border: '1px solid #CCC' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>White Pocketed:</span>
            <span className="font-mono" style={{ fontWeight: '700' }}>{whitePocketed}/9</span>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#18181B', display: 'inline-block', border: '1px solid #555' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Black Pocketed:</span>
            <span className="font-mono" style={{ fontWeight: '700' }}>{blackPocketed}/9</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setQueenPocketed(!queenPocketed)}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            {queenPocketed ? 'Reset Queen' : 'Pocket Queen'}
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            (Click baseline to position Striker)
          </span>
        </div>
      </div>
    </div>
  );
}
