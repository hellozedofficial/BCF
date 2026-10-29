import React, { useState, useMemo } from 'react';
import { SERVER_BASE } from '../config/api';
import {
  UsersIcon,
  MapPinIcon,
  ShieldIcon,
  SearchIcon,
  PhoneIcon,
  MailIcon,
  CheckIcon,
  XIcon
} from './Icons';

const DIVISIONS = [
  'All',
  'Dhaka',
  'Chattagram',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
];



export default function Clubs({ clubs = [] }) {
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Active clubs only for public presentation
  const activeClubs = useMemo(() => {
    return clubs.filter((c) => !c.status || c.status === 'Active');
  }, [clubs]);

  // Division counts
  const divisionCounts = useMemo(() => {
    const counts = { All: activeClubs.length };
    DIVISIONS.slice(1).forEach((div) => {
      counts[div] = activeClubs.filter(
        (c) =>
          c.division && c.division.toLowerCase() === div.toLowerCase()
      ).length;
    });
    return counts;
  }, [activeClubs]);

  // Filtered clubs
  const filteredClubs = useMemo(() => {
    return activeClubs.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.division && c.division.toLowerCase().includes(q)) ||
        (c.president && c.president.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      const matchesDivision =
        selectedDivision === 'All' ||
        (c.division &&
          c.division.toLowerCase() === selectedDivision.toLowerCase());

      return matchesSearch && matchesDivision;
    });
  }, [activeClubs, selectedDivision, searchQuery]);

  const getFullImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) return img;
    if (img.startsWith('/uploads/')) return `${SERVER_BASE}${img}`;
    return img;
  };

  return (
    <section style={{ padding: '36px 0 64px 0' }}>
      <div className="container">
        {/* Header Section */}
        <div style={{ marginBottom: '28px' }}>
          <h2 className="section-headline" style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}>
            Clubs & Academies
          </h2>
          <p className="section-subtitle" style={{ maxWidth: '640px' }}>
            Regional member associations driving grassroots carrom training and tournaments across Bangladesh.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <SearchIcon
              className="w-5 h-5"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search by club name, district, division, or president..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 40px 11px 42px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Division Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {DIVISIONS.map((div) => {
              const count = divisionCounts[div] || 0;
              const isSelected = selectedDivision === div;

              if (div !== 'All' && count === 0) return null;

              return (
                <button
                  key={div}
                  type="button"
                  onClick={() => setSelectedDivision(div)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 13px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 500,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                    border: isSelected
                      ? '1px solid var(--accent-green)'
                      : '1px solid var(--border-strong)',
                    background: isSelected
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'var(--bg-surface)',
                    color: isSelected
                      ? 'var(--accent-green)'
                      : 'var(--text-secondary)'
                  }}
                >
                  <span>{div === 'All' ? 'All Divisions' : div}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: isSelected
                        ? 'var(--accent-green)'
                        : 'var(--bg-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--text-tertiary)'
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clubs Grid */}
        {filteredClubs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '56px 20px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                color: 'var(--text-tertiary)'
              }}
            >
              <ShieldIcon className="w-6 h-6" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              No Clubs Found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 16px auto' }}>
              No clubs match your current search criteria or division selection.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedDivision('All');
              }}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '26px' }}>
            {filteredClubs.map((c) => {
              const fullLogoUrl = getFullImageUrl(c.logo_url);

              return (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px 22px',
                    borderRadius: '16px',
                    position: 'relative',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    {/* 1. EMBLEM & CLUB TITLE */}
                    <div className="flex items-start" style={{ gap: '18px', marginBottom: '18px' }}>
                      {fullLogoUrl ? (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: '#FFFFFF',
                            border: '1px solid var(--border-strong)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={fullLogoUrl}
                            alt={`${c.name} emblem`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement.style.background = 'rgba(16, 185, 129, 0.08)';
                              e.currentTarget.parentElement.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                              e.currentTarget.parentElement.innerHTML = `<svg class="w-5 h-5" style="color:var(--accent-green)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: 'var(--accent-green)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <ShieldIcon className="w-5 h-5" />
                        </div>
                      )}

                      {/* Name & Division Tag */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontSize: '16.5px',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            lineHeight: 1.3,
                            marginBottom: '6px'
                          }}
                        >
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                          {c.division && (
                            <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>
                              {c.division}
                            </span>
                          )}
                          {c.established_year && (
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                              Estd. {c.established_year}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. REGION & ADDRESS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                      <div className="flex items-center gap-2" style={{ fontSize: '13px' }}>
                        <MapPinIcon className="w-4 h-4" style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.district} District
                        </span>
                        {c.division && (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                            • {c.division}
                          </span>
                        )}
                      </div>

                      {c.address && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-tertiary)',
                            paddingLeft: '24px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={c.address}
                        >
                          {c.address}
                        </div>
                      )}
                    </div>

                    {/* 3. LEADERSHIP (President) */}
                    {c.president && (
                      <div
                        className="flex items-center gap-2"
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          marginBottom: '14px',
                          paddingLeft: '2px'
                        }}
                      >
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>President:</span>
                        <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>
                          {c.president}
                        </span>
                      </div>
                    )}

                    {/* 4. QUICK CONTACT CHIPS */}
                    {((c.president_phone || c.contact_phone) || (c.president_email || c.contact_email)) && (
                      <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', marginBottom: '0px' }}>
                        {(c.president_phone || c.contact_phone) && (
                          <a
                            href={`tel:${c.president_phone || c.contact_phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 500,
                              textDecoration: 'none',
                              color: 'var(--text-secondary)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--accent-green)';
                              e.currentTarget.style.borderColor = 'var(--accent-green)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-secondary)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                          >
                            <PhoneIcon className="w-3 h-3" style={{ color: 'var(--accent-green)' }} />
                            <span>{c.president_phone || c.contact_phone}</span>
                          </a>
                        )}

                        {(c.president_email || c.contact_email) && (
                          <a
                            href={`mailto:${c.president_email || c.contact_email}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 500,
                              textDecoration: 'none',
                              color: 'var(--text-secondary)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--accent-green)';
                              e.currentTarget.style.borderColor = 'var(--accent-green)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-secondary)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                            title={c.president_email || c.contact_email}
                          >
                            <MailIcon className="w-3 h-3" style={{ color: 'var(--accent-green)' }} />
                            <span>Email</span>
                          </a>
                        )}
                      </div>
                    )}
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
