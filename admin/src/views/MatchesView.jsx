import React, { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Divider,
  Alert,
  useTheme
} from '@mui/material'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import { MatchesViewSkeleton } from '../components/Common/PageSkeletons'
import { getEmbedUrl } from '../utils/media'
import * as api from '../services/api'
import {
  Sensors as LiveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Tv as StreamIcon,
  Star as QueenIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as TrophyIcon,
  FiberManualRecord as DotIcon,
  CheckCircle as CheckCircleIcon,
  Undo as UndoIcon,
  History as HistoryIcon,
  Lock as LockIcon,
  Toll as TossIcon,
  Sports as UmpireIcon
} from '@mui/icons-material'

// Clean Date Helper outside component
function getTodayIsoString() {
  try {
    return new Date().toISOString().substring(0, 10)
  } catch {
    return ''
  }
}

export function MatchesView({
  matches = [],
  tournaments = [],
  loading = false,
  umpireAccessOnly = false,
  onUpdateScore,
  onCreateMatch,
  onDeleteMatch
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // 1. All State Hooks at the top
  const [tournamentFilter, setTournamentFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All') // 'All', 'Live', 'Today', 'Scheduled', 'Completed'
  const [selectedMatchId, setSelectedMatchId] = useState(null)

  // Scheduling side sheet state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [streamUrlInput, setStreamUrlInput] = useState('')
  const [isEditingStream, setIsEditingStream] = useState(false)

  // Score Events & Undo State
  const [matchEvents, setMatchEvents] = useState([])
  const [queenClaimed, setQueenClaimed] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [umpires, setUmpires] = useState([])

  const [newMatchData, setNewMatchData] = useState({
    tournament_id: tournaments && tournaments.length > 0 ? tournaments[0].id : 1,
    player1_name: '',
    player2_name: '',
    round_name: 'Quarter Final - Board 1',
    board_number: 1,
    status: 'Live',
    stream_url: '',
    match_date: getTodayIsoString()
  })

  // Load Umpires list for assignment
  useEffect(() => {
    if (umpireAccessOnly) return
    let isMounted = true
    const loadUmpires = async () => {
      try {
        const res = await api.fetchUmpires()
        if (res && res.success && isMounted) {
          setUmpires(res.data || [])
        }
      } catch (err) {
        console.warn('Could not load umpires for matches view:', err)
      }
    }
    loadUmpires()
    return () => { isMounted = false }
  }, [])

  // Date Helper: Determine if a match is scheduled or played today
  const isMatchToday = (m) => {
    const rawDate = m.match_date || m.scheduled_at || m.created_at
    if (!rawDate) return false
    try {
      const matchDay = String(rawDate).substring(0, 10)
      const today = getTodayIsoString()
      return matchDay === today
    } catch {
      return false
    }
  }

  // Filter and Sort: Live first, Today next, Recent date descending
  const sortedAndFilteredMatches = useMemo(() => {
    let list = Array.isArray(matches) ? [...matches] : []

    // 1. Filter by Tournament
    if (tournamentFilter !== 'All') {
      list = list.filter((m) => String(m.tournament_id) === String(tournamentFilter))
    }

    // 2. Filter by Status / Date Tab
    if (statusFilter === 'Live') {
      list = list.filter((m) => (m.status || '').toLowerCase() === 'live')
    } else if (statusFilter === 'Today') {
      list = list.filter((m) => isMatchToday(m))
    } else if (statusFilter === 'Scheduled') {
      list = list.filter((m) => {
        const s = (m.status || '').toLowerCase()
        return s === 'scheduled' || s === 'upcoming'
      })
    } else if (statusFilter === 'Completed') {
      list = list.filter((m) => (m.status || '').toLowerCase() === 'completed')
    }

    // 3. Smart Sorting:
    return list.sort((a, b) => {
      const aLive = (a.status || '').toLowerCase() === 'live' ? 1 : 0
      const bLive = (b.status || '').toLowerCase() === 'live' ? 1 : 0
      if (bLive !== aLive) return bLive - aLive

      const aToday = isMatchToday(a) ? 1 : 0
      const bToday = isMatchToday(b) ? 1 : 0
      if (bToday !== aToday) return bToday - aToday

      const aTime = new Date(a.match_date || a.created_at || 0).getTime()
      const bTime = new Date(b.match_date || b.created_at || 0).getTime()
      return bTime - aTime
    })
  }, [matches, tournamentFilter, statusFilter])

  // Active match selection
  const currentMatch = useMemo(() => {
    if (selectedMatchId && Array.isArray(matches)) {
      const found = matches.find((m) => m.id === selectedMatchId)
      if (found) return found
    }
    return sortedAndFilteredMatches[0] || (Array.isArray(matches) ? matches[0] : null) || null
  }, [matches, selectedMatchId, sortedAndFilteredMatches])

  const loadEvents = async (matchId) => {
    if (!matchId) return
    try {
      const res = await api.fetchMatchEvents(matchId)
      if (res && res.success) {
        setMatchEvents(res.data || [])
        setQueenClaimed(Boolean(res.queen_claimed_current_board))
      }
    } catch (err) {
      console.warn('Error loading match events:', err)
    }
  }

  // Sync stream input and score events whenever active match changes
  useEffect(() => {
    if (currentMatch) {
      setStreamUrlInput(currentMatch.stream_url || '')
      setIsEditingStream(false)
      loadEvents(currentMatch.id)
    } else {
      setMatchEvents([])
      setQueenClaimed(false)
    }
  }, [currentMatch?.id, currentMatch?.stream_url, currentMatch?.current_board])

  // Metric counts
  const liveCount = matches.filter((m) => (m.status || '').toLowerCase() === 'live').length
  const todayCount = matches.filter((m) => isMatchToday(m)).length

  // Base board limit from tournament configuration (or default 8)
  const baseBoardLimit = useMemo(() => {
    if (currentMatch?.tournament_board_limit) return Number(currentMatch.tournament_board_limit)
    const t = tournaments.find((item) => Number(item.id) === Number(currentMatch?.tournament_id))
    return Number(t?.board_limit) || 8
  }, [currentMatch?.tournament_board_limit, currentMatch?.tournament_id, tournaments])

  const extraBoards = Number(currentMatch?.extra_boards) || 0
  const totalBoardsCount = Math.max(1, baseBoardLimit + extraBoards)

  const availableBoards = useMemo(() => {
    const list = []
    for (let i = 1; i <= totalBoardsCount; i++) {
      list.push(i)
    }
    return list
  }, [totalBoardsCount])

  // Calculate per-board scores and active board score from matchEvents
  const boardScores = useMemo(() => {
    const map = {}
    availableBoards.forEach((b) => {
      map[b] = { player1: 0, player2: 0 }
    })
    matchEvents.forEach((ev) => {
      const b = Number(ev.board_number) || 1
      if (!map[b]) map[b] = { player1: 0, player2: 0 }
      if (Number(ev.player_slot) === 1) {
        map[b].player1 += Number(ev.points) || 0
      } else if (Number(ev.player_slot) === 2) {
        map[b].player2 += Number(ev.points) || 0
      }
    })
    return map
  }, [matchEvents, availableBoards])

  const activeBoard = Number(currentMatch?.current_board) || 1
  const activeBoardScore = boardScores[activeBoard] || { player1: 0, player2: 0 }

  // Derive Queen status for active board
  const queenEventInActiveBoard = useMemo(() => {
    return matchEvents.find(
      (e) => Number(e.board_number) === Number(activeBoard) && (e.is_queen === 1 || e.is_queen === true)
    )
  }, [matchEvents, activeBoard])

  const isQueenClaimedInActiveBoard = Boolean(queenEventInActiveBoard)
  const queenClaimerSlot = queenEventInActiveBoard ? Number(queenEventInActiveBoard.player_slot) : null

  // ICF Carrom Rules: Toss winner selects White or Black (Break)
  // Turn to break and White/Black assignments flip alternately every board!
  const getCarromRoleAndColor = (match, playerSlot, boardNum = 1) => {
    if (!match) {
      return {
        color: playerSlot === 1 ? 'White' : 'Black',
        isWhite: playerSlot === 1,
        role: playerSlot === 1 ? 'White Striker (Break)' : 'Black Defender',
        shortRole: playerSlot === 1 ? 'White Striker' : 'Black Defender'
      }
    }

    let p1IsWhiteBoard1 = true
    if (match.toss_winner_id) {
      if (Number(match.toss_winner_id) === Number(match.player1_id)) {
        p1IsWhiteBoard1 = match.toss_choice !== 'Black'
      } else if (Number(match.toss_winner_id) === Number(match.player2_id)) {
        p1IsWhiteBoard1 = match.toss_choice === 'Black'
      }
    }

    // ICF Alternation: Colors and break alternate on each board
    const isOddBoard = (Number(boardNum) % 2) !== 0
    const p1IsWhite = isOddBoard ? p1IsWhiteBoard1 : !p1IsWhiteBoard1
    const isWhite = playerSlot === 1 ? p1IsWhite : !p1IsWhite

    return {
      color: isWhite ? 'White' : 'Black',
      isWhite,
      role: isWhite ? 'White Striker (Break)' : 'Black Defender',
      shortRole: isWhite ? 'White Striker' : 'Black Defender'
    }
  }

  const handleSetToss = async (winnerId, choice) => {
    if (!currentMatch) return
    const decision = choice === 'White' ? 'Strike First (White)' : 'Defend (Black)'
    await onUpdateScore(currentMatch.id, {
      toss_winner_id: winnerId,
      toss_choice: choice,
      toss_decision: decision
    })
  }

  // Add On-Demand Extra Board
  const handleAddOnDemandBoard = () => {
    if (!currentMatch) return
    const nextExtra = extraBoards + 1
    const newBoardNum = baseBoardLimit + nextExtra
    onUpdateScore(currentMatch.id, {
      extra_boards: nextExtra,
      current_board: newBoardNum
    })
  }

  // Turn-by-Turn Score Recording with Single Queen Constraint
  const handleRecordScore = async (playerSlot, points, isQueen = false) => {
    if (!currentMatch || actionLoading) return
    if (isQueen && queenClaimed) {
      alert(`Queen has already been claimed for Board #${activeBoard}. Under ICF rules, only 1 Queen is permitted per board.`)
      return
    }

    setActionLoading(true)
    try {
      const res = await api.recordMatchEvent(currentMatch.id, {
        player_slot: playerSlot,
        points,
        is_queen: isQueen
      })
      if (res && res.success) {
        if (res.data?.events) setMatchEvents(res.data.events)
        if (isQueen) setQueenClaimed(true)
        onUpdateScore(currentMatch.id, {
          player1_score: res.data.player1_score,
          player2_score: res.data.player2_score,
          boards_played: Math.max(0, (Number(currentMatch.boards_played) || 0) + 1)
        })
      } else {
        alert(res?.message || 'Failed to record score')
      }
    } catch (err) {
      alert('Error recording score: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Undo Last Score Event
  const handleUndoScore = async () => {
    if (!currentMatch || actionLoading) return
    if (matchEvents.length === 0) {
      alert('No score actions recorded yet to undo.')
      return
    }

    setActionLoading(true)
    try {
      const res = await api.undoMatchEvent(currentMatch.id)
      if (res && res.success) {
        const remainingEvents = res.data?.events || []
        setMatchEvents(remainingEvents)
        const stillHasQueen = remainingEvents.some(
          (e) => Number(e.board_number) === Number(activeBoard) && (e.is_queen === 1 || e.is_queen === true)
        )
        setQueenClaimed(stillHasQueen)
        onUpdateScore(currentMatch.id, {
          player1_score: res.data.player1_score,
          player2_score: res.data.player2_score
        })
      } else {
        alert(res?.message || 'Failed to undo score')
      }
    } catch (err) {
      alert('Error undoing score: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const adjustScore = (player, delta) => {
    if (!currentMatch) return
    const key = player === 1 ? 'player1_score' : 'player2_score'
    const newScore = Math.max(0, (Number(currentMatch[key]) || 0) + delta)
    onUpdateScore(currentMatch.id, {
      [key]: newScore,
      boards_played: Math.max(0, (Number(currentMatch.boards_played) || 0) + (delta > 0 ? 1 : 0))
    })
  }

  const setBoardNumber = (board) => {
    if (!currentMatch) return
    const newBoard = Number(board)
    const queenInNewBoard = matchEvents.some(
      (e) => Number(e.board_number) === newBoard && (e.is_queen === 1 || e.is_queen === true)
    )
    setQueenClaimed(queenInNewBoard)
    onUpdateScore(currentMatch.id, { current_board: newBoard })
  }

  const renderSlotScorePad = (slot, boardScore, totalScore) => {
    const canFine = boardScore > 0 || totalScore > 0
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, width: '100%', maxWidth: 196 }}>
          {[1, 2, 3].map((pts) => (
            <Button
              key={`p-${pts}`}
              variant="contained"
              color="primary"
              size="small"
              disabled={actionLoading}
              onClick={() => handleRecordScore(slot, pts, false)}
              sx={{ minWidth: 0, px: 0.5, py: 0.5, borderRadius: 1, fontWeight: 800, fontSize: '0.78rem' }}
            >
              +{pts}
            </Button>
          ))}
          {[-1, -2, -3].map((pts) => (
            <Button
              key={`m-${pts}`}
              variant="outlined"
              color="error"
              size="small"
              disabled={actionLoading || !canFine}
              onClick={() => handleRecordScore(slot, pts, false)}
              sx={{ minWidth: 0, px: 0.5, py: 0.45, borderRadius: 1, fontWeight: 800, fontSize: '0.76rem' }}
            >
              {pts}
            </Button>
          ))}
        </Box>
        {isQueenClaimedInActiveBoard ? (
          queenClaimerSlot === slot ? (
            <Chip
              size="small"
              icon={<QueenIcon sx={{ fontSize: '14px !important', color: '#F59E0B !important' }} />}
              label="Queen (+3) Pocketed"
              sx={{
                borderRadius: 1,
                fontSize: '0.72rem',
                fontWeight: 800,
                bgcolor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
                color: isDark ? '#FBBF24' : '#B45309',
                border: '1px solid rgba(245, 158, 11, 0.4)'
              }}
            />
          ) : (
            <Chip
              size="small"
              icon={<LockIcon sx={{ fontSize: '12px !important' }} />}
              label="Queen Claimed"
              sx={{
                borderRadius: 1,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                color: 'text.disabled',
                border: `1px solid ${theme.palette.divider}`
              }}
            />
          )
        ) : (
          <Button
            variant="contained"
            color="warning"
            size="small"
            disabled={actionLoading}
            onClick={() => handleRecordScore(slot, 3, true)}
            startIcon={<QueenIcon sx={{ fontSize: '14px !important' }} />}
            sx={{ width: '100%', maxWidth: 196, borderRadius: 1, fontSize: '0.72rem', fontWeight: 800 }}
          >
            Queen +3
          </Button>
        )}
      </Box>
    )
  }

  // Set match status with automatic winner resolution
  const setMatchStatus = (newStatus) => {
    if (!currentMatch) return

    let finalWinnerId = currentMatch.winner_id || null
    if (newStatus === 'Completed' && !finalWinnerId) {
      const p1 = Number(currentMatch.player1_score || 0)
      const p2 = Number(currentMatch.player2_score || 0)
      if (p1 > p2) {
        finalWinnerId = currentMatch.player1_id
      } else if (p2 > p1) {
        finalWinnerId = currentMatch.player2_id
      } else {
        finalWinnerId = null // Tied / Draw
      }
    }

    onUpdateScore(currentMatch.id, {
      status: newStatus,
      winner_id: finalWinnerId
    })
  }

  // Explicitly declare or change winner / draw
  const handleDeclareWinner = (wId) => {
    if (!currentMatch) return
    onUpdateScore(currentMatch.id, {
      winner_id: wId ? Number(wId) : null,
      status: 'Completed'
    })
  }

  const handleSaveStream = () => {
    if (!currentMatch) return
    onUpdateScore(currentMatch.id, { stream_url: streamUrlInput.trim() })
    setIsEditingStream(false)
  }

  const handleScheduleSubmit = (e) => {
    e.preventDefault()
    if (!newMatchData.player1_name || !newMatchData.player2_name) return
    onCreateMatch(newMatchData)
    setIsScheduleOpen(false)
    setNewMatchData({
      tournament_id: tournaments.length > 0 ? tournaments[0].id : 1,
      player1_name: '',
      player2_name: '',
      round_name: 'Quarter Final - Board 1',
      board_number: 1,
      status: 'Live',
      stream_url: '',
      match_date: getTodayIsoString()
    })
  }

  if (loading) {
    return <MatchesViewSkeleton />
  }

  const embedStreamUrl = currentMatch?.stream_url ? getEmbedUrl(currentMatch.stream_url) : null

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. Page Header */}
      <PageHeader
        title={umpireAccessOnly ? 'Assigned Matches & Officiating Console' : 'Live Match Arena & Court Console'}
        subtitle={
          umpireAccessOnly
            ? 'Your assigned court matches — update live board points, Queen claims, toss choices & match completion'
            : 'Real-time court scoreboard, Queen bonus points & YouTube/Facebook live broadcast streaming'
        }
        actions={
          !umpireAccessOnly ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setIsScheduleOpen(true)}
              sx={{ px: 2.5, fontWeight: 700, borderRadius: 2 }}
            >
              Schedule Match
            </Button>
          ) : null
        }
      />

      {/* 2. Tournament Filter & Status Navigation Bar */}
      <Card
        sx={{
          p: 2,
          borderRadius: 1.5,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
        }}
      >
        {/* Status / Time Quick Filter Pills */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto', pb: { xs: 0.5, md: 0 } }}>
          <Chip
            label={`All (${matches.length})`}
            onClick={() => setStatusFilter('All')}
            color={statusFilter === 'All' ? 'primary' : 'default'}
            variant={statusFilter === 'All' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 750, fontSize: '0.75rem', cursor: 'pointer' }}
          />
          <Chip
            icon={<DotIcon sx={{ fontSize: '14px !important', color: '#EF4444' }} />}
            label={`Live Courts (${liveCount})`}
            onClick={() => setStatusFilter('Live')}
            color={statusFilter === 'Live' ? 'error' : 'default'}
            variant={statusFilter === 'Live' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              ...(liveCount > 0 && { borderColor: '#EF4444' })
            }}
          />
          <Chip
            icon={<CalendarIcon sx={{ fontSize: '14px !important' }} />}
            label={`Today (${todayCount})`}
            onClick={() => setStatusFilter('Today')}
            color={statusFilter === 'Today' ? 'secondary' : 'default'}
            variant={statusFilter === 'Today' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 750, fontSize: '0.75rem', cursor: 'pointer' }}
          />
          <Chip
            label="Scheduled"
            onClick={() => setStatusFilter('Scheduled')}
            variant={statusFilter === 'Scheduled' ? 'filled' : 'outlined'}
            color={statusFilter === 'Scheduled' ? 'primary' : 'default'}
            sx={{ fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
          />
          <Chip
            label="Completed"
            onClick={() => setStatusFilter('Completed')}
            variant={statusFilter === 'Completed' ? 'filled' : 'outlined'}
            color={statusFilter === 'Completed' ? 'success' : 'default'}
            sx={{ fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
          />
        </Box>

        {/* Tournament Filter Dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrophyIcon sx={{ color: 'primary.main', fontSize: 20, display: { xs: 'none', sm: 'block' } }} />
          <TextField
            select
            size="small"
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
            sx={{
              minWidth: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': { borderRadius: 2 }
            }}
            label="Filter Championship"
          >
            <MenuItem value="All">
              <em>All Tournaments ({matches.length} Matches)</em>
            </MenuItem>
            {tournaments.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.title}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Card>

      {/* 3. Horizontal Match Switcher Roster (Live & Today at the front) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflowX: 'auto', pb: 0.8, maxWidth: '100%' }}>
        {sortedAndFilteredMatches.map((m) => {
          const isSelected = currentMatch && currentMatch.id === m.id
          const isLive = (m.status || '').toLowerCase() === 'live'
          const isToday = isMatchToday(m)

          return (
            <Button
              key={m.id}
              variant={isSelected ? 'contained' : 'outlined'}
              color={isSelected ? 'primary' : 'inherit'}
              onClick={() => setSelectedMatchId(m.id)}
              size="small"
              sx={{
                borderRadius: 1.5,
                whiteSpace: 'nowrap',
                px: 1.8,
                py: 0.9,
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                flexShrink: 0,
                borderColor: isSelected
                  ? 'transparent'
                  : isLive
                  ? 'rgba(239,68,68,0.5)'
                  : theme.palette.divider,
                backgroundColor: isSelected
                  ? undefined
                  : isLive
                  ? isDark
                    ? 'rgba(239,68,68,0.08)'
                    : '#FEF2F2'
                  : undefined,
                transition: 'all 0.15s ease'
              }}
            >
              {isLive ? (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    boxShadow: '0 0 8px #EF4444'
                  }}
                />
              ) : isToday ? (
                <Chip
                  label="Today"
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    bgcolor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7',
                    color: isDark ? '#F59E0B' : '#B45309'
                  }}
                />
              ) : null}

              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', fontSize: '0.78rem' }}>
                  {m.player1_name?.split(' ')[0]} vs {m.player2_name?.split(' ')[0]}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.68rem', opacity: 0.8 }}>
                  Board #{m.board_number || 1} • ({m.player1_score || 0} - {m.player2_score || 0})
                </Typography>
              </Box>
            </Button>
          )
        })}

        {sortedAndFilteredMatches.length === 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary', p: 1 }}>
            No matches found matching current tournament and status filters.
          </Typography>
        )}
      </Box>

      {/* 4. Main Scoring & Live Broadcast Console */}
      {currentMatch ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
          {/* Left Column: Live Score Board */}
          <Card
            sx={{
              borderRadius: 1.5,
              borderTop: `4px solid ${
                currentMatch.status === 'Live' ? theme.palette.error.main : theme.palette.primary.main
              }`
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              {/* Match Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip
                      label={currentMatch.tournament_title || 'Tournament Championship'}
                      size="small"
                      sx={{ fontWeight: 750, fontSize: '0.72rem', bgcolor: isDark ? '#27272A' : '#E2E8F0' }}
                    />
                    {isMatchToday(currentMatch) && (
                      <Chip
                        label="Today's Court"
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 800, fontSize: '0.68rem', height: 20 }}
                      />
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {currentMatch.round_name || 'Championship Round'} • Board Court #{currentMatch.board_number || 1}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={currentMatch.status}
                    color={
                      currentMatch.status === 'Live'
                        ? 'error'
                        : currentMatch.status === 'Completed'
                        ? 'success'
                        : 'default'
                    }
                    size="small"
                    sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                  />
                  {!umpireAccessOnly && (
                    <Tooltip title="Delete Match Record">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this match record?')) {
                            onDeleteMatch(currentMatch.id)
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Officiating Umpire / Referee Row */}
              <Box
                sx={{
                  p: 1.2,
                  mb: 2,
                  borderRadius: 1.5,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UmpireIcon sx={{ fontSize: '1.25rem', color: '#3B82F6' }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', display: 'block' }}>
                      Officiating Umpire / Referee
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      {currentMatch.umpire_name ? (
                        <span style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>
                          {currentMatch.umpire_name}
                        </span>
                      ) : (
                        <span style={{ color: theme.palette.text.secondary }}>
                          No umpire assigned to this court
                        </span>
                      )}
                    </Typography>
                  </Box>
                </Box>

                {!umpireAccessOnly && (
                  <TextField
                    select
                    size="small"
                    label="Assign Umpire"
                    value={currentMatch.umpire_id || ''}
                    onChange={(e) => {
                      const uId = e.target.value ? Number(e.target.value) : null
                      const selectedUmpire = umpires.find(u => Number(u.id) === uId)
                      onUpdateScore(currentMatch.id, {
                        umpire_id: uId,
                        umpire_name: selectedUmpire ? selectedUmpire.name : null
                      })
                    }}
                    sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 1, height: 34, fontSize: '0.78rem' } }}
                    InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                  >
                    <MenuItem value="">
                      <em>None (Unassigned)</em>
                    </MenuItem>
                    {umpires.map((ump) => (
                      <MenuItem key={ump.id} value={ump.id} sx={{ fontSize: '0.78rem' }}>
                        {ump.name} ({ump.unique_id || `BCF-U-${ump.id}`})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>

              {/* Official Carrom Toss & Color Bar (ICF Official Rules) */}
              <Box
                sx={{
                  p: 1.5,
                  mb: 2.5,
                  borderRadius: 1.5,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TossIcon sx={{ fontSize: '1.25rem', color: isDark ? '#34D399' : '#059669' }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', display: 'block' }}>
                      ICF Match Toss & Opening Break
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      {currentMatch.toss_winner_id ? (
                        <>
                          Winner: <strong style={{ color: isDark ? '#34D399' : '#059669' }}>
                            {Number(currentMatch.toss_winner_id) === Number(currentMatch.player1_id) ? currentMatch.player1_name : currentMatch.player2_name}
                          </strong> • Chose: <strong>{currentMatch.toss_choice || 'White'}</strong> ({currentMatch.toss_decision || 'Strike First'})
                        </>
                      ) : (
                        <span style={{ color: theme.palette.text.secondary }}>
                          Toss pending — Default: {currentMatch.player1_name} breaks with White on Board #1
                        </span>
                      )}
                    </Typography>
                  </Box>
                </Box>

                {/* Quick Toss Selector Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <TextField
                    select
                    size="small"
                    label="Toss Winner"
                    value={currentMatch.toss_winner_id || currentMatch.player1_id || ''}
                    onChange={(e) => handleSetToss(Number(e.target.value), currentMatch.toss_choice || 'White')}
                    sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 1, height: 34, fontSize: '0.78rem' } }}
                    InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                  >
                    <MenuItem value={currentMatch.player1_id || 1} sx={{ fontSize: '0.78rem' }}>
                      {currentMatch.player1_name || 'Player 1'}
                    </MenuItem>
                    <MenuItem value={currentMatch.player2_id || 2} sx={{ fontSize: '0.78rem' }}>
                      {currentMatch.player2_name || 'Player 2'}
                    </MenuItem>
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="Choice"
                    value={currentMatch.toss_choice || 'White'}
                    onChange={(e) => handleSetToss(currentMatch.toss_winner_id || currentMatch.player1_id, e.target.value)}
                    sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 1, height: 34, fontSize: '0.78rem' } }}
                    InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                  >
                    <MenuItem value="White" sx={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <DotIcon sx={{ fontSize: 10, color: isDark ? '#FFFFFF' : '#64748B' }} /> White (Break)
                    </MenuItem>
                    <MenuItem value="Black" sx={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <DotIcon sx={{ fontSize: 10, color: isDark ? '#64748B' : '#0F172A' }} /> Black (Defend)
                    </MenuItem>
                  </TextField>
                </Box>
              </Box>

              {/* Head-to-Head Scoring Card */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: 3,
                  p: 2.5,
                  borderRadius: 1.5,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${theme.palette.divider}`,
                  mb: 2.5
                }}
              >
                {/* Player 1 Side */}
                <Box sx={{ textAlign: 'center' }}>
                  {(() => {
                    const p1Role = getCarromRoleAndColor(currentMatch, 1, activeBoard)
                    return (
                      <Chip
                        size="small"
                        icon={<DotIcon sx={{ fontSize: '10px !important', color: p1Role.isWhite ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#334155') }} />}
                        label={p1Role.role}
                        sx={{
                          mb: 1,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          borderRadius: 1,
                          bgcolor: p1Role.isWhite
                            ? (isDark ? 'rgba(255, 255, 255, 0.12)' : '#F1F5F9')
                            : (isDark ? 'rgba(0, 0, 0, 0.4)' : '#334155'),
                          color: p1Role.isWhite
                            ? (isDark ? '#FFFFFF' : '#0F172A')
                            : (isDark ? '#E2E8F0' : '#FFFFFF'),
                          border: `1px solid ${p1Role.isWhite ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)'}`
                        }}
                      />
                    )
                  })()}
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 0.5 }}>
                    {currentMatch.player1_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', display: 'block', mb: 0.5 }}>
                    Board #{activeBoard} Points
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5 }}>
                    {activeBoardScore.player1}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', mb: 1.5 }}>
                    Total Match: <strong style={{ color: isDark ? '#34D399' : '#059669' }}>{currentMatch.player1_score || 0} pts</strong>
                  </Typography>
                  {renderSlotScorePad(1, activeBoardScore.player1, currentMatch.player1_score || 0)}
                </Box>

                {/* Center Divider / Current Board & Undo Action */}
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block' }}>
                    VS
                  </Typography>
                  <Chip
                    label={`Court Board #${activeBoard}`}
                    color="primary"
                    size="small"
                    sx={{ my: 0.8, fontWeight: 800, fontSize: '0.72rem', borderRadius: 1 }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>
                    Match Total: {currentMatch.player1_score || 0} - {currentMatch.player2_score || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.68rem', mb: 1 }}>
                    Boards Cap: {totalBoardsCount} (Played: {currentMatch.boards_played || 0})
                  </Typography>

                  {/* Undo Button */}
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    disabled={actionLoading || matchEvents.length === 0}
                    onClick={handleUndoScore}
                    startIcon={<UndoIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontWeight: 750,
                      px: 1.2,
                      py: 0.2
                    }}
                  >
                    Undo Last Score
                  </Button>
                </Box>

                {/* Player 2 Side */}
                <Box sx={{ textAlign: 'center' }}>
                  {(() => {
                    const p2Role = getCarromRoleAndColor(currentMatch, 2, activeBoard)
                    return (
                      <Chip
                        size="small"
                        icon={<DotIcon sx={{ fontSize: '10px !important', color: p2Role.isWhite ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#334155') }} />}
                        label={p2Role.role}
                        sx={{
                          mb: 1,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          borderRadius: 1,
                          bgcolor: p2Role.isWhite
                            ? (isDark ? 'rgba(255, 255, 255, 0.12)' : '#F1F5F9')
                            : (isDark ? 'rgba(0, 0, 0, 0.4)' : '#334155'),
                          color: p2Role.isWhite
                            ? (isDark ? '#FFFFFF' : '#0F172A')
                            : (isDark ? '#E2E8F0' : '#FFFFFF'),
                          border: `1px solid ${p2Role.isWhite ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)'}`
                        }}
                      />
                    )
                  })()}
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 0.5 }}>
                    {currentMatch.player2_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', display: 'block', mb: 0.5 }}>
                    Board #{activeBoard} Points
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5 }}>
                    {activeBoardScore.player2}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', mb: 1.5 }}>
                    Total Match: <strong style={{ color: isDark ? '#34D399' : '#059669' }}>{currentMatch.player2_score || 0} pts</strong>
                  </Typography>
                  {renderSlotScorePad(2, activeBoardScore.player2, currentMatch.player2_score || 0)}
                </Box>
              </Box>

              {/* Board Navigator & On-Demand Addition Bar */}
              <Box sx={{ p: 1.5, mb: 2.5, borderRadius: 1.5, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mr: 0.5 }}>
                      Tournament Boards ({availableBoards.length}):
                    </Typography>
                    {availableBoards.map((b) => {
                      const bScore = boardScores[b] || { player1: 0, player2: 0 }
                      const isActive = activeBoard === b
                      return (
                        <Button
                          key={b}
                          size="small"
                          variant={isActive ? 'contained' : 'outlined'}
                          color={isActive ? 'primary' : 'inherit'}
                          onClick={() => setBoardNumber(b)}
                          sx={{
                            minWidth: 48,
                            px: 1,
                            height: 30,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            borderRadius: 1.5,
                            textTransform: 'none'
                          }}
                        >
                          B#{b} ({bScore.player1}-{bScore.player2})
                        </Button>
                      )
                    })}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {extraBoards > 0 && (
                      <Chip
                        label={`+${extraBoards} Extra Board`}
                        size="small"
                        color="warning"
                        sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800 }}
                      />
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={handleAddOnDemandBoard}
                      sx={{ height: 30, textTransform: 'none', fontSize: '0.72rem', fontWeight: 750, borderRadius: 1.5 }}
                    >
                      + On-Demand Board
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* Status Controls & Winner/Draw Declaration Panel */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mr: 1 }}>
                      Court Status:
                    </Typography>
                    {['Scheduled', 'Live', 'Completed'].map((st) => (
                      <Button
                        key={st}
                        size="small"
                        variant={currentMatch.status === st ? 'contained' : 'outlined'}
                        color={st === 'Live' ? 'error' : st === 'Completed' ? 'success' : 'inherit'}
                        onClick={() => setMatchStatus(st)}
                        sx={{ borderRadius: 2, fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        {st}
                      </Button>
                    ))}
                  </Box>

                  {/* Winner Display Badge */}
                  {currentMatch.winner_id ? (
                    <Chip
                      icon={<TrophyIcon sx={{ fontSize: '15px !important', color: '#F59E0B !important' }} />}
                      label={`Winner: ${Number(currentMatch.winner_id) === Number(currentMatch.player1_id) ? currentMatch.player1_name : currentMatch.player2_name}`}
                      color="success"
                      size="small"
                      sx={{ fontWeight: 800, fontSize: '0.75rem', height: 26 }}
                    />
                  ) : currentMatch.status === 'Completed' ? (
                    <Chip
                      label="Match Tied / Draw (No Winner)"
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 800, fontSize: '0.72rem', height: 26 }}
                    />
                  ) : null}
                </Box>

                {/* Winner & Draw Decision Bar */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Winner & Outcome Decision:
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant={Number(currentMatch.winner_id) === Number(currentMatch.player1_id) ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => handleDeclareWinner(currentMatch.player1_id)}
                      sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 750 }}
                    >
                      Declare {currentMatch.player1_name?.split(' ')[0]} Winner
                    </Button>
                    <Button
                      size="small"
                      variant={Number(currentMatch.winner_id) === Number(currentMatch.player2_id) ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => handleDeclareWinner(currentMatch.player2_id)}
                      sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 750 }}
                    >
                      Declare {currentMatch.player2_name?.split(' ')[0]} Winner
                    </Button>
                    <Button
                      size="small"
                      variant={currentMatch.status === 'Completed' && !currentMatch.winner_id ? 'contained' : 'outlined'}
                      color="inherit"
                      onClick={() => handleDeclareWinner(null)}
                      sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 700 }}
                    >
                      Declare Draw
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* Turn-by-Turn Score Event Log (ICF Standard) */}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Official Scoring Log ({matchEvents.length} Actions)
                  </Typography>
                </Box>
                {queenClaimed && (
                  <Chip
                    icon={<QueenIcon sx={{ fontSize: '14px !important' }} />}
                    label={`Queen Pocketed (Board #${currentMatch.current_board || 1})`}
                    size="small"
                    color="warning"
                    sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800 }}
                  />
                )}
              </Box>

              {matchEvents.length === 0 ? (
                <Box sx={{ py: 2, textAlign: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    No points recorded yet. Points awarded via +1 or Queen +3 will be logged here with turn order.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[...matchEvents].reverse().map((ev, idx) => {
                    const prevIdx = matchEvents.length - 1 - idx - 1;
                    const prevEv = prevIdx >= 0 ? matchEvents[prevIdx] : null;
                    return (
                      <Box
                        key={ev.id || idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: ev.is_queen ? (isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7') : (isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC'),
                          border: `1px solid ${ev.is_queen ? 'rgba(245, 158, 11, 0.3)' : theme.palette.divider}`
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', width: 22 }}>
                            #{matchEvents.length - idx}
                          </Typography>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.82rem' }}>
                              {ev.player_name}{' '}
                              <Typography component="span" sx={{ fontWeight: 700, color: ev.is_queen ? 'warning.main' : 'primary.main', fontSize: '0.8rem' }}>
                                {ev.is_queen ? 'Pocketed Queen (+3 pts)' : `+${ev.points} point`}
                              </Typography>
                            </Typography>
                            {prevEv && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>
                                scored after {prevEv.player_name} (+{prevEv.points})
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={`Board #${ev.board_number}`}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem', mt: 0.2 }}>
                            {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Live Stream & YouTube Embed */}
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StreamIcon color="error" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Live Broadcast Stream
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setStreamUrlInput(currentMatch.stream_url || '')
                    setIsEditingStream(!isEditingStream)
                  }}
                  sx={{ fontSize: '0.75rem', borderRadius: 1, textTransform: 'none', fontWeight: 700 }}
                >
                  {isEditingStream ? 'Cancel' : 'Edit Stream URL'}
                </Button>
              </Box>

              {isEditingStream && (
                <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: `1px solid ${theme.palette.divider}` }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Live Streaming URL"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={streamUrlInput}
                    onChange={(e) => setStreamUrlInput(e.target.value)}
                    helperText="Supports YouTube watch link, live link, youtu.be, shorts, or Facebook video"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {getEmbedUrl(streamUrlInput) ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                        label="Valid Video URL Detected"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.68rem', fontWeight: 750 }}
                      />
                    ) : streamUrlInput.trim() ? (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        Raw URL will be saved
                      </Typography>
                    ) : <Box />}

                    <Button variant="contained" size="small" onClick={handleSaveStream} sx={{ borderRadius: 2, fontWeight: 700 }}>
                      Save Stream URL
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Stream Video Player Embed or Placeholder */}
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                {embedStreamUrl ? (
                  <iframe
                    key={currentMatch?.id ? `admin-stream-${currentMatch.id}-${embedStreamUrl}` : embedStreamUrl}
                    src={embedStreamUrl}
                    title="Live Broadcast"
                    width="100%"
                    height="100%"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ border: 'none' }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <StreamIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600 }}>
                      No live broadcast URL linked to this court.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Click "Edit Stream URL" to paste a YouTube Live or video URL.
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 1.5 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600 }}>
            No matches scheduled matching the selected tournament filter.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setIsScheduleOpen(true)} sx={{ borderRadius: 1, fontWeight: 700 }}>
            Schedule First Match
          </Button>
        </Card>
      )}

      {/* 5. Schedule Match SideSheet */}
      <SideSheet
        open={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule New Carrom Match"
        subtitle="Set up live match board, tournament, and participants"
        icon={<LiveIcon />}
        width={{ xs: '100%', sm: 540, md: 620 }}
        footerActions={
          <>
            <Button onClick={() => setIsScheduleOpen(false)} color="inherit" sx={{ borderRadius: 1 }}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 1, fontWeight: 700, px: 3 }}
            >
              Schedule Match
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1 }}>
          <TextField
            select
            label="Championship Tournament"
            fullWidth
            size="small"
            value={newMatchData.tournament_id}
            onChange={(e) => setNewMatchData({ ...newMatchData, tournament_id: e.target.value })}
          >
            {tournaments.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.title}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Player 1 Name *"
              fullWidth
              required
              size="small"
              value={newMatchData.player1_name}
              onChange={(e) => setNewMatchData({ ...newMatchData, player1_name: e.target.value })}
            />
            <TextField
              label="Player 2 Name *"
              fullWidth
              required
              size="small"
              value={newMatchData.player2_name}
              onChange={(e) => setNewMatchData({ ...newMatchData, player2_name: e.target.value })}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Round / Stage"
              fullWidth
              size="small"
              value={newMatchData.round_name}
              onChange={(e) => setNewMatchData({ ...newMatchData, round_name: e.target.value })}
            />
            <TextField
              label="Board Number"
              type="number"
              fullWidth
              size="small"
              value={newMatchData.board_number}
              onChange={(e) => setNewMatchData({ ...newMatchData, board_number: Number(e.target.value) })}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Match Date"
              type="date"
              fullWidth
              size="small"
              value={newMatchData.match_date}
              onChange={(e) => setNewMatchData({ ...newMatchData, match_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Initial Status"
              fullWidth
              size="small"
              value={newMatchData.status}
              onChange={(e) => setNewMatchData({ ...newMatchData, status: e.target.value })}
            >
              <MenuItem value="Live">Live In Progress</MenuItem>
              <MenuItem value="Scheduled">Scheduled</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>
          </Box>

          <TextField
            label="Live Stream URL (Optional)"
            fullWidth
            size="small"
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            value={newMatchData.stream_url}
            onChange={(e) => setNewMatchData({ ...newMatchData, stream_url: e.target.value })}
            helperText="Direct YouTube watch, live, or Facebook stream URL"
          />
        </Box>
      </SideSheet>
    </Box>
  )
}
