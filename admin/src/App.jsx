import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Outlet
} from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material'
import { RadioButtonChecked as CircleDotIcon } from '@mui/icons-material'

import { getAppTheme } from './theme'
import { MuiSidebar } from '@/components/Layout/MuiSidebar'
import { MuiHeader } from '@/components/Layout/MuiHeader'
import { DashboardView } from '@/views/DashboardView'
import { TournamentsView } from '@/views/TournamentsView'
import { MatchesView } from '@/views/MatchesView'
import { PlayersView } from '@/views/PlayersView'
import { RegistrationsView } from '@/views/RegistrationsView'
import { NewsView } from '@/views/NewsView'
import { BannersView } from '@/views/BannersView'
import { AboutCommitteeView } from '@/views/AboutCommitteeView'
import { ClubsView } from '@/views/ClubsView'
import { UsersView } from '@/views/UsersView'
import { SettingsView } from '@/views/SettingsView'
import { LoginView } from '@/views/LoginView'
import { PlayerDetailView } from '@/views/PlayerDetailView'
import { TournamentDetailView } from '@/views/TournamentDetailView'
import { ErrorBoundary } from '@/components/Common/ErrorBoundary'
import * as api from '@/services/api'

// Protected Route Guard
function RequireAuth({ isAuthenticated, isVerifyingAuth, children }) {
  const location = useLocation()

  if (isVerifyingAuth) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2.5,
          backgroundColor: 'background.default'
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            backgroundColor: 'primary.main',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}
        >
          <CircleDotIcon sx={{ fontSize: 28 }} />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
            BCF ADMIN CONSOLE
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <CircularProgress size={12} color="inherit" /> Verifying security credentials...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// Inner App Layout
function AdminMainLayout({
  counts,
  isDark,
  onToggleTheme,
  user,
  onLogout,
  isOnline,
  isRefreshing,
  onRefresh
}) {
  const location = useLocation()
  const mainRef = useRef(null)

  // Local storage persisted sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('bcf_admin_sidebar_collapsed')
      return saved !== null ? JSON.parse(saved) : false
    } catch (e) {
      return false
    }
  })

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('bcf_admin_sidebar_collapsed', JSON.stringify(next))
      } catch (e) {}
      return next
    })
  }

  // Refetch fresh real-time data from API and reset scroll when user navigates
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
    if (onRefresh) {
      onRefresh()
    }
  }, [location.pathname])

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* 1. Fixed Top Navbar spanning 100% width */}
      <MuiHeader
        onToggleSidebar={toggleCollapse}
        isCollapsed={isCollapsed}
      />

      {/* Route progress indicator on route switch */}
      <Box key={`glow-${location.pathname}`} className="bcf-route-glow-bar" />

      {/* 2. Body Container below the 64px fixed header */}
      <Box sx={{ display: 'flex', pt: '64px', minHeight: '100vh' }}>
        <MuiSidebar
          counts={counts}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          user={user}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />

        <Box
          ref={mainRef}
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            p: { xs: 2.5, sm: 3.5, md: 4.5 }
          }}
        >
          <Box
            key={location.pathname}
            className="bcf-page-transition"
            sx={{
              minHeight: '100%',
              width: '100%'
            }}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}


export function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('bcf_admin_theme')
    if (saved !== null) return saved === 'dark'
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [currentUser, setCurrentUser] = useState(() => api.getCurrentUser())
  const [isAuthenticated, setIsAuthenticated] = useState(() => api.isAuthenticated())
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true)

  // Data States
  const [stats, setStats] = useState({})
  const [tournaments, setTournaments] = useState([])
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [news, setNews] = useState([])
  const [banners, setBanners] = useState([])
  const [clubs, setClubs] = useState([])
  const [livePrimaryColor, setLivePrimaryColor] = useState(null)

  const [isOnline, setIsOnline] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, severity = 'success') => {
    setToast({ message, severity })
  }

  // Fetch live app config (including PRIMARY_COLOR from .env)
  const refreshConfig = useCallback(async () => {
    try {
      const cfg = await api.fetchAppConfig()
      if (cfg && cfg.primaryColor) {
        setLivePrimaryColor(cfg.primaryColor)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    refreshConfig()
    window.addEventListener('focus', refreshConfig)
    return () => window.removeEventListener('focus', refreshConfig)
  }, [refreshConfig])

  // Theme Builder with live primary color from .env
  const theme = useMemo(
    () => getAppTheme(isDark ? 'dark' : 'light', livePrimaryColor),
    [isDark, livePrimaryColor]
  )

  // Sync theme to localStorage and documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('bcf_admin_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('bcf_admin_theme', 'light')
    }
  }, [isDark])

  // Verify auth session on initial load
  useEffect(() => {
    let isMounted = true
    const checkAuth = async () => {
      try {
        const auth = await api.verifyAuth()
        if (isMounted) {
          if (auth.success && auth.user) {
            setCurrentUser(auth.user)
            setIsAuthenticated(true)
          } else {
            setCurrentUser(null)
            setIsAuthenticated(false)
          }
        }
      } catch (err) {
        if (isMounted) {
          const cached = api.getCurrentUser()
          setIsAuthenticated(Boolean(cached))
          setCurrentUser(cached)
        }
      } finally {
        if (isMounted) {
          setIsVerifyingAuth(false)
        }
      }
    }
    checkAuth()
    return () => {
      isMounted = false
    }
  }, [])

  // Data loader
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const online = await api.checkServerStatus()
      setIsOnline(online)

      const [statsRes, tourneysRes, matchesRes, playersRes, regsRes, newsRes, bannersRes, clubsRes] =
        await Promise.all([
          api.fetchStats(),
          api.fetchTournaments(),
          api.fetchMatches(),
          api.fetchPlayers(),
          api.fetchRegistrations(),
          api.fetchNews(),
          api.fetchBanners(),
          api.fetchClubs()
        ])

      setStats(statsRes.data || {})
      setTournaments(tourneysRes || [])
      setMatches(matchesRes || [])
      setPlayers(playersRes || [])
      setRegistrations(regsRes || [])
      setNews(newsRes || [])
      setBanners(bannersRes || [])
      setClubs(clubsRes || [])
    } catch (err) {
      console.error('Data sync error', err)
      showToast('Error syncing data with backend', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Sync data automatically when authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    loadAllData()
    const timer = setInterval(() => {
      api.checkServerStatus().then(setIsOnline)
    }, 15000)
    return () => clearInterval(timer)
  }, [isAuthenticated, loadAllData])

  // Logout handler
  const handleLogout = async () => {
    await api.logout()
    setCurrentUser(null)
    setIsAuthenticated(false)
    showToast('Logged out of admin console', 'info')
  }

  // Handlers for Tournament CRUD
  const handleCreateTournament = async (data) => {
    const res = await api.createTournament(data)
    if (res.success) {
      showToast('Tournament added successfully')
      loadAllData()
    }
  }

  const handleUpdateTournament = async (id, data) => {
    const res = await api.updateTournament(id, data)
    if (res.success) {
      showToast('Tournament updated')
      loadAllData()
    }
  }

  const handleDeleteTournament = async (id) => {
    const res = await api.deleteTournament(id)
    if (res.success) {
      showToast('Tournament removed')
      loadAllData()
    }
  }

  // Handlers for Player CRUD
  const handleCreatePlayer = async (data) => {
    const res = await api.createPlayer(data)
    if (res.success) {
      showToast('Player registered in national directory')
      loadAllData()
    }
  }

  const handleUpdatePlayer = async (id, data) => {
    const res = await api.updatePlayer(id, data)
    if (res.success) {
      showToast('Player profile updated')
      loadAllData()
    }
  }

  const handleDeletePlayer = async (id) => {
    const res = await api.deletePlayer(id)
    if (res.success) {
      showToast('Player removed')
      loadAllData()
    }
  }

  // Handlers for Match Scoring
  const handleUpdateMatchScore = async (id, scoreData) => {
    const res = await api.updateMatchScore(id, scoreData)
    if (res.success) {
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...scoreData } : m))
      )
      loadAllData()
    }
  }

  const handleCreateMatch = async (matchData) => {
    const res = await api.createMatch(matchData)
    if (res.success) {
      showToast('Match scheduled')
      loadAllData()
    }
  }

  const handleDeleteMatch = async (id) => {
    const res = await api.deleteMatch(id)
    if (res.success) {
      showToast('Match deleted')
      loadAllData()
    }
  }

  // Handlers for Registrations
  const handleUpdateRegistration = async (id, data) => {
    const res = await api.updateRegistration(id, data)
    if (res.success) {
      showToast('Player registration updated successfully')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to update registration', 'error')
    }
    return res
  }

  const handleUpdateRegistrationStatus = async (id, status, playerDetails = null) => {
    const res = await api.updateRegistrationStatus(id, status, playerDetails)
    if (res.success) {
      if (status === 'Approved') {
        showToast('Player approved & enrolled into National Players!')
      } else if (status === 'Rejected') {
        showToast('Application rejected & player set to Inactive')
      } else {
        showToast(`Application marked as ${status}`)
      }
      loadAllData()
    } else {
      showToast(res.message || 'Failed to update status', 'error')
    }
    return res
  }

  const handleDeleteRegistration = async (id) => {
    const res = await api.deleteRegistration(id)
    if (res.success) {
      showToast('Application deleted')
      loadAllData()
    }
  }

  const handleCreateNews = async (data) => {
    const res = await api.createNews(data)
    if (res.success) {
      showToast('Article published successfully')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to publish article', 'error')
    }
    return res
  }

  const handleUpdateNews = async (id, data) => {
    const res = await api.updateNews(id, data)
    if (res.success) {
      showToast('Article updated successfully')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to update article', 'error')
    }
    return res
  }

  const handleDeleteNews = async (id) => {
    const res = await api.deleteNews(id)
    if (res.success) {
      showToast('Article removed')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to delete article', 'error')
    }
    return res
  }

  // Handlers for Banners (CMS)
  const handleCreateBanner = async (data) => {
    const res = await api.createBanner(data)
    if (res.success) {
      showToast('Banner created and published')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to create banner', 'error')
    }
    return res
  }

  const handleUpdateBanner = async (id, data) => {
    const res = await api.updateBanner(id, data)
    if (res.success) {
      showToast('Banner updated successfully')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to update banner', 'error')
    }
    return res
  }

  const handleDeleteBanner = async (id) => {
    const res = await api.deleteBanner(id)
    if (res.success) {
      showToast('Banner removed')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to delete banner', 'error')
    }
    return res
  }

  // Handlers for Clubs CRUD
  const handleCreateClub = async (data) => {
    const res = await api.createClub(data)
    if (res.success) {
      showToast('Club registered successfully')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to register club', 'error')
    }
    return res
  }

  const handleUpdateClub = async (id, data) => {
    const res = await api.updateClub(id, data)
    if (res.success) {
      showToast('Club details updated')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to update club', 'error')
    }
    return res
  }

  const handleToggleClubStatus = async (id, status) => {
    const res = await api.toggleClubStatus(id, status)
    if (res.success) {
      showToast(`Club status changed to ${res.data?.status || status}`)
      loadAllData()
    } else {
      showToast(res.message || 'Failed to toggle status', 'error')
    }
    return res
  }

  const handleDeleteClub = async (id) => {
    const res = await api.deleteClub(id)
    if (res.success) {
      showToast('Club removed from federation directory')
      loadAllData()
    } else {
      showToast(res.message || 'Failed to delete club', 'error')
    }
    return res
  }

  const liveMatchesList = matches.filter((m) => m.status === 'Live')
  const pendingRegsList = registrations.filter((r) => r.status === 'Pending')

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Global Toast / Snackbar */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert
            severity={toast.severity || 'success'}
            onClose={() => setToast(null)}
            sx={{ width: '100%', borderRadius: 2.5, fontWeight: 600, boxShadow: 6 }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      <BrowserRouter basename={
        typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
          ? '/admin'
          : (import.meta.env.BASE_URL && import.meta.env.BASE_URL !== './' ? import.meta.env.BASE_URL : '/')
      }>
        <Routes>
          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginView
                  onLoginSuccess={(user) => {
                    setCurrentUser(user)
                    setIsAuthenticated(true)
                    showToast(`Welcome back, ${user.name || user.email}!`)
                  }}
                  isDark={isDark}
                  onToggleTheme={() => setIsDark((d) => !d)}
                />
              )
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/"
            element={
              <RequireAuth isAuthenticated={isAuthenticated} isVerifyingAuth={isVerifyingAuth}>
                <AdminMainLayout
                  counts={{
                    tournaments: tournaments.length,
                    liveMatches: liveMatchesList.length,
                    players: players.length,
                    clubs: clubs.length,
                    pendingRegistrations: pendingRegsList.length,
                    banners: banners.length,
                    news: news.length
                  }}
                  isDark={isDark}
                  onToggleTheme={() => setIsDark((d) => !d)}
                  user={currentUser}
                  onLogout={handleLogout}
                  isOnline={isOnline}
                  isRefreshing={isRefreshing}
                  onRefresh={loadAllData}
                />
              </RequireAuth>
            }
          >
            {/* Root redirects to /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Separate Individual Module Paths */}
            <Route
              path="dashboard"
              element={
                <DashboardView
                  stats={stats}
                  liveMatches={liveMatchesList}
                  pendingRegistrations={pendingRegsList}
                  tournaments={tournaments}
                  onApproveRegistration={(id) => handleUpdateRegistrationStatus(id, 'Approved')}
                  onRejectRegistration={(id) => handleUpdateRegistrationStatus(id, 'Rejected')}
                />
              }
            />

            <Route
              path="tournaments"
              element={
                <TournamentsView
                  tournaments={tournaments}
                  players={players}
                  onCreate={handleCreateTournament}
                  onUpdate={handleUpdateTournament}
                  onDelete={handleDeleteTournament}
                  onRefresh={loadAllData}
                />
              }
            />

            <Route
              path="tournaments/:id"
              element={<TournamentDetailView onRefresh={loadAllData} />}
            />

            <Route
              path="tournament/:id"
              element={<TournamentDetailView onRefresh={loadAllData} />}
            />

            <Route
              path="matches"
              element={
                <MatchesView
                  matches={matches}
                  tournaments={tournaments}
                  players={players}
                  onUpdateScore={handleUpdateMatchScore}
                  onCreateMatch={handleCreateMatch}
                  onDeleteMatch={handleDeleteMatch}
                />
              }
            />

            <Route
              path="players"
              element={
                <PlayersView
                  players={players}
                  clubs={clubs}
                  onCreate={handleCreatePlayer}
                  onUpdate={handleUpdatePlayer}
                  onDelete={handleDeletePlayer}
                />
              }
            />

            <Route
              path="players/:id"
              element={
                <PlayerDetailView
                  clubs={clubs}
                  onUpdatePlayer={handleUpdatePlayer}
                />
              }
            />

            <Route
              path="player/:id"
              element={
                <PlayerDetailView
                  clubs={clubs}
                  onUpdatePlayer={handleUpdatePlayer}
                />
              }
            />

            <Route
              path="registrations"
              element={
                <RegistrationsView
                  registrations={registrations}
                  clubs={clubs}
                  onUpdateStatus={handleUpdateRegistrationStatus}
                  onDelete={handleDeleteRegistration}
                  onRefresh={loadAllData}
                  onUpdate={handleUpdateRegistration}
                />
              }
            />

            <Route
              path="clubs"
              element={
                <ClubsView
                  clubs={clubs}
                  onCreate={handleCreateClub}
                  onUpdate={handleUpdateClub}
                  onDelete={handleDeleteClub}
                  onToggleStatus={handleToggleClubStatus}
                  onRefresh={loadAllData}
                />
              }
            />

            <Route
              path="news"
              element={
                <NewsView
                  news={news}
                  onCreate={handleCreateNews}
                  onUpdate={handleUpdateNews}
                  onDelete={handleDeleteNews}
                />
              }
            />

            <Route
              path="banners"
              element={
                <BannersView
                  banners={banners}
                  onCreate={handleCreateBanner}
                  onUpdate={handleUpdateBanner}
                  onDelete={handleDeleteBanner}
                  onRefresh={loadAllData}
                />
              }
            />

            <Route
              path="about-cms"
              element={<AboutCommitteeView />}
            />

            <Route
              path="committee"
              element={<AboutCommitteeView />}
            />

            <Route
              path="users"
              element={<UsersView />}
            />

            <Route
              path="settings"
              element={<SettingsView />}
            />
          </Route>

          {/* Fallback Catch-all -> Redirect to /dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
