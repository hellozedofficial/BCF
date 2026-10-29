import React, { useState, useMemo } from 'react';
import { SERVER_BASE } from '../config/api';
import {
  NewspaperIcon,
  CalendarIcon,
  BookOpenIcon,
  PinIcon,
  SearchIcon,
  ClockIcon,
  ChevronRightIcon
} from './Icons';

export default function NewsSection({ news = [], onNavigate = () => { } }) {
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'News' | 'Blog'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter only Published articles for public website
  const publishedArticles = useMemo(() => {
    return news.filter((item) => (item.status || 'Published') === 'Published');
  }, [news]);

  const categories = useMemo(() => {
    const set = new Set();
    publishedArticles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ['All', ...Array.from(set)];
  }, [publishedArticles]);

  const filteredNews = useMemo(() => {
    return publishedArticles.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.summary && item.summary.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.author && item.author.toLowerCase().includes(q));

      const matchesType =
        activeTab === 'All'
          ? true
          : (item.type || 'News').toLowerCase() === activeTab.toLowerCase();

      const matchesCat =
        selectedCategory === 'All' || item.category === selectedCategory;

      return matchesSearch && matchesType && matchesCat;
    });
  }, [publishedArticles, activeTab, search, selectedCategory]);

  const getFullImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.startsWith('/uploads/')) return `${SERVER_BASE}${img}`;
    return img;
  };

  const calculateReadingTime = (text = '') => {
    const clean = text.replace(/<[^>]*>/g, ' ').trim();
    const words = clean.split(/\s+/).length;
    return `${Math.max(1, Math.round(words / 200))} min read`;
  };

  const newsCount = publishedArticles.filter((a) => (a.type || 'News') === 'News').length;
  const blogCount = publishedArticles.filter((a) => a.type === 'Blog').length;

  return (
    <section style={{ padding: '40px 0 72px' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 className="section-headline" style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 4vw, 38px)' }}>
            News & Blogs
          </h2>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 28,
            padding: '12px 18px',
            background: 'var(--bg-surface)',
            borderRadius: 14,
            border: '1px solid var(--border-subtle)'
          }}
        >
          {/* Type Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('All')}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'All' ? 'var(--brand-green, #047857)' : 'transparent',
                color: activeTab === 'All' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 750,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: activeTab === 'All' ? '0 2px 8px rgba(4, 120, 87, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              All ({publishedArticles.length})
            </button>

            <button
              onClick={() => setActiveTab('News')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'News' ? 'var(--brand-green, #047857)' : 'transparent',
                color: activeTab === 'News' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 750,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: activeTab === 'News' ? '0 2px 8px rgba(4, 120, 87, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <NewspaperIcon size={14} /> Official News ({newsCount})
            </button>

            <button
              onClick={() => setActiveTab('Blog')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'Blog' ? '#8B5CF6' : 'transparent',
                color: activeTab === 'Blog' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 750,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: activeTab === 'Blog' ? '0 2px 8px rgba(139, 92, 246, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <BookOpenIcon size={14} /> Editorial Blogs ({blogCount})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 260, flex: '1 1 240px', maxWidth: 360 }}>
            <SearchIcon
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="Search news & blogs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 14px 8px 36px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-header)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Category Pills (if available) */}
        {categories.length > 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 14, marginBottom: 24 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Topics:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 9999,
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'var(--brand-green)' : 'var(--border-subtle)',
                  background: selectedCategory === cat ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                  color: selectedCategory === cat ? 'var(--brand-green)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: selectedCategory === cat ? 750 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {filteredNews.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)'
            }}
          >
            <NewspaperIcon size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 750, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No articles found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
              Try adjusting your search terms or filters above.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24
            }}
          >
            {filteredNews.map((item) => {
              const isBlog = item.type === 'Blog';
              const cover = getFullImageUrl(item.image_url);
              const readingTime = calculateReadingTime(item.content);
              const articleUrl = `/news/${item.slug || item.id}`;

              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(articleUrl)}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
                    border: '1px solid var(--border-subtle)',
                    borderTop: item.is_pinned ? '3px solid #F59E0B' : '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Cover Image (16:9) */}
                  <div
                    style={{
                      height: 190,
                      width: '100%',
                      background: 'var(--bg-card-header)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-tertiary)'
                        }}
                      >
                        {isBlog ? <BookOpenIcon size={36} /> : <NewspaperIcon size={36} />}
                      </div>
                    )}

                    {/* Top Overlay Badges */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        right: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span
                        className={isBlog ? 'badge badge-purple' : 'badge badge-green'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                      >
                        {isBlog ? 'BLOG' : 'NEWS'}
                      </span>

                      {item.is_pinned === 1 && (
                        <span
                          className="badge badge-gold"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6
                          }}
                        >
                          <PinIcon size={11} /> PINNED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Category & Date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span style={{ fontWeight: 700, color: isBlog ? '#A78BFA' : 'var(--brand-green)' }}>
                        {item.category || 'General'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CalendarIcon size={12} />
                        {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : ''}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: '0 0 10px',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Excerpt */}
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        margin: '0 0 16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1
                      }}
                    >
                      {item.summary || (item.content ? item.content.replace(/<[^>]*>/g, '') : '')}
                    </p>

                    {/* Footer Info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 12,
                        borderTop: '1px solid var(--border-subtle)',
                        marginTop: 'auto',
                        fontSize: 12
                      }}
                    >
                      <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        By {item.author || 'BCF Media'}
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--brand-green)',
                          fontWeight: 750
                        }}
                      >
                        Read Article <ChevronRightIcon size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
