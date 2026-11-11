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
  MenuItem,
  Avatar,
  TablePagination,
  Divider,
  useTheme
} from '@mui/material'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import { TablePageSkeleton } from '../components/Common/PageSkeletons'
import {
  Sports as WhistleIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CloudUpload as UploadIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Block as SuspendedIcon,
  ContentCopy as CopyIcon,
  CalendarMonth as CalendarIcon,
  Badge as BadgeIcon
} from '@mui/icons-material'
import * as api from '../services/api'

// Client-side 1:1 square crop helper for umpire photo
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
      const sy = img.height > img.width ? (img.height - minSide) * 0.15 : (img.height - minSide) / 2
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 600, 600)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export function UmpiresView() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [umpires, setUmpires] = useState([])
  const [allUmpiresForUserCheck, setAllUmpiresForUserCheck] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [genderFilter, setGenderFilter] = useState('All')

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Drawer / SideSheet
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUmpire, setEditingUmpire] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const defaultFormData = {
    name: '',
    name_bangla: '',
    email: '',
    phone: '',
    photo_url: '',
    joined_date: '',
    nid_number: '',
    dob: '',
    gender: 'Male',
    status: 'Active',
    grade: 'National Referee',
    federation_id: '',
    user_id: ''
  }

  const [formData, setFormData] = useState(defaultFormData)

  const loadUmpires = async () => {
    setLoading(true)
    try {
      const [data, allUnfiltered, usersList] = await Promise.all([
        api.fetchUmpires({
          status: statusFilter,
          gender: genderFilter,
          search: searchQuery
        }),
        api.fetchUmpires({}),
        api.fetchUsers()
      ])
      setUmpires(data)
      setAllUmpiresForUserCheck(allUnfiltered || data)
      setAdminUsers(Array.isArray(usersList) ? usersList : [])
    } catch (err) {
      console.error('Error loading umpires:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUmpires()
  }, [statusFilter, genderFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadUmpires()
  }

  const handleOpenCreate = () => {
    setEditingUmpire(null)
    setFormData(defaultFormData)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (umpire) => {
    setEditingUmpire(umpire)
    setFormData({
      name: umpire.name || '',
      name_bangla: umpire.name_bangla || '',
      email: umpire.email || '',
      phone: umpire.phone || '',
      photo_url: umpire.photo_url || '',
      joined_date: umpire.joined_date ? umpire.joined_date.split('T')[0] : '',
      nid_number: umpire.nid_number || '',
      dob: umpire.dob ? umpire.dob.split('T')[0] : '',
      gender: umpire.gender || 'Male',
      status: umpire.status || 'Active',
      grade: umpire.grade || 'National Referee',
      federation_id: umpire.federation_id || umpire.umpire_id || '',
      user_id: umpire.user_id ? String(umpire.user_id) : ''
    })
    setIsDialogOpen(true)
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const cropped = await autoCropSquare(reader.result)
        setFormData((prev) => ({ ...prev, photo_url: cropped }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter umpire name')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        user_id: formData.user_id ? Number(formData.user_id) : null,
      }
      if (editingUmpire) {
        const res = await api.updateUmpire(editingUmpire.id, payload)
        if (res.success) {
          setIsDialogOpen(false)
          loadUmpires()
        } else {
          alert(res.message || 'Failed to update umpire')
        }
      } else {
        const res = await api.createUmpire(payload)
        if (res.success) {
          setIsDialogOpen(false)
          loadUmpires()
        } else {
          alert(res.message || 'Failed to register umpire')
        }
      }
    } catch (err) {
      alert('Error saving umpire: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove referee/umpire "${name}"?`)) {
      try {
        const res = await api.deleteUmpire(id)
        if (res.success) {
          loadUmpires()
        } else {
          alert(res.message || 'Failed to delete umpire')
        }
      } catch (err) {
        alert('Error: ' + err.message)
      }
    }
  }

  // Filtered umpires list
  const filteredUmpires = umpires.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = (u.name || '').toLowerCase().includes(q)
      const matchBangla = (u.name_bangla || '').toLowerCase().includes(q)
      const matchId = (u.umpire_id || '').toLowerCase().includes(q)
      const matchEmail = (u.email || '').toLowerCase().includes(q)
      const matchPhone = (u.phone || '').toLowerCase().includes(q)
      const matchNid = (u.nid_number || '').toLowerCase().includes(q)
      if (!matchName && !matchBangla && !matchId && !matchEmail && !matchPhone && !matchNid) return false
    }
    return true
  })

  // Metric counts
  const totalCount = umpires.length
  const activeCount = umpires.filter((u) => u.status === 'Active').length
  const totalAssignedMatches = umpires.reduce((sum, u) => sum + (Number(u.assigned_matches_count) || 0), 0)
  const suspendedCount = umpires.filter((u) => u.status === 'Suspended').length

  if (loading && umpires.length === 0) {
    return <TablePageSkeleton title="Federation Umpires & Referees" rows={8} />
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* 1. Header */}
      <PageHeader
        title="Federation Umpires & Referees"
        subtitle="Manage official carrom umpires, technical delegates, certification grades and match court assignments"
        actionLabel="Register Umpire"
        onAction={handleOpenCreate}
      />

      {/* 2. Top Metric Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        <Card sx={{ borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                Total Umpires
              </Typography>
              <WhistleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
              {totalCount}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              Registered on national panel
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                Active Referees
              </Typography>
              <ActiveIcon sx={{ color: '#10B981', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#10B981' }}>
              {activeCount}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              Available for match duty
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                Court Officiated
              </Typography>
              <BadgeIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#3B82F6' }}>
              {totalAssignedMatches}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              Total matches assigned
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                Suspended / Inactive
              </Typography>
              <SuspendedIcon sx={{ color: '#EF4444', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: suspendedCount > 0 ? '#EF4444' : 'text.primary' }}>
              {suspendedCount}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              Requires federation clearance
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 3. Search & Filter Bar */}
      <Card sx={{ borderRadius: 1.5, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <TextField
              size="small"
              placeholder="Search by umpire name, 6-digit ID, phone, email, NID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
              sx={{
                flex: 1,
                minWidth: 260,
                '& .MuiOutlinedInput-root': { borderRadius: 1 }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label="Gender"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="All">All Gender</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

              <Button
                variant="outlined"
                onClick={loadUmpires}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 700 }}
              >
                Filter
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 4. Umpires Table */}
      <Card sx={{ borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Referee Identity
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Federation 6-Digit ID
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Contact Information
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Grade / Certification
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Joined Since
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Matches Officiated
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUmpires.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                    <WhistleIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      No umpires registered yet
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                      Click "Register Umpire" to catalog a national referee to the panel.
                    </Typography>
                    <Button variant="contained" size="small" onClick={handleOpenCreate} sx={{ borderRadius: 1, fontWeight: 700 }}>
                      Register First Umpire
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUmpires
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((umpire) => (
                    <TableRow key={umpire.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Name & Photo */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={umpire.photo_url || ''}
                            alt={umpire.name}
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              bgcolor: 'primary.main',
                              fontWeight: 800,
                              fontSize: '0.82rem'
                            }}
                          >
                            {umpire.name ? umpire.name[0].toUpperCase() : 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                              {umpire.name}
                            </Typography>
                            {umpire.name_bangla && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                                {umpire.name_bangla}
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>
                              Gender: {umpire.gender || 'Male'}
                            </Typography>
                            {umpire.user_id && (
                              <Chip
                                label={`User: ${umpire.linked_user_name || `#${umpire.user_id}`}`}
                                size="small"
                                sx={{
                                  mt: 0.4,
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  borderRadius: 1,
                                  bgcolor: isDark ? 'rgba(59, 130, 246, 0.14)' : '#EFF6FF',
                                  color: isDark ? '#60A5FA' : '#1D4ED8',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* 6-digit ID */}
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={umpire.umpire_id || `BCF-U-${String(umpire.id).padStart(6, '0')}`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.74rem',
                              fontFamily: 'monospace',
                              bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                              color: isDark ? '#34D399' : '#047857',
                              borderRadius: 1
                            }}
                          />
                          <Tooltip title="Copy Federation ID">
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(umpire.umpire_id || '')
                                alert('Federation ID copied to clipboard!')
                              }}
                              sx={{ p: 0.4 }}
                            >
                              <CopyIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                          {umpire.phone ? (
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                              <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} /> {umpire.phone}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>No phone</Typography>
                          )}
                          {umpire.email && (
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                              <EmailIcon sx={{ fontSize: 13 }} /> {umpire.email}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Grade */}
                      <TableCell>
                        <Chip
                          label={umpire.grade || 'National Referee'}
                          size="small"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.7rem',
                            borderRadius: 1,
                            bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                            color: isDark ? '#60A5FA' : '#1D4ED8'
                          }}
                        />
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 13 }} />
                          {umpire.joined_date ? new Date(umpire.joined_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </Typography>
                      </TableCell>

                      {/* Matches count */}
                      <TableCell>
                        <Chip
                          label={`${umpire.assigned_matches_count || 0} matches`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            borderRadius: 1,
                            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'
                          }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={umpire.status || 'Active'}
                          size="small"
                          color={
                            umpire.status === 'Active'
                              ? 'success'
                              : umpire.status === 'Suspended'
                              ? 'error'
                              : 'default'
                          }
                          sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 1 }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="Edit Umpire Details">
                            <IconButton size="small" onClick={() => handleOpenEdit(umpire)} color="primary">
                              <EditIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Umpire">
                            <IconButton size="small" onClick={() => handleDelete(umpire.id, umpire.name)} color="error">
                              <DeleteIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUmpires.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Card>

      {/* 5. Create / Edit Umpire SideSheet */}
      <SideSheet
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingUmpire ? `Edit Umpire: ${editingUmpire.name}` : 'Register Official Umpire'}
        subtitle="Catalog federation credentials, personal details, and referee grade"
        icon={<WhistleIcon />}
        width={{ xs: '100%', sm: 540, md: 620 }}
        footerActions={
          <>
            <Button onClick={() => setIsDialogOpen(false)} color="inherit" sx={{ borderRadius: 1 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={submitting}
              sx={{ borderRadius: 1, fontWeight: 700, px: 3 }}
            >
              {submitting ? 'Saving...' : editingUmpire ? 'Save Changes' : 'Register Umpire'}
            </Button>
          </>
        }
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1 }}>
          {/* Profile Photo Upload */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              p: 2,
              borderRadius: 1.5,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Avatar
              src={formData.photo_url || ''}
              alt="Umpire Preview"
              sx={{
                width: 64,
                height: 64,
                borderRadius: 1.5,
                border: `2px solid ${theme.palette.divider}`,
                bgcolor: 'primary.main',
                fontSize: '1.2rem',
                fontWeight: 800
              }}
            >
              {formData.name ? formData.name[0].toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                Official Profile Picture
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Square ratio photo (PNG/JPG). Compressed automatically under 500 KB.
              </Typography>
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<UploadIcon sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
              >
                Upload Photo
                <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
              </Button>
            </Box>
          </Box>

          {/* Full Name & Bangla Name */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Full Name (English) *"
              required
              fullWidth
              size="small"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputProps={{ sx: { borderRadius: 1 } }}
            />
            <TextField
              label="Full Name (বাংলা)"
              fullWidth
              size="small"
              value={formData.name_bangla}
              onChange={(e) => setFormData({ ...formData, name_bangla: e.target.value })}
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Box>

          {/* Contact (Email & Phone) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              InputProps={{ sx: { borderRadius: 1 } }}
            />
            <TextField
              label="Phone Number"
              fullWidth
              size="small"
              placeholder="+880 1..."
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Box>

          {/* NID & DOB */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="National ID (NID) Number"
              fullWidth
              size="small"
              value={formData.nid_number}
              onChange={(e) => setFormData({ ...formData, nid_number: e.target.value })}
              InputProps={{ sx: { borderRadius: 1 } }}
            />
            <TextField
              label="Date of Birth"
              type="date"
              fullWidth
              size="small"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Box>

          {/* Gender & Status */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Gender"
              fullWidth
              size="small"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              InputProps={{ sx: { borderRadius: 1 } }}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              InputProps={{ sx: { borderRadius: 1 } }}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
            </TextField>
          </Box>

          {/* Joined Date (Kobe theke federation e) & Grade */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Joined Federation Date"
              type="date"
              fullWidth
              size="small"
              value={formData.joined_date}
              onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Date umpire officially joined BCF"
              InputProps={{ sx: { borderRadius: 1 } }}
            />

            <TextField
              select
              label="Referee Grade / Title"
              fullWidth
              size="small"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              InputProps={{ sx: { borderRadius: 1 } }}
            >
              <MenuItem value="National Referee">National Referee</MenuItem>
              <MenuItem value="Chief Referee">Chief Referee</MenuItem>
              <MenuItem value="International Referee">International Referee</MenuItem>
              <MenuItem value="Technical Delegate">Technical Delegate</MenuItem>
              <MenuItem value="Assistant Referee">Assistant Referee</MenuItem>
            </TextField>
          </Box>

          {/* Federation ID (Generated 6-digit unique id) */}
          <TextField
            label="Federation Unique ID"
            fullWidth
            size="small"
            value={formData.federation_id}
            onChange={(e) => setFormData({ ...formData, federation_id: e.target.value })}
            placeholder="Auto-generated (e.g. BCF-U-100001)"
            helperText="6-digit unique official registration code. Automatically generated if left empty."
            InputProps={{ sx: { borderRadius: 1, fontFamily: 'monospace' } }}
          />

          {/* Link Existing Admin / System User */}
          <TextField
            select
            label="Link System / Admin User Account (Optional)"
            fullWidth
            size="small"
            value={formData.user_id || ''}
            onChange={(e) => {
              const selectedId = e.target.value
              const chosenUser = adminUsers.find((u) => String(u.id) === String(selectedId))
              setFormData((prev) => ({
                ...prev,
                user_id: selectedId,
                name: !editingUmpire && !prev.name && chosenUser?.name ? chosenUser.name : prev.name,
                email: !editingUmpire && !prev.email && chosenUser?.email ? chosenUser.email : prev.email,
                phone: !editingUmpire && !prev.phone && chosenUser?.phone ? chosenUser.phone : prev.phone,
              }))
            }}
            helperText="Select an admin/system user to link with this umpire. Users already assigned to another umpire are disabled."
            InputProps={{ sx: { borderRadius: 1 } }}
          >
            <MenuItem value="">
              <em>None (Unlinked)</em>
            </MenuItem>
            {adminUsers.map((sysUser) => {
              const assignedUmpire = allUmpiresForUserCheck.find(
                (u) =>
                  u.user_id &&
                  Number(u.user_id) === Number(sysUser.id) &&
                  Number(u.id) !== Number(editingUmpire?.id)
              )
              return (
                <MenuItem
                  key={sysUser.id}
                  value={String(sysUser.id)}
                  disabled={Boolean(assignedUmpire)}
                >
                  {sysUser.name} ({sysUser.email}) — {sysUser.role || 'User'}
                  {assignedUmpire ? ` [Assigned to ${assignedUmpire.name}]` : ''}
                </MenuItem>
              )
            })}
          </TextField>
        </Box>
      </SideSheet>
    </Box>
  )
}

