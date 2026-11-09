'use client';

import React, { useState } from 'react';
import { RadioIcon } from './Icons';
import { Trophy, Coins, Crown } from 'lucide-react';
import { getEmbedUrl } from '../utils/media';

export default function LiveMatches({ matches = [], tournaments = [], loading = false, onUpdateMatch }) {
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Date Helper: Determine if a match is scheduled or played today
  const isMatchToday = (m) => {
    const rawDate = m.scheduled_at || m.match_date || m.created_at;
    if (!rawDate) return false;
    try {
      const matchDay = new Date(rawDate).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return matchDay === today;
    } catch {
      return false;
    }
  };

  // 1. Filter by Tournament
  const tournamentMatches = React.useMemo(() => {
    if (tournamentFilter === 'all') return matches;
    return matches.filter(m => String(m.tournament_id) === String(tournamentFilter));
  }, [matches, tournamentFilter]);

  // 2. Smart Sorting: Live first, Today second, Recent date descending
  const sortedMatches = React.useMemo(() => {
    return [...tournamentMatches].sort((a, b) => {
      const aLive = (a.status || '').toLowerCase() === 'live' ? 1 : 0;
      const bLive = (b.status || '').toLowerCase() === 'live' ? 1 : 0;
      if (bLive !== aLive) return bLive - aLive;

      const aToday = isMatchToday(a) ? 1 : 0;
      const bToday = isMatchToday(b) ? 1 : 0;
      if (bToday !== aToday) return bToday - aToday;

      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : (a.match_date ? new Date(a.match_date).getTime() : 0);
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : (b.match_date ? new Date(b.match_date).getTime() : 0);
      if (bTime !== aTime) return bTime - aTime;

      return (b.id || 0) - (a.id || 0);
    });
  }, [tournamentMatches]);

  // Active / selected match computation (Live > Today's Match > Fallback)
  const activeMatches = sortedMatches.filter(m => (m.status || '').toLowerCase() === 'live');
  const todayMatches = sortedMatches.filter(m => isMatchToday(m));
  const currentMatch = sortedMatches.find(m => m.id === selectedMatchId) 
    || activeMatches[0] 
    || todayMatches[0] 
    || sortedMatches[0] 
    || null;

  // Real-time score events timeline state
  const [scoreEvents, setScoreEvents] = useState([]);

  // Calculate per-board scores from score events
  const boardScores = React.useMemo(() => {
    const map = {};
    scoreEvents.forEach((ev) => {
      const b = Number(ev.board_number) || 1;
      if (!map[b]) map[b] = { player1: 0, player2: 0 };
      if (Number(ev.player_slot) === 1) map[b].player1 += Number(ev.points) || 0;
      else if (Number(ev.player_slot) === 2) map[b].player2 += Number(ev.points) || 0;
    });
    return map;
  }, [scoreEvents]);

  const activeBoard = Number(currentMatch?.current_board) || 1;
  const activeBoardScore = boardScores[activeBoard] || { player1: 0, player2: 0 };

  // ICF Carrom Rules: Toss winner selects White or Black (Break)
  // Turn to break and White/Black assignments flip alternately every board!
  const getCarromRoleAndColor = (match, playerSlot, boardNum = 1) => {
    if (!match) {
      return {
        color: playerSlot === 1 ? 'White' : 'Black',
        isWhite: playerSlot === 1,
        role: playerSlot === 1 ? 'White Striker (Break)' : 'Black Defender',
        shortRole: playerSlot === 1 ? 'White Striker' : 'Black Defender'
      };
    }

    let p1IsWhiteBoard1 = true;
    if (match.toss_winner_id) {
      if (Number(match.toss_winner_id) === Number(match.player1_id)) {
        p1IsWhiteBoard1 = match.toss_choice !== 'Black';
      } else if (Number(match.toss_winner_id) === Number(match.player2_id)) {
        p1IsWhiteBoard1 = match.toss_choice === 'Black';
      }
    }

    // ICF Alternation: Colors and break alternate on each board
    const isOddBoard = (Number(boardNum) % 2) !== 0;
    const p1IsWhite = isOddBoard ? p1IsWhiteBoard1 : !p1IsWhiteBoard1;
    const isWhite = playerSlot === 1 ? p1IsWhite : !p1IsWhite;

    return {
      color: isWhite ? 'White' : 'Black',
      isWhite,
      role: isWhite ? 'White Striker (Break)' : 'Black Defender',
      shortRole: isWhite ? 'White Striker' : 'Black Defender'
    };
  };

  React.useEffect(() => {
    if (!currentMatch?.id) {
      setScoreEvents([]);
      return;
    }

    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/matches/${currentMatch.id}/events`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            setScoreEvents(json.data || []);
          }
        }
      } catch (err) {}
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, (currentMatch.status || '').toLowerCase() === 'live' ? 3000 : 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentMatch?.id, currentMatch?.status]);

  // Curated, authentic Carrom Championship fallback streams
  const fallbackVideos = [
    'https://www.youtube-nocookie.com/embed/jQHclik08SU?autoplay=0&rel=0', // Carrom World Cup Final
    'https://www.youtube-nocookie.com/embed/3yGUB4LEnWI?autoplay=0&rel=0', // National Championship Molla Tournament
    'https://www.youtube-nocookie.com/embed/-ECRzKb8i4o?autoplay=0&rel=0', // Senior National Carrom Championship
    'https://www.youtube-nocookie.com/embed/ci3cfJt4zAo?autoplay=0&rel=0'  // Carrom Live MS Final Match
  ];

  const matchEmbedUrl = currentMatch?.stream_url ? getEmbedUrl(currentMatch.stream_url) : null;
  const fallbackUrl = currentMatch ? fallbackVideos[Math.abs(Number(currentMatch.id) || 0) % fallbackVideos.length] : fallbackVideos[0];
  const currentVideoUrl = matchEmbedUrl || fallbackUrl;

  // Counts for filters
  const liveCount = tournamentMatches.filter(m => (m.status || '').toLowerCase() === 'live').length;
  const scheduledCount = tournamentMatches.filter(m => {
    const s = (m.status || 'scheduled').toLowerCase();
    return s === 'scheduled' || s === 'upcoming';
  }).length;
  const completedCount = tournamentMatches.filter(m => {
    const s = (m.status || '').toLowerCase();
    return s === 'completed' || s === 'finished';
  }).length;

  // Filtered fixtures for the list
  const filteredMatches = sortedMatches.filter(m => {
    const statusLower = (m.status || 'scheduled').toLowerCase();
    if (statusFilter === 'live' && statusLower !== 'live') return false;
    if (statusFilter === 'scheduled' && statusLower !== 'scheduled' && statusLower !== 'upcoming') return false;
    if (statusFilter === 'completed' && statusLower !== 'completed' && statusLower !== 'finished') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const p1 = (m.player1_name || '').toLowerCase();
      const p2 = (m.player2_name || '').toLowerCase();
      const round = (m.round_name || '').toLowerCase();
      const tourney = (m.tournament_title || '').toLowerCase();
      const boardStr = `board #${m.current_board || 1}`.toLowerCase();
      if (!p1.includes(q) && !p2.includes(q) && !round.includes(q) && !tourney.includes(q) && !boardStr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Top quick-switch pills: prioritize live matches + first few upcoming (avoid dumping 30+ pills)
  const priorityMatches = sortedMatches.slice(0, 6);
  if (currentMatch && !priorityMatches.some(m => m.id === currentMatch.id)) {
    priorityMatches.push(currentMatch);
  }

  // Skeleton loading view
  if (loading && matches.length === 0) {
    return (
      <section style={{
        padding: '8px 0 24px 0',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}>
        <div className="container" style={{ maxWidth: '1360px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
            <div className="bcf-skeleton" style={{ width: 180, height: 28, borderRadius: 9999 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="bcf-skeleton" style={{ width: 90, height: 28, borderRadius: 9999 }} />
              <div className="bcf-skeleton" style={{ width: 90, height: 28, borderRadius: 9999 }} />
              <div className="bcf-skeleton" style={{ width: 90, height: 28, borderRadius: 9999 }} />
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.45fr) minmax(340px, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div className="bcf-skeleton" style={{ width: '100%', aspectRatio: '16 / 9' }} />
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="bcf-skeleton" style={{ width: 140, height: 18 }} />
                <div className="bcf-skeleton" style={{ width: 100, height: 18 }} />
              </div>
            </div>
            <div style={{ borderRadius: 16, padding: '20px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="bcf-skeleton" style={{ width: '60%', height: 24 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                <div className="bcf-skeleton" style={{ height: 110, borderRadius: 12 }} />
                <div className="bcf-skeleton" style={{ height: 40, borderRadius: 8 }} />
                <div className="bcf-skeleton" style={{ height: 110, borderRadius: 12 }} />
              </div>
              <div className="bcf-skeleton" style={{ width: '100%', height: 48, borderRadius: 10, marginTop: 'auto' }} />
            </div>
          </div>
          <div style={{ borderRadius: 16, padding: '16px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="bcf-skeleton" style={{ width: 200, height: 20, marginBottom: '8px' }} />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bcf-skeleton" style={{ width: '100%', height: 48, borderRadius: 10 }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{
      padding: '8px 0 24px 0',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start'
    }}>
      <div className="container" style={{ maxWidth: '1360px', width: '100%' }}>
        {/* Compact Header & Match Switcher Bar */}
        <div className="live-header-bar" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Title & Pulse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#EF4444',
              background: 'rgba(239, 68, 68, 0.12)',
              padding: '3px 10px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <RadioIcon className="w-3 h-3" />
              LIVE STREAM
            </span>
            {tournaments && tournaments.length > 0 && (
              <select
                value={tournamentFilter}
                onChange={(e) => {
                  setTournamentFilter(e.target.value);
                  setSelectedMatchId(null);
                }}
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '3px 5px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Tournaments</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            )}
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-tertiary)'
            }}>
              {liveCount > 0 ? `${liveCount} Live Court${liveCount > 1 ? 's' : ''}` : 'Featured Broadcast'}
            </span>
          </div>

          {/* Quick Match Selector Pills (Prioritized top matches only) */}
          <div className="live-matches-pills-bar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
            maxWidth: '100%'
          }}>
            {priorityMatches.map((m) => {
              const isSelected = (currentMatch?.id === m.id);
              const isLive = (m.status === 'Live');
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className="live-match-pill"
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? '700' : '600',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-surface)',
                    color: isSelected ? 'var(--accent-green)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isSelected ? '0 1px 4px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isLive && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)'
                    }} />
                  )}
                  <span>{m.player1_name?.split(' ')[0]} vs {m.player2_name?.split(' ')[0]}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: isSelected ? 'var(--accent-green)' : 'var(--text-tertiary)'
                  }}>
                    ({m.player1_score ?? 0}-{m.player2_score ?? 0})
                  </span>
                </button>
              );
            })}

            {matches.length > priorityMatches.length && (
              <span style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                fontWeight: '600',
                padding: '0 4px',
                whiteSpace: 'nowrap'
              }}>
                +{matches.length - priorityMatches.length} more in list
              </span>
            )}
          </div>
        </div>

        {/* Unified Arena Grid (Responsive: 2-col on desktop, stacked 1-col on mobile) */}
        <div className="live-arena-grid">
          {/* Left Column: YouTube Video Broadcast Player */}
          <div style={{
            background: '#0F172A',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--card-shadow)'
          }}>
            {/* Top Bar above Video */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: currentMatch?.status === 'Live' ? '#EF4444' : '#64748B',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em'
                }}>
                  {currentMatch?.status === 'Live' ? 'LIVE' : (currentMatch?.status || 'BROADCAST').toUpperCase()}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                  {currentMatch ? `${currentMatch.player1_name} vs ${currentMatch.player2_name}` : 'Live Match Stream'}
                </span>
              </div>
              {currentMatch?.round_name && (
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>
                  {currentMatch.round_name}
                </span>
              )}
            </div>

            {/* Responsive 16:9 YouTube Embed Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%', // 16:9 Aspect Ratio
              height: 0,
              background: '#000000'
            }}>
              <iframe
                key={currentMatch?.id ? `match-stream-${currentMatch.id}-${currentVideoUrl}` : currentVideoUrl}
                src={currentVideoUrl}
                title="BCF Live Match YouTube Feed"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Real-time Scoring Feed & Player Action Timeline (Below Live Stream) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.98)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Timeline Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: (currentMatch?.status === 'Live') ? '#10B981' : '#64748B',
                    boxShadow: (currentMatch?.status === 'Live') ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none',
                    animation: (currentMatch?.status === 'Live') ? 'pulse 1.5s infinite' : 'none'
                  }} />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#F8FAFC',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    Live Court Scoring Feed
                  </span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '700',
                    color: '#94A3B8',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '1px 7px',
                    borderRadius: '4px'
                  }}>
                    {scoreEvents.length} Recorded Strikes
                  </span>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#94A3B8'
                }}>
                  Court Board #{currentMatch?.current_board || 1}
                </span>
              </div>

              {/* Event Timeline List */}
              {scoreEvents.length === 0 ? (
                <div style={{
                  padding: '14px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)'
                }}>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#94A3B8' }}>
                    Referee is active at court console. Turn-by-turn points and Queen pockets appear here live in real time.
                  </p>
                </div>
              ) : (
                <div style={{
                  maxHeight: '175px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  paddingRight: '4px'
                }}>
                  {[...scoreEvents].reverse().map((ev, idx) => {
                    const originalIdx = scoreEvents.length - 1 - idx;
                    const prevEv = originalIdx > 0 ? scoreEvents[originalIdx - 1] : null;
                    const initials = (ev.player_name || 'BCF')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(p => p[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={ev.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: ev.is_queen
                            ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.8) 100%)'
                            : 'rgba(255, 255, 255, 0.04)',
                          border: ev.is_queen
                            ? '1px solid rgba(245, 158, 11, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        {/* Player Photo + Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                          {ev.photo_url ? (
                            <img
                              src={ev.photo_url}
                              alt={ev.player_name}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: ev.is_queen ? '2px solid #F59E0B' : '1.5px solid rgba(255, 255, 255, 0.2)',
                                flexShrink: 0
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: ev.is_queen ? '#F59E0B' : '#334155',
                              color: ev.is_queen ? '#000000' : '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: '800',
                              flexShrink: 0
                            }}>
                              {initials}
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: '#F8FAFC' }}>
                                {ev.player_name}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                color: ev.is_queen ? '#FBBF24' : '#10B981',
                                background: ev.is_queen ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                {ev.is_queen ? (
                                  <>
                                    <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                                    QUEEN (+3)
                                  </>
                                ) : (
                                  `+${ev.points} POINT`
                                )}
                              </span>
                            </div>

                            {/* Who scored after whom context */}
                            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px' }}>
                              {prevEv ? (
                                <span>scored after <strong style={{ color: '#CBD5E1' }}>{prevEv.player_name}</strong> (+{prevEv.points})</span>
                              ) : (
                                <span>Opening strike · Board #{ev.board_number}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Timestamp & Board tag */}
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '9.5px',
                            fontWeight: '700',
                            color: '#CBD5E1',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '1px 5px',
                            borderRadius: '3px'
                          }}>
                            B#{ev.board_number}
                          </span>
                          <span style={{ display: 'block', fontSize: '9.5px', color: '#64748B', marginTop: '1px' }}>
                            {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Full Balanced Scoreboard & Filterable Fixtures */}
          {currentMatch ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Compact Active Scoreboard Card */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--card-shadow)',
                flexShrink: 0
              }}>
                {/* Winner Celebration Banner */}
                {currentMatch.winner_id && (
                  <div style={{
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0.5) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    color: '#34D399',
                    fontWeight: '800',
                    fontSize: '12.5px'
                  }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Winner: {Number(currentMatch.winner_id) === Number(currentMatch.player1_id) ? currentMatch.player1_name : currentMatch.player2_name}</span>
                    </div>
                  </div>
                )}

                {/* Tournament & Board header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {currentMatch.tournament_title || 'Bangabandhu Premier Carrom League'}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {currentMatch.round_name || 'Match'} • Board #{activeBoard}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: currentMatch.status === 'Live' ? '#EF4444' : currentMatch.status === 'Completed' ? '#10B981' : 'var(--text-secondary)',
                    background: currentMatch.status === 'Live' ? 'rgba(239, 68, 68, 0.12)' : currentMatch.status === 'Completed' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-elevated)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    {currentMatch.status === 'Live' && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                    )}
                    {currentMatch.status === 'Live' ? 'Live Court' : (currentMatch.status || 'Scheduled')}
                  </span>
                </div>

                {/* Toss Information Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  marginBottom: '10px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {currentMatch.toss_winner_id ? (
                      <span>
                        Toss: <strong style={{ color: 'var(--accent-green)' }}>
                          {Number(currentMatch.toss_winner_id) === Number(currentMatch.player1_id) ? currentMatch.player1_name : currentMatch.player2_name}
                        </strong> chose <strong>{currentMatch.toss_choice || 'White'}</strong>
                      </span>
                    ) : (
                      <span>Toss: Standard Opening (White breaks first)</span>
                    )}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '10.5px' }}>
                    {activeBoard % 2 !== 0 ? 'Board 1 Rotation' : 'Rotated Break (ICF)'}
                  </span>
                </div>

                {/* Head-to-Head Scoring Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                  padding: '12px 10px',
                  border: '1px solid var(--border-subtle)',
                  gap: '8px',
                  textAlign: 'center'
                }}>
                  {/* Player 1 */}
                  {(() => {
                    const p1Role = getCarromRoleAndColor(currentMatch, 1, activeBoard);
                    return (
                      <div>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          color: p1Role.isWhite ? '#10B981' : '#94A3B8',
                          background: p1Role.isWhite ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p1Role.isWhite ? '#10B981' : '#94A3B8', display: 'inline-block' }} /> {p1Role.shortRole}
                        </span>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '800',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {currentMatch.player1_name}
                        </div>
                        <div style={{
                          fontSize: '32px',
                          fontWeight: '900',
                          color: 'var(--accent-green)',
                          lineHeight: '1',
                          margin: '6px 0'
                        }}>
                          {currentMatch.player1_score}
                        </div>
                        <div style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          color: 'var(--text-tertiary)',
                          marginTop: '2px'
                        }}>
                          Board #{activeBoard}: <strong style={{ color: 'var(--text-secondary)' }}>+{activeBoardScore.player1} pts</strong>
                        </div>
                      </div>
                    );
                  })()}

                  {/* VS Divider */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-tertiary)' }}>VS</div>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: '700',
                      color: '#EF4444',
                      background: 'rgba(239, 68, 68, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginTop: '4px'
                    }}>
                      TO 25
                    </span>
                  </div>

                  {/* Player 2 */}
                  {(() => {
                    const p2Role = getCarromRoleAndColor(currentMatch, 2, activeBoard);
                    return (
                      <div>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          color: p2Role.isWhite ? '#10B981' : '#94A3B8',
                          background: p2Role.isWhite ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p2Role.isWhite ? '#10B981' : '#94A3B8', display: 'inline-block' }} /> {p2Role.shortRole}
                        </span>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '800',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {currentMatch.player2_name}
                        </div>
                        <div style={{
                          fontSize: '32px',
                          fontWeight: '900',
                          color: '#3B82F6',
                          lineHeight: '1',
                          margin: '6px 0'
                        }}>
                          {currentMatch.player2_score}
                        </div>
                        <div style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          color: 'var(--text-tertiary)',
                          marginTop: '2px'
                        }}>
                          Board #{activeBoard}: <strong style={{ color: 'var(--text-secondary)' }}>+{activeBoardScore.player2} pts</strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Tournament Fixtures & Filter Card */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--card-shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {/* Header row with Title and Count */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      Tournament Courts & Matches
                    </span>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '1px 7px',
                      borderRadius: '6px',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)'
                    }}>
                      {matches.length}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>
                    Click match to stream
                  </span>
                </div>

                {/* Filter Tabs & Search */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Status Tabs */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--bg-elevated)',
                    padding: '3px',
                    borderRadius: '8px'
                  }}>
                    {[
                      { id: 'all', label: 'All', count: matches.length },
                      { id: 'live', label: 'Live', count: liveCount },
                      { id: 'scheduled', label: 'Scheduled', count: scheduledCount },
                      { id: 'completed', label: 'Done', count: completedCount }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        style={{
                          flex: 1,
                          padding: '4px 6px',
                          fontSize: '11px',
                          fontWeight: statusFilter === tab.id ? '700' : '600',
                          borderRadius: '6px',
                          border: 'none',
                          background: statusFilter === tab.id ? 'var(--bg-surface)' : 'transparent',
                          color: statusFilter === tab.id ? 'var(--accent-green)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          boxShadow: statusFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {tab.id === 'live' && liveCount > 0 && (
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#EF4444' }} />
                        )}
                        <span>{tab.label}</span>
                        <span style={{
                          fontSize: '9.5px',
                          opacity: 0.8
                        }}>
                          ({tab.count})
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search player, board #, or round..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-tertiary)',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Fixture cards with scroll container (fixed max height so it never stretches the page) */}
                <div className="live-fixtures-scroll" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((m) => {
                      const isSelected = (currentMatch?.id === m.id);
                      const isLive = (m.status === 'Live');
                      const isCompleted = (m.status === 'Completed' || m.status === 'Finished');

                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMatchId(m.id)}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-elevated)',
                            border: isSelected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 2px 6px rgba(16, 185, 129, 0.15)' : 'none'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: isSelected ? 'var(--accent-green)' : 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.player1_name}</span>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', fontWeight: '600' }}>vs</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.player2_name}</span>
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: 'var(--text-tertiary)',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {m.round_name || 'Match'} • Board #{m.current_board || 1}
                              {m.tournament_title ? ` • ${m.tournament_title}` : ''}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '800',
                              fontFamily: 'monospace',
                              color: isLive ? '#EF4444' : (isCompleted ? 'var(--accent-green)' : 'var(--text-secondary)')
                            }}>
                              {m.player1_score ?? 0} - {m.player2_score ?? 0}
                            </div>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '800',
                              letterSpacing: '0.02em',
                              color: isLive ? '#EF4444' : (isCompleted ? 'var(--accent-green)' : 'var(--text-tertiary)'),
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              {isLive && (
                                <span style={{
                                  width: '4px',
                                  height: '4px',
                                  borderRadius: '50%',
                                  background: '#EF4444',
                                  boxShadow: '0 0 4px rgba(239, 68, 68, 0.8)'
                                }} />
                              )}
                              {isLive ? 'LIVE' : (m.status || 'SCHEDULED').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      fontSize: '12px'
                    }}>
                      No matches found matching filter.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              padding: '40px',
              textAlign: 'center',
              border: '1px solid var(--border-subtle)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>No match selected.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
