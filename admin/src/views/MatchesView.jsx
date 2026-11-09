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
import {
  Sensors as LiveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Tv as StreamIcon,
  Star as QueenIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as TrophyIcon,
  FiberManualRecord as DotIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'

export function MatchesView({
  matches = [],
  tournaments = [],
  loading = false,
  onUpdateScore,
  onCreateMatch,
  onDeleteMatch
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Tournament & Status Filter State
  const [tournamentFilter, setTournamentFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All') // 'All', 'Live', 'Today', 'Scheduled', 'Completed'
  const [selectedMatchId, setSelectedMatchId] = useState(null)

  // Scheduling side sheet state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [streamUrlInput, setStreamUrlInput] = useState('')
  const [isEditingStream, setIsEditingStream] = useState(false)

  // Sync stream input whenever active match changes
  useEffect(() => {
    if (currentMatch) {
      setStreamUrlInput(currentMatch.stream_url || '')
      setIsEditingStream(false)
    }
  }, [currentMatch?.id, currentMatch?.stream_url])

  const [newMatchData, setNewMatchData] = useState({
    tournament_id: tournaments.length > 0 ? tournaments[0].id : 1,
    player1_name: '',
    player2_name: '',
    round_name: 'Quarter Final - Board 1',
    board_number: 1,
    status: 'Live',
    stream_url: '',
    match_date: new Date().toISOString().split('T')[0]
  })

  // Date Helper: Determine if a match is scheduled or played today
  const isMatchToday = (m) => {
    const rawDate = m.match_date || m.scheduled_at || m.created_at
    if (!rawDate) return false
    try {
      const matchDay = new Date(rawDate).toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]
      return matchDay === today
    } catch {
      return false
    }
  }

  // Filter and Sort: Live first, Today next, Recent date descending
  const sortedAndFilteredMatches = useMemo(() => {
    let list = [...matches]

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
    // Priority 1: Live matches
    // Priority 2: Today's matches
    // Priority 3: Recent dates descending (newest first)
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
    if (selectedMatchId) {
      const found = matches.find((m) => m.id === selectedMatchId)
      if (found) return found
    }
    return sortedAndFilteredMatches[0] || matches[0] || null
  }, [matches, selectedMatchId, sortedAndFilteredMatches])

  // Metric counts
  const liveCount = matches.filter((m) => (m.status || '').toLowerCase() === 'live').length
  const todayCount = matches.filter((m) => isMatchToday(m)).length

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
    onUpdateScore(currentMatch.id, { current_board: Number(board) })
  }

  const setMatchStatus = (status) => {
    if (!currentMatch) return
    onUpdateScore(currentMatch.id, { status })
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
      match_date: new Date().toISOString().split('T')[0]
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
        title="Live Match Arena & Court Console"
        subtitle="Real-time court scoreboard, Queen bonus points & YouTube/Facebook live broadcast streaming"
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsScheduleOpen(true)}
            sx={{ px: 2.5, fontWeight: 700, borderRadius: 2 }}
          >
            Schedule Match
          </Button>
        }
      />

      {/* 2. Tournament Filter & Status Navigation Bar */}
      <Card
        sx={{
          p: 2,
          borderRadius: 3,
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
                borderRadius: 2.5,
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
              borderRadius: 3.5,
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
                </Box>
              </Box>

              {/* Head-to-Head Scoring Card */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: 3,
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${theme.palette.divider}`,
                  mb: 3
                }}
              >
                {/* Player 1 Side */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 1 }}>
                    {currentMatch.player1_name}
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>
                    {currentMatch.player1_score || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => adjustScore(1, -1)}
                      sx={{ minWidth: 36, px: 1, borderRadius: 1.5 }}
                    >
                      -1
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => adjustScore(1, 1)}
                      sx={{ minWidth: 44, px: 2, borderRadius: 1.5, fontWeight: 800 }}
                    >
                      +1
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => adjustScore(1, 3)}
                      startIcon={<QueenIcon sx={{ fontSize: '14px !important' }} />}
                      sx={{ borderRadius: 1.5, fontSize: '0.72rem' }}
                    >
                      Queen +3
                    </Button>
                  </Box>
                </Box>

                {/* Center Divider / Current Board indicator */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block' }}>
                    VS
                  </Typography>
                  <Chip
                    label={`Board #${currentMatch.current_board || 1}`}
                    size="small"
                    sx={{ my: 1, fontWeight: 750, fontSize: '0.7rem' }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                    Played: {currentMatch.boards_played || 0}
                  </Typography>
                </Box>

                {/* Player 2 Side */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 1 }}>
                    {currentMatch.player2_name}
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>
                    {currentMatch.player2_score || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => adjustScore(2, -1)}
                      sx={{ minWidth: 36, px: 1, borderRadius: 1.5 }}
                    >
                      -1
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => adjustScore(2, 1)}
                      sx={{ minWidth: 44, px: 2, borderRadius: 1.5, fontWeight: 800 }}
                    >
                      +1
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => adjustScore(2, 3)}
                      startIcon={<QueenIcon sx={{ fontSize: '14px !important' }} />}
                      sx={{ borderRadius: 1.5, fontSize: '0.72rem' }}
                    >
                      Queen +3
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* Status Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
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

                {/* Board Step Navigator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Active Board:
                  </Typography>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((b) => (
                    <Button
                      key={b}
                      size="small"
                      variant={currentMatch.current_board === b ? 'contained' : 'outlined'}
                      color={currentMatch.current_board === b ? 'primary' : 'inherit'}
                      onClick={() => setBoardNumber(b)}
                      sx={{ minWidth: 28, px: 0.8, height: 28, fontSize: '0.72rem', borderRadius: 1 }}
                    >
                      {b}
                    </Button>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Right Column: Live Stream & YouTube Embed */}
          <Card sx={{ borderRadius: 3.5 }}>
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
                  sx={{ fontSize: '0.75rem', borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  {isEditingStream ? 'Cancel' : 'Edit Stream URL'}
                </Button>
              </Box>

              {isEditingStream && (
                <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: `1px solid ${theme.palette.divider}` }}>
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
                  borderRadius: 2.5,
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
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3.5 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600 }}>
            No matches scheduled matching the selected tournament filter.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setIsScheduleOpen(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
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
            <Button onClick={() => setIsScheduleOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
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
