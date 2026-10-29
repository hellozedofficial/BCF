import React, { useState, useEffect } from 'react';
import { API_BASE, getMediaUrl } from '../config/api';
import {
  TrophyIcon,
  ShieldIcon,
  FlameIcon,
  CheckIcon,
  SearchIcon
} from './Icons';

export default function PlayerProfile({ playerId, onNavigate, theme }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('persona');
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
          if (isMounted) setError('404: Athlete profile not found or currently inactive');
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.status !== 'Active') {
            if (isMounted) setError('404: Athlete profile is inactive or not found');
            return;
          }
          if (isMounted) setPlayer(json.data);
        } else {
          if (isMounted) setError(json.message || '404: Player profile not found');
        }
      } catch (err) {
        if (isMounted) setError('Network error while connecting to Federation servers');
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
    }, 2800);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Profile link copied to clipboard');
      });
    } else {
      showToast('Profile URL ready to share');
    }
  };

  const handleCopyId = (id) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        showToast(`Player ID ${id} copied`);
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && player) {
      try {
        await navigator.share({
          title: `${player.full_name} | Bangladesh Carrom Federation Athlete Profile`,
          text: `Official Carrom Federation player profile for ${player.full_name} (ID: ${player.player_id || player.id})`,
          url: window.location.href
        });
      } catch (e) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-green)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px' }}>
          Loading official player profile...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{
          fontSize: '76px',
          fontWeight: 900,
          color: 'var(--accent-red)',
          lineHeight: 1,
          marginBottom: '8px',
          letterSpacing: '-0.04em'
        }}>
          404
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Athlete Profile Not Found
        </h2>
        <p style={{ maxWidth: '460px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
          {error || `The athlete profile for "${playerId}" is either inactive or does not exist in the public directory.`}
        </p>
        <button
          onClick={() => onNavigate('/players')}
          className="btn btn-primary"
          style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '10px' }}
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

  // Rating Tier badge
  const getRatingTier = (pts) => {
    if (pts >= 1800) return { label: 'Grandmaster', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    if (pts >= 1700) return { label: 'Master Striker', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
    if (pts >= 1500) return { label: 'Elite Pro', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (pts >= 1300) return { label: 'Contender', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
    return { label: 'Challenger', color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' };
  };
  const tier = getRatingTier(rating);

  const displayId = player.player_id || `BCF-${String(player.id).padStart(6, '0')}`;
  const avatarUrl = player.photo_url ? getMediaUrl(player.photo_url) : null;
  const initials = player.full_name ? player.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'P';
  const isActive = (player.status || 'Active') === 'Active';

  return (
    <div style={{ paddingBottom: '70px', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {copied && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#047857',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(4, 120, 87, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <CheckIcon className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Breadcrumbs Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 0'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Back to Players
            </button>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span onClick={() => onNavigate('/')} style={{ cursor: 'pointer' }}>Home</span>
              <span>/</span>
              <span onClick={() => onNavigate('/players')} style={{ cursor: 'pointer' }}>Players</span>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{displayId}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              title="Copy Profile URL"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Share Profile
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1060px', marginTop: '20px' }}>
        {/* ===================== SOCIAL PROFILE HERO CONTAINER ===================== */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Cover Banner (Graphic with Carrom geometry & sports pattern) */}
          <div style={{
            height: '210px',
            background: 'linear-gradient(135deg, #064E3B 0%, #047857 38%, #0F172A 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Visual Carrom Board concentric circles overlay */}
            <div style={{
              position: 'absolute',
              right: '-40px',
              top: '-40px',
              width: '280px',
              height: '280px',
              border: '2px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              right: '20px',
              top: '20px',
              width: '160px',
              height: '160px',
              border: '2px dashed rgba(255,255,255,0.12)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Federation Badging on Banner */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: '30px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              <ShieldIcon className="w-4 h-4" style={{ color: '#34D399' }} />
              BANGLADESH CARROM FEDERATION • ATHLETE ROSTER
            </div>

            {/* Quick Actions on top right of cover */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '20px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => handleCopyId(displayId)}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Copy ID: {displayId}
              </button>
            </div>
          </div>

          {/* Social Profile Header Info Section (Overlapping Avatar) */}
          <div style={{ padding: '0 28px 24px 28px', position: 'relative' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              marginTop: '-64px',
              marginBottom: '16px',
              gap: '16px'
            }}>
              {/* Overlapping Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '128px',
                  height: '128px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface)',
                  padding: '4px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
                }}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={player.full_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: `3px solid ${isActive ? '#10B981' : '#94A3B8'}`
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)',
                    color: '#FFFFFF',
                    display: avatarUrl ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    fontWeight: 800,
                    border: `3px solid ${isActive ? '#10B981' : '#94A3B8'}`
                  }}>
                    {initials}
                  </div>
                </div>

                {/* Status Indicator Dot on Avatar */}
                <div
                  title={`Status: ${player.status || 'Active'}`}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isActive ? '#10B981' : '#EF4444',
                    border: '3px solid var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF' }} />
                </div>
              </div>

              {/* Action Buttons Right */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleShare}
                  className="btn btn-outline"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '24px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderColor: 'var(--border-strong)'
                  }}
                >
                  Share Profile
                </button>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '24px',
                  fontSize: '12px',
                  fontWeight: 800,
                  background: tier.bg,
                  color: tier.color,
                  border: `1px solid ${tier.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FlameIcon className="w-3.5 h-3.5" />
                  {tier.label}
                </div>
              </div>
            </div>

            {/* Profile Names and Identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  {player.full_name}
                </h1>

                {/* Bengali Name Tag */}
                {player.name_bn && (
                  <span style={{ fontSize: '17px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    ({player.name_bn})
                  </span>
                )}
              </div>

              {/* Handle & ID Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
                  @{player.nickname || (player.full_name ? player.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'athlete')}
                </span>
                <span className="badge badge-blue" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {player.gender || 'Men'} | {player.category || 'Senior'}
                </span>
              </div>

              {/* Player Bio / Tagline */}
              <p style={{
                marginTop: '12px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '740px'
              }}>
                {player.playing_style ? (
                  <>Official carrom competitor specializing as an <strong>{player.playing_style}</strong>.</>
                ) : (
                  <>Official federated carrom athlete accredited by the Bangladesh Carrom Federation.</>
                )}
                {player.club_name && player.club_name !== 'Independent' ? (
                  <> Affiliated with <strong>{player.club_name}</strong>.</>
                ) : (
                  <> Participating on the national circuit as an independent competitor.</>
                )}
              </p>

              {/* Quick Meta Chips Row (Location, Club, Division) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                marginTop: '16px',
                flexWrap: 'wrap',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Location: </strong>
                  <span>
                    {player.district ? `${player.district}, ` : ''}
                    {player.division ? `${player.division} Division, ` : ''}
                    Bangladesh
                  </span>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Club: </strong>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {player.club_name || 'Independent / Unattached'}
                  </span>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Affiliated Since: </strong>
                  <span>{player.player_since || (player.created_at ? new Date(player.created_at).getFullYear() : '2026')}</span>
                </div>

                {player.dominant_hand && (
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Hand: </strong>
                    <span>{player.dominant_hand}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ===================== SOCIAL STATS COUNTER STRIP ===================== */}
            <div style={{
              marginTop: '24px',
              padding: '16px 20px',
              background: 'var(--bg-elevated)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '16px',
              textAlign: 'center'
            }}>
              {/* Elo Rating */}
              <div style={{ borderRight: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  ELO RATING
                </div>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: 900, color: '#B45309', marginTop: '2px' }}>
                  {rating}
                </div>
                <div style={{ fontSize: '11px', color: tier.color, fontWeight: 700 }}>
                  {tier.label}
                </div>
              </div>

              {/* National Rank */}
              <div style={{ borderRight: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  NATIONAL RANK
                </div>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {player.national_rank ? `#${player.national_rank}` : 'Unranked'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {player.gender || 'National'} Circuit
                </div>
              </div>

              {/* Win Rate */}
              <div style={{ borderRight: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  WIN RATE
                </div>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-green)', marginTop: '2px' }}>
                  {winRate}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {matchesWon}W - {matchesLost}L ({matchesPlayed} MP)
                </div>
              </div>

              {/* White Slams */}
              <div style={{ borderRight: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  WHITE SLAMS
                </div>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {whiteSlams}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Opening Board Clear
                </div>
              </div>

              {/* Black Slams */}
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  BLACK SLAMS
                </div>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {blackSlams}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Turn-2 Counter Clear
                </div>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '4px',
              borderBottom: '1px solid var(--border-subtle)',
              marginTop: '28px',
              paddingBottom: '0px'
            }}>
              {[
                { id: 'persona', label: 'Carrom Persona & Stance' },
                { id: 'matches', label: `Match History (${(player.matches || []).length})` },
                { id: 'card', label: 'Digital Athlete License' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 18px',
                    fontSize: '14px',
                    fontWeight: activeTab === tab.id ? 800 : 600,
                    color: activeTab === tab.id ? 'var(--accent-green)' : 'var(--text-secondary)',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '3px solid var(--accent-green)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===================== TAB CONTENT SECTIONS ===================== */}
            <div style={{ marginTop: '24px' }}>
              {/* TAB 1: CARROM PERSONA & TECHNICAL STANCE */}
              {activeTab === 'persona' && (
                <div style={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: '24px' }}>
                  {/* Left Column: Technical Specifications */}
                  <div style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: '16px',
                    padding: '22px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      Technical Stance & Equipment
                    </h3>

                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Dominant Striking Hand</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {player.dominant_hand || 'Right Hand'}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tactical Playing Style</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-green)' }}>
                          {player.playing_style || 'All-Rounder'}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Carrom Board Preference</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {player.carrom_board_preference || 'Championship 29x29 Standard'}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Category & Tier</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {player.category || 'Senior'} Athlete
                        </span>
                      </div>
                    </div>

                    {/* Slam Breakdown Bar */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Career Grand Slams ({totalSlams})</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{whiteSlams} White • {blackSlams} Black</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '10px',
                        background: 'var(--bg-surface)',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        display: 'flex'
                      }}>
                        <div style={{
                          width: `${totalSlams > 0 ? (whiteSlams / totalSlams) * 100 : 50}%`,
                          background: '#CBD5E1',
                          borderRight: '1px solid #94A3B8'
                        }} title={`White Slams: ${whiteSlams}`} />
                        <div style={{
                          width: `${totalSlams > 0 ? (blackSlams / totalSlams) * 100 : 50}%`,
                          background: '#0F172A'
                        }} title={`Black Slams: ${blackSlams}`} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Federation Credentials & Verification */}
                  <div style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: '16px',
                    padding: '22px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      Federation Accreditation
                    </h3>

                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{
                        padding: '12px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                          BCF REGISTRATION ID
                        </div>
                        <div className="font-mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px' }}>
                          {displayId}
                        </div>
                      </div>

                      <div style={{
                        padding: '12px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                          AFFILIATED CLUB / ACADEMY
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {player.club_name || 'Independent Athlete'}
                        </div>
                        {player.club && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {player.club.division ? `${player.club.division} • ` : ''}Status: {player.club.status || 'Active'}
                          </div>
                        )}
                      </div>

                      <div style={{
                        padding: '12px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                          DISTRICT REPRESENTATION
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {player.district || 'Unassigned'} District
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Division: {player.division || 'Dhaka'}
                        </div>
                      </div>

                      <div style={{
                        padding: '12px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                            ATHLETE VERIFICATION
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)', marginTop: '2px' }}>
                            Certified National Competitor
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-tertiary)' }}>BANGLADESH</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SANCTIONED MATCH HISTORY */}
              {activeTab === 'matches' && (
                <div>
                  {player.matches && player.matches.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
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
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase' }}>
                                {m.tournament_title || 'BCF National Championship'} • {m.tournament_edition || '2026'}
                              </div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>
                                {m.round_name || 'Sanctioned Match'}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                vs. <strong>{opponentName || 'Competitor'}</strong>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div className="font-mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                                  {playerScore} - {oppScore}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                  Boards: {m.boards_played || 0}
                                </div>
                              </div>

                              <span
                                className={`badge ${isWinner ? 'badge-green' : 'badge-red'}`}
                                style={{ fontSize: '12px', padding: '4px 10px', fontWeight: 800 }}
                              >
                                {isWinner ? 'VICTORY' : 'DEFEAT'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: '48px 20px',
                      textAlign: 'center',
                      background: 'var(--bg-elevated)',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        No Official Tournament Matches Yet
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '6px auto 0 auto' }}>
                        Match scoring records and round statistics will be updated automatically as {player.full_name} participates in future BCF sanctioned tournaments and league fixtures.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: OFFICIAL DIGITAL ATHLETE LICENSE CARD */}
              {activeTab === 'card' && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                  <div
                    id="bcf-athlete-card"
                    style={{
                      width: '100%',
                      maxWidth: '480px',
                      background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #0F172A 100%)',
                      color: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '24px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Federation Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '14px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#047857', fontSize: '14px' }}>
                          BCF
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>BANGLADESH CARROM FEDERATION</div>
                          <div style={{ fontSize: '10px', opacity: 0.8 }}>OFFICIAL ATHLETE IDENTITY CARD</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>BANGLADESH</span>
                    </div>

                    {/* Card Body */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        width: '90px',
                        height: '110px',
                        borderRadius: '10px',
                        background: '#090D14',
                        border: '2px solid rgba(255,255,255,0.3)',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={player.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800 }}>
                            {initials}
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '17px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {player.full_name}
                        </div>
                        {player.name_bn && (
                          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '1px' }}>
                            {player.name_bn}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.75 }}>
                          ID: <strong style={{ color: '#FDE047', fontFamily: 'monospace' }}>{displayId}</strong>
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.75 }}>
                          Club: <strong>{player.club_name || 'Independent'}</strong>
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.75 }}>
                          District: <strong>{player.district || 'Dhaka'}</strong>
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.75 }}>
                          Category: <strong>{player.category || 'Senior'} ({player.gender || 'Men'})</strong>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '10px' }}>
                      <div>
                        <div style={{ opacity: 0.65 }}>AUTHENTICATED BY</div>
                        <div style={{ fontWeight: 800 }}>BCF NATIONAL SECRETARIAT</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ opacity: 0.65 }}>STATUS</div>
                        <div style={{ color: '#34D399', fontWeight: 800 }}>VERIFIED ATHLETE</div>
                      </div>
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
