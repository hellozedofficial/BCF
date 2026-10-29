'use client';

import React from 'react';
import BounceCards from './BounceCards';
import { ShieldIcon, ChevronRightIcon } from './Icons';

export default function AboutSection({ aboutData, setActiveTab, onOpenRegister }) {
  // Default authentic carrom action images for BounceCards fallback
  const defaultImages = [
    'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
  ];

  const bounceImages = (aboutData?.bounce_images && Array.isArray(aboutData.bounce_images) && aboutData.bounce_images.length > 0)
    ? aboutData.bounce_images
    : defaultImages;

  const badgeText = aboutData?.badge || 'Official National Authority';
  const headline = aboutData?.headline || 'Governing Carrom Excellence Across Bangladesh';
  const storyP1 = aboutData?.story_p1 || 'Founded in 1990 and officially recognized by the National Sports Council (NSC), the Bangladesh Carrom Federation (BCF) stands as the country’s apex governing authority, affiliated with the International Carrom Federation (ICF) and the Asian Carrom Federation (ACF).';
  const storyP2 = aboutData?.story_p2 || 'From grooming grassroots striker prodigies across 64 districts to organizing the marquee National Championship and Premier League, BCF empowers titleholders, certifies tournament referees, and proudly waves the Bangladesh flag on the world stage.';

  return (
    <section style={{
      padding: '48px 0 56px 0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle decorative background gradient */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ maxWidth: '1280px', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          {/* Left Column: Narrative & Links */}
          <div style={{ maxWidth: '580px' }}>
            {badgeText && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 9999,
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--brand-green, #047857)',
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 16
              }}>
                <ShieldIcon size={14} /> {badgeText}
              </div>
            )}

            {/* Heading */}
            <h2 style={{
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: '900',
              color: 'var(--text-primary)',
              lineHeight: '1.2',
              letterSpacing: '-0.025em',
              marginBottom: '18px'
            }}>
              {headline}
            </h2>

            {/* Description Paragraphs */}
            <p style={{
              fontSize: '15.5px',
              lineHeight: '1.7',
              color: 'var(--text-secondary)',
              marginBottom: '14px'
            }}>
              {storyP1}
            </p>

            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: 'var(--text-tertiary)',
              marginBottom: '26px'
            }}>
              {storyP2}
            </p>

            {/* Call to Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab && setActiveTab('/about')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--brand-green, #047857)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 750,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(4, 120, 87, 0.28)',
                  transition: 'all 0.18s ease'
                }}
              >
                Learn More & Committee <ChevronRightIcon size={15} />
              </button>

              <button
                onClick={() => onOpenRegister && onOpenRegister()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                Join as Player
              </button>
            </div>
          </div>

          {/* Right Column: ReactBits BounceCards + Corner CircularText */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            minHeight: '420px'
          }}>
            {/* BounceCards Component from ReactBits */}
            <BounceCards
              className="about-bounce-gallery"
              images={bounceImages}
              containerWidth={460}
              containerHeight={400}
              animationDelay={0.6}
              enableHover={true}
              animationStagger={0.1}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
