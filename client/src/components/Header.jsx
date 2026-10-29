'use client';

import React, { useState, useEffect, useRef } from 'react';
import StaggeredMenu from './StaggeredMenu';
import GlassSurface from './GlassSurface';
import { PlusIcon } from './Icons';

const SunIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

export default function Header({
  activeTab = 'home',
  onTabChange,
  navigateTo: navigateToProp,
  liveMatchCount = 2,
  onOpenRegister,
  theme = 'light',
  toggleTheme
}) {
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger floating dock when scrolled past 40px
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', path: '/' },
    { id: 'live', label: 'Live Matches', path: '/live-matches', badge: liveMatchCount > 0 ? `${liveMatchCount} Live` : null },
    { id: 'tournaments', label: 'Tournaments', path: '/tournaments' },
    { id: 'rankings', label: 'Rankings', path: '/rankings' },
    { id: 'players', label: 'Players', path: '/players' },
    { id: 'clubs', label: 'Clubs', path: '/clubs' },
    { id: 'news', label: 'News & Blogs', path: '/news' },
    { id: 'committee', label: 'About', path: '/about' }
  ];

  const navigateTo = (path) => {
    if (navigateToProp) {
      navigateToProp(path);
      return;
    }
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const staggeredMenuItems = [
    { label: 'Overview', link: '/', ariaLabel: 'BCF Overview Page', onClick: () => navigateTo('/') },
    { label: 'Live Matches', link: '/live-matches', ariaLabel: 'Live Scores & Streaming', onClick: () => navigateTo('/live-matches') },
    { label: 'Tournaments', link: '/tournaments', ariaLabel: 'Tournament Schedules & Draws', onClick: () => navigateTo('/tournaments') },
    { label: 'Rankings', link: '/rankings', ariaLabel: 'National Player Rankings', onClick: () => navigateTo('/rankings') },
    { label: 'Players', link: '/players', ariaLabel: 'National Master Players', onClick: () => navigateTo('/players') },
    { label: 'Clubs & Academies', link: '/clubs', ariaLabel: 'Affiliated Clubs', onClick: () => navigateTo('/clubs') },
    { label: 'News & Blogs', link: '/news', ariaLabel: 'BCF Press, Media & Blogs', onClick: () => navigateTo('/news') },
    { label: 'Player Registration', link: '/player-register', ariaLabel: 'Official Player Registration', onClick: () => navigateTo('/player-register') },
    { label: 'About BCF', link: '/about', ariaLabel: 'Federation History & Committee', onClick: () => navigateTo('/about') }
  ];

  const socialLinks = [
    { label: 'International Carrom Federation (ICF)', link: 'https://icfcarrom.com' },
    { label: 'Asian Carrom Federation (ACF)', link: 'https://asiancarrom.com' },
    { label: 'National Sports Council (NSC)', link: 'https://nsc.gov.bd' }
  ];

  return (
    <>
      {/* 
        1. FLOATING TOP HEADER CAPSULE
        Sleek, modern floating navigation bar
      */}
      <header
        className={`top-header-capsule ${scrolled ? 'is-scrolled' : 'at-top'}`}
        style={{
          position: 'fixed',
          top: '18px',
          left: '50%',
          transform: scrolled
            ? 'translate(-50%, -100px)'
            : 'translate(-50%, 0)',
          opacity: scrolled ? 0 : 1,
          pointerEvents: scrolled ? 'none' : 'auto',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 900,
          width: 'calc(100% - 36px)',
          maxWidth: '1220px'
        }}
      >
        <div
          className="top-header-inner"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '9999px',
            border: '1px solid var(--header-border)',
            boxShadow: theme === 'dark' ? '0 10px 35px rgba(0, 0, 0, 0.7)' : '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03)',
            padding: '8px 16px 8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* Logo & Title */}
          <div
            onClick={() => navigateTo('/')}
            className="brand-container"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              userSelect: 'none',
              flexShrink: 0
            }}
          >
            <div className="brand-logo-wrap" style={{
              width: '32px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))'
            }}>
              <img
                src="/01M3YBY0TBEXJA8T8H0SWPY123.png"
                alt="Bangladesh Carrom Federation"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className="brand-text-wrap">
              <div className="brand-desktop-title">
                <div className="brand-title" style={{
                  fontSize: '14.5px',
                  fontWeight: '900',
                  letterSpacing: '-0.025em',
                  color: 'var(--text-primary)',
                  lineHeight: '1.2'
                }}>
                  BANGLADESH CARROM
                </div>
                <div className="brand-subtitle" style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: 'var(--accent-green)',
                  letterSpacing: '0.06em',
                  lineHeight: '1'
                }}>
                  FEDERATION
                </div>
              </div>
              <div className="brand-mobile-title" style={{ display: 'none' }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '900',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)'
                }}>
                  BCF
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Route Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            className="hidden-mobile"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id ||
                (item.id === 'overview' && (activeTab === 'overview' || activeTab === 'home')) ||
                (item.id === 'committee' && (activeTab === 'committee' || activeTab === 'about'));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateTo(item.path);
                    onTabChange?.(item.id);
                  }}
                  style={{
                    position: 'relative',
                    background: isActive ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(4, 120, 87, 0.08)') : 'transparent',
                    border: 'none',
                    color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
                    fontWeight: isActive ? '700' : '600',
                    fontSize: '13px',
                    padding: '7px 13px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {item.id === 'live' && liveMatchCount > 0 && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      display: 'inline-block',
                      animation: 'pulse 1.5s infinite'
                    }} />
                  )}
                  <span>{item.label}</span>
                  {item.badge && item.id !== 'live' && (
                    <span style={{
                      background: '#EF4444',
                      color: '#FFF',
                      fontSize: '10px',
                      borderRadius: '9999px',
                      padding: '1px 6px',
                      fontWeight: '700'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Theme Toggle + Register + Menu */}
          <div className="top-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '9999px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: theme === 'dark' ? '#F59E0B' : '#047857',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.borderColor = 'var(--accent-green)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenRegister}
              className="btn btn-primary top-register-btn"
              title="Player Registration"
              style={{
                padding: '7px 14px',
                fontSize: '12.5px',
                borderRadius: '9999px',
                background: 'var(--accent-green)',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)',
                fontWeight: '700',
                gap: '4px'
              }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span className="top-register-label">Register</span>
            </button>

            {/* Menu Trigger Button in Top Header (Only on mobile/narrow screens) */}
            <button
              onClick={() => menuRef.current?.toggle()}
              className="menu-trigger-btn top-menu-btn"
              aria-label="Open Navigation Menu"
              style={{
                background: '#F43F5E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                padding: '7px 14px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 10px rgba(244, 63, 94, 0.35)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span>Menu</span>
            </button>

            {/* Staggered Menu Portal */}
            <StaggeredMenu
              ref={menuRef}
              items={staggeredMenuItems}
              socialItems={socialLinks}
              accentColor="#F43F5E"
              colors={theme === 'dark' ? ['#059669', '#1E293B', '#F43F5E'] : ['#047857', '#0F172A', '#F43F5E']}
              menuButtonColor={theme === 'dark' ? '#F8FAFC' : '#0F172A'}
              openMenuButtonColor="#FFFFFF"
              logoUrl="/01M3YBY0TBEXJA8T8H0SWPY123.png"
              isFixed={true}
              showDefaultToggle={false}
            />
          </div>
        </div>
      </header>

      {/* 
        2. FLOATING LIQUID GLASS DOCK AT THE BOTTOM (bottom: 24px desktop, persistent bottom nav on mobile)
        Appears on scroll on desktop, always visible on mobile view
      */}
      <div
        className={`bottom-floating-dock ${scrolled ? 'is-scrolled' : 'at-top'}`}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: scrolled ? 'translate(-50%, 0)' : 'translate(-50%, 50px)',
          opacity: scrolled ? 1 : 0,
          pointerEvents: scrolled ? 'auto' : 'none',
          zIndex: 1000,
          width: 'calc(100% - 24px)',
          maxWidth: '480px',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <GlassSurface
          width="100%"
          height={54}
          borderRadius={50}
          borderWidth={0.08}
          brightness={50}
          opacity={0.92}
          blur={10}
          displace={0.4}
          backgroundOpacity={0.16}
          saturation={1.4}
          distortionScale={-35}
          redOffset={0}
          greenOffset={8}
          blueOffset={16}
        >
          {/* Logo & BCF Badge on Left */}
          <div
            onClick={() => navigateTo('/')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              userSelect: 'none',
              flexShrink: 0
            }}
          >
            <div style={{
              width: '24px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src="/01M3YBY0TBEXJA8T8H0SWPY123.png"
                alt="BCF Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)'
            }}>
              BCF
            </span>
          </div>

          {/* Quick Route Shortcuts in Center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {liveMatchCount > 0 && (
              <button
                onClick={() => navigateTo('/live-matches')}
                className="badge badge-live"
                style={{
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                  backdropFilter: 'blur(4px)',
                  fontWeight: '700',
                  gap: '4px'
                }}
              >
                <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                <span>{liveMatchCount} LIVE</span>
              </button>
            )}
          </div>

          {/* Right: Theme Toggle + Register + Menu Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            {/* Quick Theme Switcher in Bottom Dock */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: theme === 'dark' ? '#F59E0B' : '#047857',
                borderRadius: '9999px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {theme === 'dark' ? <SunIcon className="w-3.5 h-3.5" /> : <MoonIcon className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onOpenRegister}
              className="btn btn-primary"
              title="Register as Player"
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                borderRadius: '9999px',
                background: 'var(--accent-green)',
                boxShadow: '0 2px 10px rgba(4, 120, 87, 0.35)',
                fontWeight: '600',
                gap: '4px'
              }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span className="dock-register-label">Register</span>
            </button>

            <button
              onClick={() => menuRef.current?.toggle()}
              style={{
                background: '#F43F5E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(244, 63, 94, 0.35)'
              }}
            >
              <span>Menu</span>
            </button>
          </div>
        </GlassSurface>
      </div>
    </>
  );
}
