import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TablePagination,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  useTheme
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import {
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Place as PlaceIcon,
  CalendarToday as CalendarIcon,
  AccountTree as BracketIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  SportsEsports as BoardIcon,
  Group as ParticipantsIcon,
  Tune as RulesIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  MilitaryTech as RankIcon,
  InfoOutlined as InfoIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import * as api from '../services/api'

// Hover preview card matching player profile mini card
function PlayerHoverCard({ player, onNavigate }) {
  if (!player) return null
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const playerId = player.player_id || player.bcf_player_id || (player.id ? `BCF${player.id}` : 'BCF-PLAYER')
  const genderCategory = `${(player.gender || 'MEN').toUpperCase()} • ${(player.category || 'SENIOR').toUpperCase()}`
  const clubDistrict = `${player.club_name || 'BCF Affiliated'} • ${player.district || 'Dhaka'}`
  const rating = player.rating_points || player.rating || 1200
  const won = player.matches_won !== undefined ? player.matches_won : (player.won || 0)
  const slams = ((player.white_slams || 0) + (player.black_slams || 0)) || (player.slams || 0)

  return (
    <Card
      elevation={0}
      sx={{
        width: 300,
        p: 2.2,
        borderRadius: 3.5,
        backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
        border: `1px solid ${isDark ? '#333338' : '#E2E8F0'}`,
        boxShadow: isDark
          ? '0 16px 36px rgba(0, 0, 0, 0.55)'
          : '0 16px 36px rgba(15, 23, 42, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.8
      }}
    >
      {/* Top Badges Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={playerId}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.74rem',
            color: '#B45309',
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
            border: '1.5px solid #F59E0B',
            borderRadius: 9999,
            height: 24,
            px: 0.5
          }}
        />
        <Chip
          label={genderCategory}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.7rem',
            color: '#2563EB',
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
            border: '1.5px solid #60A5FA',
            borderRadius: 9999,
            height: 24,
            px: 0.5
          }}
        />
      </Box>

      {/* Profile Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={player.photo_url || player.photo}
          alt={player.full_name}
          sx={{
            width: 48,
            height: 48,
            border: `2px solid ${isDark ? '#3F3F46' : '#E2E8F0'}`,
            fontWeight: 800,
            fontSize: '1.05rem',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            flexShrink: 0
          }}
        >
          {player.full_name?.charAt(0) || 'P'}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 800,
              fontSize: '0.98rem',
              color: 'text.primary',
              lineHeight: 1.2
            }}
          >
            {player.full_name}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.78rem',
              fontWeight: 500,
              mt: 0.3
            }}
          >
            {clubDistrict}
          </Typography>
        </Box>
      </Box>

      {/* Mini Stats Box */}
      <Box
        sx={{
          borderRadius: 2.5,
          backgroundColor: isDark ? '#27272A' : '#F8FAFC',
          border: `1px solid ${isDark ? '#3F3F46' : '#E2E8F0'}`,
          p: 1.3,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          textAlign: 'center'
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
            Rating
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#D97706', fontSize: '0.95rem' }}>
            {rating}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
            Won
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
            {won}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
            Slams
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
            {slams}
          </Typography>
        </Box>
      </Box>

      {/* Bottom Footer Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.2 }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 650, fontSize: '0.8rem' }}>
          {playerId}
        </Typography>

        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            if (onNavigate) onNavigate(playerId)
          }}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
          sx={{
            color: '#059669',
            fontWeight: 700,
            fontSize: '0.78rem',
            p: 0,
            minWidth: 0,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          View Profile
        </Button>
      </Box>
    </Card>
  )
}

export function TournamentsView({
  tournaments = [],
  players = [],
  onCreate,
  onUpdate,
  onDelete,
  onRefresh
}) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [createStepTab, setCreateStepTab] = useState(0)
  const [copiedCode, setCopiedCode] = useState(null)

  // Helper to find player details for matches
  const getPlayerData = (playerId, playerName, pKey = 'player1') => {
    if (playerId) {
      const p = players.find(x => x.id === playerId)
      if (p) return p
      const fromParts = bracketData?.participants?.find(x => x.player_id === playerId)
      if (fromParts) return fromParts
    }
    if (playerName) {
      const clean = playerName.replace(/\[#\d+\]\s*/, '').trim().toLowerCase()
      const p = players.find(x => x.full_name?.toLowerCase() === clean)
      if (p) return p
      const fromParts = bracketData?.participants?.find(x => x.full_name?.toLowerCase() === clean)
      if (fromParts) return fromParts
    }
    return null
  }

  // Bracket View State
  const [bracketDrawerOpen, setBracketDrawerOpen] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [bracketData, setBracketData] = useState(null)
  const [loadingBracket, setLoadingBracket] = useState(false)
  const [bracketTab, setBracketTab] = useState('bracket')
  const [roundFilter, setRoundFilter] = useState('All')

  // Score Update Dialog State
  const [scoreModalOpen, setScoreModalOpen] = useState(false)
  const [activeMatch, setActiveMatch] = useState(null)
  const [scoreForm, setScoreForm] = useState({
    player1_score: 0,
    player2_score: 0,
    current_board: 1,
    boards_played: 0,
    status: 'Live',
    winner_id: null
  })

  // Player search in creation form
  const [playerSearchQuery, setPlayerSearchQuery] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])

  const theme = useTheme()

  const [formData, setFormData] = useState({
    title: '',
    edition: '2026',
    venue: '',
    start_date: '',
    end_date: '',
    category: 'National Championship',
    format: 'Knockout',
    seeding_type: 'Seeded',
    board_limit: 8,
    points_limit: 25,
    prize_pool: '৳ 5,00,000',
    registration_deadline: '',
    status: 'Upcoming',
    description: ''
  })

  // Pagination state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    setPage(0)
  }, [activeFilter, searchQuery])

  // Filter active registered players for tournament selection
  const activePlayersList = players.filter(p => !p.status || p.status === 'Active')

  const filteredPlayersForSelection = activePlayersList.filter(p => {
    const q = playerSearchQuery.toLowerCase()
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.club_name?.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q) ||
      (p.player_id && p.player_id.toLowerCase().includes(q))
    )
  })

  const filteredTournaments = tournaments.filter((t) => {
    const matchesFilter =
      activeFilter === 'All' || (t.status && t.status.toLowerCase() === activeFilter.toLowerCase())
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.tournament_code && t.tournament_code.toLowerCase().includes(q)) ||
      (t.venue && t.venue.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    return matchesFilter && matchesSearch
  })

  const paginatedTournaments = filteredTournaments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const handleCopyCode = (code, e) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleOpenCreate = () => {
    setEditingItem(null)
    setCreateStepTab(0)
    setFormData({
      title: '',
      edition: '2026',
      venue: 'National Sports Council Gymnasium, Dhaka',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      category: 'National Championship',
      format: 'Knockout',
      seeding_type: 'Seeded',
      board_limit: 8,
      points_limit: 25,
      prize_pool: '৳ 5,00,000',
      registration_deadline: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      status: 'Upcoming',
      description: ''
    })
    // Pre-select top 8 players by default if available
    const top8Ids = [...activePlayersList]
      .sort((a, b) => (a.national_rank || 999) - (b.national_rank || 999))
      .slice(0, 8)
      .map(p => p.id)
    setSelectedPlayerIds(top8Ids)
    setPlayerSearchQuery('')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (t) => {
    setEditingItem(t)
    setCreateStepTab(0)
    setFormData({
      title: t.title || '',
      edition: t.edition || '2026',
      venue: t.venue || '',
      start_date: t.start_date ? t.start_date.split('T')[0] : '',
      end_date: t.end_date ? t.end_date.split('T')[0] : '',
      category: t.category || 'National Championship',
      format: t.format || 'Knockout',
      seeding_type: t.seeding_type || 'Seeded',
      board_limit: t.board_limit || 8,
      points_limit: t.points_limit || 25,
      prize_pool: t.prize_pool || '',
      registration_deadline: t.registration_deadline ? t.registration_deadline.split('T')[0] : '',
      status: t.status || 'Upcoming',
      description: t.description || ''
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.venue) return

    if (editingItem) {
      onUpdate(editingItem.id, formData)
    } else {
      onCreate({
        ...formData,
        selected_player_ids: selectedPlayerIds
      })
    }
    setIsDialogOpen(false)
  }

  // Quick player selection helpers
  const handleSelectTop = (count) => {
    const topIds = [...activePlayersList]
      .sort((a, b) => (a.national_rank || 999) - (b.national_rank || 999))
      .slice(0, count)
      .map(p => p.id)
    setSelectedPlayerIds(topIds)
  }

  const handleSelectAll = () => {
    setSelectedPlayerIds(activePlayersList.map(p => p.id))
  }

  const handleClearPlayers = () => {
    setSelectedPlayerIds([])
  }

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  // Bracket Viewer Handling
  const handleOpenBracket = async (t) => {
    setSelectedTournament(t)
    setBracketDrawerOpen(true)
    setBracketTab('bracket')
    setRoundFilter('All')
    loadBracket(t.id)
  }

  const loadBracket = async (tournamentId) => {
    setLoadingBracket(true)
    try {
      const data = await api.fetchTournamentBracket(tournamentId)
      setBracketData(data)
    } catch (err) {
      console.error('Failed to load bracket:', err)
    } finally {
      setLoadingBracket(false)
    }
  }

  const handleRegenerateFixtures = async () => {
    if (!selectedTournament) return
    if (!window.confirm('Re-generate fixtures according to Carrom seeding rules? This will reset existing matches.')) return

    try {
      await api.generateTournamentFixtures(selectedTournament.id, {
        seeding_type: selectedTournament.seeding_type || 'Seeded'
      })
      loadBracket(selectedTournament.id)
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error generating fixtures:', err)
    }
  }

  // Score Updater
  const handleOpenScoreModal = (match) => {
    setActiveMatch(match)
    setScoreForm({
      player1_score: match.player1_score || 0,
      player2_score: match.player2_score || 0,
      current_board: match.current_board || 1,
      boards_played: match.boards_played || 0,
      status: match.status || 'Live',
      winner_id: match.winner_id || ''
    })
    setScoreModalOpen(true)
  }

  const handleSaveScore = async () => {
    if (!activeMatch) return
    try {
      await api.updateTournamentMatchScore(activeMatch.id, {
        ...scoreForm,
        winner_id: scoreForm.winner_id ? parseInt(scoreForm.winner_id, 10) : null
      })
      setScoreModalOpen(false)
      if (selectedTournament) {
        loadBracket(selectedTournament.id)
      }
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error updating score:', err)
    }
  }

  // Match rounds list for filtering
  const allMatchesList = bracketData?.matches || []
  const distinctRounds = Array.from(new Set(allMatchesList.map(m => m.round_name))).filter(Boolean)

  const displayedMatches = allMatchesList.filter(m => {
    if (roundFilter === 'All') return true
    return m.round_name === roundFilter
  })

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Material 3 Page Header */}
      <PageHeader
        title="Tournament Championships"
        subtitle="Official national championships, premier leagues, draws & live bracket fixtures"
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ px: 2.5 }}
          >
            Create Tournament
          </Button>
        }
      />

      {/* Top Filter and Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            p: 0.5,
            borderRadius: 9999,
            backgroundColor: theme.palette.mode === 'dark' ? '#18181B' : '#F1F5F9',
            border: 'none',
            maxWidth: '100%',
            overflowX: 'auto'
          }}
        >
          <Tabs
            value={activeFilter}
            onChange={(e, val) => setActiveFilter(val)}
            TabIndicatorProps={{ style: { display: 'none' } }}
            sx={{
              minHeight: 34,
              '& .MuiTabs-indicator': { display: 'none !important', height: '0 !important' },
              '& .MuiTabs-flexContainer': { gap: 0.5 },
              '& .MuiTab-root': {
                minHeight: 32,
                fontSize: '0.8rem',
                fontWeight: 650,
                textTransform: 'none',
                px: 2,
                py: 0.6,
                borderRadius: 9999,
                color: 'text.secondary',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: (theme) => `${theme.palette.primary.contrastText} !important`,
                  fontWeight: 700,
                  boxShadow: (theme) => `0 2px 8px ${theme.palette.primary.main}4D`
                },
                '&:hover:not(.Mui-selected)': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  color: 'text.primary'
                }
              }
            }}
          >
            <Tab value="All" label={`All (${tournaments.length})`} />
            <Tab value="Live" label="Live" />
            <Tab value="Upcoming" label="Upcoming" />
            <Tab value="Ongoing" label="Ongoing" />
            <Tab value="Completed" label="Completed" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search code (T-XXXXXX), title, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
            sx={{
              width: { xs: '100%', sm: 320 }
            }}
          />
        </Box>
      </Box>

      {/* Tournaments Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell>Code & Championship</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Rules & Format</TableCell>
                <TableCell>Prize Pool</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTournaments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No tournaments matching current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTournaments.map((t) => {
                  const code = t.tournament_code || `T-${String(t.id).padStart(6, '0')}`
                  return (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(217, 119, 6, 0.1)',
                              color: 'secondary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <TrophyIcon fontSize="small" />
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
                              <Tooltip title={copiedCode === code ? 'Copied!' : 'Click to copy tournament code'}>
                                <Chip
                                  label={code}
                                  size="small"
                                  onClick={(e) => handleCopyCode(code, e)}
                                  icon={copiedCode === code ? <CheckIcon sx={{ fontSize: 13 }} /> : <CopyIcon sx={{ fontSize: 13 }} />}
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    height: 22,
                                    cursor: 'pointer',
                                    backgroundColor: theme.palette.mode === 'dark' ? '#27272A' : '#E2E8F0'
                                  }}
                                />
                              </Tooltip>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t.edition || '2026'}
                              </Typography>
                            </Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                              }}
                              onClick={() => navigate(`/tournaments/${t.id}`)}
                            >
                              {t.title}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                          <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          {t.venue}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 13 }} />
                          {t.start_date ? t.start_date.split('T')[0] : 'TBD'} → {t.end_date ? t.end_date.split('T')[0] : 'TBD'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 650 }}>
                            {t.format || 'Knockout'} ({t.seeding_type || 'Seeded'})
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                            ICF {t.board_limit || 8} Boards • {t.points_limit || 25} Pts
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.82rem' }}>
                          {t.prize_pool || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={t.status || 'Upcoming'}
                          size="small"
                          color={
                            t.status === 'Live' ? 'error' : t.status === 'Ongoing' ? 'primary' : 'default'
                          }
                          variant={t.status === 'Live' ? 'filled' : 'outlined'}
                          sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
                          <Button
                            title="View Tournament Console, Draws & Round-Robin Matrix"
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<BracketIcon sx={{ fontSize: 15 }} />}
                            onClick={() => navigate(`/tournaments/${t.id}`)}
                            sx={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              py: 0.4,
                              px: 1.4,
                              borderRadius: 1.8,
                              textTransform: 'none'
                            }}
                          >
                            View
                          </Button>

                          <Tooltip title="Edit Tournament Details">
                            <IconButton size="small" onClick={() => handleOpenEdit(t)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Tournament">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (window.confirm(`Delete ${t.title}?`)) onDelete(t.id)
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTournaments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
        />
      </Card>

      {/* Create / Edit SideSheet with 3 Functional Steps */}
      <SideSheet
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingItem ? 'Edit Tournament' : 'Create Carrom Tournament'}
        subtitle={
          editingItem
            ? `Editing details for ${editingItem.title} (${editingItem.tournament_code || 'T-XXXXXX'})`
            : 'Configure sanctioned tournament rules, seedings, and official player draws'
        }
        icon={<TrophyIcon />}
        width={{ xs: '100%', sm: 580, md: 680 }}
        footerActions={
          <>
            <Button onClick={() => setIsDialogOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
            >
              {editingItem ? 'Save Changes' : `Create & Generate Draw (${selectedPlayerIds.length} Players)`}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.4 }}>
          {/* Step Navigation Tabs */}
          {!editingItem && (
            <Tabs
              value={createStepTab}
              onChange={(e, v) => setCreateStepTab(v)}
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                minHeight: 40,
                '& .MuiTab-root': { fontSize: '0.82rem', fontWeight: 650, textTransform: 'none', minHeight: 40 }
              }}
            >
              <Tab label="1. Championship Info" />
              <Tab label="2. Rules & Format" />
              <Tab label={`3. Players Selection (${selectedPlayerIds.length})`} />
            </Tabs>
          )}

          {/* TAB 0: Championship Info */}
          {(editingItem || createStepTab === 0) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              <TextField
                label="Tournament Title"
                fullWidth
                required
                size="small"
                placeholder="e.g. 43rd National Carrom Championship"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Edition"
                  fullWidth
                  size="small"
                  placeholder="e.g. 2026 or 43rd Edition"
                  value={formData.edition}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                />
                <TextField
                  label="Category"
                  fullWidth
                  size="small"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </Box>

              <TextField
                label="Venue Location"
                fullWidth
                required
                size="small"
                placeholder="e.g. National Sports Council Gymnasium, Dhaka"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Prize Pool"
                  fullWidth
                  size="small"
                  placeholder="e.g. ৳ 5,00,000"
                  value={formData.prize_pool}
                  onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                />
                <TextField
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Upcoming">Upcoming</MenuItem>
                  <MenuItem value="Ongoing">Ongoing</MenuItem>
                  <MenuItem value="Live">Live</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </TextField>
              </Box>

              <TextField
                label="Championship Description"
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="Official tournament details, sanctions, and schedule notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Box>
          )}

          {/* TAB 1: Rules & Format */}
          {(editingItem || createStepTab === 1) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              <Alert severity="info" icon={<RulesIcon fontSize="inherit" />} sx={{ fontSize: '0.82rem' }}>
                International Carrom Federation (ICF) Official Tournament Rules are enforced: standard matches consist of 8 boards or 25 points maximum cap.
              </Alert>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  select
                  label="Tournament Draw Format"
                  fullWidth
                  size="small"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                >
                  <MenuItem value="Knockout">Knockout (Single Elimination)</MenuItem>
                  <MenuItem value="RoundRobin">Round Robin (League Stage)</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Draw Seeding Logic"
                  fullWidth
                  size="small"
                  value={formData.seeding_type}
                  onChange={(e) => setFormData({ ...formData, seeding_type: e.target.value })}
                >
                  <MenuItem value="Seeded">Seeded by National Ranking / Elo</MenuItem>
                  <MenuItem value="Random">Open Random Lottery Draw</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  select
                  label="Boards Per Match"
                  fullWidth
                  size="small"
                  value={formData.board_limit}
                  onChange={(e) => setFormData({ ...formData, board_limit: parseInt(e.target.value, 10) })}
                >
                  <MenuItem value={8}>8 Boards (Official ICF Standard)</MenuItem>
                  <MenuItem value={6}>6 Boards (Divisional Standard)</MenuItem>
                  <MenuItem value={4}>4 Boards (Fast-play)</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Points Limit"
                  fullWidth
                  size="small"
                  value={formData.points_limit}
                  onChange={(e) => setFormData({ ...formData, points_limit: parseInt(e.target.value, 10) })}
                >
                  <MenuItem value={25}>25 Points (ICF Official Cap)</MenuItem>
                  <MenuItem value={29}>29 Points</MenuItem>
                  <MenuItem value={21}>21 Points</MenuItem>
                </TextField>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Pairing Rules Explained:
                </Typography>
                {formData.format === 'RoundRobin' ? (
                  <>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 0.6 }}>
                      • <strong>Single Round-Robin (All-play-all):</strong> Generates N-1 rounds where every participant faces each opponent once according to official Berger/Polygon pairing matrices (Tabel 1 & Tabel 2).
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      • <strong>Standings & Matrix:</strong> Produces a full round-by-round fixture list and visual cross-pairing matrix with points table standings (2 pts for win).
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 0.6 }}>
                      • <strong>Seeded Pairing:</strong> Seed 1 is placed in the Top Half and Seed 2 in the Bottom Half, ensuring the top two ranked players can only meet in the Final.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      • <strong>Carrom Boards:</strong> Board 1, Board 2, Board 3... are automatically assigned to concurrent matches in the bracket.
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* TAB 2: Player Selection */}
          {!editingItem && createStepTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Quick Select Buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Select Participants ({selectedPlayerIds.length} Selected)
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.8 }}>
                  <Button size="small" variant="outlined" onClick={() => handleSelectTop(8)} sx={{ fontSize: '0.72rem', py: 0.3 }}>
                    Top 8 Ranked
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => handleSelectTop(16)} sx={{ fontSize: '0.72rem', py: 0.3 }}>
                    Top 16 Ranked
                  </Button>
                  <Button size="small" variant="outlined" onClick={handleSelectAll} sx={{ fontSize: '0.72rem', py: 0.3 }}>
                    All Active
                  </Button>
                  <Button size="small" color="inherit" onClick={handleClearPlayers} sx={{ fontSize: '0.72rem', py: 0.3 }}>
                    Clear
                  </Button>
                </Box>
              </Box>

              {/* Bracket Sizing Forecast */}
              <Alert
                severity={selectedPlayerIds.length >= 2 ? 'success' : 'warning'}
                sx={{ fontSize: '0.8rem', py: 0.5 }}
              >
                {selectedPlayerIds.length >= 2
                  ? `${selectedPlayerIds.length} players selected -> Bracket size: ${selectedPlayerIds.length > 16 ? '32 (Round of 32)' : selectedPlayerIds.length > 8 ? '16 (Round of 16)' : selectedPlayerIds.length > 4 ? '8 (Quarter Finals)' : '4 (Semi Finals)'
                  }`
                  : 'Please select at least 2 players to generate tournament fixtures.'}
              </Alert>

              {/* Search Filter */}
              <TextField
                size="small"
                placeholder="Search player name, club, or district..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16 }} />
                    </InputAdornment>
                  )
                }}
              />

              {/* Player Multi-select List */}
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  borderRadius: 2
                }}
              >
                {filteredPlayersForSelection.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No active players found.
                    </Typography>
                  </Box>
                ) : (
                  filteredPlayersForSelection.map((p) => {
                    const isSelected = selectedPlayerIds.includes(p.id)
                    return (
                      <Box
                        key={p.id}
                        onClick={() => togglePlayerSelection(p.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.2,
                          px: 2,
                          cursor: 'pointer',
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          backgroundColor: isSelected
                            ? theme.palette.mode === 'dark'
                              ? 'rgba(59, 130, 246, 0.08)'
                              : 'rgba(59, 130, 246, 0.04)'
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Checkbox
                            checked={isSelected}
                            size="small"
                            sx={{ p: 0 }}
                          />
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 650, fontSize: '0.85rem' }}>
                                {p.full_name}
                              </Typography>
                              {p.national_rank && (
                                <Chip
                                  label={`#${p.national_rank}`}
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {p.club_name || 'BCF Affiliated'} • {p.district || 'Dhaka'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {p.rating_points || 1500} pts
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </SideSheet>

      {/* Bracket & Draws Viewer SideSheet */}
      <SideSheet
        open={bracketDrawerOpen}
        onClose={() => setBracketDrawerOpen(false)}
        title={selectedTournament ? `${selectedTournament.title}` : 'Tournament Bracket & Draws'}
        subtitle={
          selectedTournament
            ? `Official Draw & Fixtures • Code: ${selectedTournament.tournament_code || `T-${String(selectedTournament.id).padStart(6, '0')}`}`
            : 'Interactive match pairings and live board results'
        }
        icon={<BracketIcon />}
        width={{ xs: '100%', sm: 680, md: 840 }}
        footerActions={
          <>
            <Button onClick={() => setBracketDrawerOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
              Close
            </Button>
            <Button
              onClick={handleRegenerateFixtures}
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Regenerate Draw
            </Button>
          </>
        }
      >
        {loadingBracket ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={36} />
          </Box>
        ) : !bracketData ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No bracket data available for this tournament.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Tournament Meta Summary Banner */}
            <Card variant="outlined" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#18181B' : '#F8FAFC' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={bracketData.tournament?.tournament_code || 'T-942234'}
                        size="small"
                        icon={<CopyIcon sx={{ fontSize: 13 }} />}
                        onClick={(e) => handleCopyCode(bracketData.tournament?.tournament_code, e)}
                        sx={{ fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}
                      />
                      <Chip
                        label={bracketData.tournament?.status || 'Upcoming'}
                        size="small"
                        color={bracketData.tournament?.status === 'Live' ? 'error' : 'primary'}
                        sx={{ fontWeight: 700, height: 22 }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {bracketData.tournament?.edition || '2026'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PlaceIcon sx={{ fontSize: 13 }} />
                      {bracketData.tournament?.venue}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<BoardIcon sx={{ fontSize: 14 }} />}
                      label={`ICF ${bracketData.tournament?.board_limit || 8} Boards`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<ParticipantsIcon sx={{ fontSize: 14 }} />}
                      label={`${bracketData.participants?.length || 0} Participants`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Sub-tabs: Bracket Fixtures vs Participants Table */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Tabs
                value={bracketTab}
                onChange={(e, v) => setBracketTab(v)}
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': { fontSize: '0.82rem', fontWeight: 650, textTransform: 'none', minHeight: 36, px: 2 }
                }}
              >
                <Tab value="bracket" label={`Fixtures & Draws (${bracketData.matches?.length || 0})`} />
                <Tab value="participants" label={`Enrolled Players (${bracketData.participants?.length || 0})`} />
              </Tabs>

              {bracketTab === 'bracket' && distinctRounds.length > 0 && (
                <TextField
                  select
                  size="small"
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="All">All Rounds</MenuItem>
                  {distinctRounds.map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              )}
            </Box>

            {/* TAB: Bracket Matches List */}
            {bracketTab === 'bracket' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {displayedMatches.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No matches scheduled for this tournament yet. Click "Regenerate Draw" to create pairings.
                    </Typography>
                  </Box>
                ) : (
                  displayedMatches.map((match) => {
                    const isLive = match.status === 'Live'
                    const isCompleted = match.status === 'Completed'
                    const p1Won = match.winner_id && match.winner_id === match.player1_id
                    const p2Won = match.winner_id && match.winner_id === match.player2_id

                    return (
                      <Card
                        key={match.id}
                        variant="outlined"
                        sx={{
                          borderLeft: isLive ? '4px solid #EF4444' : isCompleted ? '4px solid #10B981' : `4px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: theme.shadows[2]
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                {match.round_name}
                              </Typography>
                              <Chip
                                label={`Board ${match.board_number || 1}`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={
                                  match.player1_name === 'BYE' || match.player2_name === 'BYE'
                                    ? 'Walkover'
                                    : (match.status || 'Scheduled')
                                }
                                size="small"
                                color={isLive ? 'error' : isCompleted ? 'success' : 'default'}
                                variant={isLive ? 'filled' : 'outlined'}
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                              />
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleOpenScoreModal(match)}
                                sx={{ fontSize: '0.72rem', py: 0.2, px: 1, borderRadius: 1.5, textTransform: 'none' }}
                              >
                                {isCompleted ? 'Edit Score' : 'Update Score'}
                              </Button>
                            </Box>
                          </Box>

                          {/* Match Players & Scores with Profile Pic & Hover Card */}
                          {(() => {
                            const isP1BYE = match.player1_name === 'BYE'
                            const isP2BYE = match.player2_name === 'BYE'
                            const isBYEMatch = isP1BYE || isP2BYE

                            const p1Data = getPlayerData(match.player1_id, match.player1_name, 'player1')
                            const p2Data = getPlayerData(match.player2_id, match.player2_name, 'player2')

                            const p1Photo = p1Data?.photo_url || match.player1_photo
                            const p1Code = p1Data?.player_id || p1Data?.bcf_player_id || match.player1_code || (p1Data?.id ? `BCF${p1Data.id}` : null)
                            const p1District = p1Data?.district || match.player1_district || 'Dhaka'

                            const p2Photo = p2Data?.photo_url || match.player2_photo
                            const p2Code = p2Data?.player_id || p2Data?.bcf_player_id || match.player2_code || (p2Data?.id ? `BCF${p2Data.id}` : null)
                            const p2District = p2Data?.district || match.player2_district || 'Dhaka'

                            return (
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 2, py: 1 }}>
                                {/* Player 1 Slot */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p1Won ? '#10B981' : 'transparent', flexShrink: 0 }} />

                                  {isP1BYE ? (
                                    <Chip
                                      label="BYE (No Opponent)"
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 24, fontSize: '0.74rem', fontWeight: 650, color: 'text.disabled' }}
                                    />
                                  ) : match.player1_name?.startsWith('Winner of') ? (
                                    <Box>
                                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.84rem' }}>
                                        {match.player1_name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
                                        White Carrom Men
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Tooltip
                                      enterDelay={150}
                                      leaveDelay={200}
                                      slotProps={{
                                        tooltip: {
                                          sx: {
                                            bgcolor: 'transparent',
                                            p: 0,
                                            boxShadow: 'none',
                                            maxWidth: 'none'
                                          }
                                        }
                                      }}
                                      title={
                                        <PlayerHoverCard
                                          player={p1Data || { full_name: match.player1_name, player_id: p1Code, district: p1District, photo_url: p1Photo }}
                                          onNavigate={(code) => navigate(`/players/${code}`)}
                                        />
                                      }
                                    >
                                      <Box
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (p1Code) navigate(`/players/${p1Code}`)
                                        }}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1.2,
                                          p: 0.6,
                                          borderRadius: 2,
                                          cursor: 'pointer',
                                          transition: 'background-color 0.15s ease',
                                          '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                                          }
                                        }}
                                      >
                                        <Avatar
                                          src={p1Photo}
                                          sx={{
                                            width: 38,
                                            height: 38,
                                            border: p1Won ? '2px solid #10B981' : `1.5px solid ${theme.palette.divider}`,
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            flexShrink: 0
                                          }}
                                        >
                                          {match.player1_name?.replace(/\[#\d+\]\s*/, '').charAt(0) || 'P'}
                                        </Avatar>

                                        <Box sx={{ minWidth: 0 }}>
                                          <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{
                                              fontWeight: p1Won ? 800 : 700,
                                              color: p1Won ? 'text.primary' : 'text.primary',
                                              fontSize: '0.88rem',
                                              lineHeight: 1.2
                                            }}
                                          >
                                            {match.player1_name}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            noWrap
                                            sx={{
                                              color: 'text.secondary',
                                              fontSize: '0.72rem',
                                              display: 'block',
                                              mt: 0.3
                                            }}
                                          >
                                            {p1Code || 'BCF Player'} • {p1District}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Box>

                                {/* Score Display */}
                                {isBYEMatch ? (
                                  <Box
                                    sx={{
                                      px: 2,
                                      py: 0.8,
                                      borderRadius: 2,
                                      backgroundColor: theme.palette.mode === 'dark' ? '#27272A' : '#F1F5F9',
                                      textAlign: 'center'
                                    }}
                                  >
                                    <Chip
                                      label="WALKOVER (BYE)"
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        color: '#059669',
                                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid #10B981'
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ fontSize: '0.66rem', color: 'text.secondary', display: 'block', mt: 0.4 }}>
                                      Auto Advanced
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{
                                      px: 2,
                                      py: 0.5,
                                      borderRadius: 1.5,
                                      backgroundColor: theme.palette.mode === 'dark' ? '#27272A' : '#F1F5F9',
                                      textAlign: 'center'
                                    }}
                                  >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'monospace', letterSpacing: 1 }}>
                                      {match.player1_score || 0} - {match.player2_score || 0}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                                      Board {match.current_board || 1} of {selectedTournament?.board_limit || 8}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Player 2 Slot */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.2, textAlign: 'right' }}>
                                  {isP2BYE ? (
                                    <Chip
                                      label="BYE (No Opponent)"
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 24, fontSize: '0.74rem', fontWeight: 650, color: 'text.disabled' }}
                                    />
                                  ) : match.player2_name?.startsWith('Winner of') ? (
                                    <Box>
                                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.84rem' }}>
                                        {match.player2_name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
                                        Black Carrom Men
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Tooltip
                                      enterDelay={150}
                                      leaveDelay={200}
                                      slotProps={{
                                        tooltip: {
                                          sx: {
                                            bgcolor: 'transparent',
                                            p: 0,
                                            boxShadow: 'none',
                                            maxWidth: 'none'
                                          }
                                        }
                                      }}
                                      title={
                                        <PlayerHoverCard
                                          player={p2Data || { full_name: match.player2_name, player_id: p2Code, district: p2District, photo_url: p2Photo }}
                                          onNavigate={(code) => navigate(`/players/${code}`)}
                                        />
                                      }
                                    >
                                      <Box
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (p2Code) navigate(`/players/${p2Code}`)
                                        }}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'flex-end',
                                          gap: 1.2,
                                          p: 0.6,
                                          borderRadius: 2,
                                          cursor: 'pointer',
                                          textAlign: 'right',
                                          transition: 'background-color 0.15s ease',
                                          '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                                          }
                                        }}
                                      >
                                        <Box sx={{ minWidth: 0 }}>
                                          <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{
                                              fontWeight: p2Won ? 800 : 700,
                                              color: p2Won ? 'text.primary' : 'text.primary',
                                              fontSize: '0.88rem',
                                              lineHeight: 1.2
                                            }}
                                          >
                                            {match.player2_name}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            noWrap
                                            sx={{
                                              color: 'text.secondary',
                                              fontSize: '0.72rem',
                                              display: 'block',
                                              mt: 0.3
                                            }}
                                          >
                                            {p2Code || 'BCF Player'} • {p2District}
                                          </Typography>
                                        </Box>

                                        <Avatar
                                          src={p2Photo}
                                          sx={{
                                            width: 38,
                                            height: 38,
                                            border: p2Won ? '2px solid #10B981' : `1.5px solid ${theme.palette.divider}`,
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                            bgcolor: 'secondary.main',
                                            color: 'secondary.contrastText',
                                            flexShrink: 0
                                          }}
                                        >
                                          {match.player2_name?.replace(/\[#\d+\]\s*/, '').charAt(0) || 'P'}
                                        </Avatar>
                                      </Box>
                                    </Tooltip>
                                  )}

                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p2Won ? '#10B981' : 'transparent', flexShrink: 0 }} />
                                </Box>
                              </Box>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </Box>
            )}

            {/* TAB: Participants Table */}
            {bracketTab === 'participants' && (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Seed #</TableCell>
                      <TableCell>Player Name</TableCell>
                      <TableCell>National Rank</TableCell>
                      <TableCell>Rating Points</TableCell>
                      <TableCell>Club / District</TableCell>
                      <TableCell>Draw Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bracketData.participants?.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Chip
                            label={`#${p.seed_number}`}
                            size="small"
                            color={p.seed_number <= 2 ? 'primary' : 'default'}
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 650, fontSize: '0.84rem' }}>
                            {p.full_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {p.bcf_player_id || 'BCF Player'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {p.national_rank ? `#${p.national_rank}` : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.8rem' }}>
                            {p.rating_points || 1500} pts
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            {p.club_name || 'Affiliated'} ({p.district || 'Dhaka'})
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.status || 'Registered'}
                            size="small"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </SideSheet>

      {/* Match Score & Result Dialog */}
      <Dialog
        open={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
          Update Match Score: {activeMatch?.round_name}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1.5 }}>
          <Alert severity="info" sx={{ fontSize: '0.78rem' }}>
            When a match is marked 'Completed' with a winner, the winner will automatically advance to the next bracket round!
          </Alert>

          {/* Player 1 Score */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 650 }}>
              {activeMatch?.player1_name || 'Player 1'} (White)
            </Typography>
            <TextField
              type="number"
              size="small"
              label="Points"
              value={scoreForm.player1_score}
              onChange={(e) => setScoreForm({ ...scoreForm, player1_score: parseInt(e.target.value, 10) || 0 })}
            />
          </Box>

          {/* Player 2 Score */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 650 }}>
              {activeMatch?.player2_name || 'Player 2'} (Black)
            </Typography>
            <TextField
              type="number"
              size="small"
              label="Points"
              value={scoreForm.player2_score}
              onChange={(e) => setScoreForm({ ...scoreForm, player2_score: parseInt(e.target.value, 10) || 0 })}
            />
          </Box>

          <Divider />

          {/* Boards Status */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              type="number"
              size="small"
              label="Current Board"
              value={scoreForm.current_board}
              onChange={(e) => setScoreForm({ ...scoreForm, current_board: parseInt(e.target.value, 10) || 1 })}
            />
            <TextField
              type="number"
              size="small"
              label="Boards Completed"
              value={scoreForm.boards_played}
              onChange={(e) => setScoreForm({ ...scoreForm, boards_played: parseInt(e.target.value, 10) || 0 })}
            />
          </Box>

          <TextField
            select
            size="small"
            label="Match Status"
            value={scoreForm.status}
            onChange={(e) => setScoreForm({ ...scoreForm, status: e.target.value })}
          >
            <MenuItem value="Scheduled">Scheduled</MenuItem>
            <MenuItem value="Live">Live (In Progress)</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </TextField>

          {/* Winner Selector */}
          <TextField
            select
            size="small"
            label="Declare Winner"
            value={scoreForm.winner_id || ''}
            onChange={(e) => setScoreForm({ ...scoreForm, winner_id: e.target.value })}
            helperText="Selecting a winner advances them to the next round match"
          >
            <MenuItem value="">— No Winner Yet —</MenuItem>
            {activeMatch?.player1_id && (
              <MenuItem value={activeMatch.player1_id}>
                Winner: {activeMatch.player1_name}
              </MenuItem>
            )}
            {activeMatch?.player2_id && (
              <MenuItem value={activeMatch.player2_id}>
                Winner: {activeMatch.player2_name}
              </MenuItem>
            )}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setScoreModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveScore} variant="contained" color="primary" sx={{ fontWeight: 700 }}>
            Save Score & Advance
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
