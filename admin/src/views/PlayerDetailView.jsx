import React, { useState, useEffect } from 'react'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Shield as ClubIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  EmojiEvents as TrophyIcon,
  FlashOn as SlamsIcon,
  SportsKabaddi as SportsIcon,
  CalendarMonth as CalendarIcon,
  Fingerprint as NidIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material'
import { fetchPlayerById, updatePlayer, getMediaUrl, getClientWebsiteUrl } from '../services/api'
import { BD_DIVISIONS, BD_DISTRICTS_BY_DIVISION, ALL_BD_DISTRICTS } from '../utils/geoData'
import { PageHeader } from '../components/Common/PageHeader'

export function PlayerDetailView({ clubs = [], onUpdatePlayer }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()

  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  // Document Zoom Modal State
  const [zoomImage, setZoomImage] = useState(null)

  const loadPlayerData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPlayerById(id)
      if (data) {
        setPlayer(data)
        setEditFormData({
          full_name: data.full_name || '',
          nickname: data.nickname || '',
          gender: data.gender || 'Men',
          category: data.category || 'Senior',
          club_name: data.club_name || 'Independent',
          division: data.division || 'Dhaka',
          district: data.district || 'Dhaka',
          dominant_hand: data.dominant_hand || 'Right Hand',
          playing_style: data.playing_style || 'All-Rounder',
          carrom_board_preference: data.carrom_board_preference || 'Championship 29x29 Standard',
          national_rank: data.national_rank || '',
          rating_points: data.rating_points || 1200,
          matches_played: data.matches_played || 0,
          matches_won: data.matches_won || 0,
          white_slams: data.white_slams || 0,
          black_slams: data.black_slams || 0,
          status: data.status || 'Active',
          phone: data.phone || '',
          email: data.email || '',
          photo_url: data.photo_url || ''
        })
      } else {
        setError('Player profile not found in database.')
      }
    } catch (err) {
      setError('Failed to fetch player details from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlayerData()
  }, [id])

  const handleCopyId = (txt) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleStatus = async () => {
    if (!player) return
    const newStatus = player.status === 'Active' ? 'Inactive' : 'Active'
    try {
      await updatePlayer(player.id, { ...player, status: newStatus })
      if (onUpdatePlayer) {
        onUpdatePlayer(player.id, { ...player, status: newStatus })
      }
      setPlayer(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      alert('Failed to update player status')
    }
  }

  const handleSaveEdit = async () => {
    if (!player) return
    setEditSaving(true)
    try {
      const payload = {
        ...editFormData,
        national_rank: editFormData.national_rank ? parseInt(editFormData.national_rank, 10) : null,
        rating_points: parseInt(editFormData.rating_points, 10) || 1200,
        matches_played: parseInt(editFormData.matches_played, 10) || 0,
        matches_won: parseInt(editFormData.matches_won, 10) || 0,
        white_slams: parseInt(editFormData.white_slams, 10) || 0,
        black_slams: parseInt(editFormData.black_slams, 10) || 0
      }
      await updatePlayer(player.id, payload)
      if (onUpdatePlayer) {
        onUpdatePlayer(player.id, payload)
      }
      setPlayer(prev => ({ ...prev, ...payload }))
      setEditOpen(false)
    } catch (err) {
      alert('Error updating player profile: ' + err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const handleEditPhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setEditFormData(prev => ({ ...prev, photo_url: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={44} color="primary" />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Loading Athlete Profile...
        </Typography>
      </Box>
    )
  }

  if (error || !player) {
    return (
      <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 480, width: '100%', borderRadius: 2 }}>
          {error || 'Player profile not found.'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/players')}
          sx={{ borderRadius: 2 }}
        >
          Return to National Players
        </Button>
      </Box>
    )
  }

  const displayId = player.player_id || `BCF-${String(player.id).padStart(6, '0')}`
  const matchesPlayed = player.matches_played || 0
  const matchesWon = player.matches_won || 0
  const matchesLost = Math.max(0, matchesPlayed - matchesWon)
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0
  const whiteSlams = player.white_slams || 0
  const blackSlams = player.black_slams || 0
  const totalSlams = whiteSlams + blackSlams
  const rating = player.rating_points || 1200
  const isActive = player.status === 'Active'

  // Rating Tier Calculation
  const getTier = (pts) => {
    if (pts >= 1800) return { label: 'Grandmaster', color: 'warning' }
    if (pts >= 1700) return { label: 'Master Striker', color: 'secondary' }
    if (pts >= 1500) return { label: 'Elite Pro', color: 'success' }
    if (pts >= 1300) return { label: 'Contender', color: 'info' }
    return { label: 'Challenger', color: 'default' }
  }
  const tier = getTier(rating)

  const clientUrl = `${getClientWebsiteUrl()}/player/${player.player_id || player.id}`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 6 }}>
      <PageHeader title={player ? `${player.name} (${displayId})` : 'Athlete Profile'} />

      {/* Top Navigation & Breadcrumbs Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/players')}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Players
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              National Roster /
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {player.full_name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="info"
            size="small"
            component="a"
            href={clientUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<OpenInNewIcon />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Public Profile
          </Button>
          <Button
            variant={isActive ? 'outlined' : 'contained'}
            color={isActive ? 'error' : 'success'}
            size="small"
            onClick={handleToggleStatus}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {isActive ? 'Deactivate Player' : 'Activate Player'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      {/* ===================== HERO ATHLETE CARD ===================== */}
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
            : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'flex-start', md: 'center' } }}>
            {/* Player Avatar */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={getMediaUrl(player.photo_url)}
                alt={player.full_name}
                sx={{
                  width: { xs: 88, md: 104 },
                  height: { xs: 88, md: 104 },
                  borderRadius: 3,
                  border: '3px solid',
                  borderColor: isActive ? 'success.main' : 'error.main',
                  fontSize: '2rem',
                  fontWeight: 800,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
                }}
              >
                {(player.full_name || 'P')[0]}
              </Avatar>
              <Chip
                size="small"
                label={isActive ? 'Active' : 'Inactive'}
                color={isActive ? 'success' : 'error'}
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 20
                }}
              />
            </Box>

            {/* Core Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                  {player.full_name}
                </Typography>
                {player.name_bn && (
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
                    ({player.name_bn})
                  </Typography>
                )}
                <Chip
                  size="small"
                  label="BCF Certified"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  @{player.nickname || (player.full_name ? player.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'athlete')}
                </Typography>
                <Typography variant="body2" color="text.tertiary">•</Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.2,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCopyId(displayId)}
                >
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                    ID: {displayId}
                  </Typography>
                  <CopyIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                </Box>
                {copied && (
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                    Copied
                  </Typography>
                )}
                <Typography variant="body2" color="text.tertiary">•</Typography>
                <Chip
                  size="small"
                  label={`${player.gender || 'Men'} • ${player.category || 'Senior'}`}
                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                />
                <Chip
                  size="small"
                  label={tier.label}
                  color={tier.color}
                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                />
              </Box>

              {/* Location & Metadata Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 1.8, flexWrap: 'wrap', fontSize: '0.84rem', color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <ClubIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {player.club_name || 'Independent / Unattached'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <PlaceIcon sx={{ fontSize: 16, color: 'text.tertiary' }} />
                  <Typography variant="body2">
                    {player.district ? `${player.district}, ` : ''}
                    {player.division ? `${player.division} Division, ` : ''}
                    Bangladesh
                  </Typography>
                </Box>
                {player.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: 'text.tertiary' }} />
                    <Typography variant="body2">{player.phone}</Typography>
                  </Box>
                )}
                {player.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <EmailIcon sx={{ fontSize: 16, color: 'text.tertiary' }} />
                    <Typography variant="body2">{player.email}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ===================== KPI COUNTER STRIP ===================== */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
        {/* National Rank */}
        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.04em' }}>
              National Rank
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>
              {player.national_rank ? `#${player.national_rank}` : 'Unranked'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {player.gender || 'National'} Circuit
            </Typography>
          </CardContent>
        </Card>

        {/* Elo Rating */}
        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.04em' }}>
              Elo Rating
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706', mt: 0.5 }}>
              {rating}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tier.label} Tier
            </Typography>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.04em' }}>
              Match Record
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5 }}>
              {winRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {matchesWon}W - {matchesLost}L ({matchesPlayed} MP)
            </Typography>
          </CardContent>
        </Card>

        {/* Grand Slams */}
        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.04em' }}>
              Career Slams
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
              {totalSlams}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {whiteSlams} White / {blackSlams} Black
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ===================== TABBED DETAILS SECTION ===================== */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Profile & Persona" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' }} />
            <Tab label={`Tournament Matches (${(player.matches || []).length})`} sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' }} />
            <Tab label="Verification & Audit Documents" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' }} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* TAB 0: PROFILE & PERSONA */}
          {activeTab === 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Technical Carrom Persona */}
              <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F9FAFB', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>
                  Technical Carrom Persona
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Dominant Hand</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{player.dominant_hand || 'Right Hand'}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Tactical Playing Style</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>{player.playing_style || 'All-Rounder'}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Carrom Board Preference</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{player.carrom_board_preference || 'Championship 29x29 Standard'}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Athlete Category</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{player.category || 'Senior'} ({player.gender || 'Men'})</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Grand Slam Distribution</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {whiteSlams} White Slams • {blackSlams} Black Slams
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Personal & Residential Details */}
              <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F9FAFB', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>
                  Personal & Affiliation Details
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Registration ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{displayId}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{player.dob || 'Not specified'}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">National ID (NID)</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{player.nid_number || 'Not verified'}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Club / Academy</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{player.club_name || 'Independent'}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">District / Division</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {player.district || 'Dhaka'}, {player.division || 'Dhaka'} Division
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* TAB 1: TOURNAMENT MATCH RECORDS */}
          {activeTab === 1 && (
            <Box>
              {player.matches && player.matches.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                        <TableCell sx={{ fontWeight: 800 }}>Tournament</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Round</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Competitors</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Score</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Boards</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Result</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {player.matches.map(m => {
                        const isPlayer1 = m.player1_name && m.player1_name.toLowerCase().includes(player.full_name.toLowerCase())
                        const playerScore = isPlayer1 ? m.player1_score : m.player2_score
                        const oppScore = isPlayer1 ? m.player2_score : m.player1_score
                        const opponent = isPlayer1 ? m.player2_name : m.player1_name
                        const isWin = playerScore > oppScore

                        return (
                          <TableRow key={m.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {m.tournament_title || 'Sanctioned Tournament'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {m.tournament_edition || '2026'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {m.round_name || 'Match'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                vs. <strong>{opponent || 'Competitor'}</strong>
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                                {playerScore} - {oppScore}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {m.boards_played || 0}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={isWin ? 'Victory' : 'Defeat'}
                                color={isWin ? 'success' : 'error'}
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                    No Sanctioned Matches Recorded
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 440, mx: 'auto' }}>
                    Official match statistics and scores will be updated automatically as {player.full_name} competes in BCF sanctioned tournaments.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* TAB 2: VERIFICATION & AUDIT DOCUMENTS */}
          {activeTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5 }}>
                {/* Photo Preview */}
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Player Profile Photo
                  </Typography>
                  {player.photo_url ? (
                    <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => setZoomImage(getMediaUrl(player.photo_url))}>
                      <img
                        src={getMediaUrl(player.photo_url)}
                        alt="Player Photo"
                        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: 'primary.main', fontWeight: 700 }}>
                        Click to Zoom
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">No photo uploaded</Typography>
                    </Box>
                  )}
                </Box>

                {/* NID Front */}
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    NID Document (Front)
                  </Typography>
                  {player.nid_front_url ? (
                    <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => setZoomImage(getMediaUrl(player.nid_front_url))}>
                      <img
                        src={getMediaUrl(player.nid_front_url)}
                        alt="NID Front"
                        style={{ width: '100%', height: 160, objectFit: 'contain', borderRadius: 8, bgcolor: '#000' }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: 'primary.main', fontWeight: 700 }}>
                        Click to Zoom
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Document not on file</Typography>
                    </Box>
                  )}
                </Box>

                {/* NID Back */}
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    NID Document (Back)
                  </Typography>
                  {player.nid_back_url ? (
                    <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => setZoomImage(getMediaUrl(player.nid_back_url))}>
                      <img
                        src={getMediaUrl(player.nid_back_url)}
                        alt="NID Back"
                        style={{ width: '100%', height: 160, objectFit: 'contain', borderRadius: 8, bgcolor: '#000' }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: 'primary.main', fontWeight: 700 }}>
                        Click to Zoom
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Document not on file</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Audit Metadata */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F9FAFB', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Registration Record
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                    Registration ID: {displayId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Registered Athlete since: {player.player_since || 2026}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F9FAFB', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Federation Status
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: isActive ? 'success.main' : 'error.main' }}>
                    {isActive ? 'Active Federated Status' : 'Inactive / Suspended Status'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tournament Eligibility: {isActive ? 'Approved for National Circuit' : 'Disqualified / Inactive'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ===================== EDIT PLAYER DIALOG ===================== */}
      <Dialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Edit Athlete Profile
            </Typography>
            <IconButton size="small" onClick={() => setEditOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Full Name"
                size="small"
                required
                value={editFormData.full_name || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
              <TextField
                label="Nickname"
                size="small"
                value={editFormData.nickname || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, nickname: e.target.value }))}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Club</InputLabel>
                <Select
                  value={editFormData.club_name || 'Independent'}
                  label="Club"
                  onChange={(e) => setEditFormData(prev => ({ ...prev, club_name: e.target.value }))}
                >
                  <MenuItem value="Independent">Independent</MenuItem>
                  {clubs.map(c => (
                    <MenuItem key={c.id || c.name} value={c.name}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Division</InputLabel>
                <Select
                  value={editFormData.division || 'Dhaka'}
                  label="Division"
                  onChange={(e) => {
                    const newDiv = e.target.value
                    const dists = BD_DISTRICTS_BY_DIVISION[newDiv] || []
                    setEditFormData(prev => ({
                      ...prev,
                      division: newDiv,
                      district: dists[0] || ''
                    }))
                  }}
                >
                  {BD_DIVISIONS.map(d => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>District</InputLabel>
                <Select
                  value={editFormData.district || 'Dhaka'}
                  label="District"
                  onChange={(e) => setEditFormData(prev => ({ ...prev, district: e.target.value }))}
                >
                  {(BD_DISTRICTS_BY_DIVISION[editFormData.division] || ALL_BD_DISTRICTS).map(dist => (
                    <MenuItem key={dist} value={dist}>{dist}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Dominant Hand</InputLabel>
                <Select
                  value={editFormData.dominant_hand || 'Right Hand'}
                  label="Dominant Hand"
                  onChange={(e) => setEditFormData(prev => ({ ...prev, dominant_hand: e.target.value }))}
                >
                  <MenuItem value="Right Hand">Right Hand</MenuItem>
                  <MenuItem value="Left Hand">Left Hand</MenuItem>
                  <MenuItem value="Ambidextrous">Ambidextrous</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Playing Style</InputLabel>
                <Select
                  value={editFormData.playing_style || 'All-Rounder'}
                  label="Playing Style"
                  onChange={(e) => setEditFormData(prev => ({ ...prev, playing_style: e.target.value }))}
                >
                  <MenuItem value="All-Rounder">All-Rounder</MenuItem>
                  <MenuItem value="Aggressive Striker">Aggressive Striker</MenuItem>
                  <MenuItem value="Defensive Board Specialist">Defensive Board Specialist</MenuItem>
                  <MenuItem value="Direct Pocket Specialist">Direct Pocket Specialist</MenuItem>
                  <MenuItem value="Cut Shot Specialist">Cut Shot Specialist</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status || 'Active'}
                  label="Status"
                  onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                  <MenuItem value="Retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Elo Rating"
                type="number"
                size="small"
                value={editFormData.rating_points || 1200}
                onChange={(e) => setEditFormData(prev => ({ ...prev, rating_points: e.target.value }))}
              />
              <TextField
                label="National Rank"
                size="small"
                value={editFormData.national_rank || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, national_rank: e.target.value }))}
              />
              <TextField
                label="White Slams"
                type="number"
                size="small"
                value={editFormData.white_slams || 0}
                onChange={(e) => setEditFormData(prev => ({ ...prev, white_slams: e.target.value }))}
              />
              <TextField
                label="Black Slams"
                type="number"
                size="small"
                value={editFormData.black_slams || 0}
                onChange={(e) => setEditFormData(prev => ({ ...prev, black_slams: e.target.value }))}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Phone"
                size="small"
                value={editFormData.phone || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
              <TextField
                label="Email"
                size="small"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Box>

            {/* Photo upload */}
            <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={getMediaUrl(editFormData.photo_url)} sx={{ width: 56, height: 56, borderRadius: 2 }}>
                P
              </Avatar>
              <Button variant="outlined" component="label" size="small" startIcon={<UploadIcon />}>
                Upload New Photo
                <input type="file" accept="image/*" hidden onChange={handleEditPhotoUpload} />
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveEdit}
            disabled={editSaving}
            sx={{ fontWeight: 700 }}
          >
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== IMAGE ZOOM DIALOG ===================== */}
      <Dialog
        open={Boolean(zoomImage)}
        onClose={() => setZoomImage(null)}
        maxWidth="md"
        PaperProps={{ sx: { bgcolor: '#000', p: 1 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setZoomImage(null)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
          <img
            src={zoomImage}
            alt="Zoom View"
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </Box>
      </Dialog>
    </Box>
  )
}
