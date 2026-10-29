'use client';

import React from 'react';
import { ShieldIcon, UsersIcon, TrophyIcon, MapPinIcon } from './Icons';
import BounceCards from './BounceCards';

export default function Committee({ committee = [], aboutData = null, onNavigate }) {
  const defaultBounceImages = [
    'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop'
  ];

  const galleryImages = (aboutData?.bounce_images && Array.isArray(aboutData.bounce_images) && aboutData.bounce_images.length > 0)
    ? aboutData.bounce_images
    : defaultBounceImages;

  const historyText = aboutData?.history_story || 'The Bangladesh Carrom Federation (BCF) was established with a singular mission: transform carrom from an informal neighborhood pastime into a disciplined, professional, and internationally competitive sport. Over three decades, BCF has produced South Asian champions, established standardized playing regulations conforming to ICF norms, and integrated technology with live digital boards and referee academies.';
  const missionText = aboutData?.mission || 'To nurture talent from grassroots schools and district clubs, provide institutional backing for national athletes, and maintain high standards of sportsmanship and ethical governance.';
  const visionText = aboutData?.vision || 'To establish Bangladesh as a dominant force in world carrom championships and make carrom an accessible, revered, and technologically modern national sport.';
  const officeAddress = aboutData?.office_address || 'National Sports Council (NSC) Tower, 62/3 Purana Paltan, Dhaka-1000';
  const officialColors = aboutData?.official_colors || '';

  // Sort committee members by display_order
  const sortedCommittee = [...committee].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  return (
    <div style={{ padding: '36px 0 80px' }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* 1. Page Hero Header */}
        <div style={{ marginBottom: 40, textAlign: 'center', maxWidth: 840, mx: 'auto', margin: '0 auto 40px' }}>

          <h1 style={{
            fontSize: 'clamp(32px, 4.5vw, 46px)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            marginBottom: 16
          }}>
            Bangladesh Carrom Federation
          </h1>

          <p style={{
            fontSize: '17px',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            maxWidth: 720,
            margin: '0 auto 24px'
          }}>
            Presiding over carrom athletics, championship circuits, district academies, and national squad selection under the National Sports Council, Ministry of Youth and Sports.
          </p>
        </div>

        {/* 2. Federation History & Narrative Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 36,
          alignItems: 'center',
          marginBottom: 64,
          padding: '36px',
          background: 'var(--bg-surface)',
          borderRadius: 20,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 850, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
              Federation Heritage & Founding
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {historyText}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20, fontSize: 13.5, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MapPinIcon size={16} style={{ color: 'var(--brand-green, #047857)', flexShrink: 0, marginTop: 3 }} />
                <span><strong>Head Office:</strong> {officeAddress}</span>
              </div>
            </div>
          </div>

          {/* Right Column: BounceCards Action Gallery */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
            <BounceCards
              className="about-bounce-gallery"
              images={galleryImages}
              containerWidth={420}
              containerHeight={340}
              animationDelay={0.4}
              enableHover={true}
              animationStagger={0.1}
            />
          </div>
        </div>

        {/* 3. Mission & Vision Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 64 }}>
          <div className="card" style={{ padding: 28, borderLeft: '4px solid var(--brand-green, #047857)', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--brand-green, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrophyIcon size={18} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Our Mission
              </h3>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
              {missionText}
            </p>
          </div>

          <div className="card" style={{ padding: 28, borderLeft: '4px solid #F59E0B', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldIcon size={18} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Our Vision
              </h3>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
              {visionText}
            </p>
          </div>
        </div>

        {/* 4. Executive Committee Members Grid */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <h2 className="section-headline" style={{ margin: '0 0 6px', fontSize: 'clamp(24px, 3.2vw, 32px)' }}>
                Executive Committee & Governance
              </h2>
              <p className="section-subtitle" style={{ margin: 0 }}>
                Apex leadership presiding over federation operations, referee academy, and tournament circuits.
              </p>
            </div>
            <span className="badge" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>
              {sortedCommittee.length} Members Enlisted
            </span>
          </div>

          {sortedCommittee.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
              <UsersIcon size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 18, fontWeight: 750, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                Committee directory updating
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                The official executive committee member list is currently being synchronized.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 22
            }}>
              {sortedCommittee.map((member) => (
                <div
                  key={member.id}
                  className="card"
                  style={{
                    padding: 24,
                    borderRadius: 16,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--card-shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    {/* Header: Photo / Avatar + Names */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      {member.image_url ? (
                        <img
                          src={member.image_url}
                          alt={member.name}
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--brand-green, #047857)',
                            boxShadow: '0 4px 12px rgba(4, 120, 87, 0.18)',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #047857, #10B981)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 22,
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)'
                          }}
                        >
                          {(member.name || 'B').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: '0 0 4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {member.name}
                        </h4>
                        <span
                          className="badge badge-green"
                          style={{
                            fontSize: 11,
                            fontWeight: 750,
                            display: 'inline-block',
                            padding: '3px 9px'
                          }}
                        >
                          {member.designation}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {member.organization || 'Bangladesh Carrom Federation'}
                    </div>
                  </div>

                  {/* Contact Info Footer */}
                  <div style={{
                    paddingTop: 14,
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    fontSize: 12.5
                  }}>
                    {member.contact_email && (
                      <a
                        href={`mailto:${member.contact_email}`}
                        style={{
                          color: 'var(--brand-green, #047857)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {member.contact_email}
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        style={{
                          color: 'var(--text-tertiary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 500
                        }}
                      >
                        📞 {member.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
