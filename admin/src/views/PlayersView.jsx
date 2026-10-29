import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  MenuItem,
  Avatar,
  TablePagination,
  Divider,
  useTheme
} from '@mui/material'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import {
  People as PeopleIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FlashOn as SlamsIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  CloudUpload as UploadIcon,
  SportsKabaddi as SportsIcon,
  Shield as ShieldIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { getMediaUrl, getClientWebsiteUrl } from '../services/api'
import { BD_DIVISIONS, BD_DISTRICTS_BY_DIVISION, ALL_BD_DISTRICTS } from '../utils/geoData'

// Client-side 1:1 center-crop helper for square player photo
const autoCropSquare = (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const minSide = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      const sx = (img.width - minSide) / 2
      const sy = (img.height - minSide) / 2
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 600, 600)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export function PlayersView({
  players = [],
  clubs = [],
  onCreate,
  onUpdate,
  onDelete
}) {
  const [genderFilter, setGenderFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)

  const theme = useTheme()
  const navigate = useNavigate()

  const defaultFormData = {
    full_name: '',
    nickname: '',
    gender: 'Men',
    category: 'Senior',
    club_name: 'Independent',
    division: 'Dhaka',
    district: 'Dhaka',
    dominant_hand: 'Right Hand',
    playing_style: 'All-Rounder',
    carrom_board_preference: 'Championship 29x29 Standard',
    national_rank: '',
    rating_points: 1200,
    white_slams: 0,
    black_slams: 0,
    matches_played: 0,
    matches_won: 0,
    photo_url: '',
    status: 'Active',
    phone: '',
    email: ''
  }

  const [formData, setFormData] = useState(defaultFormData)

  // Pagination state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Reset page on filter/search change
  useEffect(() => {
    setPage(0)
  }, [genderFilter, searchQuery])

  const filteredPlayers = players.filter((p) => {
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
      (p.nickname && p.nickname.toLowerCase().includes(q)) ||
      (p.club_name && p.club_name.toLowerCase().includes(q)) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.division && p.division.toLowerCase().includes(q))
    return matchesGender && matchesSearch
  })

  const paginatedPlayers = filteredPlayers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const handleOpenCreate = () => {
    setEditingPlayer(null)
    setFormData({
      ...defaultFormData,
      club_name: clubs.length > 0 ? clubs[0].name : 'Independent'
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (player) => {
    setEditingPlayer(player)
    setFormData({
      full_name: player.full_name || '',
      nickname: player.nickname || '',
      gender: player.gender || 'Men',
      category: player.category || 'Senior',
      club_name: player.club_name || 'Independent',
      division: player.division || 'Dhaka',
      district: player.district || 'Dhaka',
      dominant_hand: player.dominant_hand || 'Right Hand',
      playing_style: player.playing_style || 'All-Rounder',
      carrom_board_preference: player.carrom_board_preference || 'Championship 29x29 Standard',
      national_rank: player.national_rank !== null && player.national_rank !== undefined ? player.national_rank : '',
      rating_points: player.rating_points || 1200,
      white_slams: player.white_slams || 0,
      black_slams: player.black_slams || 0,
      matches_played: player.matches_played || 0,
      matches_won: player.matches_won || 0,
      photo_url: player.photo_url || '',
      status: player.status || 'Active',
      phone: player.phone || '',
      email: player.email || ''
    })
    setIsDialogOpen(true)
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const cropped = await autoCropSquare(evt.target.result)
      setFormData(prev => ({ ...prev, photo_url: cropped }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.full_name) return

    const payload = {
      ...formData,
      national_rank: formData.national_rank !== '' ? parseInt(formData.national_rank, 10) : null,
      rating_points: parseInt(formData.rating_points || 1200, 10),
      white_slams: parseInt(formData.white_slams || 0, 10),
      black_slams: parseInt(formData.black_slams || 0, 10),
      matches_played: parseInt(formData.matches_played || 0, 10),
      matches_won: parseInt(formData.matches_won || 0, 10)
    }

    if (editingPlayer) {
      onUpdate(editingPlayer.id, payload)
    } else {
      onCreate(payload)
    }
    setIsDialogOpen(false)
  }

  // Active district list based on selected division
  const availableDistricts = BD_DISTRICTS_BY_DIVISION[formData.division] || ALL_BD_DISTRICTS

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Material 3 Page Header */}
      <PageHeader
        title="National Players & Rankings"
        subtitle="Official player registry, White Slam master list, club affiliations & regional standings"
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ px: 2.5 }}
          >
            Register Athlete
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
            value={genderFilter}
            onChange={(e, val) => setGenderFilter(val)}
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
            <Tab value="All" label={`All Athletes (${players.length})`} />
            <Tab value="Men" label="Men Division" />
            <Tab value="Women" label="Women Division" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search athletes, clubs, districts..."
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
              width: { xs: '100%', sm: 280 }
            }}
          />
        </Box>
      </Box>

      {/* Players Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell>Rank & Athlete</TableCell>
                <TableCell>Affiliation / Club</TableCell>
                <TableCell>Region & District</TableCell>
                <TableCell>Style & Stance</TableCell>
                <TableCell>Category & Status</TableCell>
                <TableCell>Rating Points</TableCell>
                <TableCell>Slams (W/B)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No players found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPlayers.map((p, idx) => {
                  const isTopRank = (page * rowsPerPage + idx) === 0
                  const isSecondRank = (page * rowsPerPage + idx) === 1
                  const isInactive = p.status === 'Inactive' || p.status === 'Suspended'

                  return (
                    <TableRow key={p.id} hover sx={{ opacity: isInactive ? 0.6 : 1 }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={getMediaUrl(p.photo_url)}
                            sx={{
                              width: 40,
                              height: 40,
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              backgroundColor:
                                isTopRank
                                  ? 'secondary.main'
                                  : isSecondRank
                                  ? 'primary.main'
                                  : theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.08)'
                                  : 'rgba(0,0,0,0.06)',
                              color: (isTopRank || isSecondRank) ? '#fff' : 'text.primary',
                              border: p.photo_url ? `2px solid ${isTopRank ? '#F59E0B' : 'rgba(255,255,255,0.1)'}` : 'none'
                            }}
                          >
                            {p.national_rank || (page * rowsPerPage + idx + 1)}
                          </Avatar>
                          <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(`/players/${p.id}`)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 750, fontSize: '0.88rem', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                                {p.full_name}
                              </Typography>
                              {p.nickname && (
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                  "{p.nickname}"
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {p.player_id ? `ID: ${p.player_id} • ` : ''}
                              {p.phone || p.email || 'BCF Federated'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.84rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <ShieldIcon sx={{ fontSize: 14, color: p.club_name && p.club_name !== 'Independent' ? 'primary.main' : 'text.secondary' }} />
                          {p.club_name || 'Independent'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {p.district || 'Dhaka'}
                          </Typography>
                          {p.division && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                              {p.division} Division
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {p.playing_style || 'All-Rounder'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                            {p.dominant_hand || 'Right Hand'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                          <Chip
                            label={`${p.gender || 'Men'} • ${p.category || 'Senior'}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                            }}
                          />
                          <Chip
                            label={p.status || 'Active'}
                            size="small"
                            color={p.status === 'Active' ? 'success' : p.status === 'Inactive' ? 'default' : 'error'}
                            variant={p.status === 'Active' ? 'filled' : 'outlined'}
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.9rem' }}>
                          {p.rating_points || 1200}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          {p.matches_won || 0}W / {p.matches_played || 0}M
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="White Slams">
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                              <Box sx={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px solid', borderColor: 'text.primary', bgcolor: 'background.paper' }} />
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                {p.white_slams || 0}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>/</Typography>
                          <Tooltip title="Black Slams">
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: 'text.primary' }} />
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                {p.black_slams || 0}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Box>
                      </TableCell>

                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View Profile in Admin">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/players/${p.id}`)}
                              color="primary"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Public Social Profile">
                            <IconButton
                              size="small"
                              component="a"
                              href={`${getClientWebsiteUrl()}/player/${p.player_id || p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="info"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Athlete Profile">
                            <IconButton size="small" onClick={() => handleOpenEdit(p)} color="inherit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Athlete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (window.confirm(`Delete profile of ${p.full_name}?`)) onDelete(p.id)
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
          count={filteredPlayers.length}
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

      {/* Add / Edit Player SideSheet */}
      <SideSheet
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingPlayer ? 'Edit Player Profile' : 'Register New National Player'}
        subtitle={editingPlayer ? `Updating record for ${editingPlayer.full_name}` : 'Enlist verified player with BCF national Elo rating points'}
        icon={<PeopleIcon />}
        width={{ xs: '100%', sm: 580, md: 660 }}
        footerActions={
          <>
            <Button onClick={() => setIsDialogOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
              {editingPlayer ? 'Save Changes' : 'Register Athlete'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Section 1: Profile Photo & Basic Identity */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2, borderRadius: 2.5, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
            <Avatar
              src={getMediaUrl(formData.photo_url)}
              sx={{ width: 72, height: 72, borderRadius: 2.5, border: `2px solid ${theme.palette.primary.main}` }}
            >
              <PeopleIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Player Profile Picture
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Square photo recommended (auto-crops center 1:1)
              </Typography>
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<UploadIcon />}
                sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              >
                Upload Photo
                <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
              </Button>
            </Box>
          </Box>

          {/* Name & Nickname */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              required
              size="small"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <TextField
              label="Nickname / Alias"
              fullWidth
              size="small"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="e.g. Master Striker"
            />
          </Box>

          {/* Gender & Category & Status */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Gender"
              fullWidth
              size="small"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <MenuItem value="Men">Men</MenuItem>
              <MenuItem value="Women">Women</MenuItem>
            </TextField>

            <TextField
              select
              label="Category"
              fullWidth
              size="small"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <MenuItem value="Senior">Senior</MenuItem>
              <MenuItem value="Junior">Junior</MenuItem>
              <MenuItem value="Sub-Junior">Sub-Junior</MenuItem>
              <MenuItem value="Veteran">Veteran</MenuItem>
            </TextField>

            <TextField
              select
              label="Player Status"
              fullWidth
              size="small"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Retired">Retired</MenuItem>
            </TextField>
          </Box>

          <Divider sx={{ my: 0.5 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldIcon fontSize="small" /> Affiliation & Geographical Origin
          </Typography>

          {/* Club Selection Dropdown */}
          <TextField
            select
            label="Affiliated Club / Academy"
            fullWidth
            size="small"
            value={formData.club_name}
            onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
            helperText="Select a BCF recognized club or Independent"
          >
            <MenuItem value="Independent">Independent / Unaffiliated</MenuItem>
            {clubs.map((c) => (
              <MenuItem key={c.id || c.name} value={c.name}>
                {c.name} {c.district ? `(${c.district})` : ''}
              </MenuItem>
            ))}
          </TextField>

          {/* Division & District Selection */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Division"
              fullWidth
              size="small"
              value={formData.division}
              onChange={(e) => {
                const newDiv = e.target.value
                const dists = BD_DISTRICTS_BY_DIVISION[newDiv] || []
                setFormData({
                  ...formData,
                  division: newDiv,
                  district: dists.length > 0 ? dists[0] : formData.district
                })
              }}
            >
              {BD_DIVISIONS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="District"
              fullWidth
              size="small"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            >
              {availableDistricts.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Divider sx={{ my: 0.5 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsIcon fontSize="small" /> Carrom Technical Attributes
          </Typography>

          {/* Dominant Hand & Playing Style */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Dominant Hand / Stance"
              fullWidth
              size="small"
              value={formData.dominant_hand}
              onChange={(e) => setFormData({ ...formData, dominant_hand: e.target.value })}
            >
              <MenuItem value="Right Hand">Right Hand</MenuItem>
              <MenuItem value="Left Hand">Left Hand</MenuItem>
              <MenuItem value="Ambidextrous">Ambidextrous (Both Hands)</MenuItem>
            </TextField>

            <TextField
              select
              label="Playing Style"
              fullWidth
              size="small"
              value={formData.playing_style}
              onChange={(e) => setFormData({ ...formData, playing_style: e.target.value })}
            >
              <MenuItem value="All-Rounder">All-Rounder</MenuItem>
              <MenuItem value="Attacking Striker">Attacking Striker</MenuItem>
              <MenuItem value="Defensive Tactician">Defensive Tactician</MenuItem>
              <MenuItem value="Speed Striker">Speed Striker</MenuItem>
              <MenuItem value="Position Specialist">Position Specialist</MenuItem>
            </TextField>
          </Box>

          {/* Board Preference */}
          <TextField
            select
            label="Carrom Board Preference"
            fullWidth
            size="small"
            value={formData.carrom_board_preference}
            onChange={(e) => setFormData({ ...formData, carrom_board_preference: e.target.value })}
          >
            <MenuItem value="Championship 29x29 Standard">Championship 29x29 Standard (Synco / Precise)</MenuItem>
            <MenuItem value="International Tournament Board">International Tournament Board (ICF Approved)</MenuItem>
            <MenuItem value="Club Practice Standard">Club Practice Standard</MenuItem>
          </TextField>

          <Divider sx={{ my: 0.5 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SlamsIcon fontSize="small" /> Federation Rankings & Slams
          </Typography>

          {/* Rank & Rating */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="National Rank / Seed"
              type="number"
              fullWidth
              size="small"
              value={formData.national_rank}
              onChange={(e) => setFormData({ ...formData, national_rank: e.target.value })}
              placeholder="Auto-calculated if blank"
            />
            <TextField
              label="Elo Rating Points"
              type="number"
              fullWidth
              size="small"
              value={formData.rating_points}
              onChange={(e) => setFormData({ ...formData, rating_points: e.target.value })}
            />
          </Box>

          {/* White Slams & Black Slams */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="White Slams"
              type="number"
              fullWidth
              size="small"
              value={formData.white_slams}
              onChange={(e) => setFormData({ ...formData, white_slams: e.target.value })}
            />
            <TextField
              label="Black Slams"
              type="number"
              fullWidth
              size="small"
              value={formData.black_slams}
              onChange={(e) => setFormData({ ...formData, black_slams: e.target.value })}
            />
          </Box>

          {/* Matches Played & Won */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Matches Played"
              type="number"
              fullWidth
              size="small"
              value={formData.matches_played}
              onChange={(e) => setFormData({ ...formData, matches_played: e.target.value })}
            />
            <TextField
              label="Matches Won"
              type="number"
              fullWidth
              size="small"
              value={formData.matches_won}
              onChange={(e) => setFormData({ ...formData, matches_won: e.target.value })}
            />
          </Box>

          <Divider sx={{ my: 0.5 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon fontSize="small" /> Official Contact Information
          </Typography>

          {/* Phone & Email */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Phone Number"
              fullWidth
              size="small"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Box>
        </Box>
      </SideSheet>
    </Box>
  )
}
