import React from 'react';

export function OverviewSkeleton() {
  return (
    <div style={{ padding: '24px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        {/* Hero Skeleton */}
        <div style={{
          padding: '48px 32px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          marginBottom: '32px'
        }}>
          <div className="bcf-skeleton" style={{ width: '160px', height: '24px', borderRadius: '9999px', marginBottom: '20px' }} />
          <div className="bcf-skeleton" style={{ width: '75%', height: '48px', borderRadius: '12px', marginBottom: '14px' }} />
          <div className="bcf-skeleton" style={{ width: '50%', height: '20px', borderRadius: '8px', marginBottom: '28px' }} />
          <div style={{ display: 'flex', gap: '14px', marginBottom: '40px' }}>
            <div className="bcf-skeleton" style={{ width: '140px', height: '42px', borderRadius: '10px' }} />
            <div className="bcf-skeleton" style={{ width: '140px', height: '42px', borderRadius: '10px' }} />
          </div>

          {/* 4 Stats Metric Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ padding: '18px', borderRadius: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div className="bcf-skeleton" style={{ width: '50%', height: '14px', marginBottom: '10px' }} />
                <div className="bcf-skeleton" style={{ width: '70%', height: '28px' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Section Preview Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: '18px', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="bcf-skeleton" style={{ width: '100%', height: '180px', borderRadius: '12px', marginBottom: '16px' }} />
              <div className="bcf-skeleton" style={{ width: '60%', height: '22px', marginBottom: '10px' }} />
              <div className="bcf-skeleton" style={{ width: '90%', height: '14px', marginBottom: '6px' }} />
              <div className="bcf-skeleton" style={{ width: '40%', height: '14px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TournamentsSkeleton() {
  return (
    <section style={{ padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="bcf-skeleton" style={{ width: '260px', height: '32px', marginBottom: '10px' }} />
            <div className="bcf-skeleton" style={{ width: '380px', height: '16px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="bcf-skeleton" style={{ width: '100px', height: '36px', borderRadius: '9999px' }} />
            <div className="bcf-skeleton" style={{ width: '100px', height: '36px', borderRadius: '9999px' }} />
            <div className="bcf-skeleton" style={{ width: '100px', height: '36px', borderRadius: '9999px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: '20px', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="bcf-skeleton" style={{ width: '80px', height: '24px', borderRadius: '6px' }} />
                <div className="bcf-skeleton" style={{ width: '90px', height: '24px', borderRadius: '9999px' }} />
              </div>
              <div className="bcf-skeleton" style={{ width: '85%', height: '26px' }} />
              <div className="bcf-skeleton" style={{ width: '100%', height: '14px' }} />
              <div className="bcf-skeleton" style={{ width: '70%', height: '14px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div className="bcf-skeleton" style={{ height: '38px', borderRadius: '8px' }} />
                <div className="bcf-skeleton" style={{ height: '38px', borderRadius: '8px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RankingsSkeleton() {
  return (
    <section style={{ padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="bcf-skeleton" style={{ width: '280px', height: '32px', marginBottom: '10px' }} />
            <div className="bcf-skeleton" style={{ width: '400px', height: '16px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="bcf-skeleton" style={{ width: '90px', height: '36px', borderRadius: '8px' }} />
            <div className="bcf-skeleton" style={{ width: '90px', height: '36px', borderRadius: '8px' }} />
          </div>
        </div>

        {/* Podium Top 3 Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: '20px', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="bcf-skeleton" style={{ width: '48px', height: '24px', borderRadius: '9999px', marginBottom: '16px' }} />
              <div className="bcf-skeleton" style={{ width: '84px', height: '84px', borderRadius: '50%', marginBottom: '14px' }} />
              <div className="bcf-skeleton" style={{ width: '60%', height: '22px', marginBottom: '8px' }} />
              <div className="bcf-skeleton" style={{ width: '45%', height: '14px', marginBottom: '14px' }} />
              <div className="bcf-skeleton" style={{ width: '120px', height: '32px', borderRadius: '9999px' }} />
            </div>
          ))}
        </div>

        {/* Leaderboard Table Rows */}
        <div style={{ borderRadius: '18px', padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="bcf-skeleton" style={{ width: '100%', height: '32px', borderRadius: '8px', marginBottom: '8px' }} />
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bcf-skeleton" style={{ width: '100%', height: '48px', borderRadius: '10px' }} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function PlayersDirectorySkeleton() {
  return (
    <section style={{ padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="bcf-skeleton" style={{ width: '280px', height: '32px', marginBottom: '8px' }} />
            <div className="bcf-skeleton" style={{ width: '360px', height: '16px' }} />
          </div>
          <div className="bcf-skeleton" style={{ width: '160px', height: '40px', borderRadius: '10px' }} />
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div className="bcf-skeleton" style={{ flex: 1, minWidth: '240px', height: '46px', borderRadius: '12px' }} />
          <div className="bcf-skeleton" style={{ width: '180px', height: '46px', borderRadius: '12px' }} />
        </div>

        {/* 4-col Player Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} style={{ borderRadius: '18px', padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="bcf-skeleton" style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="bcf-skeleton" style={{ width: '75%', height: '18px', marginBottom: '6px' }} />
                  <div className="bcf-skeleton" style={{ width: '50%', height: '13px' }} />
                </div>
              </div>
              <div className="bcf-skeleton" style={{ width: '100%', height: '1px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="bcf-skeleton" style={{ width: '70px', height: '16px' }} />
                <div className="bcf-skeleton" style={{ width: '60px', height: '22px', borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClubsSkeleton() {
  return (
    <section style={{ padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div className="bcf-skeleton" style={{ width: '280px', height: '32px', marginBottom: '8px' }} />
          <div className="bcf-skeleton" style={{ width: '380px', height: '16px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ borderRadius: '18px', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="bcf-skeleton" style={{ width: '50px', height: '50px', borderRadius: '12px' }} />
                <div style={{ flex: 1 }}>
                  <div className="bcf-skeleton" style={{ width: '80%', height: '20px', marginBottom: '6px' }} />
                  <div className="bcf-skeleton" style={{ width: '45%', height: '13px' }} />
                </div>
              </div>
              <div className="bcf-skeleton" style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewsSkeleton() {
  return (
    <section style={{ padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div className="bcf-skeleton" style={{ width: '280px', height: '32px', marginBottom: '8px' }} />
          <div className="bcf-skeleton" style={{ width: '380px', height: '16px' }} />
        </div>

        {/* Featured News Hero Skeleton */}
        <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', marginBottom: '36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            <div className="bcf-skeleton" style={{ width: '100%', minHeight: '300px' }} />
            <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
              <div className="bcf-skeleton" style={{ width: '110px', height: '24px', borderRadius: '9999px' }} />
              <div className="bcf-skeleton" style={{ width: '90%', height: '34px' }} />
              <div className="bcf-skeleton" style={{ width: '100%', height: '14px' }} />
              <div className="bcf-skeleton" style={{ width: '75%', height: '14px' }} />
              <div className="bcf-skeleton" style={{ width: '140px', height: '38px', borderRadius: '10px', marginTop: '12px' }} />
            </div>
          </div>
        </div>

        {/* 3-col News Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div className="bcf-skeleton" style={{ width: '100%', height: '190px' }} />
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="bcf-skeleton" style={{ width: '80px', height: '20px', borderRadius: '9999px' }} />
                <div className="bcf-skeleton" style={{ width: '90%', height: '22px' }} />
                <div className="bcf-skeleton" style={{ width: '100%', height: '14px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CommitteeSkeleton() {
  return (
    <section style={{ padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="bcf-skeleton" style={{ width: '280px', height: '34px', margin: '0 auto 10px' }} />
          <div className="bcf-skeleton" style={{ width: '420px', height: '16px', margin: '0 auto' }} />
        </div>

        {[1, 2].map(row => (
          <div key={row} style={{ marginBottom: '40px' }}>
            <div className="bcf-skeleton" style={{ width: '160px', height: '24px', margin: '0 auto 20px', borderRadius: '6px' }} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
              {[1, 2, 3].map(c => (
                <div key={c} style={{ width: '268px', aspectRatio: '4 / 5', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#111317', position: 'relative' }}>
                  <div className="bcf-skeleton" style={{ width: '100%', height: '70%' }} />
                  <div style={{ padding: '16px', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <div className="bcf-skeleton" style={{ width: '50%', height: '14px', marginBottom: '8px' }} />
                    <div className="bcf-skeleton" style={{ width: '80%', height: '20px', marginBottom: '6px' }} />
                    <div className="bcf-skeleton" style={{ width: '60%', height: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PlayerProfileSkeleton() {
  return (
    <div style={{ paddingBottom: '70px', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '1080px', marginTop: '24px' }}>
        {/* Cover Skeleton */}
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div className="bcf-skeleton" style={{ width: '100%', height: '180px' }} />
          <div style={{ padding: '0 28px 28px', marginTop: '-54px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div className="bcf-skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--bg-surface)' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="bcf-skeleton" style={{ width: '120px', height: '38px', borderRadius: '24px' }} />
                <div className="bcf-skeleton" style={{ width: '100px', height: '38px', borderRadius: '24px' }} />
              </div>
            </div>
            <div className="bcf-skeleton" style={{ width: '320px', height: '32px', marginBottom: '10px' }} />
            <div className="bcf-skeleton" style={{ width: '220px', height: '18px', marginBottom: '16px' }} />
            <div className="bcf-skeleton" style={{ width: '80%', height: '14px', marginBottom: '24px' }} />

            {/* 4 Stat Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bcf-skeleton" style={{ height: '80px', borderRadius: '14px' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Tab & Details Grid Skeleton */}
        <div style={{ marginTop: '24px', borderRadius: '20px', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div className="bcf-skeleton" style={{ width: '140px', height: '38px', borderRadius: '10px' }} />
            <div className="bcf-skeleton" style={{ width: '140px', height: '38px', borderRadius: '10px' }} />
            <div className="bcf-skeleton" style={{ width: '140px', height: '38px', borderRadius: '10px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bcf-skeleton" style={{ height: '70px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
