import React from 'react';
import { ShieldIcon } from './Icons';

export default function Footer({ onOpenRegister, setActiveTab }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      padding: '48px 0 96px 0',
      marginTop: '60px',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.02)'
    }}>
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8" style={{ marginBottom: '40px' }}>
          {/* Col 1: Brand & Affiliation */}
          <div style={{ gridColumn: 'span 1' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '14px' }}>
              <img
                src="/01M3YBY0TBEXJA8T8H0SWPY123.png"
                alt="BCF Logo"
                style={{ width: '38px', height: '46px', objectFit: 'contain' }}
              />
              <div>
                <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px', display: 'block', lineHeight: 1.2 }}>
                  BANGLADESH CARROM FEDERATION
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Apex National Governing Body under the National Sports Council (NSC), Ministry of Youth & Sports.
              Affiliated with ICF & ACF.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Competitions
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li><a href="#tournaments" onClick={() => setActiveTab('tournaments')} style={{ color: 'inherit', textDecoration: 'none' }}>National Championships</a></li>
              <li><a href="#live" onClick={() => setActiveTab('live')} style={{ color: 'inherit', textDecoration: 'none' }}>Live Score Arena</a></li>
              <li><a href="#rankings" onClick={() => setActiveTab('rankings')} style={{ color: 'inherit', textDecoration: 'none' }}>Men's National Rankings</a></li>
              <li><a href="#rankings" onClick={() => setActiveTab('rankings')} style={{ color: 'inherit', textDecoration: 'none' }}>Women's National Rankings</a></li>
            </ul>
          </div>

          {/* Col 3: Development & Governance */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Federation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li><a href="#committee" onClick={() => setActiveTab('committee')} style={{ color: 'inherit', textDecoration: 'none' }}>Executive Committee</a></li>
              <li><a href="#clubs" onClick={() => setActiveTab('clubs')} style={{ color: 'inherit', textDecoration: 'none' }}>Affiliated District Clubs</a></li>
              <li><a href="#players" onClick={() => setActiveTab('players')} style={{ color: 'inherit', textDecoration: 'none' }}>Registered Players Roster</a></li>
              <li><a href="#news" onClick={() => setActiveTab('news')} style={{ color: 'inherit', textDecoration: 'none' }}>News & Editorial Blogs</a></li>
            </ul>
          </div>

          {/* Col 4: Secretariat & Contact */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              BCF Secretariat
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <p>National Sports Council (NSC) Gymnasium Complex, Purana Paltan, Dhaka-1000, Bangladesh</p>
              <p>Hotline: +880 2-9556677</p>
              <p>Email: contact@bcf.org.bd</p>
              <button
                onClick={onOpenRegister}
                className="btn btn-outline"
                style={{ marginTop: '8px', fontSize: '12px', padding: '6px 12px' }}
              >
                Online Registration Form
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-tertiary)'
        }}>
          <div>
            © {new Date().getFullYear()} Bangladesh Carrom Federation (BCF). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://hellozed.com"
              target="_blank"
              rel="noopener noreferrer"
              className="it-partner-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(16, 185, 129, 0.16)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981, #34D399)',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.75)',
                  flexShrink: 0
                }}
              />
              <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: '700' }}>
                IT Partner
              </span>
              <span style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />
              <span
                style={{
                  fontWeight: '800',
                  fontSize: '12.5px',
                  letterSpacing: '0.02em',
                  background: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                HelloZed
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.85 }}
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
