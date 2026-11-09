'use client';

import React, { useState, useEffect, useRef } from 'react';
import DriftWall from './DriftWall';
import ImagePreviewModal from './ImagePreviewModal';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const FALLBACK_CARROM_IMAGES = [
  'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1652558973203-da9443c900d1?q=80&w=1481&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop'
];

export default function TournamentGallery({ tournaments: propTournaments = [], setActiveTab }) {
  // Modal Preview State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePreviewItem, setActivePreviewItem] = useState(null);
  const [activePreviewList, setActivePreviewList] = useState([]);

  // Live Tournaments State
  const [fetchedTournaments, setFetchedTournaments] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayedIdx, setDisplayedIdx] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [spinDirection, setSpinDirection] = useState('next');
  const flipTimerRef = useRef(null);

  // Draws & Bracket Tree Modal State
  const [drawsModalOpen, setDrawsModalOpen] = useState(false);
  const [bracketData, setBracketData] = useState(null);
  const [loadingBracket, setLoadingBracket] = useState(false);
  const [roundFilter, setRoundFilter] = useState('All');
  const [exporting, setExporting] = useState(false);
  const bracketRef = useRef(null);

  // Fetch tournaments from API if none passed or empty
  useEffect(() => {
    if (propTournaments && propTournaments.length > 0) {
      setFetchedTournaments(propTournaments);
      return;
    }

    let isMounted = true;
    fetch('/api/tournaments')
      .then(res => res.json())
      .then(json => {
        if (json.success && isMounted && Array.isArray(json.data) && json.data.length > 0) {
          setFetchedTournaments(json.data);
        }
      })
      .catch(err => console.error('Failed to load gallery tournaments:', err));

    return () => { isMounted = false; };
  }, [propTournaments]);

  // Transform tournament items with gallery images and metadata
  const tournaments = React.useMemo(() => {
    const rawList = fetchedTournaments.length > 0 ? fetchedTournaments : propTournaments;
    if (!rawList || rawList.length === 0) {
      return [
        {
          id: 1,
          step: '01',
          badge: 'National Championship 2026',
          badgeColor: '#047857',
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          title: 'Bangladesh National Carrom Championship',
          subtitle: 'The apex annual battleground for national master players, titleholders and white slam masters.',
          dates: 'Nov 10 – Nov 15, 2026',
          venue: 'National Sports Council (NSC) Gymnasium, Dhaka',
          prizepool: '৳ 3,50,000',
          galleryItems: FALLBACK_CARROM_IMAGES.map((img, i) => ({
            id: `fb-1-${i}`,
            image: img,
            tournament: 'Bangladesh National Carrom Championship'
          }))
        }
      ];
    }

    return rawList.map((t, idx) => {
      let parsedImages = [];
      try {
        if (t.gallery_images) {
          parsedImages = typeof t.gallery_images === 'string' ? JSON.parse(t.gallery_images) : t.gallery_images;
        }
      } catch (e) {
        parsedImages = [];
      }

      if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
        parsedImages = FALLBACK_CARROM_IMAGES;
      }

      const galleryItems = parsedImages.map((img, i) => ({
        id: `t-${t.id || idx}-${i}`,
        image: typeof img === 'string' && (img.startsWith('http') || img.startsWith('/') ? img : `/${img}`),
        tournament: t.title
      }));

      // Format Dates
      let formattedDates = 'TBD';
      if (t.start_date && t.end_date) {
        try {
          const s = new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const e = new Date(t.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          formattedDates = `${s} – ${e}`;
        } catch {
          formattedDates = `${t.start_date} – ${t.end_date}`;
        }
      } else if (t.start_date) {
        formattedDates = t.start_date;
      }

      return {
        id: t.id,
        tournament_code: t.tournament_code || `T-${String(t.id).padStart(6, '0')}`,
        step: String(idx + 1).padStart(2, '0'),
        badge: t.edition ? `${t.edition} Edition` : (t.status || 'Championship Series'),
        badgeColor: t.status === 'Ongoing' ? '#10B981' : '#2563EB',
        badgeBg: t.status === 'Ongoing' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)',
        title: t.title,
        subtitle: t.description || 'Top district franchises and national seed holders competing under ICF international carrom rules.',
        dates: formattedDates,
        venue: t.venue || 'Dhaka, Bangladesh',
        prizepool: t.prize_pool ? `৳ ${Number(t.prize_pool).toLocaleString()}` : 'Championship Trophy & ICF Points',
        galleryItems
      };
    });
  }, [fetchedTournaments, propTournaments]);

  // Ensure active index is within bounds
  useEffect(() => {
    if (activeIdx >= tournaments.length) {
      setActiveIdx(0);
      setDisplayedIdx(0);
    }
  }, [tournaments.length, activeIdx]);

  // Smooth 360-degree 3D card rotation when switching tabs
  useEffect(() => {
    if (activeIdx === displayedIdx) return;

    const dir = activeIdx > displayedIdx ? 'next' : 'prev';
    setSpinDirection(dir);
    setIsFlipping(true);

    if (flipTimerRef.current) {
      clearTimeout(flipTimerRef.current.mid);
      clearTimeout(flipTimerRef.current.end);
    }

    const midTimer = setTimeout(() => {
      setDisplayedIdx(activeIdx);
    }, 360);

    const endTimer = setTimeout(() => {
      setIsFlipping(false);
    }, 720);

    flipTimerRef.current = { mid: midTimer, end: endTimer };

    return () => {
      clearTimeout(midTimer);
      clearTimeout(endTimer);
    };
  }, [activeIdx, displayedIdx]);

  const handleTabClick = (index) => {
    if (activeIdx === index) return;
    setActiveIdx(index);
  };

  const handleOpenPreview = (item, list) => {
    setActivePreviewItem(item);
    setActivePreviewList(list);
    setIsModalOpen(true);
  };

  const handlePrevPreview = () => {
    if (!activePreviewList.length || !activePreviewItem) return;
    const currentIndex = activePreviewList.findIndex(
      it => (it.id && activePreviewItem?.id && it.id === activePreviewItem.id) || it.image === activePreviewItem?.image
    );
    const prevIndex = (currentIndex - 1 + activePreviewList.length) % activePreviewList.length;
    setActivePreviewItem(activePreviewList[prevIndex]);
  };

  const handleNextPreview = () => {
    if (!activePreviewList.length || !activePreviewItem) return;
    const currentIndex = activePreviewList.findIndex(
      it => (it.id && activePreviewItem?.id && it.id === activePreviewItem.id) || it.image === activePreviewItem?.image
    );
    const nextIndex = (currentIndex + 1) % activePreviewList.length;
    setActivePreviewItem(activePreviewList[nextIndex]);
  };

  // Open Draws / Bracket Tree Modal
  const handleOpenDraws = async (tourney) => {
    setDrawsModalOpen(true);
    setRoundFilter('All');
    setLoadingBracket(true);
    try {
      const res = await fetch(`/api/tournaments/${tourney.id}/bracket`);
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

  // Download Bracket as PNG
  const handleDownloadPng = async () => {
    if (!bracketRef.current) return;
    setExporting(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(bracketRef.current, {
        backgroundColor: '#0F172A',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      const tourneyTitle = (tournaments[displayedIdx]?.title || 'tournament').toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `${tourneyTitle}-fixtures-draws.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('Could not export image. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Download Bracket as PDF
  const handleDownloadPdf = async () => {
    if (!bracketRef.current) return;
    setExporting(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(bracketRef.current, {
        backgroundColor: '#0F172A',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      const tourneyTitle = (tournaments[displayedIdx]?.title || 'tournament').toLowerCase().replace(/[^a-z0-9]/g, '-');
      pdf.save(`${tourneyTitle}-fixtures-draws.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const currentTourney = tournaments[displayedIdx] || tournaments[0];
  const allBracketMatches = bracketData?.matches || [];
  const distinctRounds = Array.from(new Set(allBracketMatches.map(m => m.round_name))).filter(Boolean);
  const displayedMatches = allBracketMatches.filter(m => {
    if (roundFilter === 'All') return true;
    return m.round_name === roundFilter;
  });

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '680px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 0',
        overflow: 'hidden'
      }}
    >
      {/* Background Interactive DriftWall */}
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
        {/* Cloudy edge gradient masks */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '180px',
            background: 'linear-gradient(to bottom, var(--bg-base) 0%, var(--bg-base) 25%, transparent 100%)',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '180px',
            background: 'linear-gradient(to top, var(--bg-base) 0%, var(--bg-base) 25%, transparent 100%)',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />
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

        <DriftWall
          key={`drift-wall-${displayedIdx}`}
          items={currentTourney?.galleryItems || []}
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
          onItemClick={item => handleOpenPreview(item, currentTourney?.galleryItems || [])}
        />
      </div>

      {/* Floating Tournament Details Panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 clamp(20px, 4vw, 56px)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          perspective: '1400px'
        }}
      >
        {/* 3D Rotating Card Container */}
        <div
          className={`tournament-3d-card ${isFlipping
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
              borderRadius: '12px',
              padding: 'clamp(20px, 3vw, 30px)',
              boxShadow: 'var(--card-shadow-hover)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)'
            }}
          >
            {/* Header Tag & Step Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--accent-green)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Featured Championships</span>
              </div>

              {/* Step Dots Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {tournaments.map((t, idx) => (
                  <button
                    key={t.id || idx}
                    type="button"
                    onClick={() => handleTabClick(idx)}
                    style={{
                      background: activeIdx === idx ? 'var(--accent-green)' : 'var(--border-strong)',
                      border: 'none',
                      height: '5px',
                      width: activeIdx === idx ? '22px' : '5px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    title={t.title}
                  />
                ))}
              </div>
            </div>

            {/* Quick Switch Tabs */}
            {tournaments.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '16px',
                  padding: '4px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {tournaments.slice(0, 4).map((t, idx) => {
                  const isActive = activeIdx === idx;
                  return (
                    <button
                      key={t.id || idx}
                      type="button"
                      onClick={() => handleTabClick(idx)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '11.5px',
                        fontWeight: isActive ? '800' : '600',
                        borderRadius: '6px',
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
                      {t.step}. {t.title.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tournament Edition & Prize */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
              <span
                style={{
                  background: currentTourney?.badgeBg || 'rgba(37, 99, 235, 0.15)',
                  color: currentTourney?.badgeColor || '#2563EB',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {currentTourney?.badge}
              </span>

              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-green)' }}>
                Prize Pool: {currentTourney?.prizepool}
              </span>
            </div>

            {/* Tournament Title */}
            <h3
              key={currentTourney?.id + '-title'}
              style={{
                fontSize: 'clamp(18px, 2vw, 24px)',
                fontWeight: '900',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                margin: '0 0 8px 0'
              }}
            >
              {currentTourney?.title}
            </h3>

            {/* Subtitle */}
            <p
              key={currentTourney?.id + '-sub'}
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '0 0 16px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {currentTourney?.subtitle}
            </p>

            {/* Date & Venue Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>{currentTourney?.dates}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentTourney?.venue}
                </span>
              </div>
            </div>

            {/* Action Buttons: View Details (Draws & Tree) & Calendar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => handleOpenDraws(currentTourney)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>View Draws & Bracket Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('tournaments')}
                className="btn btn-outline"
                style={{ padding: '8px 14px', fontSize: '12.5px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>All Tournaments</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Navigator Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '11.5px',
                color: 'var(--text-tertiary)'
              }}
            >
              <span>Click tabs or arrows to rotate</span>
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
                    color: 'var(--text-secondary)'
                  }}
                  title="Previous Tournament"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '11.5px' }}>
                  {activeIdx + 1} of {tournaments.length}
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
                    color: 'var(--text-secondary)'
                  }}
                  title="Next Tournament"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* BACK FACE (Federation Crest shown during 360 rotation) */}
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
              borderRadius: '12px',
              padding: 'clamp(20px, 3vw, 30px)',
              boxShadow: '0 16px 40px rgba(16, 185, 129, 0.2)',
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
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(245, 158, 11, 0.2))',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)',
                marginBottom: '12px'
              }}
            >
              <Trophy className="w-7 h-7 text-emerald-400" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-green)' }}>
                Bangladesh Carrom Federation
              </span>
              <h4 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '2px 0 0 0' }}>
                Stage {tournaments[activeIdx]?.step || '01'}
              </h4>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {tournaments[activeIdx]?.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Interactive Bracket & Draws Modal with PNG / PDF Downloads */}
      {drawsModalOpen && currentTourney && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
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
              backgroundColor: 'var(--card-bg, #0F172A)',
              color: 'var(--text-primary)',
              borderRadius: '12px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '11px', padding: '2px 7px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary, #1E293B)', border: '1px solid var(--border-subtle)' }}>
                    {currentTourney.tournament_code}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 7px', borderRadius: '4px' }}>
                    {currentTourney.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                  {currentTourney.title} — Official Draws & Tree
                </h3>
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
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls Toolbar (Rounds + Download Actions) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary, #1E293B)', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>Round:</span>
                {['All', ...distinctRounds].map((rnd) => (
                  <button
                    key={rnd}
                    onClick={() => setRoundFilter(rnd)}
                    style={{
                      border: 'none',
                      background: roundFilter === rnd ? 'var(--accent-green, #10B981)' : 'transparent',
                      color: roundFilter === rnd ? '#ffffff' : 'var(--text-secondary)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {rnd}
                  </button>
                ))}
              </div>

              {/* PNG and PDF Download Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  disabled={exporting || loadingBracket}
                  onClick={handleDownloadPng}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 11px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated, #334155)',
                    color: 'var(--text-primary)',
                    cursor: exporting ? 'not-allowed' : 'pointer'
                  }}
                  title="Export Draws as High-Resolution PNG"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{exporting ? 'Exporting...' : 'Download PNG'}</span>
                </button>

                <button
                  type="button"
                  disabled={exporting || loadingBracket}
                  onClick={handleDownloadPdf}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 11px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated, #334155)',
                    color: 'var(--text-primary)',
                    cursor: exporting ? 'not-allowed' : 'pointer'
                  }}
                  title="Export Official Draws Document as PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>{exporting ? 'Exporting...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>

            {/* Bracket Content Container (Referenced for PNG/PDF capture) */}
            <div
              ref={bracketRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                background: '#0B1120'
              }}
            >
              {loadingBracket ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94A3B8' }}>
                  Loading official fixtures and tournament bracket...
                </div>
              ) : displayedMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94A3B8', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  No match fixtures scheduled yet for this championship.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {displayedMatches.map((m, idx) => {
                    const isLive = (m.status || '').toLowerCase() === 'live';
                    const isCompleted = (m.status || '').toLowerCase() === 'completed';
                    return (
                      <div
                        key={m.id || idx}
                        style={{
                          background: '#1E293B',
                          borderRadius: '8px',
                          border: isLive ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8' }}>
                          <span style={{ fontWeight: '700' }}>{m.round_name || 'Match'} • Board #{m.board_number || 1}</span>
                          <span style={{
                            fontWeight: '800',
                            color: isLive ? '#EF4444' : isCompleted ? '#10B981' : '#94A3B8'
                          }}>
                            {(m.status || 'SCHEDULED').toUpperCase()}
                          </span>
                        </div>

                        {/* Player 1 Row */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: m.winner_id && Number(m.winner_id) === Number(m.player1_id) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)'
                        }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#F8FAFC' }}>
                            {m.player1_name || 'TBD'}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace', color: '#F8FAFC' }}>
                            {m.player1_score ?? 0}
                          </span>
                        </div>

                        {/* Player 2 Row */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: m.winner_id && Number(m.winner_id) === Number(m.player2_id) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)'
                        }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#F8FAFC' }}>
                            {m.player2_name || 'TBD'}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace', color: '#F8FAFC' }}>
                            {m.player2_score ?? 0}
                          </span>
                        </div>

                        {m.umpire_name && (
                          <div style={{ fontSize: '10.5px', color: '#64748B', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '2px' }}>
                            Umpire: {m.umpire_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-secondary, #1E293B)' }}>
              <button
                type="button"
                onClick={() => setDrawsModalOpen(false)}
                className="btn btn-primary"
                style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '6px' }}
              >
                Close Tree
              </button>
            </div>
          </div>
        </div>
      )}

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
