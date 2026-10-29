import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  EmojiEvents as TrophyIcon,
  CalendarMonth as CalendarIcon,
  Place as PlaceIcon,
  SportsEsports as BoardIcon,
  Group as ParticipantsIcon,
  AccountTree as BracketIcon,
  TableChart as TableChartIcon,
  FormatListNumbered as ListIcon,
  Leaderboard as StandingsIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  PlayArrow as PlayIcon,
  InfoOutlined as InfoIcon,
  OpenInNew as ExternalIcon
} from '@mui/icons-material'
import * as api from '../services/api'
import { PageHeader } from '../components/Common/PageHeader'
import { PlayerHoverCard } from '../components/Common/PlayerHoverCard'

export function TournamentDetailView({ onRefresh }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [loading, setLoading] = useState(true)
  const [tournamentData, setTournamentData] = useState(null)
  const [activeTab, setActiveTab] = useState('fixtures') // 'fixtures', 'matrix', 'standings', 'participants', 'bracket'
  const [roundFilter, setRoundFilter] = useState('All')
  const [copiedCode, setCopiedCode] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Interactive Hover in Matrix Table
  const [hoveredCell, setHoveredCell] = useState(null) // { roundLevel, teamSeed, opponentSeed }

  // Score Modal State
  const [scoreModalOpen, setScoreModalOpen] = useState(false)
  const [activeMatch, setActiveMatch] = useState(null)
  const [scoreForm, setScoreForm] = useState({
    player1_score: 0,
    player2_score: 0,
    boards_played: 0,
    current_board: 1,
    status: 'Live',
    winner_id: null
  })

  // Re-generate Draw Modal State
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [regenerateSeeding, setRegenerateSeeding] = useState('Seeded')

  const loadData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await api.fetchTournamentBracket(id)
      if (data) {
        setTournamentData(data)
        // If format is RoundRobin, default to fixtures or matrix
        const fmt = (data.tournament?.format || '').toLowerCase()
        if (fmt === 'roundrobin') {
          setActiveTab('fixtures')
        } else {
          setActiveTab('bracket')
        }
      } else {
        setErrorMsg('Tournament data not found.')
      }
    } catch (err) {
      console.error('Failed to load tournament detail:', err)
      setErrorMsg('Failed to load tournament details from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const tournament = tournamentData?.tournament
  const participants = tournamentData?.participants || []
  const matches = tournamentData?.matches || []
  const isRoundRobin = (tournament?.format || '').toLowerCase() === 'roundrobin'

  // Map seed number -> participant
  const seedMap = useMemo(() => {
    const map = new Map()
    participants.forEach(p => {
      map.set(p.seed_number, p)
    })
    return map
  }, [participants])

  // Map player_id -> participant
  const playerMap = useMemo(() => {
    const map = new Map()
    participants.forEach(p => {
      map.set(p.player_id, p)
    })
    return map
  }, [participants])

  const handleCopyCode = (code, e) => {
    e?.stopPropagation()
    if (!code) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // Group matches by round level
  const roundsList = useMemo(() => {
    const grouped = {}
    matches.forEach(m => {
      const level = m.round_level || 1
      if (!grouped[level]) {
        grouped[level] = {
          level,
          name: m.round_name ? m.round_name.split(' - ')[0] : `Round ${level}`,
          matches: []
        }
      }
      grouped[level].matches.push(m)
    })
    return Object.values(grouped).sort((a, b) => a.level - b.level)
  }, [matches])

  // Build the Round-Robin Matrix Table (Matching Tabel 2 in screenshot!)
  const matrixTable = useMemo(() => {
    if (!isRoundRobin && roundsList.length === 0) return []

    const totalTeams = Math.max(participants.length, 8)
    const teamsList = []
    for (let i = 1; i <= totalTeams; i++) {
      teamsList.push(i)
    }

    const rows = []
    roundsList.forEach(round => {
      const row = {
        roundLevel: round.level,
        roundName: round.name,
        opponents: {}, // teamSeed -> opponentSeed
        matchesByTeam: {} // teamSeed -> matchObj
      }

      round.matches.forEach(m => {
        // Find seeds for player 1 and player 2
        let s1 = m.player1_seed
        let s2 = m.player2_seed

        if (!s1 && m.player1_id) {
          const p = playerMap.get(m.player1_id)
          if (p) s1 = p.seed_number
        }
        if (!s2 && m.player2_id) {
          const p = playerMap.get(m.player2_id)
          if (p) s2 = p.seed_number
        }

        if (!s1 && m.player1_name) {
          const matchSeed = m.player1_name.match(/\[#(\d+)\]/)
          if (matchSeed) s1 = parseInt(matchSeed[1], 10)
        }
        if (!s2 && m.player2_name) {
          const matchSeed = m.player2_name.match(/\[#(\d+)\]/)
          if (matchSeed) s2 = parseInt(matchSeed[1], 10)
        }

        if (s1 && s2) {
          row.opponents[s1] = s2
          row.opponents[s2] = s1
          row.matchesByTeam[s1] = m
          row.matchesByTeam[s2] = m
        }
      })

      rows.push(row)
    })

    return { teamsList, rows }
  }, [isRoundRobin, roundsList, participants, playerMap])

  // Calculate Standings Points Table for Round-Robin
  const standings = useMemo(() => {
    const stats = new Map()

    participants.forEach(p => {
      stats.set(p.player_id, {
        player: p,
        played: 0,
        won: 0,
        lost: 0,
        points: 0, // 2 for win, 0 for loss
        scoreFor: 0,
        scoreAgainst: 0,
        netPoints: 0,
        whiteSlams: p.white_slams || 0,
        blackSlams: p.black_slams || 0,
        form: []
      })
    })

    matches.forEach(m => {
      if (m.status === 'Completed' || (m.player1_score > 0 || m.player2_score > 0)) {
        const p1 = stats.get(m.player1_id)
        const p2 = stats.get(m.player2_id)

        if (p1 && p2) {
          p1.played++
          p2.played++
          p1.scoreFor += (m.player1_score || 0)
          p1.scoreAgainst += (m.player2_score || 0)
          p2.scoreFor += (m.player2_score || 0)
          p2.scoreAgainst += (m.player1_score || 0)

          if (m.winner_id === m.player1_id) {
            p1.won++
            p1.points += 2
            p1.form.push('W')
            p2.lost++
            p2.form.push('L')
          } else if (m.winner_id === m.player2_id) {
            p2.won++
            p2.points += 2
            p2.form.push('W')
            p1.lost++
            p1.form.push('L')
          }
        }
      }
    })

    const list = Array.from(stats.values()).map(s => ({
      ...s,
      netPoints: s.scoreFor - s.scoreAgainst
    }))

    // Sort by: Points desc, Net Points desc, Score For desc
    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.netPoints !== a.netPoints) return b.netPoints - a.netPoints
      return b.scoreFor - a.scoreFor
    })

    return list
  }, [participants, matches])

  // Handle Match Score Edit
  const handleOpenScore = (match) => {
    setActiveMatch(match)
    setScoreForm({
      player1_score: match.player1_score || 0,
      player2_score: match.player2_score || 0,
      boards_played: match.boards_played || 0,
      current_board: match.current_board || 1,
      status: match.status || 'Live',
      winner_id: match.winner_id || null
    })
    setScoreModalOpen(true)
  }

  const handleSaveScore = async () => {
    if (!activeMatch) return
    try {
      const payload = {
        ...scoreForm,
        boards_played: parseInt(scoreForm.boards_played, 10) || 0,
        current_board: parseInt(scoreForm.current_board, 10) || 1,
        player1_score: parseInt(scoreForm.player1_score, 10) || 0,
        player2_score: parseInt(scoreForm.player2_score, 10) || 0
      }

      // Auto assign winner if completed and not selected
      if (payload.status === 'Completed' && !payload.winner_id) {
        if (payload.player1_score > payload.player2_score) {
          payload.winner_id = activeMatch.player1_id
        } else if (payload.player2_score > payload.player1_score) {
          payload.winner_id = activeMatch.player2_id
        }
      }

      await api.updateTournamentMatchScore(activeMatch.id, payload)
      setScoreModalOpen(false)
      loadData()
      if (onRefresh) onRefresh()
    } catch (err) {
      alert('Failed to update match score: ' + err.message)
    }
  }

  // Handle Re-generate Draw
  const handleRegenerateDraw = async () => {
    try {
      const res = await api.generateTournamentFixtures(tournament.id, {
        seeding_type: regenerateSeeding
      })
      if (res.success) {
        setRegenerateOpen(false)
        loadData()
        if (onRefresh) onRefresh()
      } else {
        alert(res.message || 'Failed to re-generate fixtures')
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={44} color="primary" />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Loading Tournament Championship Console...
        </Typography>
      </Box>
    )
  }

  if (errorMsg || !tournament) {
    return (
      <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Alert severity="error" sx={{ maxWidth: 480, width: '100%', borderRadius: 2 }}>
          {errorMsg || 'Tournament not found.'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tournaments')}
          sx={{ borderRadius: 2 }}
        >
          Return to Tournaments
        </Button>
      </Box>
    )
  }

  const code = tournament.tournament_code || `T-${String(tournament.id).padStart(6, '0')}`
  const totalMatchesCount = matches.length
  const completedMatchesCount = matches.filter(m => m.status === 'Completed').length
  const liveMatchesCount = matches.filter(m => m.status === 'Live').length

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. Header Integration via PageHeader portal */}
      <PageHeader
        title={`${tournament.title} (${code})`}
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/tournaments')}
              sx={{ fontWeight: 650, borderRadius: 2, textTransform: 'none' }}
            >
              Tournaments
            </Button>
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
              onClick={() => setRegenerateOpen(true)}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
            >
              Re-generate Draw
            </Button>
          </Box>
        }
      />

      {/* 2. Top Championship Hero Card */}
      <Card
        sx={{
          borderRadius: 3.5,
          p: { xs: 2.5, sm: 3 },
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
          boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2.5 }}>
          <Box sx={{ flex: 1 }}>
            {/* Top Badge Strip */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              <Tooltip title={copiedCode ? 'Copied to clipboard!' : 'Click to copy tournament code'}>
                <Chip
                  label={code}
                  size="small"
                  onClick={(e) => handleCopyCode(code, e)}
                  icon={copiedCode ? <CheckIcon sx={{ fontSize: 13 }} /> : <CopyIcon sx={{ fontSize: 13 }} />}
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    height: 26,
                    cursor: 'pointer',
                    backgroundColor: isDark ? '#27272A' : '#FEF3C7',
                    color: isDark ? '#F59E0B' : '#B45309',
                    border: '1.5px solid #F59E0B'
                  }}
                />
              </Tooltip>

              <Chip
                label={tournament.status || 'Upcoming'}
                size="small"
                color={tournament.status === 'Live' ? 'error' : tournament.status === 'Ongoing' ? 'primary' : 'default'}
                sx={{ height: 26, fontWeight: 750, fontSize: '0.74rem' }}
              />

              <Chip
                label={isRoundRobin ? 'Single Round-Robin (All-play-all)' : 'Single Elimination (Knockout)'}
                size="small"
                sx={{
                  height: 26,
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #60A5FA'
                }}
              />

              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                Edition {tournament.edition || '2026'}
              </Typography>
            </Box>

            {/* Championship Title */}
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 1.2 }}>
              {tournament.title}
            </Typography>

            {/* Meta details */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2.5, color: 'text.secondary', fontSize: '0.84rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <PlaceIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                <span>{tournament.venue}</span>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CalendarIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                <span>
                  {tournament.start_date ? tournament.start_date.split('T')[0] : 'TBD'} → {tournament.end_date ? tournament.end_date.split('T')[0] : 'TBD'}
                </span>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <BoardIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                <span>ICF {tournament.board_limit || 8} Boards Cap • {tournament.points_limit || 25} Pts</span>
              </Box>
            </Box>
          </Box>

          {/* Quick Metrics KPI Column */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1.5,
              p: 1.5,
              borderRadius: 3,
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              border: `1px solid ${isDark ? '#3F3F46' : '#E2E8F0'}`,
              minWidth: { md: 360 },
              textAlign: 'center'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
                Athletes
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {participants.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
                Rounds
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {roundsList.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
                Matches
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {totalMatchesCount}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
                Completed
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669' }}>
                {completedMatchesCount}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* 3. Navigation Sub-Tabs */}
      <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.86rem',
              py: 1.2,
              minHeight: 46
            }
          }}
        >
          {isRoundRobin ? (
            [
              <Tab
                key="fixtures"
                value="fixtures"
                icon={<ListIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Tabel 1: Round-by-Round Fixtures (${totalMatchesCount})`}
              />,
              <Tab
                key="matrix"
                value="matrix"
                icon={<TableChartIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Tabel 2: Round-Robin Matrix (Jadwal Turnamen)"
              />,
              <Tab
                key="standings"
                value="standings"
                icon={<StandingsIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Points Table (${standings.length})`}
              />,
              <Tab
                key="participants"
                value="participants"
                icon={<ParticipantsIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Participants (${participants.length})`}
              />
            ]
          ) : (
            [
              <Tab
                key="bracket"
                value="bracket"
                icon={<BracketIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Knockout Bracket Tree"
              />,
              <Tab
                key="fixtures"
                value="fixtures"
                icon={<ListIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Fixtures & Draws (${totalMatchesCount})`}
              />,
              <Tab
                key="participants"
                value="participants"
                icon={<ParticipantsIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Participants (${participants.length})`}
              />
            ]
          )}
        </Tabs>
      </Box>

      {/* ======================================================== */}
      {/* TAB A: TABEL 1 - ROUND-BY-ROUND FIXTURES LIST             */}
      {/* ======================================================== */}
      {activeTab === 'fixtures' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Round Filter Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`All Rounds (${totalMatchesCount})`}
                onClick={() => setRoundFilter('All')}
                color={roundFilter === 'All' ? 'primary' : 'default'}
                variant={roundFilter === 'All' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
              {roundsList.map((r) => (
                <Chip
                  key={r.level}
                  label={r.name}
                  onClick={() => setRoundFilter(r.level)}
                  color={roundFilter === r.level ? 'primary' : 'default'}
                  variant={roundFilter === r.level ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700, cursor: 'pointer' }}
                />
              ))}
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
              Hover player name for athlete statistics card
            </Typography>
          </Box>

          {/* Rounds List */}
          {roundsList
            .filter((r) => roundFilter === 'All' || roundFilter === r.level)
            .map((round) => (
              <Card
                key={round.level}
                sx={{
                  borderRadius: 3.5,
                  p: 2.5,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  backgroundColor: isDark ? '#1C1C20' : '#FFFFFF'
                }}
              >
                {/* Round Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main'
                      }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {round.name}
                    </Typography>
                    <Chip
                      label={`${round.matches.length} Matches`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Concurrent Carrom Boards 1 to {tournament.board_limit || 8}
                  </Typography>
                </Box>

                {/* Match Cards Grid */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
                    gap: 2
                  }}
                >
                  {round.matches.map((match) => {
                    const p1 = playerMap.get(match.player1_id)
                    const p2 = playerMap.get(match.player2_id)
                    const isCompleted = match.status === 'Completed'
                    const isLive = match.status === 'Live'

                    return (
                      <Card
                        key={match.id}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          border: `1px solid ${
                            isLive
                              ? theme.palette.error.main
                              : isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.06)'
                          }`,
                          backgroundColor: isDark ? '#232328' : '#F8FAFC',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                          transition: 'transform 0.15s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.06)'
                          }
                        }}
                      >
                        {/* Match Header: Board and Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Chip
                            label={`Board ${match.board_number || 1}`}
                            size="small"
                            sx={{
                              height: 22,
                              fontWeight: 750,
                              fontSize: '0.7rem',
                              backgroundColor: isDark ? '#333338' : '#E2E8F0'
                            }}
                          />

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={match.status || 'Scheduled'}
                              size="small"
                              color={isLive ? 'error' : isCompleted ? 'success' : 'default'}
                              variant={isLive ? 'filled' : 'outlined'}
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 750,
                                ...(isLive && { animation: 'pulse 1.5s infinite' })
                              }}
                            />

                            <IconButton
                              size="small"
                              onClick={() => handleOpenScore(match)}
                              sx={{ p: 0.4, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                            >
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Player 1 Row */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                            borderRadius: 2,
                            backgroundColor:
                              match.winner_id && match.winner_id === match.player1_id
                                ? isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5'
                                : 'transparent'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flex: 1 }}>
                            <Avatar
                              src={p1?.photo_url}
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: '0.82rem',
                                fontWeight: 750,
                                bgcolor: 'primary.main'
                              }}
                            >
                              {match.player1_name?.charAt(0) || 'P'}
                            </Avatar>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Tooltip
                                arrow
                                placement="top"
                                title={
                                  p1 ? (
                                    <PlayerHoverCard
                                      player={p1}
                                      onNavigate={(pid) => navigate(`/players/${pid}`)}
                                    />
                                  ) : ''
                                }
                                slotProps={{
                                  tooltip: {
                                    sx: { p: 0, bgcolor: 'transparent', boxShadow: 'none' }
                                  }
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  noWrap
                                  sx={{
                                    fontWeight: match.winner_id === match.player1_id ? 800 : 700,
                                    fontSize: '0.88rem',
                                    color: 'text.primary',
                                    cursor: p1 ? 'pointer' : 'default',
                                    '&:hover': p1 ? { textDecoration: 'underline', color: 'primary.main' } : {}
                                  }}
                                >
                                  {match.player1_name || 'TBD'}
                                </Typography>
                              </Tooltip>

                              {p1 && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
                                  {p1.bcf_player_id || `BCF${p1.id}`} • {p1.club_name || 'BCF'}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          <Typography variant="h6" sx={{ fontWeight: 800, minWidth: 32, textAlign: 'right' }}>
                            {match.player1_score || 0}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 0.2 }} />

                        {/* Player 2 Row */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                            borderRadius: 2,
                            backgroundColor:
                              match.winner_id && match.winner_id === match.player2_id
                                ? isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5'
                                : 'transparent'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flex: 1 }}>
                            <Avatar
                              src={p2?.photo_url}
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: '0.82rem',
                                fontWeight: 750,
                                bgcolor: 'secondary.main'
                              }}
                            >
                              {match.player2_name?.charAt(0) || 'P'}
                            </Avatar>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Tooltip
                                arrow
                                placement="top"
                                title={
                                  p2 ? (
                                    <PlayerHoverCard
                                      player={p2}
                                      onNavigate={(pid) => navigate(`/players/${pid}`)}
                                    />
                                  ) : ''
                                }
                                slotProps={{
                                  tooltip: {
                                    sx: { p: 0, bgcolor: 'transparent', boxShadow: 'none' }
                                  }
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  noWrap
                                  sx={{
                                    fontWeight: match.winner_id === match.player2_id ? 800 : 700,
                                    fontSize: '0.88rem',
                                    color: 'text.primary',
                                    cursor: p2 ? 'pointer' : 'default',
                                    '&:hover': p2 ? { textDecoration: 'underline', color: 'primary.main' } : {}
                                  }}
                                >
                                  {match.player2_name || 'TBD'}
                                </Typography>
                              </Tooltip>

                              {p2 && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
                                  {p2.bcf_player_id || `BCF${p2.id}`} • {p2.club_name || 'BCF'}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          <Typography variant="h6" sx={{ fontWeight: 800, minWidth: 32, textAlign: 'right' }}>
                            {match.player2_score || 0}
                          </Typography>
                        </Box>
                      </Card>
                    )
                  })}
                </Box>
              </Card>
            ))}
        </Box>
      )}

      {/* ======================================================== */}
      {/* TAB B: TABEL 2 - VISUAL ROUND-ROBIN PAIRING MATRIX       */}
      {/* (Exact implementation of Tabel 2 from User's Screenshot) */}
      {/* ======================================================== */}
      {activeTab === 'matrix' && (
        <Card
          sx={{
            borderRadius: 3.5,
            p: { xs: 2, sm: 3 },
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5
          }}
        >
          {/* Header Explanation matching screenshot */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
                Tabel 2: Matriks Jadwal Turnamen Round-Robin
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.3 }}>
                Matriks sederhana menunjukkan lawan tanding setiap tim/atlet pada masing-masing ronde sesuai rumus resmi single round-robin.
              </Typography>
            </Box>

            <Chip
              label={`${matrixTable.teamsList?.length || 8} Teams • ${matrixTable.rows?.length || 7} Rounds`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 750, height: 26 }}
            />
          </Box>

          {/* Matrix Table */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1.5px solid ${isDark ? '#3F3F46' : '#CBD5E1'}`,
              overflowX: 'auto',
              backgroundColor: isDark ? '#18181B' : '#FFFFFF'
            }}
          >
            <Table sx={{ minWidth: 700, borderCollapse: 'collapse' }}>
              <TableHead>
                {/* Top header row: Team Label spanning all team columns */}
                <TableRow sx={{ backgroundColor: isDark ? '#27272A' : '#F1F5F9' }}>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      textAlign: 'center',
                      borderRight: `2px solid ${isDark ? '#3F3F46' : '#CBD5E1'}`,
                      borderBottom: `2px solid ${isDark ? '#3F3F46' : '#CBD5E1'}`,
                      py: 1.5,
                      px: 2,
                      width: 140,
                      backgroundColor: isDark ? '#27272A' : '#E2E8F0'
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em' }}>
                        TEAM →
                      </Typography>
                      <Divider sx={{ width: '80%', borderColor: isDark ? '#52525B' : '#94A3B8' }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em' }}>
                        ↓ ROUND
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell
                    colSpan={matrixTable.teamsList.length}
                    align="center"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'primary.main',
                      py: 1,
                      borderBottom: `1.5px solid ${isDark ? '#3F3F46' : '#CBD5E1'}`
                    }}
                  >
                    Team / Participant Seeds
                  </TableCell>
                </TableRow>

                {/* Team Number Columns: 1, 2, 3, 4, 5, 6, 7, 8 */}
                <TableRow sx={{ backgroundColor: isDark ? '#202024' : '#F8FAFC' }}>
                  {matrixTable.teamsList.map((seedNum) => {
                    const participant = seedMap.get(seedNum)
                    return (
                      <TableCell
                        key={seedNum}
                        align="center"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          color: 'text.primary',
                          py: 1.2,
                          px: 1.5,
                          borderRight: `1px solid ${isDark ? '#333338' : '#E2E8F0'}`,
                          borderBottom: `2px solid ${isDark ? '#3F3F46' : '#CBD5E1'}`
                        }}
                      >
                        <Tooltip
                          title={
                            participant ? (
                              <Box sx={{ p: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                  [#{seedNum}] {participant.full_name}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                                  {participant.club_name || 'BCF'} • Rank #{participant.national_rank || seedNum}
                                </Typography>
                              </Box>
                            ) : `Team ${seedNum}`
                          }
                          arrow
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3, cursor: 'pointer' }}>
                            <Avatar
                              src={participant?.photo_url}
                              sx={{ width: 26, height: 26, fontSize: '0.72rem', fontWeight: 800, bgcolor: 'primary.main' }}
                            >
                              {seedNum}
                            </Avatar>
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>
                              {seedNum}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                    )
                  })}
                </TableRow>
              </TableHead>

              <TableBody>
                {matrixTable.rows.map((row) => (
                  <TableRow
                    key={row.roundLevel}
                    sx={{
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
                      }
                    }}
                  >
                    {/* Row Header: Round 1, Round 2, Round 3, ... */}
                    <TableCell
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        color: 'text.primary',
                        backgroundColor: isDark ? '#202024' : '#F8FAFC',
                        borderRight: `2px solid ${isDark ? '#3F3F46' : '#CBD5E1'}`,
                        borderBottom: `1px solid ${isDark ? '#333338' : '#E2E8F0'}`,
                        py: 1.5,
                        px: 2,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {row.roundName}
                    </TableCell>

                    {/* Matrix Cells: Opponent Seed Number */}
                    {matrixTable.teamsList.map((seedNum) => {
                      const opponentSeed = row.opponents[seedNum]
                      const match = row.matchesByTeam[seedNum]
                      const isHovered =
                        hoveredCell &&
                        hoveredCell.roundLevel === row.roundLevel &&
                        (hoveredCell.teamSeed === seedNum || hoveredCell.opponentSeed === seedNum)

                      const isCompleted = match?.status === 'Completed'
                      const isLive = match?.status === 'Live'

                      return (
                        <TableCell
                          key={seedNum}
                          align="center"
                          onMouseEnter={() => {
                            if (opponentSeed) {
                              setHoveredCell({
                                roundLevel: row.roundLevel,
                                teamSeed: seedNum,
                                opponentSeed: opponentSeed
                              })
                            }
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => {
                            if (match) handleOpenScore(match)
                          }}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.98rem',
                            py: 1.6,
                            px: 1.5,
                            borderRight: `1px solid ${isDark ? '#333338' : '#E2E8F0'}`,
                            borderBottom: `1px solid ${isDark ? '#333338' : '#E2E8F0'}`,
                            cursor: match ? 'pointer' : 'default',
                            transition: 'all 0.15s ease',
                            backgroundColor: isHovered
                              ? theme.palette.mode === 'dark'
                                ? 'rgba(16, 185, 129, 0.25)'
                                : '#D1FAE5'
                              : isLive
                              ? 'rgba(239, 68, 68, 0.15)'
                              : isCompleted
                              ? isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                              : 'transparent',
                            color: isHovered
                              ? '#059669'
                              : isLive
                              ? 'error.main'
                              : 'text.primary'
                          }}
                        >
                          <Tooltip
                            title={
                              match ? (
                                <Box sx={{ p: 0.8, textAlign: 'center' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#38BDF8', display: 'block' }}>
                                    {row.roundName} • Board {match.board_number || 1}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3 }}>
                                    [#{seedNum}] vs [#{opponentSeed}]
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                                    {match.player1_name} vs {match.player2_name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: isLive ? '#F87171' : isCompleted ? '#4ADE80' : '#E2E8F0', display: 'block', mt: 0.4 }}>
                                    {isCompleted ? `Score: ${match.player1_score} - ${match.player2_score} (Completed)` : isLive ? `LIVE: ${match.player1_score} - ${match.player2_score}` : 'Scheduled'}
                                  </Typography>
                                </Box>
                              ) : 'BYE'
                            }
                            arrow
                          >
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span>{opponentSeed !== undefined ? opponentSeed : '—'}</span>
                            </Box>
                          </Tooltip>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Explanatory Rule Footer */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5
            }}
          >
            <InfoIcon sx={{ fontSize: 20, color: 'primary.main', mt: 0.2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.4 }}>
                Aturan & Cara Membaca Tabel 2 (Round-Robin Pairing Matrix):
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
                • <strong>Baris (Ronde):</strong> Menunjukkan jadwal pertandingan pada setiap babak (Ronde 1 s/d Ronde 7).<br />
                • <strong>Kolom (Nomor Tim/Seed):</strong> Menunjukkan nomor peserta (Tim 1 hingga Tim 8).<br />
                • <strong>Nilai Sel:</strong> Angka di dalam sel adalah <em>nomor tim lawan</em> pada ronde tersebut. Contoh: Pada baris Ronde 1 di bawah Tim 1 terdapat angka <strong>7</strong>, dan di bawah Tim 7 terdapat angka <strong>1</strong> (artinya Tim 1 bertanding melawan Tim 7).<br />
                • Klik pada sel mana saja untuk membuka jendela perolehan skor dan papan carrom langsung.
              </Typography>
            </Box>
          </Box>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB C: OFFICIAL STANDINGS / POINTS TABLE                 */}
      {/* ======================================================== */}
      {activeTab === 'standings' && (
        <Card
          sx={{
            borderRadius: 3.5,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            backgroundColor: isDark ? '#1C1C20' : '#FFFFFF'
          }}
        >
          <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Official Championship Standings
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Rankings calculated automatically based on Match Points (2 pts/Win), Net Carrom Points, and Slams.
              </Typography>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
            <Table sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 800, width: 60 }}>Pos</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Athlete / Club</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>P</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>W</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>L</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Pts</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Net Pts</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Slams</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Form</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {standings.map((item, index) => {
                  const p = item.player
                  const isTop3 = index < 3
                  return (
                    <TableRow key={p.id} hover>
                      {/* Rank Position */}
                      <TableCell>
                        <Chip
                          label={index + 1}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            height: 24,
                            width: 24,
                            borderRadius: '50%',
                            backgroundColor:
                              index === 0
                                ? '#F59E0B'
                                : index === 1
                                ? '#94A3B8'
                                : index === 2
                                ? '#B45309'
                                : isDark ? '#27272A' : '#E2E8F0',
                            color: isTop3 ? '#FFFFFF' : 'text.primary'
                          }}
                        />
                      </TableCell>

                      {/* Player Profile */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={p.photo_url}
                            sx={{ width: 36, height: 36, fontWeight: 750, fontSize: '0.85rem', bgcolor: 'primary.main' }}
                          >
                            {p.full_name?.charAt(0) || 'P'}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 750,
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline', color: 'primary.main' }
                              }}
                              onClick={() => navigate(`/players/${p.player_id || p.id}`)}
                            >
                              {p.full_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {p.bcf_player_id || `BCF${p.id}`} • {p.club_name || 'BCF Affiliated'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell align="center" sx={{ fontWeight: 700 }}>{item.played}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#059669' }}>{item.won}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary' }}>{item.lost}</TableCell>

                      <TableCell align="center">
                        <Chip
                          label={item.points}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 800, height: 24, px: 0.5, fontSize: '0.82rem' }}
                        />
                      </TableCell>

                      <TableCell align="center" sx={{ fontWeight: 750, color: item.netPoints > 0 ? '#059669' : item.netPoints < 0 ? '#DC2626' : 'text.secondary' }}>
                        {item.netPoints > 0 ? `+${item.netPoints}` : item.netPoints}
                      </TableCell>

                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {item.whiteSlams + item.blackSlams}
                      </TableCell>

                      {/* Form (W/L badges) */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          {item.form.length === 0 ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
                          ) : (
                            item.form.slice(-5).map((f, i) => (
                              <Box
                                key={i}
                                sx={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 0.8,
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: f === 'W' ? '#059669' : '#DC2626',
                                  color: '#FFFFFF'
                                }}
                              >
                                {f}
                              </Box>
                            ))
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB D: PARTICIPANTS DIRECTORY                            */}
      {/* ======================================================== */}
      {activeTab === 'participants' && (
        <Card
          sx={{
            borderRadius: 3.5,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            backgroundColor: isDark ? '#1C1C20' : '#FFFFFF'
          }}
        >
          <Box sx={{ p: 2.5, pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Enrolled Championship Participants
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Official draw seeding numbers, Elo rating points, and club affiliations.
            </Typography>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Seed #</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Athlete Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Federation ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Affiliated Club</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>District</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>National Rank</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Rating</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id || p.player_id} hover>
                    <TableCell>
                      <Chip
                        label={`#${p.seed_number || 1}`}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          backgroundColor: isDark ? '#27272A' : '#E2E8F0'
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={p.photo_url}
                          sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 800, bgcolor: 'primary.main' }}
                        >
                          {p.full_name?.charAt(0) || 'P'}
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {p.full_name}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem' }}>
                        {p.bcf_player_id || `BCF${p.player_id}`}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                        {p.club_name || 'BCF Affiliated'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                        {p.district || 'Dhaka'}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={p.national_rank ? `#${p.national_rank}` : '—'}
                        size="small"
                        color={p.national_rank <= 3 ? 'secondary' : 'default'}
                        sx={{ fontWeight: 750, height: 22, fontSize: '0.72rem' }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#D97706' }}>
                        {p.rating_points || 1200}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<ExternalIcon sx={{ fontSize: 13 }} />}
                        onClick={() => navigate(`/players/${p.player_id || p.id}`)}
                        sx={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                      >
                        Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB E: KNOCKOUT BRACKET TREE (When Format is Knockout)   */}
      {/* ======================================================== */}
      {activeTab === 'bracket' && (
        <Card
          sx={{
            borderRadius: 3.5,
            p: 3,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            backgroundColor: isDark ? '#1C1C20' : '#FFFFFF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Single Elimination Knockout Bracket
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Advancement tree following official seeding draw rules.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 4,
              overflowX: 'auto',
              py: 2,
              px: 1
            }}
          >
            {roundsList.map((round) => (
              <Box key={round.level} sx={{ minWidth: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 2, pb: 1, borderBottom: `2px solid ${theme.palette.primary.main}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {round.name}
                  </Typography>
                  <Chip label={`${round.matches.length} M`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, gap: 2.5 }}>
                  {round.matches.map((match) => (
                    <Card
                      key={match.id}
                      onClick={() => handleOpenScore(match)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        border: `1px solid ${match.status === 'Live' ? theme.palette.error.main : theme.palette.divider}`,
                        backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                        '&:hover': { borderColor: 'primary.main', transform: 'scale(1.02)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem' }}>
                          Board {match.board_number || 1}
                        </Typography>
                        <Chip
                          label={match.status}
                          size="small"
                          color={match.status === 'Completed' ? 'success' : match.status === 'Live' ? 'error' : 'default'}
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 750 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: match.winner_id === match.player1_id ? 800 : 650, fontSize: '0.82rem' }}>
                          {match.player1_name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {match.player1_score}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: match.winner_id === match.player2_id ? 800 : 650, fontSize: '0.82rem' }}>
                          {match.player2_name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {match.player2_score}
                        </Typography>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 4. Match Score & Status Modal                            */}
      {/* ======================================================== */}
      <Dialog
        open={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Update Match Score
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {activeMatch?.round_name} • Board {activeMatch?.board_number || 1}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1.5 }}>
          {/* Player 1 Score Input */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
              {activeMatch?.player1_name}
            </Typography>
            <TextField
              type="number"
              fullWidth
              size="small"
              label="Points / Score"
              value={scoreForm.player1_score}
              onChange={(e) => setScoreForm({ ...scoreForm, player1_score: parseInt(e.target.value, 10) || 0 })}
            />
          </Box>

          {/* Player 2 Score Input */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
              {activeMatch?.player2_name}
            </Typography>
            <TextField
              type="number"
              fullWidth
              size="small"
              label="Points / Score"
              value={scoreForm.player2_score}
              onChange={(e) => setScoreForm({ ...scoreForm, player2_score: parseInt(e.target.value, 10) || 0 })}
            />
          </Box>

          {/* Match Status & Boards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              select
              size="small"
              label="Match Status"
              value={scoreForm.status}
              onChange={(e) => setScoreForm({ ...scoreForm, status: e.target.value })}
            >
              <MenuItem value="Scheduled">Scheduled</MenuItem>
              <MenuItem value="Live">Live In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>

            <TextField
              type="number"
              size="small"
              label="Boards Played"
              value={scoreForm.boards_played}
              onChange={(e) => setScoreForm({ ...scoreForm, boards_played: parseInt(e.target.value, 10) || 0 })}
            />
          </Box>

          {/* Winner Selector */}
          {scoreForm.status === 'Completed' && (
            <TextField
              select
              size="small"
              label="Official Winner"
              value={scoreForm.winner_id || ''}
              onChange={(e) => setScoreForm({ ...scoreForm, winner_id: e.target.value ? parseInt(e.target.value, 10) : null })}
            >
              <MenuItem value="">Auto Determine by Points</MenuItem>
              {activeMatch?.player1_id && (
                <MenuItem value={activeMatch.player1_id}>
                  {activeMatch.player1_name}
                </MenuItem>
              )}
              {activeMatch?.player2_id && (
                <MenuItem value={activeMatch.player2_id}>
                  {activeMatch.player2_name}
                </MenuItem>
              )}
            </TextField>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setScoreModalOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveScore} sx={{ textTransform: 'none', borderRadius: 2, px: 2.5 }}>
            Save Score
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 5. Re-generate Draw Confirmation Modal                   */}
      {/* ======================================================== */}
      <Dialog
        open={regenerateOpen}
        onClose={() => setRegenerateOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Re-generate Tournament Fixtures
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            This will reset current scores and re-calculate the round pairings for all {participants.length} players.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Seeding Engine"
            value={regenerateSeeding}
            onChange={(e) => setRegenerateSeeding(e.target.value)}
          >
            <MenuItem value="Seeded">Official National Seedings (Rank/Elo)</MenuItem>
            <MenuItem value="Random">Open Random Lottery Draw</MenuItem>
          </TextField>

          <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
            Format: <strong>{isRoundRobin ? 'Single Round-Robin (Tabel 1 & Tabel 2)' : 'Knockout'}</strong>. Existing match scores will be reset.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRegenerateOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleRegenerateDraw} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Re-generate Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
