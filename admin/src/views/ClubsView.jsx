import React, { useState, useMemo, useRef } from 'react'
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  TablePagination,
  Grid,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material'
import {
  ShieldOutlined as ClubIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  People as PlayersIcon,
  Business as DistrictIcon,
  AccountCircle as PresidentIcon,
  CalendarToday as YearIcon,
  HomeWork as AddressIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import { getApiBaseUrl } from '@/services/api'

// Comprehensive divisions and districts list in Bangladesh
export const BANGLADESH_DIVISIONS = [
  { id: 6, name: 'Dhaka', districts: ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'] },
  { id: 1, name: 'Chattagram', districts: ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chittagong', 'Comilla', "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'] },
  { id: 2, name: 'Rajshahi', districts: ['Bogra', 'Joypurhat', 'Naogaon', 'Natore', 'Nawabganj', 'Pabna', 'Rajshahi', 'Sirajganj'] },
  { id: 3, name: 'Khulna', districts: ['Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'] },
  { id: 4, name: 'Barisal', districts: ['Barguna', 'Barisal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'] },
  { id: 5, name: 'Sylhet', districts: ['Habiganj', 'Maulvibazar', 'Sunamganj', 'Sylhet'] },
  { id: 7, name: 'Rangpur', districts: ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'] },
  { id: 8, name: 'Mymensingh', districts: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'] }
]

const ALL_DISTRICTS = Array.from(
  new Set(BANGLADESH_DIVISIONS.flatMap((d) => d.districts))
).sort()

export function getClubMonogram(name = '') {
  if (!name) return 'BCF'
  const clean = name.replace(/Carrom|Club|Academy|Association|Guild|Striker/gi, '').trim()
  const words = (clean || name).trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function ClubsView({
  clubs = [],
  onCreate,
  onUpdate,
  onDelete,
  onToggleStatus,
  onRefresh
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const fileInputRef = useRef(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Pagination State
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // SideSheet Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingClub, setEditingClub] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [clubToDelete, setClubToDelete] = useState(null)

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    division: '',
    district: '',
    address: '',
    president: '',
    president_phone: '',
    president_email: '',
    established_year: '',
    total_registered_players: 0,
    status: 'Active',
    logo: null, // base64 payload
    logo_url: '' // existing or preview url
  })
  const [logoPreview, setLogoPreview] = useState('')

  // Available districts for the currently selected division in form
  const availableDistrictsForForm = useMemo(() => {
    if (!formData.division) return ALL_DISTRICTS
    const found = BANGLADESH_DIVISIONS.find(
      (d) => d.name.toLowerCase() === formData.division.toLowerCase()
    )
    return found ? found.districts : ALL_DISTRICTS
  }, [formData.division])

  // KPIs
  const stats = useMemo(() => {
    const total = clubs.length
    const active = clubs.filter((c) => c.status === 'Active').length
    const inactive = clubs.filter((c) => c.status === 'Inactive').length
    const totalPlayers = clubs.reduce(
      (sum, c) => sum + (Number(c.total_registered_players) || 0),
      0
    )
    const divisionsCovered = new Set(
      clubs.map((c) => c.division).filter(Boolean)
    ).size
    return { total, active, inactive, totalPlayers, divisionsCovered }
  }, [clubs])

  // Filtered Clubs
  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (club.name && club.name.toLowerCase().includes(q)) ||
        (club.president && club.president.toLowerCase().includes(q)) ||
        (club.district && club.district.toLowerCase().includes(q)) ||
        (club.division && club.division.toLowerCase().includes(q)) ||
        (club.address && club.address.toLowerCase().includes(q))

      const matchesDivision =
        divisionFilter === 'All' ||
        (club.division &&
          club.division.toLowerCase() === divisionFilter.toLowerCase())

      const matchesStatus =
        statusFilter === 'All' || club.status === statusFilter

      return matchesSearch && matchesDivision && matchesStatus
    })
  }, [clubs, searchQuery, divisionFilter, statusFilter])

  // Paginated Rows
  const paginatedClubs = useMemo(() => {
    return filteredClubs.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    )
  }, [filteredClubs, page, rowsPerPage])

  // Open Drawer for Create
  const handleOpenCreate = () => {
    setEditingClub(null)
    setFormData({
      name: '',
      division: 'Dhaka',
      district: 'Dhaka',
      address: '',
      president: '',
      president_phone: '',
      president_email: '',
      established_year: new Date().getFullYear().toString(),
      total_registered_players: 0,
      status: 'Active',
      logo: null,
      logo_url: ''
    })
    setLogoPreview('')
    setIsDrawerOpen(true)
  }

  // Open Drawer for Edit
  const handleOpenEdit = (club) => {
    setEditingClub(club)
    setFormData({
      name: club.name || '',
      division: club.division || '',
      district: club.district || '',
      address: club.address || '',
      president: club.president || '',
      president_phone: club.president_phone || club.contact_phone || '',
      president_email: club.president_email || club.contact_email || '',
      established_year: club.established_year ? String(club.established_year) : '',
      total_registered_players: club.total_registered_players || 0,
      status: club.status || 'Active',
      logo: null,
      logo_url: club.logo_url || ''
    })
    setLogoPreview(club.logo_url ? getFullImageUrl(club.logo_url) : '')
    setIsDrawerOpen(true)
  }

  // Handle Logo Upload File Selection
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, or WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      setFormData((prev) => ({ ...prev, logo: base64 }))
      setLogoPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: null, logo_url: null }))
    setLogoPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please provide a Club Name.')
      return
    }
    if (!formData.district.trim()) {
      alert('Please select a District for the club.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        division: formData.division.trim(),
        district: formData.district.trim(),
        address: formData.address.trim(),
        president: formData.president.trim(),
        president_phone: formData.president_phone.trim(),
        president_email: formData.president_email.trim(),
        established_year: formData.established_year
          ? parseInt(formData.established_year, 10)
          : null,
        total_registered_players: parseInt(
          formData.total_registered_players || 0,
          10
        ),
        status: formData.status,
        logo: formData.logo,
        logo_url: formData.logo_url
      }

      if (editingClub) {
        await onUpdate(editingClub.id, payload)
      } else {
        await onCreate(payload)
      }
      setIsDrawerOpen(false)
    } catch (err) {
      console.error('Club save error:', err)
      alert(err.message || 'Failed to save club record')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Status Toggle
  const handleToggleActive = async (club) => {
    try {
      const nextStatus = club.status === 'Active' ? 'Inactive' : 'Active'
      await onToggleStatus(club.id, nextStatus)
    } catch (err) {
      console.error('Toggle status error:', err)
    }
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!clubToDelete) return
    try {
      await onDelete(clubToDelete.id)
      setDeleteConfirmOpen(false)
      setClubToDelete(null)
    } catch (err) {
      console.error('Delete error:', err)
      alert(err.message || 'Failed to delete club')
    }
  }

  // Helper to build full URL for images
  function getFullImageUrl(url) {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url
    }
    const base = getApiBaseUrl().replace('/api', '')
    return `${base}${url}`
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Clubs & Academies"
        subtitle="Manage affiliated regional clubs, district academies, leadership information, and active membership directory."
        icon={<ClubIcon sx={{ fontSize: 26, color: 'primary.main' }} />}
        action={
          <Stack direction="row" spacing={1.5}>
            {onRefresh && (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                sx={{
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.88rem',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
                }}
              >
                Sync
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                px: 2.5
              }}
            >
              Register Club
            </Button>
          </Stack>
        }
      />

      {/* 2. STATS OVERVIEW CARDS */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: isDark ? 'background.paper' : '#FFFFFF',
              boxShadow: isDark
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Total Clubs
              </Typography>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  backgroundColor: 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ClubIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              {stats.divisionsCovered} Divisions Represented
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: isDark ? 'background.paper' : '#FFFFFF',
              boxShadow: isDark
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Active Members
              </Typography>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ActiveIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.02em' }}>
              {stats.active}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              Shown on Official Website
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: isDark ? 'background.paper' : '#FFFFFF',
              boxShadow: isDark
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Inactive / Paused
              </Typography>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <InactiveIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: stats.inactive > 0 ? 'error.main' : 'text.primary', letterSpacing: '-0.02em' }}>
              {stats.inactive}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              Hidden from Public Listing
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: isDark ? 'background.paper' : '#FFFFFF',
              boxShadow: isDark
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Registered Players
              </Typography>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlayersIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#3B82F6', letterSpacing: '-0.02em' }}>
              {stats.totalPlayers}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              Enrolled through Member Clubs
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 3. SEARCH & FILTERS BAR */}
      <Card
        elevation={0}
        sx={{
          p: 2.2,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: isDark ? 'background.paper' : '#FFFFFF'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search club name, president, district, or address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2.5 }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="division-filter-label">Division</InputLabel>
              <Select
                labelId="division-filter-label"
                value={divisionFilter}
                label="Division"
                onChange={(e) => {
                  setDivisionFilter(e.target.value)
                  setPage(0)
                }}
                sx={{ borderRadius: 2.5 }}
              >
                <MenuItem value="All">All Divisions ({clubs.length})</MenuItem>
                {BANGLADESH_DIVISIONS.map((div) => {
                  const count = clubs.filter(
                    (c) => c.division && c.division.toLowerCase() === div.name.toLowerCase()
                  ).length
                  return (
                    <MenuItem key={div.id} value={div.name}>
                      {div.name} {count > 0 ? `(${count})` : ''}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
                sx={{ borderRadius: 2.5 }}
              >
                <MenuItem value="All">All Status ({clubs.length})</MenuItem>
                <MenuItem value="Active">Active ({stats.active})</MenuItem>
                <MenuItem value="Inactive">Inactive ({stats.inactive})</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* 4. CLUBS DATA TABLE */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          backgroundColor: isDark ? 'background.paper' : '#FFFFFF'
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 1.8 }}>Club & Academy</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.8 }}>Region</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.8 }}>President & Contact</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.8, textAlign: 'center' }}>Players</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.8, textAlign: 'center' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.8, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedClubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center' }}>
                    <Box sx={{ maxWidth: 360, mx: 'auto', textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 3,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                          color: 'text.secondary'
                        }}
                      >
                        <ClubIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 750, mb: 0.5 }}>
                        No Clubs Found
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        {searchQuery || divisionFilter !== 'All' || statusFilter !== 'All'
                          ? 'Try clearing your filters or search keywords to view registered clubs.'
                          : 'No regional carrom clubs have been registered yet. Click below to add the first club.'}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 650 }}
                      >
                        Register Club
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClubs.map((club) => {
                  const hasLogo = Boolean(club.logo_url)
                  const logoUrl = getFullImageUrl(club.logo_url)

                  return (
                    <TableRow
                      key={club.id}
                      hover
                      sx={{
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
                        }
                      }}
                    >
                      {/* 1. CLUB NAME & LOGO */}
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {hasLogo ? (
                            <Avatar
                              src={logoUrl}
                              alt={club.name}
                              variant="rounded"
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                                p: 0.5,
                                img: { objectFit: 'contain' }
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2.5,
                                background: isDark
                                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.3) 100%)'
                                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.18) 100%)',
                                color: 'primary.main',
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                letterSpacing: '0.04em',
                                flexShrink: 0
                              }}
                            >
                              {getClubMonogram(club.name)}
                            </Box>
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 750,
                                fontSize: '0.94rem',
                                color: 'text.primary',
                                lineHeight: 1.3
                              }}
                            >
                              {club.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                              {club.established_year && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <YearIcon sx={{ fontSize: 13 }} /> Estd. {club.established_year}
                                </Typography>
                              )}
                              {club.address && (
                                <Tooltip title={club.address} arrow>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: 'text.tertiary',
                                      maxWidth: 180,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: 'inline-block'
                                    }}
                                  >
                                    • {club.address}
                                  </Typography>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* 2. REGION (DIVISION & DISTRICT) */}
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={club.division || 'Dhaka'}
                              size="small"
                              sx={{
                                fontWeight: 650,
                                fontSize: '0.72rem',
                                height: 22,
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                color: isDark ? '#93C5FD' : '#2563EB',
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {club.district}
                            </Typography>
                          </Box>
                          {club.address && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                maxWidth: 220,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              <AddressIcon sx={{ fontSize: 13, flexShrink: 0 }} /> {club.address}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* 3. PRESIDENT & CONTACT */}
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <PresidentIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> {club.president || 'N/A'}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, fontSize: '0.78rem', color: 'text.secondary' }}>
                            {(club.president_phone || club.contact_phone) && (
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary' }}>
                                <PhoneIcon sx={{ fontSize: 13 }} /> {club.president_phone || club.contact_phone}
                              </Typography>
                            )}
                            {(club.president_email || club.contact_email) && (
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary' }}>
                                <EmailIcon sx={{ fontSize: 13 }} /> {club.president_email || club.contact_email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* 4. TOTAL PLAYERS */}
                      <TableCell sx={{ py: 2, textAlign: 'center' }}>
                        <Chip
                          icon={<PlayersIcon sx={{ fontSize: 14 }} />}
                          label={`${club.total_registered_players || 0}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            borderRadius: 2,
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                            color: 'primary.main',
                            border: '1px solid',
                            borderColor: 'rgba(16, 185, 129, 0.3)'
                          }}
                        />
                      </TableCell>

                      {/* 5. STATUS TOGGLE */}
                      <TableCell sx={{ py: 2, textAlign: 'center' }}>
                        <Tooltip title={`Click to mark ${club.status === 'Active' ? 'Inactive' : 'Active'}`} arrow>
                          <Chip
                            label={club.status || 'Active'}
                            size="small"
                            onClick={() => handleToggleActive(club)}
                            icon={club.status === 'Active' ? <ActiveIcon sx={{ fontSize: 14 }} /> : <InactiveIcon sx={{ fontSize: 14 }} />}
                            sx={{
                              cursor: 'pointer',
                              fontWeight: 700,
                              borderRadius: 2,
                              transition: 'all 0.15s ease',
                              backgroundColor:
                                club.status === 'Active'
                                  ? isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
                                  : isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                              color: club.status === 'Active' ? 'primary.main' : 'error.main',
                              border: '1px solid',
                              borderColor: club.status === 'Active' ? 'primary.main' : 'error.main',
                              '&:hover': {
                                transform: 'scale(1.04)',
                                boxShadow: 1
                              }
                            }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* 6. ACTIONS */}
                      <TableCell sx={{ py: 2, textAlign: 'right' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit Club" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(club)}
                              sx={{
                                color: 'text.secondary',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': { color: 'primary.main', borderColor: 'primary.main' }
                              }}
                            >
                              <EditIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Club" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setClubToDelete(club)
                                setDeleteConfirmOpen(true)
                              }}
                              sx={{
                                color: 'error.main',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  borderColor: 'error.main'
                                }
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINATION */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredClubs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>

      {/* 5. CREATE / EDIT SIDESHEET DRAWER */}
      <SideSheet
        open={isDrawerOpen}
        onClose={() => !isSubmitting && setIsDrawerOpen(false)}
        title={editingClub ? 'Edit Club Details' : 'Register New Club'}
        subtitle={
          editingClub
            ? `Update details and membership profile for ${editingClub.name}`
            : 'Fill in club information, leadership contact, and regional affiliation'
        }
        icon={<ClubIcon sx={{ fontSize: 24 }} />}
        width={{ xs: '100%', sm: 540, md: 620 }}
        footerActions={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              disabled={isSubmitting}
              onClick={() => setIsDrawerOpen(false)}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2.5 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={isSubmitting}
              onClick={handleSubmit}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              {isSubmitting ? 'Saving...' : editingClub ? 'Update Club' : 'Register Club'}
            </Button>
          </Stack>
        }
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* SECTION 1: LOGO UPLOAD */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1, color: 'text.primary' }}>
              Club Logo
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Upload the official club emblem or crest. High-res transparent PNG or WebP recommended (up to 5MB).
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                p: 2,
                borderRadius: 3,
                border: '1px dashed',
                borderColor: logoPreview ? 'primary.main' : 'divider',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
              }}
            >
              {logoPreview ? (
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={logoPreview}
                    alt="Club Logo Preview"
                    variant="rounded"
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                      p: 0.5,
                      img: { objectFit: 'contain' }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveLogo}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 22,
                      height: 22,
                      backgroundColor: 'error.main',
                      color: '#fff',
                      boxShadow: 2,
                      '&:hover': { backgroundColor: 'error.dark' }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: 'divider',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    flexShrink: 0
                  }}
                >
                  <ClubIcon sx={{ fontSize: 28, opacity: 0.6 }} />
                </Box>
              )}

              <Box sx={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleLogoFileChange}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 650,
                    fontSize: '0.82rem',
                    mb: 0.8
                  }}
                >
                  {logoPreview ? 'Change Emblem' : 'Upload Logo'}
                </Button>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.74rem' }}>
                  Supports square or badge aspect ratios with clean borders.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* SECTION 2: BASIC CLUB DETAILS */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1.5, color: 'text.primary' }}>
              Basic Club Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Club / Academy Name"
                  placeholder="e.g. Dhaka Carrom Club"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2.5 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Established Year"
                  type="number"
                  placeholder="e.g. 2012"
                  value={formData.established_year}
                  onChange={(e) => setFormData((p) => ({ ...p, established_year: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <YearIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Registered Players"
                  type="number"
                  placeholder="0"
                  value={formData.total_registered_players}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      total_registered_players: Math.max(0, parseInt(e.target.value, 10) || 0)
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PlayersIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.8,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Affiliation Status
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formData.status === 'Active'
                        ? 'Club is Active and publicly listed on the federation website.'
                        : 'Club is Inactive / suspended and hidden from public directory.'}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.status === 'Active'}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            status: e.target.checked ? 'Active' : 'Inactive'
                          }))
                        }
                        color="primary"
                      />
                    }
                    label={formData.status}
                    sx={{ m: 0, fontWeight: 700 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* SECTION 3: REGIONAL & ADDRESS INFORMATION */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1.5, color: 'text.primary' }}>
              Regional Location & Address
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="division-select-label">Division</InputLabel>
                  <Select
                    labelId="division-select-label"
                    value={formData.division}
                    label="Division"
                    onChange={(e) => {
                      const newDiv = e.target.value
                      const divObj = BANGLADESH_DIVISIONS.find(
                        (d) => d.name.toLowerCase() === newDiv.toLowerCase()
                      )
                      const defaultDistrict = divObj ? divObj.districts[0] : ''
                      setFormData((p) => ({
                        ...p,
                        division: newDiv,
                        district: divObj && divObj.districts.includes(p.district) ? p.district : defaultDistrict
                      }))
                    }}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {BANGLADESH_DIVISIONS.map((div) => (
                      <MenuItem key={div.id} value={div.name}>
                        {div.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="district-select-label">District</InputLabel>
                  <Select
                    labelId="district-select-label"
                    value={formData.district}
                    label="District"
                    onChange={(e) => setFormData((p) => ({ ...p, district: e.target.value }))}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {availableDistrictsForForm.map((dist) => (
                      <MenuItem key={dist} value={dist}>
                        {dist}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Detailed Club Address"
                  placeholder="e.g. 14/B Stadium Road, Paltan, Dhaka-1000"
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* SECTION 4: PRESIDENT & LEADERSHIP CONTACT */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1.5, color: 'text.primary' }}>
              President & Leadership Info
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="President / Secretary Name"
                  placeholder="e.g. Ashraful Alam"
                  value={formData.president}
                  onChange={(e) => setFormData((p) => ({ ...p, president: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PresidentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="President Contact Phone"
                  placeholder="+880 1711-000111"
                  value={formData.president_phone}
                  onChange={(e) => setFormData((p) => ({ ...p, president_phone: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="President / Official Email"
                  placeholder="club@bcf.org.bd"
                  type="email"
                  value={formData.president_email}
                  onChange={(e) => setFormData((p) => ({ ...p, president_email: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </SideSheet>

      {/* 6. DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            width: '100%',
            maxWidth: 440
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Delete Club</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: isDark ? '#fff' : '#000' }}>
              {clubToDelete?.name}
            </strong>
            ? This will remove the club record, its logo, and regional association from the federation database.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 650 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Delete Club
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ClubsView
