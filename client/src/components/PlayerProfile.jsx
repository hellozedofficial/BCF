import React, { useState, useEffect } from 'react';
import { API_BASE, getMediaUrl } from '../config/api';
import { PlayerProfileSkeleton } from './Skeletons';
import {
  TrophyIcon,
  ShieldIcon,
  FlameIcon,
  CheckIcon,
  SearchIcon,
  ChevronRightIcon
} from './Icons';

export default function PlayerProfile({ playerId, onNavigate, theme }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs', 'matches', 'license'
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchPlayer = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/players/${encodeURIComponent(playerId)}?public=true`);
        if (res.status === 404) {
          if (isMounted) setError('Athlete profile not found or currently inactive in the public registry.');
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.status !== 'Active') {
            if (isMounted) setError('Athlete profile is inactive or pending federation review.');
            return;
          }
          if (isMounted) {
            setPlayer(json.data);
            // Canonical URL clean-up: if user visited /player/21, auto-replace URL with /player/BCF-000021
            const canonicalId = json.data.player_id || `BCF-${String(json.data.id).padStart(6, '0')}`;
            if (typeof window !== 'undefined' && String(playerId).toLowerCase() !== canonicalId.toLowerCase()) {
              window.history.replaceState(null, '', `/player/${canonicalId}`);
            }
          }
        } else {
          if (isMounted) setError(json.message || 'Player profile not found.');
        }
      } catch (err) {
        if (isMounted) setError('Unable to connect to Bangladesh Carrom Federation registry.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (playerId) {
      fetchPlayer();
    }
    return () => {
      isMounted = false;
    };
  }, [playerId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setToastMessage('');
    }, 2400);
  };

  const handleCopyId = (id) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        showToast(`Federation ID ${id} copied!`);
      });
    } else {
      showToast(`Federation ID: ${id}`);
    }
  };

  const handleShare = async () => {
    const canonicalId = player?.player_id || `BCF-${String(player?.id || '').padStart(6, '0')}`;
    const url = `${window.location.origin}/player/${canonicalId}`;
    if (navigator.share && player) {
      try {
        await navigator.share({
          title: `${player.full_name} | BCF National Player`,
          text: `Official Carrom Federation athlete profile: ${player.full_name} (${canonicalId})`,
          url
        });
        return;
      } catch (e) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Profile link copied to clipboard!');
      });
    } else {
      showToast('Profile URL ready to share');
    }
  };

  if (loading) {
    return <PlayerProfileSkeleton />;
  }

  if (error || !player) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--accent-red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          fontSize: '28px',
          fontWeight: 800
        }}>
          !
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Athlete Profile Not Found
        </h2>
        <p style={{ maxWidth: '440px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
          {error || `The athlete profile for "${playerId}" does not exist in the active national directory.`}
        </p>
        <button
          onClick={() => onNavigate('/players')}
          style={{
            padding: '10px 22px',
            fontSize: '13.5px',
            borderRadius: '10px',
            fontWeight: 700,
            background: 'var(--accent-green)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Return to Player Directory
        </button>
      </div>
    );
  }

  // Derived Statistics
  const matchesPlayed = player.matches_played || 0;
  const matchesWon = player.matches_won || 0;
  const matchesLost = Math.max(0, matchesPlayed - matchesWon);
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
  const whiteSlams = player.white_slams || 0;
  const blackSlams = player.black_slams || 0;
  const totalSlams = whiteSlams + blackSlams;
  const rating = player.rating_points || 1200;

  const getRatingTier = (pts) => {
    if (pts >= 1800) return { label: 'Grandmaster', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' };
    if (pts >= 1650) return { label: 'Master Striker', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.14)' };
    if (pts >= 1450) return { label: 'Elite Pro', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)' };
    if (pts >= 1250) return { label: 'National Contender', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.14)' };
    return { label: 'Circuit Challenger', color: '#64748B', bg: 'rgba(100, 116, 139, 0.14)' };
  };
  const tier = getRatingTier(rating);

  const displayId = player.player_id || `BCF-${String(player.id).padStart(6, '0')}`;
  const avatarUrl = player.photo_url ? getMediaUrl(player.photo_url) : null;
  const initials = player.full_name ? player.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'P';

  return (
    <div style={{ paddingBottom: '70px', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Toast Notification */}
      {copied && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#047857',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(4, 120, 87, 0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '13.5px'
        }}>
          <CheckIcon className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 0'
      }}>
        <div className="container" style={{ maxWidth: '1120px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => onNavigate('/players')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ← Back to Players
            </button>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span onClick={() => onNavigate('/')} style={{ cursor: 'pointer' }}>Home</span>
              <span>/</span>
              <span onClick={() => onNavigate('/players')} style={{ cursor: 'pointer' }}>Players</span>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'monospace' }}>{displayId}</span>
            </div>
          </div>

          <button
            onClick={handleShare}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Share Profile
          </button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1120px', marginTop: '24px' }}>
        {/* ===================== ATHLETE HERO CARD ===================== */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '22px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
        }}>
          {/* Top Canopy Banner: Sleek, dark sports canopy with subtle radial lighting */}
          <div style={{
            height: '170px',
            background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: "'Tactic Sans', 'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 800,
                color: '#34D399',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                BANGLADESH CARROM FEDERATION
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                Official Athlete Registry
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleCopyId(displayId)}
                title="Click to copy official Federation ID"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#FFFFFF',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>ID: {displayId}</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>📋</span>
              </button>
            </div>
          </div>

          {/* Profile Content Body */}
          <div style={{ padding: '0 28px 28px', marginTop: '-52px', position: 'relative' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {/* Avatar Squircle */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '124px',
                  height: '124px',
                  borderRadius: '20px',
                  background: 'var(--bg-surface)',
                  padding: '4px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={player.full_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '16px',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                    color: '#FFFFFF',
                    display: avatarUrl ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '38px',
                    fontWeight: 800
                  }}>
                    {initials}
                  </div>
                </div>

                {/* Verified badge */}
                <div
                  title="Verified National Competitor"
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    background: '#10B981',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                    border: '2px solid var(--bg-surface)',
                    fontSize: '12px'
                  }}
                >
                  ✓
                </div>
              </div>

              {/* Status & Tier Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  background: tier.bg,
                  color: tier.color,
                  border: `1px solid ${tier.color}33`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <FlameIcon className="w-3.5 h-3.5" />
                  {tier.label}
                </span>

                <span style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {player.category || 'Senior'} • {player.gender || 'Men'}
                </span>
              </div>
            </div>

            {/* Names & Core Bio */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  {player.full_name}
                </h1>
                {player.name_bn && (
                  <span style={{ fontSize: '18px', color: 'var(--accent-green)', fontWeight: 600 }}>
                    ({player.name_bn})
                  </span>
                )}
              </div>

              {/* Club & Circuit Tag */}
              <p style={{
                marginTop: '8px',
                fontSize: '13.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                maxWidth: '780px'
              }}>
                {player.club_name && player.club_name !== 'Independent' ? (
                  <>Official carrom athlete competing for <strong>{player.club_name}</strong> in the {player.district || 'National'} District circuit.</>
                ) : (
                  <>Official accredited carrom athlete registered under the Bangladesh Carrom Federation (BCF) national circuit.</>
                )}
              </p>

              {/* Meta Chips */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '14px',
                flexWrap: 'wrap',
                fontSize: '12.5px',
                color: 'var(--text-tertiary)'
              }}>
                <span>District: <strong style={{ color: 'var(--text-primary)' }}>{player.district || 'Dhaka'}</strong></span>
                <span>•</span>
                <span>Division: <strong style={{ color: 'var(--text-primary)' }}>{player.division || 'Dhaka'}</strong></span>
                <span>•</span>
                <span>Registered: <strong style={{ color: 'var(--text-primary)' }}>{player.player_since || '2026'}</strong></span>
                {player.playing_style && (
                  <>
                    <span>•</span>
                    <span>Style: <strong style={{ color: 'var(--text-primary)' }}>{player.playing_style}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* ===================== 4 KEY METRIC CARDS ===================== */}
            <div style={{
              marginTop: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '14px'
            }}>
              {/* ELO Rating */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  ELO RATING
                </div>
                <div className="font-mono" style={{ fontSize: '26px', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
                  {rating}
                </div>
                <div style={{ fontSize: '11.5px', color: tier.color, fontWeight: 700, marginTop: '2px' }}>
                  {tier.label}
                </div>
              </div>

              {/* National Rank */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  NATIONAL RANK
                </div>
                <div className="font-mono" style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {player.national_rank ? `#${player.national_rank}` : 'Unranked'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {player.gender || 'Men'} Circuit
                </div>
              </div>

              {/* Win Rate */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  WIN RATE
                </div>
                <div className="font-mono" style={{ fontSize: '26px', fontWeight: 900, color: 'var(--accent-green)', marginTop: '4px' }}>
                  {winRate}%
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {matchesWon}W - {matchesLost}L ({matchesPlayed} MP)
                </div>
              </div>

              {/* Slams */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  CARROM SLAMS
                </div>
                <div className="font-mono" style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {totalSlams}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {whiteSlams} White • {blackSlams} Black
                </div>
              </div>
            </div>

            {/* ===================== TABS NAVIGATION ===================== */}
            <div style={{
              display: 'flex',
              gap: '6px',
              borderBottom: '1px solid var(--border-subtle)',
              marginTop: '32px',
              paddingBottom: '2px'
            }}>
              {[
                { id: 'specs', label: 'Technical Specs & Bio' },
                { id: 'matches', label: `Matches (${(player.matches || []).length})` },
                { id: 'license', label: 'Official License Card' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    color: activeTab === tab.id ? 'var(--accent-green)' : 'var(--text-secondary)',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid var(--accent-green)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===================== TAB CONTENT ===================== */}
            <div style={{ marginTop: '20px' }}>
              {/* TAB 1: TECHNICAL SPECS */}
              {activeTab === 'specs' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    padding: '18px',
                    borderRadius: '14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      DOMINANT STRIKE HAND
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {player.dominant_hand || 'Right-Handed'}
                    </div>
                  </div>

                  <div style={{
                    padding: '18px',
                    borderRadius: '14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      PLAYING STYLE & TECHNIQUE
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {player.playing_style || 'Attacking Pocket Master'}
                    </div>
                  </div>

                  <div style={{
                    padding: '18px',
                    borderRadius: '14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      CARROM BOARD SPECIFICATION
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {player.carrom_board_preference || 'Synco Championship Standard'}
                    </div>
                  </div>

                  <div style={{
                    padding: '18px',
                    borderRadius: '14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      AFFILIATED CLUB / ACADEMY
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {player.club_name || 'Independent Athlete'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MATCHES HISTORY */}
              {activeTab === 'matches' && (
                <div>
                  {player.matches && player.matches.length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {player.matches.map(m => {
                        const isPlayer1 = m.player1_name && m.player1_name.toLowerCase().includes(player.full_name.toLowerCase());
                        const playerScore = isPlayer1 ? m.player1_score : m.player2_score;
                        const oppScore = isPlayer1 ? m.player2_score : m.player1_score;
                        const opponentName = isPlayer1 ? m.player2_name : m.player1_name;
                        const isWinner = playerScore > oppScore;

                        return (
                          <div
                            key={m.id}
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '14px',
                              padding: '16px 20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase' }}>
                                {m.tournament_title || 'BCF Sanctioned Tournament'}
                              </div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                                {m.round_name || 'Match'} • vs. {opponentName || 'Competitor'}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                Board #{m.board_number || 1} • {m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString() : 'Scheduled'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div className="font-mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                                {playerScore} - {oppScore}
                              </div>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: isWinner ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                                color: isWinner ? 'var(--accent-green)' : 'var(--accent-red)'
                              }}>
                                {isWinner ? 'WIN' : 'LOSS'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      background: 'var(--bg-elevated)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        No Official Match Records Yet
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '6px auto 0' }}>
                        Match statistics and fixture scores will automatically appear here as {player.full_name} competes in federation championships.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DIGITAL LICENSE CARD */}
              {activeTab === 'license' && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '440px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    background: '#111317',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
                    color: '#FFFFFF',
                    padding: '24px'
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', marginBottom: '18px' }}>
                      <div>
                        <div style={{ fontFamily: "'Tactic Sans', 'Inter', sans-serif", fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em', color: '#34D399' }}>
                          BANGLADESH CARROM FEDERATION
                        </div>
                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                          NATIONAL ATHLETE IDENTITY LICENSE
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }}>
                        ACTIVE
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        width: '84px',
                        height: '104px',
                        borderRadius: '10px',
                        background: '#1F242D',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={player.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: '#34D399' }}>
                            {initials}
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {player.full_name}
                        </div>
                        {player.name_bn && (
                          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '1px' }}>
                            {player.name_bn}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', marginTop: '6px', color: '#E2E8F0' }}>
                          Federation ID: <strong style={{ color: '#34D399', fontFamily: 'monospace' }}>{displayId}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          Club: {player.club_name || 'Independent'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          District: {player.district || 'Dhaka'}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748B' }}>
                      <span>AUTHENTICATED BY BCF SECRETARIAT</span>
                      <span style={{ color: '#34D399', fontWeight: 700 }}>NATIONAL REGISTRY</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
