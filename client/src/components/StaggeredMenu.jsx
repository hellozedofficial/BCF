'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import './StaggeredMenu.css';

export const StaggeredMenu = forwardRef(({
  position = 'right',
  colors = ['#047857', '#0F172A', '#F43F5E'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className = '',
  logoUrl = '/01M3YBY0TBEXJA8T8H0SWPY123.png',
  menuButtonColor = '#0F172A',
  accentColor = '#F43F5E',
  showDefaultToggle = true,
  onMenuOpen,
  onMenuClose
}, ref) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => {
    setOpen(prev => {
      const next = !prev;
      if (next) onMenuOpen?.();
      else onMenuClose?.();
      return next;
    });
  };

  const closeMenu = () => {
    setOpen(false);
    onMenuClose?.();
  };

  const openMenu = () => {
    setOpen(true);
    onMenuOpen?.();
  };

  // Expose methods via ref for external buttons (like bottom dock)
  useImperativeHandle(ref, () => ({
    open: openMenu,
    close: closeMenu,
    toggle: toggleMenu,
    isOpen: () => open
  }));

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        closeMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const portalElement = mounted && typeof document !== 'undefined' ? (
    createPortal(
      <div
        className={`sm-portal-overlay ${open ? 'sm-portal-open' : ''}`}
        data-position={position}
        style={accentColor ? { '--sm-accent': accentColor } : undefined}
      >
        {/* Dimmed backdrop to close on click outside */}
        <div
          className="sm-portal-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* 3 Staggered colored underlay sweeps */}
        <div className="sm-prelayers" aria-hidden="true">
          {(() => {
            const raw = colors && colors.length ? colors.slice(0, 4) : ['#047857', '#0F172A', '#F43F5E'];
            return raw.map((c, i) => (
              <div key={i} className="sm-prelayer" style={{ background: c }} />
            ));
          })()}
        </div>

        {/* Slide-out Menu Panel */}
        <aside
          id="staggered-menu-panel"
          className="staggered-menu-panel"
          aria-hidden={!open}
        >
          <div className="sm-panel-inner">
            {/* Header: Logo and Close button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={logoUrl}
                  alt="BCF Logo"
                  style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                    BANGLADESH CARROM
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-green)', letterSpacing: '0.04em' }}>
                    FEDERATION
                  </div>
                </div>
              </div>

              <button
                onClick={closeMenu}
                aria-label="Close Menu"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  transition: 'background 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FEE2E2';
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Links */}
            <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
              {items && items.length > 0 ? (
                items.map((it, idx) => (
                  <li className="sm-panel-itemWrap" key={it.label + idx}>
                    <a
                      className="sm-panel-item"
                      href={it.link}
                      aria-label={it.ariaLabel}
                      data-index={idx + 1}
                      onClick={(e) => {
                        if (it.onClick) {
                          e.preventDefault();
                          it.onClick(it.link);
                        }
                        closeMenu();
                      }}
                    >
                      <span className="sm-panel-itemLabel">{it.label}</span>
                    </a>
                  </li>
                ))
              ) : null}
            </ul>

            {/* Affiliations & Social Links */}
            {displaySocials && socialItems && socialItems.length > 0 && (
              <div className="sm-socials" aria-label="Social links">
                <h3 className="sm-socials-title">Affiliations & Socials</h3>
                <ul className="sm-socials-list" role="list">
                  {socialItems.map((s, i) => (
                    <li key={s.label + i} className="sm-socials-item">
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>

      {portalElement}
    </>
  );
});

export default StaggeredMenu;
