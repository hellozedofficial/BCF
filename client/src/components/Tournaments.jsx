import React, { useState } from 'react';
import {
  TrophyIcon,
  CalendarIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  CopyIcon,
  BracketIcon,
  CheckIcon,
  XIcon
} from './Icons';
import { API_BASE } from '../config/api';

export default function Tournaments({ tournaments = [], onOpenRegister }) {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Draws & Bracket Modal State
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [drawsModalOpen, setDrawsModalOpen] = useState(false);
  const [bracketData, setBracketData] = useState(null);
  const [loadingBracket, setLoadingBracket] = useState(false);
  const [modalTab, setModalTab] = useState('bracket');
  const [roundFilter, setRoundFilter] = useState('All');

  const filteredTournaments = tournaments.filter(t => {
    const matchesFilter = filter === 'All' ? true : t.status === filter;
    const q = searchQuery.toLowerCase().trim();
    const code = (t.tournament_code || `T-${String(t.id).padStart(6, '0')}`).toLowerCase();
    const matchesSearch =
      !q ||
      code.includes(q) ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.venue && t.venue.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const handleCopyCode = (code, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenDraws = async (t) => {
    setSelectedTournament(t);
    setDrawsModalOpen(true);
    setModalTab('bracket');
    setRoundFilter('All');
    setLoadingBracket(true);

    try {
      const res = await fetch(`${API_BASE}/tournaments/${t.id}/bracket`);
      const json = await res.json();
      if (json.success) {
        setBracketData(json.data);
      }
    } catch (err) {
      console.error('Failed to load bracket data:', err);
    } finally {
      setLoadingBracket(false);
    }
  };

  const allMatches = bracketData?.matches || [];
  const distinctRounds = Array.from(new Set(allMatches.map(m => m.round_name))).filter(Boolean);

  const displayedMatches = allMatches.filter(m => {
    if (roundFilter === 'All') return true;
    return m.round_name === roundFilter;
  });

  return (
    <section style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
              <TrophyIcon className="w-3.5 h-3.5" />
              <span>Sanctioned Championship Series</span>
            </div>
            <h2 className="section-headline">Official Tournaments Calendar</h2>
            <p className="section-subtitle">
              Sanctioned National Championships, Premier Leagues, and District Ranking Events.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Upcoming', 'Ongoing', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={filter === status ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '9999px' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '24px', maxWidth: '420px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <SearchIcon style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by code (e.g. T-942234), title, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--card-bg, #ffffff)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', border: '1px dashed var(--border-subtle)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              No tournaments matching current filters or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((t) => {
              const isUpcoming = t.status === 'Upcoming';
              const isOngoing = t.status === 'Ongoing';
              const code = t.tournament_code || `T-${String(t.id).padStart(6, '0')}`;
              const isCopied = copiedCode === code;

              return (
                <div 
                  key={t.id} 
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderTop: isOngoing ? '3px solid #EF4444' : isUpcoming ? '3px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  <div>
                    {/* Top Badges: Tournament Code & Status */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                      <div 
                        onClick={(e) => handleCopyCode(code, e)}
                        title="Click to copy tournament code"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-secondary, #F1F5F9)',
                          color: 'var(--text-primary)',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        {isCopied ? <CheckIcon className="w-3 h-3" style={{ color: '#10B981' }} /> : <CopyIcon className="w-3 h-3" />}
                        <span>{code}</span>
                      </div>

                      <span 
                        className={isOngoing ? 'badge badge-live' : isUpcoming ? 'badge badge-green' : 'badge badge-blue'} 
                        style={{ fontSize: '11px' }}
                      >
                        {isOngoing && <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />}
                        {t.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {t.title}
                    </h3>

                    <div style={{ display: 'inline-block', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', marginBottom: '12px' }}>
                      Edition: {t.edition || '2026'} • {t.format || 'Knockout'} Format
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                      {t.description || 'Official Bangladesh Carrom Federation sanctioned championship tournament.'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                        <span>{t.venue}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                        <span>{t.start_date ? new Date(t.start_date).toLocaleDateString() : 'TBD'} — {t.end_date ? new Date(t.end_date).toLocaleDateString() : 'TBD'}</span>
                      </div>

                      {t.prize_pool && (
                        <div className="flex items-center gap-2">
                          <TrophyIcon className="w-4 h-4" style={{ color: '#F59E0B', flexShrink: 0 }} />
                          <span style={{ fontWeight: '700', color: '#F59E0B' }}>Prize Pool: {t.prize_pool}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenDraws(t)}
                      className="btn btn-outline"
                      style={{ width: '100%', fontSize: '13px', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <BracketIcon className="w-4 h-4" />
                      <span>Official Draws & Fixtures</span>
                    </button>

                    {isUpcoming && onOpenRegister && (
                      <button 
                        onClick={() => onOpenRegister(t.id)}
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '13px', padding: '8px 0' }}
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Register for this Event</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Draws & Fixtures Modal */}
      {drawsModalOpen && selectedTournament && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setDrawsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--text-primary)',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    onClick={(e) => handleCopyCode(selectedTournament.tournament_code || `T-${String(selectedTournament.id).padStart(6, '0')}`, e)}
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary, #F1F5F9)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    {selectedTournament.tournament_code || `T-${String(selectedTournament.id).padStart(6, '0')}`}
                  </span>
                  <span className="badge badge-gold" style={{ fontSize: '10px' }}>
                    {selectedTournament.edition || '2026'}
                  </span>
                  <span className={selectedTournament.status === 'Ongoing' ? 'badge badge-live' : 'badge badge-blue'} style={{ fontSize: '10px' }}>
                    {selectedTournament.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
                  {selectedTournament.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {selectedTournament.venue} • ICF Rules: {selectedTournament.board_limit || 8} Boards • {selectedTournament.points_limit || 25} Points Max
                </p>
              </div>

              <button
                onClick={() => setDrawsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary, #F8FAFC)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setModalTab('bracket')}
                  style={{
                    border: 'none',
                    background: modalTab === 'bracket' ? 'var(--primary-color, #2563EB)' : 'transparent',
                    color: modalTab === 'bracket' ? '#ffffff' : 'var(--text-secondary)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Fixtures & Bracket ({bracketData?.matches?.length || 0})
                </button>
                <button
                  onClick={() => setModalTab('participants')}
                  style={{
                    border: 'none',
                    background: modalTab === 'participants' ? 'var(--primary-color, #2563EB)' : 'transparent',
                    color: modalTab === 'participants' ? '#ffffff' : 'var(--text-secondary)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Enrolled Players ({bracketData?.participants?.length || 0})
                </button>
              </div>

              {modalTab === 'bracket' && distinctRounds.length > 0 && (
                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--card-bg, #ffffff)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="All">All Rounds</option>
                  {distinctRounds.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {loadingBracket ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  Loading official tournament draw and matches...
                </div>
              ) : modalTab === 'bracket' ? (
                displayedMatches.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No fixtures have been scheduled for this tournament yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {displayedMatches.map((m) => {
                      const isCompleted = m.status === 'Completed';
                      const isLive = m.status === 'Live';
                      const p1Won = m.winner_id && m.winner_id === m.player1_id;
                      const p2Won = m.winner_id && m.winner_id === m.player2_id;

                      return (
                        <div
                          key={m.id}
                          style={{
                            border: '1px solid var(--border-subtle)',
                            borderLeft: isLive ? '4px solid #EF4444' : isCompleted ? '4px solid #10B981' : '4px solid var(--border-subtle)',
                            borderRadius: '10px',
                            padding: '14px 18px',
                            backgroundColor: 'var(--card-bg, #ffffff)'
                          }}
                        >
                          {/* Round & Board info */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {m.round_name}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary, #F1F5F9)', padding: '2px 6px', borderRadius: '4px' }}>
                                Board {m.board_number || 1}
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: isLive ? '#FEE2E2' : isCompleted ? '#D1FAE5' : 'var(--bg-secondary, #F1F5F9)',
                                color: isLive ? '#EF4444' : isCompleted ? '#059669' : 'var(--text-secondary)'
                              }}
                            >
                              {m.status}
                            </span>
                          </div>

                          {/* Match Pairings */}
                          {(() => {
                            const isP1BYE = m.player1_name === 'BYE';
                            const isP2BYE = m.player2_name === 'BYE';
                            const isBYEMatch = isP1BYE || isP2BYE;

                            return (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px' }}>
                                {/* Player 1 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {isP1BYE ? (
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary, #F1F5F9)', padding: '3px 8px', borderRadius: '4px' }}>
                                      BYE (No Opponent)
                                    </span>
                                  ) : (
                                    <>
                                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0, overflow: 'hidden' }}>
                                        {m.player1_photo ? (
                                          <img src={m.player1_photo} alt={m.player1_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          m.player1_name?.replace(/\[#\d+\]\s*/, '').charAt(0) || 'P'
                                        )}
                                      </div>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: p1Won ? '800' : '650', fontSize: '13px', color: p1Won ? 'var(--text-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {m.player1_name || 'TBD'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                          {m.player1_code || 'BCF Player'}{m.player1_district ? ` • ${m.player1_district}` : ''}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Score Display */}
                                {isBYEMatch ? (
                                  <div style={{ textAlign: 'center', padding: '4px 10px', backgroundColor: 'var(--bg-secondary, #F1F5F9)', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#059669', backgroundColor: '#D1FAE5', padding: '2px 6px', borderRadius: '4px' }}>
                                      WALKOVER (BYE)
                                    </span>
                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                      Auto Advanced
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '4px 12px', backgroundColor: 'var(--bg-secondary, #F1F5F9)', borderRadius: '8px' }}>
                                    <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', letterSpacing: '1px' }}>
                                      {m.player1_score || 0} - {m.player2_score || 0}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                      Board {m.current_board || 1} of {selectedTournament.board_limit || 8}
                                    </div>
                                  </div>
                                )}

                                {/* Player 2 */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', textAlign: 'right' }}>
                                  {isP2BYE ? (
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary, #F1F5F9)', padding: '3px 8px', borderRadius: '4px' }}>
                                      BYE (No Opponent)
                                    </span>
                                  ) : (
                                    <>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: p2Won ? '800' : '650', fontSize: '13px', color: p2Won ? 'var(--text-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {m.player2_name || 'TBD'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                          {m.player2_code || 'BCF Player'}{m.player2_district ? ` • ${m.player2_district}` : ''}
                                        </div>
                                      </div>
                                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#D97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0, overflow: 'hidden' }}>
                                        {m.player2_photo ? (
                                          <img src={m.player2_photo} alt={m.player2_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          m.player2_name?.replace(/\[#\d+\]\s*/, '').charAt(0) || 'P'
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Participants Tab */
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px' }}>Seed #</th>
                        <th style={{ padding: '8px' }}>Player Name</th>
                        <th style={{ padding: '8px' }}>National Rank</th>
                        <th style={{ padding: '8px' }}>Rating</th>
                        <th style={{ padding: '8px' }}>Club & District</th>
                        <th style={{ padding: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bracketData?.participants?.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: '700' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: p.seed_number <= 2 ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary, #F1F5F9)', color: p.seed_number <= 2 ? '#2563EB' : 'inherit' }}>
                              #{p.seed_number}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: '600' }}>
                            {p.full_name}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            {p.national_rank ? `#${p.national_rank}` : '—'}
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: '700', color: 'var(--primary-color, #2563EB)' }}>
                            {p.rating_points || 1500} pts
                          </td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                            {p.club_name || 'Affiliated'} ({p.district || 'Dhaka'})
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary, #F1F5F9)', color: 'var(--text-secondary)' }}>
                              {p.status || 'Registered'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-secondary, #F8FAFC)' }}>
              <button
                onClick={() => setDrawsModalOpen(false)}
                className="btn btn-outline"
                style={{ fontSize: '13px', padding: '6px 18px', borderRadius: '8px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
