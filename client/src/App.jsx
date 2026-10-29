import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import TournamentGallery from './components/TournamentGallery';
import LiveMatches from './components/LiveMatches';
import Tournaments from './components/Tournaments';
import Rankings from './components/Rankings';
import PlayersDirectory from './components/PlayersDirectory';
import Clubs from './components/Clubs';
import NewsSection from './components/NewsSection';
import NewsDetail from './components/NewsDetail';
import Committee from './components/Committee';
import AboutSection from './components/AboutSection';
import RegistrationModal from './components/RegistrationModal';
import PlayerRegister from './components/PlayerRegister';
import PlayerProfile from './components/PlayerProfile';
import Footer from './components/Footer';
import ClickSpark from './components/ClickSpark';
import { API_BASE } from './config/api';

const PATH_TO_TAB = {
  '/': 'overview',
  '/overview': 'overview',
  '/live-matches': 'live',
  '/live': 'live',
  '/tournaments': 'tournaments',
  '/rankings': 'rankings',
  '/players': 'players',
  '/clubs': 'clubs',
  '/news': 'news',
  '/about': 'committee',
  '/player-register': 'register'
};

const TAB_TO_PATH = {
  overview: '/',
  live: '/live-matches',
  tournaments: '/tournaments',
  rankings: '/rankings',
  players: '/players',
  clubs: '/clubs',
  news: '/news',
  committee: '/about',
  register: '/player-register'
};

const parseCurrentRoute = () => {
  if (typeof window === 'undefined') return { tab: 'overview', slug: null, playerId: null };
  const rawPath = window.location.pathname.replace(/\/$/, '') || '/';
  const lowerPath = rawPath.toLowerCase();

  // Match /player/:playerId (e.g. /player/BCF2026100002 or /player/16)
  const playerMatch = rawPath.match(/^\/player\/([^/]+)/i);
  if (playerMatch) {
    return { tab: 'player-profile', slug: null, playerId: playerMatch[1] };
  }

  // Match /news/:slug or /news-and-blogs/:slug
  const newsMatch = rawPath.match(/^\/(?:news|news-and-blogs)\/([^/]+)/i);
  if (newsMatch) {
    return { tab: 'news-detail', slug: newsMatch[1], playerId: null };
  }

  if (PATH_TO_TAB[lowerPath]) {
    return { tab: PATH_TO_TAB[lowerPath], slug: null, playerId: null };
  }

  return { tab: 'overview', slug: null, playerId: null };
};

export default function App() {
  const [routeState, setRouteState] = useState(parseCurrentRoute);
  const activeTab = routeState.tab;
  const currentSlug = routeState.slug;

  // Theme Management (System default fallback + localStorage persistence)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('bcf_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('bcf_theme', theme);
  }, [theme]);

  // Sync with OS theme changes if user has not explicitly set a preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const stored = localStorage.getItem('bcf_theme');
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handleSystemChange);
    return () => mq.removeEventListener('change', handleSystemChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const navigateTo = (pathOrTab) => {
    let tab = 'overview';
    let path = '/';
    let slug = null;
    let playerId = null;

    if (typeof pathOrTab === 'string') {
      const playerMatch = pathOrTab.match(/^\/player\/([^/]+)/i);
      const newsMatch = pathOrTab.match(/^\/(?:news|news-and-blogs)\/([^/]+)/i);

      if (playerMatch) {
        tab = 'player-profile';
        playerId = playerMatch[1];
        path = pathOrTab;
      } else if (newsMatch) {
        tab = 'news-detail';
        slug = newsMatch[1];
        path = pathOrTab;
      } else if (PATH_TO_TAB[pathOrTab.toLowerCase()]) {
        tab = PATH_TO_TAB[pathOrTab.toLowerCase()];
        path = pathOrTab;
      } else if (TAB_TO_PATH[pathOrTab]) {
        tab = pathOrTab;
        path = TAB_TO_PATH[pathOrTab];
      } else {
        path = pathOrTab;
      }
    }

    setRouteState({ tab, slug, playerId });
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  const setActiveTab = navigateTo;

  // Scroll to top whenever activeTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, currentSlug]);

  useEffect(() => {
    const handlePopState = () => {
      setRouteState(parseCurrentRoute());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [news, setNews] = useState([]);
  const [committee, setCommittee] = useState([]);
  const [aboutData, setAboutData] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [defaultTourneyId, setDefaultTourneyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(null);

  // Fetch all initial data
  const loadData = async () => {
    try {
      const [statsRes, matchesRes, tourneysRes, playersRes, clubsRes, newsRes, commRes, aboutRes] = await Promise.allSettled([
        fetch(`${API_BASE}/stats`).then(r => r.json()),
        fetch(`${API_BASE}/matches`).then(r => r.json()),
        fetch(`${API_BASE}/tournaments`).then(r => r.json()),
        fetch(`${API_BASE}/players?status=Active`).then(r => r.json()),
        fetch(`${API_BASE}/clubs`).then(r => r.json()),
        fetch(`${API_BASE}/news`).then(r => r.json()),
        fetch(`${API_BASE}/committee`).then(r => r.json()),
        fetch(`${API_BASE}/about`).then(r => r.json())
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) setStats(statsRes.value.data);
      if (matchesRes.status === 'fulfilled' && matchesRes.value?.data) setMatches(matchesRes.value.data);
      if (tourneysRes.status === 'fulfilled' && tourneysRes.value?.data) setTournaments(tourneysRes.value.data);
      if (playersRes.status === 'fulfilled' && playersRes.value?.data) {
        setPlayers(playersRes.value.data.filter(p => (p.status || 'Active') === 'Active'));
      }
      if (clubsRes.status === 'fulfilled' && clubsRes.value?.data) setClubs(clubsRes.value.data);
      if (newsRes.status === 'fulfilled' && newsRes.value?.data) setNews(newsRes.value.data);
      if (commRes.status === 'fulfilled' && commRes.value?.data) setCommittee(commRes.value.data);
      if (aboutRes.status === 'fulfilled' && aboutRes.value?.data) setAboutData(aboutRes.value.data);

      setServerError(null);
    } catch (err) {
      console.error('Error fetching federation data:', err);
      setServerError('Unable to reach Bangladesh Carrom Federation (BCF) API backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    // Auto-poll live matches every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/matches`);
        const data = await res.json();
        if (data.success) {
          setMatches(data.data);
        }
      } catch (e) {
        // silent poll failure
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateMatch = async (matchId, payload) => {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // update local state
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...payload } : m));
      }
    } catch (err) {
      console.error('Error updating match score:', err);
    }
  };

  const handleOpenRegister = (tournamentId = null) => {
    if (tournamentId) {
      setDefaultTourneyId(tournamentId);
      setIsRegisterOpen(true);
    } else {
      navigateTo('/player-register');
    }
  };

  const liveMatchesCount = matches.filter(m => m.status === 'Live').length;

  if (activeTab === 'register') {
    return (
      <PlayerRegister
        navigateTo={navigateTo}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <ClickSpark sparkColor={theme === 'dark' ? '#34D399' : '#047857'} sparkCount={10} sparkRadius={32} duration={420}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Header
          activeTab={activeTab}
          navigateTo={navigateTo}
          setActiveTab={navigateTo}
          onOpenRegister={() => handleOpenRegister()}
          liveMatchCount={liveMatchesCount}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Backend Connection Alert if failed */}
        {serverError && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', borderBottom: '1px solid #FCA5A5', padding: '10px 20px', fontSize: '13px', textAlign: 'center' }}>
            <strong>Notice:</strong> {serverError}. Please ensure Node.js server is running with MySQL database <code>bcf</code>.
          </div>
        )}

        {/* Content Rendering based on Tab with WOW page transition */}
        <main className="app-main-content">
          <div key={activeTab} className="page-transition-wrapper">
            {activeTab === 'overview' && (
              <>
                <Hero 
                  stats={stats} 
                  onOpenRegister={() => handleOpenRegister()} 
                  setActiveTab={navigateTo} 
                />
                <AboutSection 
                  aboutData={aboutData}
                  setActiveTab={navigateTo} 
                  onOpenRegister={handleOpenRegister} 
                />
                <TournamentGallery 
                  onOpenRegister={handleOpenRegister} 
                  setActiveTab={navigateTo} 
                />
              </>
            )}

            {activeTab === 'live' && (
              <LiveMatches matches={matches} onUpdateMatch={handleUpdateMatch} />
            )}

            {activeTab === 'tournaments' && (
              <Tournaments tournaments={tournaments} onOpenRegister={handleOpenRegister} />
            )}

            {activeTab === 'rankings' && (
              <Rankings players={players} onNavigate={navigateTo} />
            )}

            {activeTab === 'players' && (
              <PlayersDirectory players={players} onOpenRegister={() => handleOpenRegister()} onNavigate={navigateTo} />
            )}

            {activeTab === 'player-profile' && (
              <PlayerProfile
                playerId={routeState.playerId}
                onNavigate={navigateTo}
                theme={theme}
              />
            )}

            {activeTab === 'clubs' && (
              <Clubs clubs={clubs} />
            )}

            {activeTab === 'news' && (
              <NewsSection news={news} onNavigate={navigateTo} />
            )}

            {activeTab === 'news-detail' && (
              <NewsDetail slug={currentSlug} onNavigate={navigateTo} />
            )}

            {activeTab === 'committee' && (
              <Committee committee={committee} aboutData={aboutData} onNavigate={navigateTo} />
            )}
          </div>
        </main>

        {/* Registration Modal */}
        <RegistrationModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          tournaments={tournaments}
          defaultTournamentId={defaultTourneyId}
          onSuccess={loadData}
        />

        {/* Footer */}
        <Footer onOpenRegister={() => handleOpenRegister()} setActiveTab={navigateTo} />
      </div>
    </ClickSpark>
  );
}
