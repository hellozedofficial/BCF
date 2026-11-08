import React, { useState, useEffect } from 'react';
import { API_BASE, SERVER_BASE } from '../config/api';

export default function AnnouncementModal({ navigateTo }) {
  const [announcement, setAnnouncement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const getStorageKey = (item) => {
    if (!item || !item.id) return null;
    const version = item.updated_at ? new Date(item.updated_at).getTime() : 'v1';
    return `bcf_announcement_dismissed_${item.id}_${version}`;
  };

  useEffect(() => {
    let mounted = true;

    const fetchActiveAnnouncement = async () => {
      try {
        const res = await fetch(`${API_BASE}/announcements/active`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted || !json.success || !json.data) return;

        const item = json.data;
        if (Number(item.is_published ?? 1) !== 1) return;

        const storageKey = getStorageKey(item);
        if (storageKey && localStorage.getItem(storageKey) === 'true') {
          return;
        }

        setAnnouncement(item);
        setIsOpen(true);
      } catch (e) {
        // Silent fail if offline
      }
    };

    fetchActiveAnnouncement();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      const storageKey = getStorageKey(announcement);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, 'true');
        } catch (e) {
          // ignore storage quota errors
        }
      }
    }
    setIsOpen(false);
  };

  const handleLinkClick = (e) => {
    if (!announcement?.link_url) return;
    const url = announcement.link_url.trim();
    handleDismiss();

    // If internal path (e.g. /tournaments or /player-register), use SPA navigation if available
    if (url.startsWith('/') && navigateTo) {
      e.preventDefault();
      navigateTo(url);
    }
  };

  if (!isOpen || !announcement) return null;

  const resolveImageUrl = (raw) => {
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
    if (raw.startsWith('/uploads/')) return `${SERVER_BASE}${raw}`;
    return raw;
  };

  const bannerSrc = resolveImageUrl(announcement.image_url);
  const hasText = Boolean(announcement.title?.trim() || announcement.content?.trim());
  const isExternalLink = announcement.link_url && /^https?:\/\//i.test(announcement.link_url.trim());

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '540px',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          animation: 'scaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label="Close Announcement"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 10,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '700',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#EF4444';
            e.currentTarget.style.transform = 'scale(1.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>

        {/* Banner Image */}
        {bannerSrc && (
          <div style={{ width: '100%', position: 'relative', background: 'var(--bg-elevated)' }}>
            {announcement.link_url ? (
              <a
                href={announcement.link_url}
                target={isExternalLink ? '_blank' : undefined}
                rel={isExternalLink ? 'noopener noreferrer' : undefined}
                onClick={handleLinkClick}
                style={{ display: 'block' }}
              >
                <img
                  src={bannerSrc}
                  alt={announcement.title || 'BCF Announcement'}
                  style={{
                    width: '100%',
                    maxHeight: hasText ? '300px' : '460px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </a>
            ) : (
              <img
                src={bannerSrc}
                alt={announcement.title || 'BCF Announcement'}
                style={{
                  width: '100%',
                  maxHeight: hasText ? '300px' : '460px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            )}
          </div>
        )}

        {/* Content & Actions */}
        {(hasText || announcement.link_url) && (
          <div style={{ padding: '24px 26px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.14)',
                color: 'var(--accent-green)',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent-green)'
                }}
              />
              Official Announcement
            </div>

            {announcement.title && (
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  lineHeight: 1.3,
                  color: 'var(--text-primary)',
                  marginBottom: announcement.content ? '10px' : '18px'
                }}
              >
                {announcement.title}
              </h3>
            )}

            {announcement.content && (
              <p
                style={{
                  fontSize: '14.5px',
                  lineHeight: 1.65,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-line',
                  marginBottom: '22px'
                }}
              >
                {announcement.content}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleDismiss}
                className="btn btn-outline"
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: '700'
                }}
              >
                Close
              </button>

              {announcement.link_url && (
                <a
                  href={announcement.link_url}
                  target={isExternalLink ? '_blank' : undefined}
                  rel={isExternalLink ? 'noopener noreferrer' : undefined}
                  onClick={handleLinkClick}
                  className="btn btn-primary"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  {announcement.button_text || 'Learn More'} ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
