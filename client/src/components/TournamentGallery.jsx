import React, { useState, useEffect, useRef } from 'react';
import DriftWall from './DriftWall';
import ImagePreviewModal from './ImagePreviewModal';
import { TrophyIcon, CalendarIcon, MapPinIcon } from './Icons';

export default function TournamentGallery({ onOpenRegister, setActiveTab }) {
  // Modal Preview State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePreviewItem, setActivePreviewItem] = useState(null);
  const [activePreviewList, setActivePreviewList] = useState([]);

  // Active Tournament State (defaults to 1st tournament)
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayedIdx, setDisplayedIdx] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [spinDirection, setSpinDirection] = useState('next');
  const flipTimerRef = useRef(null);

  // 3 Distinct Tournaments with their own Title, Subtitle, Details & authentic carrom photos
  const tournaments = [
    {
      id: 1,
      step: '01',
      badge: 'National Championship 2026',
      badgeColor: '#047857',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      title: '42nd Bangladesh National Carrom Championship',
      subtitle: 'The apex annual battleground for national master players, titleholders and white slam masters.',
      dates: 'Nov 10 – Nov 15, 2026',
      venue: 'National Sports Council (NSC) Gymnasium, Dhaka',
      prizepool: '৳ 3,50,000',
      galleryItems: [
        {
          id: 'nc-1',
          image: 'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-2',
          image: 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-3',
          image: 'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-4',
          image: 'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-5',
          image: 'https://images.unsplash.com/photo-1652558973203-da9443c900d1?q=80&w=1481&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-6',
          image: 'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-7',
          image: 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-8',
          image: 'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-9',
          image: 'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
          tournament: '42nd National Championship'
        },
        {
          id: 'nc-10',
          image: 'https://images.unsplash.com/photo-1652558973203-da9443c900d1?q=80&w=1481&auto=format&fit=crop',
          tournament: '42nd National Championship'
        }
      ]
    },
    {
      id: 2,
      step: '02',
      badge: 'Premier League 2026',
      badgeColor: '#2563EB',
      badgeBg: 'rgba(37, 99, 235, 0.15)',
      title: 'Bangabandhu BCF Premier Carrom League',
      subtitle: 'Top 16 district franchises competing across live televised arena boards with ICF rating points.',
      dates: 'Oct 15 – Oct 22, 2026',
      venue: 'Mirpur Indoor Stadium Complex, Dhaka',
      prizepool: '৳ 5,00,000',
      galleryItems: [
        {
          id: 'pl-1',
          image: 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-2',
          image: 'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-3',
          image: 'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-4',
          image: 'https://images.unsplash.com/photo-1652558973203-da9443c900d1?q=80&w=1481&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-5',
          image: 'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-6',
          image: 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-7',
          image: 'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-8',
          image: 'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-9',
          image: 'https://images.unsplash.com/photo-1652558973203-da9443c900d1?q=80&w=1481&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        },
        {
          id: 'pl-10',
          image: 'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
          tournament: 'BCF Premier League'
        }
      ]
    },
    {
      id: 3,
      step: '03',
      badge: 'Youth & Talent Cup',
      badgeColor: '#D97706',
      badgeBg: 'rgba(217, 119, 6, 0.15)',
      title: 'National Youth & All-District Talent Cup',
      subtitle: 'Grassroots discovery platform identifying rising cue-board stars and future national champions.',
      dates: 'Dec 01 – Dec 08, 2026',
      venue: 'Sylhet District Sports Complex',
      prizepool: '৳ 1,80,000',
      galleryItems: [
        {
          id: 'yc-1',
          image: 'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-2',
          image: 'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-3',
          image: 'https://images.unsplash.com/photo-1652558973203-da9443c900d1?q=80&w=1481&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-4',
          image: 'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-5',
          image: 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-6',
          image: 'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-7',
          image: 'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-8',
          image: 'https://images.unsplash.com/photo-1652558973203-da9443c900d1?q=80&w=1481&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-9',
          image: 'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        },
        {
          id: 'yc-10',
          image: 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
          tournament: 'Youth & Talent Cup'
        }
      ]
    }
  ];

  // Trigger smooth 360-degree 3D card rotation when user clicks a different tournament tab
  useEffect(() => {
    if (activeIdx === displayedIdx) return;

    const dir = activeIdx > displayedIdx ? 'next' : 'prev';
    setSpinDirection(dir);
    setIsFlipping(true);

    if (flipTimerRef.current) {
      clearTimeout(flipTimerRef.current.mid);
      clearTimeout(flipTimerRef.current.end);
    }

    // At 180° midpoint (360ms): swap card content while the back face is facing the camera
    const midTimer = setTimeout(() => {
      setDisplayedIdx(activeIdx);
    }, 360);

    // At 360° finish (720ms): settle rotation cleanly back at front
    const endTimer = setTimeout(() => {
      setIsFlipping(false);
    }, 720);

    flipTimerRef.current = { mid: midTimer, end: endTimer };

    return () => {
      clearTimeout(midTimer);
      clearTimeout(endTimer);
    };
  }, [activeIdx, displayedIdx]);

  // Click handler to switch tournament on demand
  const handleTabClick = (index) => {
    if (activeIdx === index) return;
    setActiveIdx(index);
  };

  // Open clean image preview modal
  const handleOpenPreview = (item, list) => {
    setActivePreviewItem(item);
    setActivePreviewList(list);
    setIsModalOpen(true);
  };

  const handlePrevPreview = () => {
    if (!activePreviewList.length || !activePreviewItem) return;
    const curIdx = activePreviewList.findIndex(
      it => (it.id && activePreviewItem?.id && it.id === activePreviewItem.id) || it.image === activePreviewItem?.image
    );
    const prevIdx = (curIdx - 1 + activePreviewList.length) % activePreviewList.length;
    setActivePreviewItem(activePreviewList[prevIdx]);
  };

  const handleNextPreview = () => {
    if (!activePreviewList.length || !activePreviewItem) return;
    const curIdx = activePreviewList.findIndex(
      it => (it.id && activePreviewItem?.id && it.id === activePreviewItem.id) || it.image === activePreviewItem?.image
    );
    const nextIdx = (curIdx + 1) % activePreviewList.length;
    setActivePreviewItem(activePreviewList[nextIdx]);
  };

  const currentTourney = tournaments[displayedIdx] || tournaments[0];

  return (
    <section
      className="tournaments-featured-section"
      style={{
        position: 'relative',
        width: '100vw',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        height: 'calc(100vh - 72px)',
        minHeight: '640px',
        maxHeight: '800px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-base)'
      }}
    >
      <style>{`
        @keyframes spin360Next {
          0% {
            transform: perspective(1400px) rotateY(0deg) scale(1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          }
          32% {
            transform: perspective(1400px) rotateY(115deg) scale(0.91) translateZ(-40px);
            box-shadow: 0 20px 50px rgba(16, 185, 129, 0.25);
          }
          50% {
            transform: perspective(1400px) rotateY(180deg) scale(0.87) translateZ(-65px);
            box-shadow: 0 25px 60px rgba(16, 185, 129, 0.35);
          }
          68% {
            transform: perspective(1400px) rotateY(245deg) scale(0.91) translateZ(-40px);
            box-shadow: 0 20px 50px rgba(16, 185, 129, 0.25);
          }
          100% {
            transform: perspective(1400px) rotateY(360deg) scale(1) translateZ(0);
            box-shadow: var(--card-shadow-hover);
          }
        }

        @keyframes spin360Prev {
          0% {
            transform: perspective(1400px) rotateY(0deg) scale(1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          }
          32% {
            transform: perspective(1400px) rotateY(-115deg) scale(0.91) translateZ(-40px);
            box-shadow: 0 20px 50px rgba(16, 185, 129, 0.25);
          }
          50% {
            transform: perspective(1400px) rotateY(-180deg) scale(0.87) translateZ(-65px);
            box-shadow: 0 25px 60px rgba(16, 185, 129, 0.35);
          }
          68% {
            transform: perspective(1400px) rotateY(-245deg) scale(0.91) translateZ(-40px);
            box-shadow: 0 20px 50px rgba(16, 185, 129, 0.25);
          }
          100% {
            transform: perspective(1400px) rotateY(-360deg) scale(1) translateZ(0);
            box-shadow: var(--card-shadow-hover);
          }
        }

        .tournament-spin-360-next {
          animation: spin360Next 0.72s cubic-bezier(0.34, 1.25, 0.64, 1) forwards !important;
        }

        .tournament-spin-360-prev {
          animation: spin360Prev 0.72s cubic-bezier(0.34, 1.25, 0.64, 1) forwards !important;
        }
      `}</style>

      {/* 
        FULL WIDTH CLOUDY DRIFT WALL BACKGROUND (ZERO BOX EDGES, NO BLUE BG!)
        Deep gradient fades seamlessly into var(--bg-base) on all 4 sides in both dark & light modes
      */}
      <div
        className="cloudy-drift-wall-layer"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'auto',
          background: 'transparent'
        }}
      >
        {/* Top Cloudy Mist Fade (240px deep fade so tiles dissolve with zero edge) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '240px',
            background: 'linear-gradient(to bottom, var(--bg-base) 0%, var(--bg-base) 30%, transparent 100%)',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />

        {/* Bottom Cloudy Mist Fade (240px deep fade) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '240px',
            background: 'linear-gradient(to top, var(--bg-base) 0%, var(--bg-base) 30%, transparent 100%)',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />

        {/* Left Cloudy Mist Blend */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 'min(620px, 50vw)',
            background: 'linear-gradient(to right, var(--bg-base) 50%, transparent 100%)',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />

        {/* Right Cloudy Edge Blend */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '160px',
            background: 'linear-gradient(to left, var(--bg-base) 25%, transparent 100%)',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />

        {/* The DriftWall Component synced to displayedIdx */}
        <DriftWall
          key={`drift-wall-${displayedIdx}`}
          items={currentTourney.galleryItems}
          columns={6}
          tileWidth={230}
          tileHeight={150}
          gap={18}
          speed={displayedIdx === 1 ? 38 : 32}
          tilt={10}
          turn={-8}
          depth={80}
          variance={0.4}
          parallax={0.45}
          lift={50}
          fade={0.8}
          dim={0.9}
          onItemClick={item => handleOpenPreview(item, currentTourney.galleryItems)}
        />
      </div>

      {/* 
        LEFT FLOATING TOURNAMENT DETAILS PANEL
        Click tabs 1, 2, or 3 to rotate and explore
      */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 clamp(24px, 5vw, 72px)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          perspective: '1400px'
        }}
      >
        {/* 3D Rotating Card Container */}
        <div
          className={`tournament-3d-card ${
            isFlipping
              ? spinDirection === 'next'
                ? 'tournament-spin-360-next'
                : 'tournament-spin-360-prev'
              : ''
          }`}
          style={{
            maxWidth: '480px',
            width: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            willChange: 'transform',
            pointerEvents: 'auto'
          }}
        >
          {/* FRONT FACE (Full Tournament Details Panel) */}
          <div
            className="tournament-card-front"
            style={{
              width: '100%',
              background: 'var(--header-bg)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              padding: 'clamp(24px, 3.5vw, 36px)',
              boxShadow: 'var(--card-shadow-hover)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)'
            }}
          >
            {/* Header Tag & Step Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--accent-green)',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <TrophyIcon className="w-3.5 h-3.5" />
                Featured Championships
              </div>

              {/* Step Dots Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {tournaments.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTabClick(idx)}
                    style={{
                      background: activeIdx === idx ? 'var(--accent-green)' : 'var(--border-strong)',
                      border: 'none',
                      height: '6px',
                      width: activeIdx === idx ? '26px' : '6px',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    title={t.title}
                  />
                ))}
              </div>
            </div>

            {/* Quick Switch Tabs (Click to View Tournament 1, 2, or 3) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '20px',
                padding: '4px',
                background: 'var(--bg-elevated)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {tournaments.map((t, idx) => {
                const isActive = activeIdx === idx;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTabClick(idx)}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      fontSize: '12px',
                      fontWeight: isActive ? '800' : '600',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? 'var(--accent-green)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {t.step}. {idx === 0 ? 'National' : idx === 1 ? 'Premier' : 'Youth Cup'}
                  </button>
                );
              })}
            </div>

            {/* Tournament Edition & Prize */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
              <span
                style={{
                  background: currentTourney.badgeBg,
                  color: currentTourney.badgeColor,
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {currentTourney.badge}
              </span>

              <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--accent-green)' }}>
                Prize Pool: {currentTourney.prizepool}
              </span>
            </div>

            {/* Tournament Title */}
            <h3
              key={currentTourney.id + '-title'}
              style={{
                fontSize: 'clamp(20px, 2.2vw, 26px)',
                fontWeight: '900',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                margin: '0 0 10px 0'
              }}
            >
              {currentTourney.title}
            </h3>

            {/* Subtitle */}
            <p
              key={currentTourney.id + '-sub'}
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '0 0 20px 0'
              }}
            >
              {currentTourney.subtitle}
            </p>

            {/* Date & Venue Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
                <span>{currentTourney.dates}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <MapPinIcon className="w-4 h-4 text-emerald-500" />
                <span>{currentTourney.venue}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => onOpenRegister && onOpenRegister(currentTourney.id)}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                <span>Register for Tournament</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('tournaments')}
                className="btn btn-outline"
                style={{ padding: '8px 14px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                <span>View Details</span>
              </button>
            </div>

            {/* Bottom Navigator Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '11.5px',
                color: 'var(--text-tertiary)'
              }}
            >
              <span>Click tabs above to switch</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleTabClick((activeIdx - 1 + tournaments.length) % tournaments.length)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontWeight: '700'
                  }}
                  title="Previous Tournament"
                >
                  ‹
                </button>
                <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '12px' }}>
                  {activeIdx + 1} of 3
                </span>
                <button
                  type="button"
                  onClick={() => handleTabClick((activeIdx + 1) % tournaments.length)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontWeight: '700'
                  }}
                  title="Next Tournament"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* BACK FACE (Federation Holographic Crest shown during 360 rotation) */}
          <div
            className="tournament-card-back"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: 'var(--header-bg)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              padding: 'clamp(24px, 3.5vw, 36px)',
              boxShadow: '0 20px 60px rgba(16, 185, 129, 0.25)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
              overflow: 'hidden'
            }}
          >
            {/* Decorative Emerald Glow */}
            <div
              style={{
                position: 'absolute',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(245, 158, 11, 0.08) 50%, transparent 70%)',
                filter: 'blur(20px)',
                pointerEvents: 'none'
              }}
            />

            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(245, 158, 11, 0.2))',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
                position: 'relative',
                zIndex: 2,
                marginBottom: '14px'
              }}
            >
              <TrophyIcon className="w-9 h-9 text-emerald-400" />
            </div>

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-green)'
                }}
              >
                Bangladesh Carrom Fed.
              </span>
              <h4
                style={{
                  fontSize: '19px',
                  fontWeight: '900',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: '2px 0 0 0'
                }}
              >
                Stage {tournaments[activeIdx]?.step || '01'}
              </h4>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)'
                }}
              >
                {tournaments[activeIdx]?.badge || 'Championship Series'}
              </span>
            </div>

            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-green)'
              }}
            >
              <span>Switching Circuit Stage...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Full-Screen Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isModalOpen}
        activeItem={activePreviewItem}
        items={activePreviewList}
        onClose={() => setIsModalOpen(false)}
        onPrev={handlePrevPreview}
        onNext={handleNextPreview}
      />
    </section>
  );
}
