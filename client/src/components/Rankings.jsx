import React, { useState } from 'react';
import { TrophyIcon, FlameIcon, ShieldIcon } from './Icons';

export default function Rankings({ players = [], onNavigate }) {
  const [selectedGender, setSelectedGender] = useState('Men');

  const filteredPlayers = players.filter(p => p.gender === selectedGender && (p.status || 'Active') === 'Active');

  return (
    <section style={{ padding: '36px 0' }}>
      <div className="container">
        <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: '28px' }}>
          <div>
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-6 h-6" style={{ color: '#F59E0B' }} />
              <h2 className="section-headline">Official BCF National Rankings</h2>
            </div>
            <p className="section-subtitle">
              Calculated dynamically according to ICF Elo rating standards across all national sanctioned circuits.
            </p>
          </div>

          {/* Gender Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedGender('Men')}
              className={selectedGender === 'Men' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              Men's Singles
            </button>
            <button
              onClick={() => setSelectedGender('Women')}
              className={selectedGender === 'Women' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              Women's Singles
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-tertiary)', width: '70px' }}>RANK</th>
                  <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-tertiary)' }}>PLAYER</th>
                  <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-tertiary)' }}>CLUB / DISTRICT</th>
                  <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-tertiary)' }}>RECORD (W-L)</th>
                  <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-tertiary)' }}>WHITE SLAMS</th>
                  <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-tertiary)' }}>BLACK SLAMS</th>
                  <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-tertiary)', textAlign: 'right' }}>RATING PTS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, idx) => {
                  const isTopRank = idx === 0;
                  const winRate = player.matches_played > 0
                    ? Math.round((player.matches_won / player.matches_played) * 100)
                    : 0;

                  return (
                    <tr
                      key={player.id}
                      onClick={() => onNavigate && onNavigate(`/player/${player.player_id || player.id}`)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isTopRank ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isTopRank ? 'rgba(245, 158, 11, 0.05)' : 'transparent';
                      }}
                    >
                      {/* Rank */}
                      <td style={{ padding: '16px 18px' }}>
                        {isTopRank ? (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            color: '#000',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px'
                          }}>
                            1
                          </div>
                        ) : (
                          <span className="font-mono" style={{ fontWeight: '700', color: 'var(--text-secondary)', fontSize: '15px' }}>
                            #{idx + 1}
                          </span>
                        )}
                      </td>

                      {/* Player Info */}
                      <td style={{ padding: '16px 18px' }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{player.full_name}</span>
                          <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {player.category}
                          </span>
                        </div>
                      </td>

                      {/* Club / District */}
                      <td style={{ padding: '16px 18px', color: 'var(--text-secondary)' }}>
                        <div>{player.club_name || 'Individual'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{player.district}</div>
                      </td>

                      {/* Win Loss Record */}
                      <td style={{ padding: '16px 18px' }}>
                        <span className="font-mono" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {player.matches_won}W - {player.matches_played - player.matches_won}L
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--accent-green)', marginLeft: '6px' }}>
                          ({winRate}%)
                        </span>
                      </td>

                      {/* White Slams */}
                      <td style={{ padding: '16px 18px' }}>
                        <span className="badge badge-green" style={{ fontSize: '12px', fontWeight: '700' }}>
                          {player.white_slams}
                        </span>
                      </td>

                      {/* Black Slams */}
                      <td style={{ padding: '16px 18px' }}>
                        <span className="badge badge-gold" style={{ fontSize: '12px', fontWeight: '700' }}>
                          {player.black_slams}
                        </span>
                      </td>

                      {/* Rating Points */}
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <span className="font-mono" style={{ fontSize: '17px', fontWeight: '800', color: '#F59E0B' }}>
                          {player.rating_points}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }}>
                          pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
