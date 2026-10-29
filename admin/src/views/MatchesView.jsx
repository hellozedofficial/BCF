import React, { useState } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Divider,
  useTheme
} from '@mui/material'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import {
  Sensors as LiveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as ResetIcon,
  Tv as StreamIcon,
  FlashOn as SlamsIcon,
  Star as QueenIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'

export function MatchesView({
  matches = [],
  tournaments = [],
  onUpdateScore,
  onCreateMatch,
  onDeleteMatch
}) {
  const [selectedMatchId, setSelectedMatchId] = useState(
    matches.length > 0 ? matches[0].id : null
  )
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [streamUrlInput, setStreamUrlInput] = useState('')
  const [isEditingStream, setIsEditingStream] = useState(false)

  const theme = useTheme()

  const [newMatchData, setNewMatchData] = useState({
    tournament_id: tournaments.length > 0 ? tournaments[0].id : 1,
    player1_name: '',
    player2_name: '',
    round_name: 'Quarter Final - Board 1',
    board_number: 1,
    status: 'Scheduled',
    stream_url: ''
  })

  const currentMatch = matches.find((m) => m.id === selectedMatchId) || matches[0]

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
    onUpdateScore(currentMatch.id, { stream_url: streamUrlInput })
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
      status: 'Scheduled',
      stream_url: ''
    })
  }

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Material 3 Page Header */}
      <PageHeader
        title="Live Match Console"
        subtitle="Real-time court scoreboard, Queen bonus points & broadcast streaming"
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsScheduleOpen(true)}
            sx={{ px: 2.5 }}
          >
            Schedule Match
          </Button>
        }
      />

      {/* Top Bar with Match Selection */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
          {matches.map((m) => {
            const isSelected = currentMatch && currentMatch.id === m.id
            return (
              <Button
                key={m.id}
                variant={isSelected ? 'contained' : 'outlined'}
                color={isSelected ? 'primary' : 'inherit'}
                onClick={() => setSelectedMatchId(m.id)}
                size="small"
                startIcon={
                  m.status === 'Live' ? (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'error.main',
                        animation: 'pulse 1.5s infinite'
                      }}
                    />
                  ) : null
                }
                sx={{
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  fontSize: '0.78rem',
                  borderColor: isSelected ? 'transparent' : theme.palette.divider
                }}
              >
                {m.player1_name?.split(' ')[0]} vs {m.player2_name?.split(' ')[0]}
              </Button>
            )
          })}
        </Box>

      </Box>

      {/* Main Scoring Console */}
      {currentMatch ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
          {/* Left Column: Live Score Board */}
          <Card sx={{ borderTop: `4px solid ${currentMatch.status === 'Live' ? theme.palette.error.main : theme.palette.primary.main}` }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              {/* Match Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {currentMatch.tournament_title || 'National Championship Match'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {currentMatch.round_name || 'Quarter Final'} • Board Court #{currentMatch.board_number || 1}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={currentMatch.status}
                    color={currentMatch.status === 'Live' ? 'error' : currentMatch.status === 'Completed' ? 'success' : 'default'}
                    size="small"
                    sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                  />
                  <Tooltip title="Delete Match">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm('Delete this match record?')) onDeleteMatch(currentMatch.id)
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

                {/* VS Divider */}
                <Box sx={{ textAlign: 'center', px: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
                    CURRENT BOARD
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', my: 0.5 }}>
                    {currentMatch.current_board || 1}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Boards: {currentMatch.boards_played || 0}
                  </Typography>
                </Box>

                {/* Player 2 Side */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 1 }}>
                    {currentMatch.player2_name}
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'secondary.main', mb: 2 }}>
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
                      color="secondary"
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    SET STATUS:
                  </Typography>
                  <Button
                    size="small"
                    variant={currentMatch.status === 'Scheduled' ? 'contained' : 'outlined'}
                    onClick={() => setMatchStatus('Scheduled')}
                    sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                  >
                    Scheduled
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant={currentMatch.status === 'Live' ? 'contained' : 'outlined'}
                    onClick={() => setMatchStatus('Live')}
                    sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                  >
                    Set Live
                  </Button>
                  <Button
                    size="small"
                    color="success"
                    variant={currentMatch.status === 'Completed' ? 'contained' : 'outlined'}
                    onClick={() => setMatchStatus('Completed')}
                    sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                  >
                    Finish
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    BOARD:
                  </Typography>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((b) => (
                    <Button
                      key={b}
                      size="small"
                      variant={currentMatch.current_board === b ? 'contained' : 'outlined'}
                      onClick={() => setBoardNumber(b)}
                      sx={{ minWidth: 28, height: 28, p: 0, borderRadius: 1.5, fontSize: '0.75rem' }}
                    >
                      {b}
                    </Button>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Right Column: Live Stream & Court Information */}
          <Card>
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
                  variant="text"
                  onClick={() => {
                    setStreamUrlInput(currentMatch.stream_url || '')
                    setIsEditingStream(!isEditingStream)
                  }}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {isEditingStream ? 'Cancel' : 'Edit Stream URL'}
                </Button>
              </Box>

              {isEditingStream && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="YouTube or RTMP embed URL"
                    value={streamUrlInput}
                    onChange={(e) => setStreamUrlInput(e.target.value)}
                  />
                  <Button variant="contained" size="small" onClick={handleSaveStream}>
                    Save
                  </Button>
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
                {currentMatch.stream_url ? (
                  <iframe
                    src={currentMatch.stream_url}
                    title="Live Broadcast"
                    width="100%"
                    height="100%"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ border: 'none' }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <StreamIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      No live broadcast URL linked to this court.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Click "Edit Stream URL" to link YouTube Live stream.
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            No matches scheduled yet.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setIsScheduleOpen(true)}>
            Schedule First Match
          </Button>
        </Card>
      )}

      {/* Schedule Match SideSheet with Fixed Header & Footer */}
      <SideSheet
        open={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule New Carrom Match"
        subtitle="Set up live match board, round and participants"
        icon={<LiveIcon />}
        width={{ xs: '100%', sm: 540, md: 620 }}
        footerActions={
          <>
            <Button onClick={() => setIsScheduleOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button onClick={handleScheduleSubmit} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
              Schedule Match
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Championship"
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
              label="Player 1 Name"
              fullWidth
              required
              size="small"
              value={newMatchData.player1_name}
              onChange={(e) => setNewMatchData({ ...newMatchData, player1_name: e.target.value })}
            />
            <TextField
              label="Player 2 Name"
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

          <TextField
            label="Live Stream URL (Optional)"
            fullWidth
            size="small"
            placeholder="https://www.youtube.com/embed/..."
            value={newMatchData.stream_url}
            onChange={(e) => setNewMatchData({ ...newMatchData, stream_url: e.target.value })}
          />
        </Box>
      </SideSheet>
    </Box>
  )
}
