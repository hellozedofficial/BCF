'use client';

import React, { useMemo, useState } from 'react';
import { ShieldIcon, UsersIcon, TrophyIcon, MapPinIcon, PhoneIcon, MailIcon } from './Icons';
import BounceCards from './BounceCards';
import { SERVER_BASE } from '../config/api';

function inferGroupName(designation = '') {
  const d = (designation || '').toLowerCase();
  if (d.includes('vice') && d.includes('president')) return 'Vice Presidents';
  if (d.includes('president')) return 'President';
  if (d.includes('general') && d.includes('secretary')) return 'General Secretary';
  if ((d.includes('joint') || d.includes('assistant')) && d.includes('secretary')) return 'Joint Secretaries';
  if (d.includes('treasurer')) return 'Treasurer';
  if (d.includes('advisor') || d.includes('patron')) return 'Advisors & Patrons';
  return 'Executive Members';
}

function getMemberPhotoUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${SERVER_BASE}${url}`;
  return url;
}

function CommitteeMemberCard({ member }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const photoSrc = getMemberPhotoUrl(member.image_url);
  const showPhoto = Boolean(photoSrc) && !imgFailed;
  const bioText = member.organization || 'Bangladesh Carrom Federation';

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 280,
        flex: '0 1 268px',
        aspectRatio: '4 / 5',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#111317',
        border: isHovered
          ? '1px solid rgba(255, 255, 255, 0.18)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isHovered
          ? '0 18px 36px -14px rgba(0, 0, 0, 0.45)'
          : '0 8px 24px -12px rgba(0, 0, 0, 0.3)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms ease, box-shadow 240ms ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        isolation: 'isolate'
      }}
    >
      {/* 1. Upper Portrait Zone (top 70% of the 4:5 card so headshots are never over-cropped or covered by text) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '70%',
          zIndex: 1,
          overflow: 'hidden',
          background: '#181c23'
        }}
      >
        {showPhoto ? (
          <img
            src={photoSrc}
            alt={member.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              transform: isHovered ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
              display: 'block'
            }}
          />
        ) : (
          /* Clean Portrait Silhouette Fallback (no rings, no crosshairs, no target look) */
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, #1d222b 0%, #151920 75%, #111317 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 12
            }}
          >
            <svg
              viewBox="0 0 160 160"
              aria-hidden="true"
              style={{
                width: '62%',
                height: 'auto',
                color: '#2c3340',
                display: 'block'
              }}
            >
              <circle cx="80" cy="54" r="28" fill="currentColor" />
              <path
                d="M28 148c0-28.7 23.3-50 52-50s52 21.3 52 50H28z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}

        {/* Smooth Bottom Fade at the lower edge of the photo into #111317 */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'linear-gradient(180deg, rgba(17, 19, 23, 0) 0%, rgba(17, 19, 23, 0) 54%, rgba(17, 19, 23, 0.62) 78%, #111317 100%)'
          }}
        />
      </div>

      {/* 2. Bottom Information Deck on Solid/Faded Dark Surface */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '14px 18px 18px',
          background: 'linear-gradient(180deg, rgba(17, 19, 23, 0) 0%, rgba(17, 19, 23, 0.92) 18%, #111317 36%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        {/* Designation Badge (Clean, no green dot, sits above name without blocking the face) */}
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 9px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0',
              fontSize: 11.5,
              fontWeight: 500,
              letterSpacing: '0.01em',
              lineHeight: 1.25
            }}
          >
            {member.designation}
          </span>
        </div>

        <h4
          title={member.name}
          style={{
            margin: 0,
            fontSize: 16.5,
            fontWeight: 600,
            color: '#f8fafc',
            letterSpacing: '-0.015em',
            lineHeight: 1.28
          }}
        >
          {member.name}
        </h4>

        <p
          title={bioText}
          style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 400,
            color: 'rgba(203, 213, 225, 0.72)',
            lineHeight: 1.42,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {bioText}
        </p>

        {(member.contact_email || member.phone) && (
          <div
            style={{
              marginTop: 4,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 10,
              fontSize: 11.5
            }}
          >
            {member.contact_email && (
              <a
                href={`mailto:${member.contact_email}`}
                style={{
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 400,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <MailIcon size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.contact_email}</span>
              </a>
            )}
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                style={{
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 400
                }}
              >
                <PhoneIcon size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span>{member.phone}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function Committee({ committee = [], aboutData = null }) {
  const defaultBounceImages = [
    'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop'
  ];

  const galleryImages =
    aboutData?.bounce_images && Array.isArray(aboutData.bounce_images) && aboutData.bounce_images.length > 0
      ? aboutData.bounce_images
      : defaultBounceImages;

  const historyText =
    aboutData?.history_story ||
    'The Bangladesh Carrom Federation (BCF) was established with a singular mission: transform carrom from an informal neighborhood pastime into a disciplined, professional, and internationally competitive sport. Over three decades, BCF has produced South Asian champions, established standardized playing regulations conforming to ICF norms, and integrated technology with live digital boards and referee academies.';
  const missionText =
    aboutData?.mission ||
    'To nurture talent from grassroots schools and district clubs, provide institutional backing for national athletes, and maintain high standards of sportsmanship and ethical governance.';
  const visionText =
    aboutData?.vision ||
    'To establish Bangladesh as a dominant force in world carrom championships and make carrom an accessible, revered, and technologically modern national sport.';
  const officeAddress =
    aboutData?.office_address || 'National Sports Council (NSC) Tower, 62/3 Purana Paltan, Dhaka-1000';

  // Sort committee members by group_order then display_order, and group into sections
  const sortedCommittee = useMemo(() => {
    return [...committee].sort((a, b) => {
      const goA = a.group_order ?? 99;
      const goB = b.group_order ?? 99;
      if (goA !== goB) return goA - goB;
      const doA = a.display_order ?? 0;
      const doB = b.display_order ?? 0;
      if (doA !== doB) return doA - doB;
      return (a.id || 0) - (b.id || 0);
    });
  }, [committee]);

  const groupedCommittee = useMemo(() => {
    const map = new Map();
    for (const member of sortedCommittee) {
      const gName = (member.group_name || '').trim() || inferGroupName(member.designation);
      if (!map.has(gName)) {
        map.set(gName, {
          name: gName,
          group_order: member.group_order ?? map.size + 1,
          members: []
        });
      }
      map.get(gName).members.push(member);
    }
    return Array.from(map.values()).sort((a, b) => a.group_order - b.group_order);
  }, [sortedCommittee]);

  return (
    <div style={{ padding: '44px 0 96px' }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 1. Page Header (No pill badge above title) */}
        <header
          style={{
            maxWidth: 760,
            margin: '0 auto 44px',
            textAlign: 'center'
          }}
        >
          <h1
            className="bcf-brand-title"
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.01em',
              lineHeight: 1.18,
              margin: '0 0 14px'
            }}
          >
            BANGLADESH CARROM FEDERATION
          </h1>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              maxWidth: 640,
              margin: '0 auto',
              fontWeight: 400
            }}
          >
            Presiding over national carrom athletics, championship circuits, district associations, and international squad selection under the National Sports Council (NSC).
          </p>
        </header>

        {/* 2. Federation Heritage & Institutional Overview */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 32,
            alignItems: 'center',
            marginBottom: 24,
            padding: '32px',
            background: 'var(--bg-surface)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'clamp(20px, 2.4vw, 24px)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 14px',
                letterSpacing: '-0.02em',
                lineHeight: 1.3
              }}
            >
              Federation Heritage &amp; Founding
            </h2>

            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                margin: '0 0 24px',
                fontWeight: 400
              }}
            >
              {historyText}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}
            >
              <MapPinIcon
                size={16}
                style={{ color: 'var(--brand-green, #10b981)', flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Head Office: </span>
                {officeAddress}
              </div>
            </div>
          </div>

          {/* Right Column: Action Gallery */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 340,
              overflow: 'hidden'
            }}
          >
            <BounceCards
              className="about-bounce-gallery"
              images={galleryImages}
              containerWidth={420}
              containerHeight={320}
              animationDelay={0.3}
              enableHover={true}
              animationStagger={0.08}
            />
          </div>
        </section>

        {/* 3. Mission & Vision Grid */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            marginBottom: 64
          }}
        >
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: 'var(--brand-green, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <TrophyIcon size={17} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Our Mission
              </h3>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>
              {missionText}
            </p>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: 'var(--brand-green, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <ShieldIcon size={17} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Our Vision
              </h3>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>
              {visionText}
            </p>
          </div>
        </section>

        {/* 4. Executive Committee Directory */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 40,
              paddingBottom: 20,
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                Executive Committee &amp; Governance
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}
              >
                Official Ad-hoc Executive Committee appointed under the National Sports Council.
              </p>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)'
              }}
            >
              <UsersIcon size={15} style={{ color: 'var(--text-tertiary)' }} />
              {sortedCommittee.length} Members
            </span>
          </div>

          {sortedCommittee.length === 0 ? (
            <div
              style={{
                padding: '64px 24px',
                textAlign: 'center',
                background: 'var(--bg-surface)',
                borderRadius: 16,
                border: '1px solid var(--border-subtle)'
              }}
            >
              <UsersIcon size={36} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                Committee directory updating
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                The official executive committee member roster is currently being synchronized.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
              {groupedCommittee.map((group) => {
                const isCompactGroup = group.members.length <= 2;
                return (
                  <div key={group.name}>
                    {/* Group Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCompactGroup ? 'center' : 'space-between',
                        gap: 12,
                        marginBottom: 24
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.015em'
                          }}
                        >
                          {group.name}
                        </h3>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {group.members.length}
                        </span>
                      </div>

                      {!isCompactGroup && (
                        <div
                          aria-hidden="true"
                          style={{
                            flex: 1,
                            height: 1,
                            background: 'var(--border-subtle)',
                            marginLeft: 12
                          }}
                        />
                      )}
                    </div>

                    {/* Group Cards Row — Flex-centered so 1 or 2 cards in any row sit centered */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 24
                      }}
                    >
                      {group.members.map((member) => (
                        <CommitteeMemberCard key={member.id} member={member} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
