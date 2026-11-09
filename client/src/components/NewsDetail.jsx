import React, { useState, useEffect, useRef } from 'react';
import { API_BASE, SERVER_BASE } from '../config/api';
import SEO from './SEO';
import {
  CalendarIcon,
  ChevronRightIcon,
  EyeIcon,
  ClockIcon,
  ShareIcon,
  CheckIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  NewspaperIcon,
  PinIcon
} from './Icons';

function AdaptiveVideoPlayer({ videoUrl, initialMeta, title }) {
  const vUrl = (videoUrl || '').trim();
  const isUrlReelOrShort = /\/(?:reel|share\/r|shorts)\//i.test(vUrl);

  const [meta, setMeta] = useState(() => {
    if (initialMeta && initialMeta.width && initialMeta.height) {
      return initialMeta;
    }
    return {
      width: isUrlReelOrShort ? 9 : 16,
      height: isUrlReelOrShort ? 16 : 9,
      aspectRatio: isUrlReelOrShort ? 9 / 16 : 16 / 9,
      isVertical: isUrlReelOrShort
    };
  });

  const wrapperRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    if (!vUrl) return;
    if (initialMeta && initialMeta.width && initialMeta.height) {
      setMeta(initialMeta);
      return;
    }
    let active = true;
    fetch(`${API_BASE}/news/video-meta?url=${encodeURIComponent(vUrl)}`)
      .then((r) => r.json())
      .then((json) => {
        if (active && json && json.success && json.width && json.height) {
          setMeta(json);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [vUrl, initialMeta]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const updateWidth = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setMeasuredWidth(Math.round(w));
    };
    updateWidth();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateWidth);
      ro.observe(el);
    } else {
      window.addEventListener('resize', updateWidth);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', updateWidth);
    };
  }, [meta.aspectRatio]);

  const ytMatch = vUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/
  );
  const isFbVideo = /(?:facebook\.com|fb\.watch|fb\.gg)/i.test(vUrl);

  const ratio = meta.aspectRatio || (meta.width && meta.height ? meta.width / meta.height : 16 / 9);
  const isVertical = ratio < 0.88;
  const isSquare = ratio >= 0.88 && ratio <= 1.15;

  // Choose natural max-width so vertical Reels/Shorts and 1:1 videos sit cleanly at their true proportions
  const maxContainerWidth = isVertical ? 380 : isSquare ? 520 : 860;
  const fallbackWidth = isVertical ? 380 : isSquare ? 500 : 800;
  const activeWidth = measuredWidth > 100 ? measuredWidth : fallbackWidth;
  const activeHeight = Math.max(200, Math.round(activeWidth / ratio));

  if (ytMatch && ytMatch[1]) {
    return (
      <div style={{ marginBottom: 36 }}>
        <div
          ref={wrapperRef}
          style={{
            width: '100%',
            maxWidth: maxContainerWidth,
            margin: '0 auto',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
            border: '1px solid var(--border-subtle)',
            background: '#000',
            aspectRatio: `${meta.width || 16} / ${meta.height || 9}`,
            height: measuredWidth > 100 ? `${activeHeight}px` : undefined
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      </div>
    );
  }

  if (isFbVideo) {
    return (
      <div style={{ marginBottom: 36 }}>
        <div
          ref={wrapperRef}
          style={{
            width: '100%',
            maxWidth: maxContainerWidth,
            margin: '0 auto',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
            border: '1px solid var(--border-subtle)',
            background: '#000',
            height: `${activeHeight}px`,
            transition: 'height 0.15s ease'
          }}
        >
          <iframe
            key={`${activeWidth}x${activeHeight}`}
            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(vUrl)}&show_text=false&width=${activeWidth}&height=${activeHeight}`}
            title={title}
            width={activeWidth}
            height={activeHeight}
            scrolling="no"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block', overflow: 'hidden' }}
          />
        </div>
        <div
          style={{
            maxWidth: maxContainerWidth,
            margin: '10px auto 0',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <a
            href={vUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--brand-green)',
              textDecoration: 'none'
            }}
          >
            Watch directly on Facebook ↗
          </a>
        </div>
      </div>
    );
  }

  return null;
}

export default function NewsDetail({ slug, onNavigate }) {
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/news/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Article not found');
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setArticle(json.data);
          setRelated(json.related || []);
        } else {
          throw new Error(json.message || 'Article not found');
        }
      })
      .catch((err) => {
        console.error('Error fetching article:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const getFullImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.startsWith('/uploads/')) return `${SERVER_BASE}${img}`;
    return img;
  };

  // Estimate reading time from words
  const calculateReadingTime = (text = '') => {
    const clean = text.replace(/<[^>]*>/g, ' ').trim();
    const words = clean.split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '60vh', padding: '60px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 44, height: 44, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-green)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Loading article details...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container" style={{ minHeight: '60vh', padding: '80px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', background: 'var(--bg-surface)', padding: 36, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Article Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            The requested news bulletin or blog post might have been moved or archived.
          </p>
          <button
            onClick={() => onNavigate('/news')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            <ArrowLeftIcon size={16} /> Back to News & Blogs
          </button>
        </div>
      </div>
    );
  }

  const isBlog = article.type === 'Blog';
  const coverUrl = getFullImageUrl(article.image_url);
  const readingTime = calculateReadingTime(article.content);
  const formattedDate = article.publish_date
    ? new Date(article.publish_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = encodeURIComponent(article.title);

  return (
    <article className="article-detail-page" style={{ padding: '32px 0 64px' }}>
      {/* Dynamic SEO Tags */}
      <SEO
        title={article.title}
        description={article.summary || article.title}
        image={coverUrl}
        type={isBlog ? 'article' : 'article'}
        publishedTime={article.publish_date}
        author={article.author}
        category={article.category}
        slug={article.slug}
      />

      <div className="container" style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--text-tertiary)',
            marginBottom: 24,
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => onNavigate('/')}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            Home
          </button>
          <ChevronRightIcon size={12} />
          <button
            onClick={() => onNavigate('/news')}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            News & Blogs
          </button>
          <ChevronRightIcon size={12} />
          <span style={{ color: 'var(--brand-green)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
            {article.category || 'Article'}
          </span>
        </nav>

        {/* Badges & Meta Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <span
            className={isBlog ? 'badge badge-purple' : 'badge badge-green'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 800,
              borderRadius: 6
            }}
          >
            {isBlog ? <BookOpenIcon size={12} /> : <NewspaperIcon size={12} />}
            {isBlog ? 'Editorial Blog' : 'Official News'}
          </span>

          {article.category && (
            <span
              className="badge"
              style={{
                background: 'var(--bg-card-header)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 6
              }}
            >
              {article.category}
            </span>
          )}

          {article.is_pinned === 1 && (
            <span
              className="badge badge-gold"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 800,
                borderRadius: 6
              }}
            >
              <PinIcon size={12} /> Pinned Bulletin
            </span>
          )}
        </div>

        {/* Main Title (H1 for SEO) */}
        <h1
          style={{
            fontSize: 'clamp(26px, 4.5vw, 42px)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            marginBottom: 20
          }}
        >
          {article.title}
        </h1>

        {/* Excerpt / Summary */}
        {article.summary && (
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              marginBottom: 24,
              fontStyle: 'normal',
              fontWeight: 450
            }}
          >
            {article.summary}
          </p>
        )}

        {/* Author, Date, Reading Time & Social Share Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            padding: '16px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 32
          }}
        >
          {/* Author info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-green), #047857)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 16,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              {(article.author || 'B').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 750, color: 'var(--text-primary)', fontSize: 14 }}>
                {article.author || 'BCF Media Cell'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CalendarIcon size={12} />
                  <time dateTime={article.publish_date}>{formattedDate}</time>
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClockIcon size={12} />
                  {readingTime}
                </span>
                {article.views_count > 0 && (
                  <>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <EyeIcon size={12} />
                      {article.views_count} views
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleCopyLink}
              title="Copy link to clipboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: copied ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                color: copied ? 'var(--brand-green)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copied ? <CheckIcon size={14} /> : <ShareIcon size={14} />}
              {copied ? 'Link Copied!' : 'Share'}
            </button>

            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on X"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 800
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on Facebook"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 800
              }}
            >
              f
            </a>

            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${shareTitle}%20${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on WhatsApp"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 800
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Featured Video Player (YouTube / Facebook) or Cover Image */}
        {(() => {
          const vUrl = (article.video_url || '').trim();
          const hasSupportedVideo =
            Boolean(vUrl) &&
            (/(?:youtube\.com|youtu\.be)/i.test(vUrl) || /(?:facebook\.com|fb\.watch|fb\.gg)/i.test(vUrl));

          if (hasSupportedVideo) {
            return (
              <AdaptiveVideoPlayer
                videoUrl={vUrl}
                initialMeta={article.video_meta}
                title={article.title}
              />
            );
          }

          return coverUrl ? (
            <div
              style={{
                marginBottom: 36,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <img
                src={coverUrl}
                alt={article.title}
                style={{
                  width: '100%',
                  maxHeight: 480,
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          ) : null;
        })()}

        {/* Rich Article Body with Typography (only rendered when content is non-empty) */}
        {(() => {
          const rawHtml = article.content || '';
          const plainCheck = rawHtml
            .replace(/<img[^>]*>/gi, 'IMG')
            .replace(/<iframe[^>]*>/gi, 'IFRAME')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .trim();
          if (!plainCheck) return null;
          return (
            <div
              className="article-rich-body"
              dangerouslySetInnerHTML={{ __html: rawHtml }}
              style={{
                fontSize: '17px',
                lineHeight: 1.8,
                color: 'var(--text-primary)',
                width: '100%',
                maxWidth: '100%',
                overflowX: 'hidden',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            />
          );
        })()}

        {/* Article Signoff / Federation Seal */}
        <div
          style={{
            marginTop: 48,
            padding: 24,
            borderRadius: 14,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              fontFamily: "'Tactic Sans', 'Inter', sans-serif",
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'var(--bg-card-header)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)',
              fontSize: 19,
              fontWeight: 900
            }}
          >
            BCF
          </div>
          <div>
            <h4 style={{ fontFamily: "'Tactic Sans', 'Inter', sans-serif", margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              Bangladesh Carrom Federation (BCF)
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              The sovereign national governing body for Carrom in the People's Republic of Bangladesh. Affiliated with the International Carrom Federation (ICF) and National Sports Council.
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div style={{ marginTop: 32 }}>
          <button
            onClick={() => onNavigate('/news')}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            <ArrowLeftIcon size={16} /> Back to All News & Blogs
          </button>
        </div>

        {/* Related Articles Section */}
        {related && related.length > 0 && (
          <div style={{ marginTop: 56, paddingTop: 36, borderTop: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
              Related Stories & Analyses
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 20
              }}
            >
              {related.map((item) => {
                const itemCover = getFullImageUrl(item.image_url);
                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(`/news/${item.slug || item.id}`)}
                    style={{
                      background: 'var(--bg-surface)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {itemCover ? (
                      <div style={{ height: 140, overflow: 'hidden' }}>
                        <img
                          src={itemCover}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{ height: 100, background: 'var(--bg-card-header)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                        <NewspaperIcon size={24} />
                      </div>
                    )}

                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: item.type === 'Blog' ? '#8B5CF6' : 'var(--brand-green)',
                          marginBottom: 6
                        }}
                      >
                        {item.type || 'News'} • {item.category || 'General'}
                      </span>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 750,
                          color: 'var(--text-primary)',
                          margin: '0 0 10px',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {item.title}
                      </h4>
                      <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
