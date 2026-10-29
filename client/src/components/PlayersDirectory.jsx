import React, { useState } from 'react';
import { SearchIcon, TrophyIcon, ShieldIcon } from './Icons';
import { getMediaUrl } from '../config/api';

export default function PlayersDirectory({ players = [], onOpenRegister, onNavigate }) {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');

  const activePlayers = players.filter(p => (p.status || 'Active') === 'Active');
  const districts = ['All', ...new Set(activePlayers.map(p => p.district).filter(Boolean))];

  const filtered = activePlayers.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.club_name && p.club_name.toLowerCase().includes(search.toLowerCase())) ||
                          (p.player_id && p.player_id.toLowerCase().includes(search.toLowerCase()));
    const matchesDistrict = districtFilter === 'All' || p.district === districtFilter;
    return matchesSearch && matchesDistrict;
  });

  return (
    <section style={{ padding: '36px 0' }}>
      <div className="container">
        <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-headline">Registered Player Directory</h2>
            <p className="section-subtitle">
              Official roster of certified carrom players across Bangladesh.
            </p>
          </div>

          <button onClick={onOpenRegister} className="btn btn-primary" style={{ fontSize: '13px' }}>
            + Register New Player
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="card" style={{ marginBottom: '24px', padding: '14px 20px', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player by name, ID (e.g. BCF2026100002), club..."
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                <SearchIcon className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>District:</span>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="form-input"
                style={{ width: 'auto', padding: '8px 12px' }}
              >
                {districts.map(d => (
                  <option key={d} value={d} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(p => {
            const profilePath = `/player/${p.player_id || p.id}`;
            const initials = p.full_name ? p.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'P';

            return (
              <div
                key={p.id}
                className="card"
                onClick={() => onNavigate && onNavigate(profilePath)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--accent-green)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                  <span className="badge badge-gold" style={{ fontSize: '10px' }}>
                    {p.national_rank ? `Rank #${p.national_rank}` : (p.player_id || 'Roster')}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                    {p.gender} • {p.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 800,
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: '2px solid var(--border-subtle)'
                  }}>
                    {p.photo_url ? (
                      <img
                        src={getMediaUrl(p.photo_url)}
                        alt={p.full_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : initials}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{
                      fontSize: '15px',
                      fontWeight: '800',
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {p.full_name}
                    </h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.club_name || 'Individual'} • {p.district}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  textAlign: 'center',
                  gap: '4px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Rating</div>
                    <div className="font-mono" style={{ fontWeight: '700', color: '#B45309' }}>{p.rating_points}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Won</div>
                    <div className="font-mono" style={{ fontWeight: '700', color: 'var(--accent-green)' }}>{p.matches_won}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Slams</div>
                    <div className="font-mono" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{p.white_slams + p.black_slams}</div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                    {p.player_id || `#${p.id}`}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)' }}>
                    View Profile →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
