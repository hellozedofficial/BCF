'use client';

import React, { useState } from 'react';
import { RadioIcon } from './Icons';

export default function LiveMatches({ matches = [], onUpdateMatch }) {
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active / selected match computation
  const activeMatches = matches.filter(m => m.status === 'Live');
  const currentMatch = matches.find(m => m.id === selectedMatchId) || activeMatches[0] || matches[0] || null;

  // Real, tested, verified working Carrom Championship video IDs
  const matchVideoMap = {
    1: 'https://www.youtube.com/embed/3yGUB4LEnWI?autoplay=0&rel=0', // National Player Hemayet Uddin / Molla Carrom Tournament
    2: 'https://www.youtube.com/embed/jQHclik08SU?autoplay=0&rel=0', // Carrom World Cup Final
    3: 'https://www.youtube.com/embed/-ECRzKb8i4o?autoplay=0&rel=0', // Senior National Carrom Championship
    4: 'https://www.youtube.com/embed/ci3cfJt4zAo?autoplay=0&rel=0'  // Carrom Live MS Final Match
  };

  const currentVideoUrl = (currentMatch && matchVideoMap[currentMatch.id])
    ? matchVideoMap[currentMatch.id]
    : 'https://www.youtube.com/embed/3yGUB4LEnWI?autoplay=0&rel=0';

  // Counts for filters
  const liveCount = matches.filter(m => (m.status || '').toLowerCase() === 'live').length;
  const scheduledCount = matches.filter(m => {
    const s = (m.status || 'scheduled').toLowerCase();
    return s === 'scheduled' || s === 'upcoming';
  }).length;
  const completedCount = matches.filter(m => {
    const s = (m.status || '').toLowerCase();
    return s === 'completed' || s === 'finished';
  }).length;

  // Filtered fixtures for the list
  const filteredMatches = matches.filter(m => {
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
  const liveMatches = matches.filter(m => (m.status || '').toLowerCase() === 'live');
  const nonLiveMatches = matches.filter(m => (m.status || '').toLowerCase() !== 'live');
  const priorityMatches = [...liveMatches, ...nonLiveMatches.slice(0, Math.max(2, 6 - liveMatches.length))];
  if (currentMatch && !priorityMatches.some(m => m.id === currentMatch.id)) {
    priorityMatches.push(currentMatch);
  }

  const handleScoreBump = async (matchId, player, delta) => {
    if (!currentMatch) return;
    const newP1Score = player === 1 ? Math.max(0, currentMatch.player1_score + delta) : currentMatch.player1_score;
    const newP2Score = player === 2 ? Math.max(0, currentMatch.player2_score + delta) : currentMatch.player2_score;

    if (onUpdateMatch) {
      await onUpdateMatch(matchId, {
        player1_score: newP1Score,
        player2_score: newP2Score,
        current_board: currentMatch.current_board,
        boards_played: currentMatch.boards_played,
        status: currentMatch.status
      });
    }
  };

  const handleNextBoard = async (matchId) => {
    if (!currentMatch) return;
    if (onUpdateMatch) {
      await onUpdateMatch(matchId, {
        current_board: currentMatch.current_board + 1,
        boards_played: currentMatch.boards_played + 1,
        status: currentMatch.status
      });
    }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#EF4444',
              background: 'rgba(239, 68, 68, 0.12)',
              padding: '3px 10px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <RadioIcon className="w-3 h-3" />
              LIVE STREAM
            </span>
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
                    borderRadius: '9999px',
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
            borderRadius: '16px',
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
                key={currentVideoUrl}
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
                borderRadius: '16px',
                padding: '14px 16px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--card-shadow)',
                flexShrink: 0
              }}>
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
                      {currentMatch.round_name || 'Match'} • Board #{currentMatch.current_board || 1}
                    </div>
                  </div>

                  <button
                    onClick={() => handleNextBoard(currentMatch.id)}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  >
                    Finish Board
                  </button>
                </div>

                {/* Head-to-Head Scoring Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  background: 'var(--bg-elevated)',
                  borderRadius: '12px',
                  padding: '12px 10px',
                  border: '1px solid var(--border-subtle)',
                  gap: '8px',
                  textAlign: 'center'
                }}>
                  {/* Player 1 (White Striker) */}
                  <div>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      color: '#047857',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      display: 'inline-block',
                      marginBottom: '4px'
                    }}>
                      White Striker
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
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      <button
                        onClick={() => handleScoreBump(currentMatch.id, 1, 1)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleScoreBump(currentMatch.id, 1, 3)}
                        style={{
                          background: '#FEF3C7',
                          border: '1px solid #FCD34D',
                          borderRadius: '6px',
                          padding: '3px 6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#B45309',
                          cursor: 'pointer'
                        }}
                      >
                        +3 Q
                      </button>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-tertiary)' }}>VS</div>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: '700',
                      color: '#EF4444',
                      background: 'rgba(239, 68, 68, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      marginTop: '4px'
                    }}>
                      TO 25
                    </span>
                  </div>

                  {/* Player 2 (Black Striker) */}
                  <div>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      color: '#3B82F6',
                      background: 'rgba(59, 130, 246, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      display: 'inline-block',
                      marginBottom: '4px'
                    }}>
                      Black Striker
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
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      <button
                        onClick={() => handleScoreBump(currentMatch.id, 2, 1)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleScoreBump(currentMatch.id, 2, 3)}
                        style={{
                          background: '#FEF3C7',
                          border: '1px solid #FCD34D',
                          borderRadius: '6px',
                          padding: '3px 6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#B45309',
                          cursor: 'pointer'
                        }}
                      >
                        +3 Q
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Fixtures & Filter Card */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: '16px',
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
                      borderRadius: '9999px',
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
              borderRadius: '16px',
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
