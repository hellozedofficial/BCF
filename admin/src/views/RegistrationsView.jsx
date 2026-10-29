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
  Divider,
  Avatar,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel,
  Alert,
  CircularProgress,
  TablePagination,
  useTheme
} from '@mui/material'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import {
  Assignment as RegistrationsIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Place as PlaceIcon,
  Description as FileIcon,
  PersonAdd as PersonAddIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  SportsKabaddi as SportsIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import {
  getMediaUrl,
  registerPlayerByAdmin,
  updateRegistration,
  fetchDivisions,
  fetchDistricts
} from '../services/api'
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

export function RegistrationsView({
  registrations = [],
  clubs = [],
  onUpdateStatus,
  onDelete,
  onRefresh,
  onUpdate
}) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReg, setSelectedReg] = useState(null)

  // Approval & National Player Enrollment Dialog State
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approvalReg, setApprovalReg] = useState(null)
  const [approvalData, setApprovalData] = useState({
    club_name: 'Independent',
    division: 'Dhaka',
    district: 'Dhaka',
    category: 'Senior',
    dominant_hand: 'Right Hand',
    playing_style: 'All-Rounder',
    carrom_board_preference: 'Championship 29x29 Standard',
    rating_points: 1200,
    national_rank: '',
    white_slams: 0,
    black_slams: 0
  })

  // Rejection deactivation confirmation state
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false)
  const [rejectReg, setRejectReg] = useState(null)

  // Pagination State
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(0)
  }, [statusFilter, searchQuery])

  // Admin Direct Registration State
  const [registerOpen, setRegisterOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Edit Registration State
  const [editOpen, setEditOpen] = useState(false)
  const [editingReg, setEditingReg] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [editDistrictsList, setEditDistrictsList] = useState([])

  // Geocode lists
  const [divisionsList, setDivisionsList] = useState([])
  const [districtsList, setDistrictsList] = useState([])

  // Initial Form Data for Create
  const initialFormState = {
    email: '',
    phone: '',
    password: 'bcf@' + new Date().getFullYear(),
    player_since: new Date().getFullYear(),
    is_new_player: false,
    name_en: '',
    name_bn: '',
    nickname: '',
    gender: 'Men',
    dob: '',
    nid_number: '',
    father_name: '',
    mother_name: '',
    present_street: '',
    present_division_id: '',
    present_district_id: '',
    photo_url: '',
    nid_front_url: '',
    nid_back_url: ''
  }

  const [formData, setFormData] = useState(initialFormState)

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name_en: '',
    name_bn: '',
    nickname: '',
    gender: 'Men',
    email: '',
    phone: '',
    dob: '',
    nid_number: '',
    father_name: '',
    mother_name: '',
    player_since: 2026,
    present_street: '',
    present_division_id: '',
    present_district_id: '',
    status: 'Pending',
    photo_url: '',
    nid_front_url: '',
    nid_back_url: ''
  })

  const theme = useTheme()

  // Load divisions on mount
  useEffect(() => {
    fetchDivisions().then(data => {
      if (Array.isArray(data)) setDivisionsList(data)
    })
  }, [])

  // Load districts when create division changes
  useEffect(() => {
    if (formData.present_division_id) {
      fetchDistricts(formData.present_division_id).then(data => {
        if (Array.isArray(data)) setDistrictsList(data)
      })
    } else {
      setDistrictsList([])
    }
  }, [formData.present_division_id])

  // Load districts when edit division changes
  useEffect(() => {
    if (editFormData.present_division_id) {
      fetchDistricts(editFormData.present_division_id).then(data => {
        if (Array.isArray(data)) setEditDistrictsList(data)
      })
    } else {
      setEditDistrictsList([])
    }
  }, [editFormData.present_division_id])

  // Approval dialog opener & player enrollment
  const handleRequestApprove = (reg) => {
    setApprovalReg(reg)
    const effectiveYear = reg.player_since ? parseInt(reg.player_since, 10) : 2020
    const cat = effectiveYear <= 2005 ? 'Veteran' : (reg.category || 'Senior')
    const divName = reg.present_division_name || 'Dhaka'
    const distName = reg.present_district_name || reg.district || 'Dhaka'

    setApprovalData({
      club_name: reg.club_name || (clubs.length > 0 ? clubs[0].name : 'Independent'),
      division: divName,
      district: distName,
      category: cat,
      dominant_hand: 'Right Hand',
      playing_style: 'All-Rounder',
      carrom_board_preference: 'Championship 29x29 Standard',
      rating_points: 1200,
      national_rank: '',
      white_slams: 0,
      black_slams: 0
    })
    setApprovalOpen(true)
  }

  const handleConfirmApproval = async () => {
    if (!approvalReg) return
    await onUpdateStatus(approvalReg.id, 'Approved', approvalData)
    setApprovalOpen(false)
    setApprovalReg(null)
    if (selectedReg && selectedReg.id === approvalReg.id) {
      setSelectedReg(null)
    }
  }

  const handleRequestReject = (reg) => {
    if (reg.status === 'Approved') {
      setRejectReg(reg)
      setRejectConfirmOpen(true)
    } else {
      if (window.confirm(`Reject registration application of ${reg.name_en || reg.full_name}?`)) {
        onUpdateStatus(reg.id, 'Rejected')
        if (selectedReg && selectedReg.id === reg.id) {
          setSelectedReg(null)
        }
      }
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectReg) return
    await onUpdateStatus(rejectReg.id, 'Rejected')
    setRejectConfirmOpen(false)
    setRejectReg(null)
    if (selectedReg && selectedReg.id === rejectReg.id) {
      setSelectedReg(null)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle Photo file with automatic 1:1 square crop for Create
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      autoCropSquare(reader.result).then(squareData => {
        setFormData(prev => ({ ...prev, photo_url: squareData }))
      })
    }
    reader.readAsDataURL(file)
  }

  // Handle Photo file for Edit
  const handleEditPhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      autoCropSquare(reader.result).then(squareData => {
        setEditFormData(prev => ({ ...prev, photo_url: squareData }))
      })
    }
    reader.readAsDataURL(file)
  }

  // Handle Document Uploads (NID Front & Back)
  const handleDocUpload = (e, targetField) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFormData(prev => ({ ...prev, [targetField]: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  // Handle Edit Doc Upload
  const handleEditDocUpload = (e, targetField) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setEditFormData(prev => ({ ...prev, [targetField]: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  // Open Edit Dialog
  const handleOpenEdit = (reg) => {
    setEditingReg(reg)
    setEditFormData({
      name_en: reg.name_en || reg.full_name || '',
      name_bn: reg.name_bn || '',
      nickname: reg.nickname || '',
      gender: reg.gender || 'Men',
      email: reg.email || '',
      phone: reg.phone || '',
      dob: reg.dob ? reg.dob.split('T')[0] : '',
      nid_number: reg.nid_number || '',
      father_name: reg.father_name || '',
      mother_name: reg.mother_name || '',
      player_since: reg.player_since || 2026,
      present_street: reg.present_street || '',
      present_division_id: reg.present_division_id || '',
      present_district_id: reg.present_district_id || '',
      status: reg.status || 'Pending',
      photo_url: reg.photo_url || '',
      nid_front_url: reg.nid_front_url || '',
      nid_back_url: reg.nid_back_url || ''
    })

    if (reg.present_division_id) {
      fetchDistricts(reg.present_division_id).then(data => {
        if (Array.isArray(data)) setEditDistrictsList(data)
      })
    }

    setEditError('')
    setEditSuccess('')
    setEditOpen(true)
  }

  // Submit Edit Registration
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')

    if (!editFormData.name_en || !editFormData.email || !editFormData.phone || !editFormData.nid_number) {
      setEditError('Please fill in required fields: Name (EN), Email, Phone, and NID Number.')
      return
    }

    setEditSubmitting(true)
    try {
      const payload = {
        name_en: editFormData.name_en.trim(),
        name_bn: editFormData.name_bn ? editFormData.name_bn.trim() : editFormData.name_en.trim(),
        nickname: editFormData.nickname ? editFormData.nickname.trim() : null,
        gender: editFormData.gender || 'Men',
        email: editFormData.email.trim().toLowerCase(),
        phone: editFormData.phone.trim(),
        dob: editFormData.dob || null,
        nid_number: editFormData.nid_number.trim(),
        father_name: editFormData.father_name ? editFormData.father_name.trim() : null,
        mother_name: editFormData.mother_name ? editFormData.mother_name.trim() : null,
        player_since: parseInt(editFormData.player_since, 10) || 2026,
        present_street: editFormData.present_street ? editFormData.present_street.trim() : null,
        present_division_id: editFormData.present_division_id ? parseInt(editFormData.present_division_id, 10) : null,
        present_district_id: editFormData.present_district_id ? parseInt(editFormData.present_district_id, 10) : null,
        status: editFormData.status,
        photo_url: editFormData.photo_url,
        nid_front_url: editFormData.nid_front_url,
        nid_back_url: editFormData.nid_back_url
      }

      let res
      if (onUpdate) {
        res = await onUpdate(editingReg.id, payload)
      } else {
        res = await updateRegistration(editingReg.id, payload)
      }

      if (res && res.success) {
        setEditSuccess('Registration updated successfully!')
        if (selectedReg && selectedReg.id === editingReg.id) {
          setSelectedReg(prev => ({ ...prev, ...payload }))
        }
        setTimeout(() => {
          setEditOpen(false)
          setEditingReg(null)
          setEditSuccess('')
          if (onRefresh) onRefresh()
        }, 1200)
      } else {
        setEditError(res?.message || 'Failed to update player registration.')
      }
    } catch (err) {
      setEditError(err.message || 'Error occurred while saving updates.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Submit Admin Direct Registration
  const handleAdminRegisterSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!formData.name_en || !formData.email || !formData.phone || !formData.nid_number || !formData.nid_back_url) {
      setFormError('Please complete required fields: Name (EN), Email, Phone, NID Number, and NID Back Image.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        player_since: parseInt(formData.player_since, 10) || new Date().getFullYear(),
        is_new_player: formData.is_new_player,
        name_en: formData.name_en.trim(),
        name_bn: formData.name_bn.trim() || formData.name_en.trim(),
        nickname: formData.nickname.trim() || null,
        gender: formData.gender || 'Men',
        father_name: formData.father_name.trim() || null,
        mother_name: formData.mother_name.trim() || null,
        dob: formData.dob || null,
        nid_number: formData.nid_number.trim(),
        photo_url: formData.photo_url || formData.nid_front_url,
        nid_front_url: formData.nid_front_url,
        nid_back_url: formData.nid_back_url,
        present_street: formData.present_street.trim() || null,
        present_division_id: formData.present_division_id ? parseInt(formData.present_division_id, 10) : null,
        present_district_id: formData.present_district_id ? parseInt(formData.present_district_id, 10) : null,
        same_as_present: true
      }

      const res = await registerPlayerByAdmin(payload)
      if (res.success) {
        setFormSuccess(`Player registered successfully! Player ID: ${res.data?.player_id || 'Generated'}. Official PDF sent to email.`)
        setTimeout(() => {
          setRegisterOpen(false)
          setFormData(initialFormState)
          setFormSuccess('')
          if (onRefresh) onRefresh()
        }, 1800)
      } else {
        setFormError(res.message || 'Failed to register player. Please check inputs.')
      }
    } catch (err) {
      setFormError(err.message || 'Network error occurred during registration.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRegistrations = registrations.filter((r) => {
    const matchesStatus =
      statusFilter === 'All' || (r.status && r.status.toLowerCase() === statusFilter.toLowerCase())
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (r.full_name && r.full_name.toLowerCase().includes(q)) ||
      (r.name_en && r.name_en.toLowerCase().includes(q)) ||
      (r.player_id && r.player_id.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.district && r.district.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  // Paginated Rows
  const paginatedRegistrations = filteredRegistrations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Material 3 Page Header */}
      <PageHeader
        title="Tournament Applications"
        subtitle="Review, approve, and verify national championship registrations"
        actions={
          <>
            <Button
              variant="outlined"
              onClick={onRefresh}
              sx={{ px: 2.5 }}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => setRegisterOpen(true)}
              sx={{ px: 2.5 }}
            >
              Register Player
            </Button>
          </>
        }
      />

      {/* Top Filter, Search, and Action Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        {/* Segmented Pill Tabs (Matching Screenshot Audience Pill Style) */}
        <Box
          sx={{
            display: 'inline-flex',
            p: 0.5,
            borderRadius: 9999,
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#18181B' : '#F1F5F9',
            border: 'none',
            maxWidth: '100%',
            overflowX: 'auto'
          }}
        >
          <Tabs
            value={statusFilter}
            onChange={(e, val) => setStatusFilter(val)}
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
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  color: 'text.primary'
                }
              }
            }}
          >
            <Tab value="All" label={`All (${registrations.length})`} />
            <Tab value="Pending" label="Pending" />
            <Tab value="Approved" label="Approved" />
            <Tab value="Rejected" label="Rejected" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search applicants, phone, district..."
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
              width: { xs: '100%', sm: 300 }
            }}
          />
        </Box>
      </Box>

      {/* Registrations Table with Pagination */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                <TableCell>Applicant Profile</TableCell>
                <TableCell>Gender & Category</TableCell>
                <TableCell>District</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No registration records matching criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRegistrations.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={getMediaUrl(r.photo_url)}
                          sx={{
                            width: 44,
                            height: 44,
                            aspectRatio: '1 / 1',
                            borderRadius: '50%',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            backgroundColor: 'primary.main',
                            color: '#fff'
                          }}
                        >
                          {(r.name_en || r.full_name || 'A').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {r.name_en || r.full_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {r.player_id ? `ID: ${r.player_id} • ` : ''}{r.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={r.gender || 'Men'}
                          size="small"
                          variant="outlined"
                          color={r.gender === 'Women' ? 'secondary' : 'default'}
                          sx={{ fontSize: '0.72rem', height: 22 }}
                        />
                        <Chip
                          label={r.category || 'Senior'}
                          size="small"
                          sx={{ fontSize: '0.72rem', height: 22 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {r.district}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : 'Recent'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.status}
                        size="small"
                        color={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'error' : 'warning'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Review Application">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setSelectedReg(r)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Registration Form">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleOpenEdit(r)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {r.status !== 'Approved' && (
                          <Tooltip title="Approve & Enroll as National Player">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleRequestApprove(r)}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {r.status !== 'Rejected' && (
                          <Tooltip title={r.status === 'Approved' ? "Reject & Disable Player" : "Reject Application"}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRequestReject(r)}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Delete Record">
                          <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => {
                              if (window.confirm('Delete application record?')) onDelete(r.id)
                            }}
                          >
                            <DeleteIcon fontSize="small" />
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

        {/* Material UI Table Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredRegistrations.length}
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

      {/* Review SideSheet with Fixed Header & Footer */}
      {selectedReg && (
        <SideSheet
          open={Boolean(selectedReg)}
          onClose={() => setSelectedReg(null)}
          title="Player Application Review"
          subtitle={`Applicant: ${selectedReg.full_name} (${selectedReg.player_id || 'ID Pending'})`}
          icon={<RegistrationsIcon />}
          width={{ xs: '100%', sm: 620, md: 740 }}
          headerActions={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<EditIcon />}
                onClick={() => {
                  const regToEdit = selectedReg
                  setSelectedReg(null)
                  handleOpenEdit(regToEdit)
                }}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
              >
                Edit Form
              </Button>
              <Chip
                label={selectedReg.status}
                color={selectedReg.status === 'Approved' ? 'success' : selectedReg.status === 'Rejected' ? 'error' : 'warning'}
                size="small"
              />
            </Box>
          }
          footerActions={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              {selectedReg.download_url ? (
                <Button
                  component="a"
                  href={selectedReg.download_url}
                  target="_blank"
                  startIcon={<DownloadIcon />}
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Download PDF
                </Button>
              ) : <Box />}

              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedReg.status !== 'Approved' && (
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                    onClick={() => handleRequestApprove(selectedReg)}
                  >
                    Approve & Enroll
                  </Button>
                )}
                {selectedReg.status !== 'Rejected' && (
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                    onClick={() => handleRequestReject(selectedReg)}
                  >
                    {selectedReg.status === 'Approved' ? 'Reject (Disable)' : 'Reject'}
                  </Button>
                )}
                <Button onClick={() => setSelectedReg(null)} color="inherit" sx={{ borderRadius: 2 }}>
                  Close
                </Button>
              </Box>
            </Box>
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Top Profile Summary */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2.5, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
              <Avatar
                src={getMediaUrl(selectedReg.photo_url)}
                sx={{
                  width: 72,
                  height: 72,
                  aspectRatio: '1 / 1',
                  borderRadius: 2,
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  backgroundColor: 'primary.main',
                  color: '#fff',
                  border: `2px solid ${theme.palette.primary.main}`
                }}
              >
                {(selectedReg.name_en || 'A').slice(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {selectedReg.name_en || selectedReg.full_name}
                </Typography>
                {selectedReg.name_bn && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {selectedReg.name_bn}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  {selectedReg.player_id ? `ID: ${selectedReg.player_id} • ` : ''}Gender: <strong>{selectedReg.gender || 'Men'}</strong> • NID: {selectedReg.nid_number || 'Pending'} • Player Since: {selectedReg.player_since || '2026'}
                </Typography>
              </Box>
            </Box>

            {/* Grid of details */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>PHONE</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReg.phone || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>EMAIL</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReg.email || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>FATHER'S NAME</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReg.father_name || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>DATE OF BIRTH</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReg.dob || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>DISTRICT / DIVISION</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReg.district || 'Dhaka'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>STREET ADDRESS</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReg.present_street || '—'}</Typography>
              </Box>
            </Box>

            {/* NID Card Documents Preview */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                Uploaded NID Verification Documents
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {/* NID Front */}
                <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#FAFAFA' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>NID FRONT SIDE</Typography>
                    {selectedReg.nid_front_url && (
                      <Button
                        size="small"
                        href={getMediaUrl(selectedReg.nid_front_url)}
                        target="_blank"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                        sx={{ fontSize: '0.7rem', py: 0 }}
                      >
                        Full Image
                      </Button>
                    )}
                  </Box>
                  {selectedReg.nid_front_url ? (
                    <Box sx={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#00000010', borderRadius: 1.5, overflow: 'hidden' }}>
                      <img
                        src={getMediaUrl(selectedReg.nid_front_url)}
                        alt="NID Front"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                      <Typography variant="caption">No image provided</Typography>
                    </Box>
                  )}
                </Box>

                {/* NID Back */}
                <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#FAFAFA' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>NID BACK SIDE</Typography>
                    {selectedReg.nid_back_url && (
                      <Button
                        size="small"
                        href={getMediaUrl(selectedReg.nid_back_url)}
                        target="_blank"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                        sx={{ fontSize: '0.7rem', py: 0 }}
                      >
                        Full Image
                      </Button>
                    )}
                  </Box>
                  {selectedReg.nid_back_url ? (
                    <Box sx={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#00000010', borderRadius: 1.5, overflow: 'hidden' }}>
                      <img
                        src={getMediaUrl(selectedReg.nid_back_url)}
                        alt="NID Back"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                      <Typography variant="caption">No image provided</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </SideSheet>
      )}

      {/* Edit Player Registration Form SideSheet with Fixed Header & Footer */}
      {editOpen && (
        <SideSheet
          open={editOpen}
          onClose={() => !editSubmitting && setEditOpen(false)}
          title="Edit Player Registration Form"
          subtitle={editingReg?.player_id ? `Athlete ID: ${editingReg.player_id}` : 'Update player profile details'}
          icon={<EditIcon />}
          width={{ xs: '100%', sm: 650, md: 780 }}
          headerActions={
            editingReg?.player_id ? (
              <Chip label={`ID: ${editingReg.player_id}`} color="primary" size="small" />
            ) : null
          }
          footerActions={
            <>
              <Button
                onClick={() => setEditOpen(false)}
                disabled={editSubmitting}
                color="inherit"
                sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                variant="contained"
                color="primary"
                disabled={editSubmitting}
                startIcon={editSubmitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
              >
                {editSubmitting ? 'Saving Changes...' : 'Save Registration Changes'}
              </Button>
            </>
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {editError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {editError}
              </Alert>
            )}

            {editSuccess && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {editSuccess}
              </Alert>
            )}

            {/* Status and Gender Header Controls */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F4F7F5', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Application Status</InputLabel>
                <Select
                  value={editFormData.status}
                  label="Application Status"
                  onChange={(e) => handleEditInputChange('status', e.target.value)}
                >
                  <MenuItem value="Pending">Pending Verification</MenuItem>
                  <MenuItem value="Approved">Approved (Federated Athlete)</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  Gender (লিঙ্গ) *
                </FormLabel>
                <RadioGroup
                  row
                  value={editFormData.gender}
                  onChange={(e) => handleEditInputChange('gender', e.target.value)}
                >
                  <FormControlLabel
                    value="Men"
                    control={<Radio size="small" color="primary" />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>পুরুষ (Men)</Typography>}
                  />
                  <FormControlLabel
                    value="Women"
                    control={<Radio size="small" color="primary" />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>মহিলা (Women)</Typography>}
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Section 1: Identity */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Identity Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Full Name (English) *"
                  size="small"
                  required
                  value={editFormData.name_en}
                  onChange={(e) => handleEditInputChange('name_en', e.target.value)}
                />
                <TextField
                  label="Full Name (Bangla)"
                  size="small"
                  value={editFormData.name_bn}
                  onChange={(e) => handleEditInputChange('name_bn', e.target.value)}
                />
                <TextField
                  label="Nickname"
                  size="small"
                  value={editFormData.nickname}
                  onChange={(e) => handleEditInputChange('nickname', e.target.value)}
                />
                <TextField
                  label="National ID Number (NID) *"
                  size="small"
                  required
                  value={editFormData.nid_number}
                  onChange={(e) => handleEditInputChange('nid_number', e.target.value)}
                />
                <TextField
                  label="Date of Birth *"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={editFormData.dob}
                  onChange={(e) => handleEditInputChange('dob', e.target.value)}
                />
                <TextField
                  label="Player Since (Year)"
                  type="number"
                  size="small"
                  value={editFormData.player_since}
                  onChange={(e) => handleEditInputChange('player_since', e.target.value)}
                />
                <TextField
                  label="Father's Name"
                  size="small"
                  value={editFormData.father_name}
                  onChange={(e) => handleEditInputChange('father_name', e.target.value)}
                />
                <TextField
                  label="Mother's Name"
                  size="small"
                  value={editFormData.mother_name}
                  onChange={(e) => handleEditInputChange('mother_name', e.target.value)}
                />
              </Box>
            </Box>

            <Divider />

            {/* Section 2: Contact */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. Contact & Address
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Email Address *"
                  type="email"
                  size="small"
                  required
                  value={editFormData.email}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                />
                <TextField
                  label="Mobile Number *"
                  size="small"
                  required
                  value={editFormData.phone}
                  onChange={(e) => handleEditInputChange('phone', e.target.value)}
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Division (বিভাগ)</InputLabel>
                  <Select
                    value={editFormData.present_division_id}
                    label="Division (বিভাগ)"
                    onChange={(e) => {
                      handleEditInputChange('present_division_id', e.target.value)
                      handleEditInputChange('present_district_id', '')
                    }}
                  >
                    {divisionsList.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name} ({d.bn_name || ''})</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth disabled={!editFormData.present_division_id}>
                  <InputLabel>District (জেলা)</InputLabel>
                  <Select
                    value={editFormData.present_district_id}
                    label="District (জেলা)"
                    onChange={(e) => handleEditInputChange('present_district_id', e.target.value)}
                  >
                    {editDistrictsList.map((dist) => (
                      <MenuItem key={dist.id} value={dist.id}>{dist.name} ({dist.bn_name || ''})</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                  <TextField
                    label="Street Address / Holding / Village"
                    size="small"
                    fullWidth
                    value={editFormData.present_street}
                    onChange={(e) => handleEditInputChange('present_street', e.target.value)}
                  />
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Section 3: Media update */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                3. Update Verification Media (Optional)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                {/* Photo */}
                <Box sx={{ p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                    Player Photo (1:1)
                  </Typography>
                  {editFormData.photo_url ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={getMediaUrl(editFormData.photo_url)}
                        sx={{ width: 68, height: 68, borderRadius: 2 }}
                      />
                      <Button size="small" component="label" sx={{ fontSize: '0.72rem' }}>
                        Replace
                        <input type="file" accept="image/*" hidden onChange={handleEditPhotoUpload} />
                      </Button>
                    </Box>
                  ) : (
                    <Button size="small" component="label" startIcon={<UploadIcon />}>
                      Upload
                      <input type="file" accept="image/*" hidden onChange={handleEditPhotoUpload} />
                    </Button>
                  )}
                </Box>

                {/* NID Front */}
                <Box sx={{ p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                    NID Front Side
                  </Typography>
                  {editFormData.nid_front_url ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <img
                        src={getMediaUrl(editFormData.nid_front_url)}
                        alt="Front"
                        style={{ width: '100%', height: 60, objectFit: 'contain' }}
                      />
                      <Button size="small" component="label" sx={{ fontSize: '0.72rem' }}>
                        Replace
                        <input type="file" accept="image/*" hidden onChange={(e) => handleEditDocUpload(e, 'nid_front_url')} />
                      </Button>
                    </Box>
                  ) : (
                    <Button size="small" component="label" startIcon={<UploadIcon />}>
                      Upload
                      <input type="file" accept="image/*" hidden onChange={(e) => handleEditDocUpload(e, 'nid_front_url')} />
                    </Button>
                  )}
                </Box>

                {/* NID Back */}
                <Box sx={{ p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                    NID Back Side
                  </Typography>
                  {editFormData.nid_back_url ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <img
                        src={getMediaUrl(editFormData.nid_back_url)}
                        alt="Back"
                        style={{ width: '100%', height: 60, objectFit: 'contain' }}
                      />
                      <Button size="small" component="label" sx={{ fontSize: '0.72rem' }}>
                        Replace
                        <input type="file" accept="image/*" hidden onChange={(e) => handleEditDocUpload(e, 'nid_back_url')} />
                      </Button>
                    </Box>
                  ) : (
                    <Button size="small" component="label" startIcon={<UploadIcon />}>
                      Upload
                      <input type="file" accept="image/*" hidden onChange={(e) => handleEditDocUpload(e, 'nid_back_url')} />
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </SideSheet>
      )}

      {/* Admin Player Registration SideSheet with Fixed Header & Footer */}
      <SideSheet
        open={registerOpen}
        onClose={() => !submitting && setRegisterOpen(false)}
        title="Direct Player Registration"
        subtitle="Register an affiliated athlete directly into the National Database with official PDF generation"
        icon={<PersonAddIcon />}
        width={{ xs: '100%', sm: 650, md: 780 }}
        footerActions={
          <>
            <Button
              onClick={() => setRegisterOpen(false)}
              disabled={submitting}
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdminRegisterSubmit}
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
            >
              {submitting ? 'Registering Player...' : 'Complete Player Registration'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {formError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          {formSuccess && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {formSuccess}
            </Alert>
          )}

          {/* Section 1: Basic & Identity */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. Player Identity Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Full Name (English) *"
                size="small"
                required
                value={formData.name_en}
                onChange={(e) => handleInputChange('name_en', e.target.value)}
              />
              <TextField
                label="Full Name (Bangla)"
                size="small"
                value={formData.name_bn}
                onChange={(e) => handleInputChange('name_bn', e.target.value)}
              />
              <TextField
                label="Nickname"
                size="small"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
              />
              <TextField
                label="National ID Number (NID) *"
                size="small"
                required
                value={formData.nid_number}
                onChange={(e) => handleInputChange('nid_number', e.target.value)}
              />
              <TextField
                label="Date of Birth *"
                type="date"
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
              />
              <TextField
                label="Father's Name"
                size="small"
                value={formData.father_name}
                onChange={(e) => handleInputChange('father_name', e.target.value)}
              />
            </Box>

            {/* Gender Radio Selector */}
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F9FBF9' }}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}>
                  Gender (লিঙ্গ) *
                </FormLabel>
                <RadioGroup
                  row
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <FormControlLabel
                    value="Men"
                    control={<Radio size="small" color="primary" />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>পুরুষ (Men)</Typography>}
                  />
                  <FormControlLabel
                    value="Women"
                    control={<Radio size="small" color="primary" />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>মহিলা (Women)</Typography>}
                  />
                </RadioGroup>
              </FormControl>
            </Box>
          </Box>

          <Divider />

          {/* Section 2: Contact & Account */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. Contact & Account Setup
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Email Address *"
                type="email"
                size="small"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                helperText="Official confirmation & PDF will be sent here"
              />
              <TextField
                label="Mobile Number *"
                size="small"
                required
                placeholder="01XXXXXXXXX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              <TextField
                label="Account Password"
                size="small"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              <TextField
                label="Player Since (Year)"
                type="number"
                size="small"
                value={formData.player_since}
                onChange={(e) => handleInputChange('player_since', e.target.value)}
              />
            </Box>
          </Box>

          <Divider />

          {/* Section 3: Residential Address */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Residential Address
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Division (বিভাগ)</InputLabel>
                <Select
                  value={formData.present_division_id}
                  label="Division (বিভাগ)"
                  onChange={(e) => {
                    handleInputChange('present_division_id', e.target.value)
                    handleInputChange('present_district_id', '')
                  }}
                >
                  {divisionsList.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name} ({d.bn_name || ''})</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth disabled={!formData.present_division_id}>
                <InputLabel>District (জেলা)</InputLabel>
                <Select
                  value={formData.present_district_id}
                  label="District (জেলা)"
                  onChange={(e) => handleInputChange('present_district_id', e.target.value)}
                >
                  {districtsList.map((dist) => (
                    <MenuItem key={dist.id} value={dist.id}>{dist.name} ({dist.bn_name || ''})</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                <TextField
                  label="Street Address / Holding / Village *"
                  size="small"
                  fullWidth
                  value={formData.present_street}
                  onChange={(e) => handleInputChange('present_street', e.target.value)}
                />
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Section 4: Document & Photo Uploads */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              4. Photos & NID Verification Documents
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              {/* 1:1 Photo */}
              <Box sx={{ p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                  Player Photo (1:1 Square)
                </Typography>
                {formData.photo_url ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={formData.photo_url}
                      sx={{ width: 84, height: 84, borderRadius: 2, border: `2px solid ${theme.palette.primary.main}` }}
                    />
                    <Button size="small" component="label" sx={{ fontSize: '0.72rem' }}>
                      Change Photo
                      <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<UploadIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Upload Photo
                    <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                  </Button>
                )}
              </Box>

              {/* NID Front */}
              <Box sx={{ p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                  NID Front Side *
                </Typography>
                {formData.nid_front_url ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <img
                      src={formData.nid_front_url}
                      alt="Front Preview"
                      style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <Button size="small" component="label" sx={{ fontSize: '0.72rem' }}>
                      Change Front
                      <input type="file" accept="image/*" hidden onChange={(e) => handleDocUpload(e, 'nid_front_url')} />
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<UploadIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Upload Front
                    <input type="file" accept="image/*" hidden onChange={(e) => handleDocUpload(e, 'nid_front_url')} />
                  </Button>
                )}
              </Box>

              {/* NID Back */}
              <Box sx={{ p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                  NID Back Side *
                </Typography>
                {formData.nid_back_url ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <img
                      src={formData.nid_back_url}
                      alt="Back Preview"
                      style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <Button size="small" component="label" sx={{ fontSize: '0.72rem' }}>
                      Change Back
                      <input type="file" accept="image/*" hidden onChange={(e) => handleDocUpload(e, 'nid_back_url')} />
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<UploadIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Upload Back
                    <input type="file" accept="image/*" hidden onChange={(e) => handleDocUpload(e, 'nid_back_url')} />
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </SideSheet>

      {/* ----------------- APPROVE & NATIONAL PLAYER ENROLLMENT DIALOG ----------------- */}
      <Dialog
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 44, height: 44 }}>
              <CheckCircleIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Approve Registration & Enroll as National Player
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review and customize carrom player details before adding to the National Players registry.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 1 }}>
          {approvalReg && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Player Summary Card */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Avatar
                  src={getMediaUrl(approvalReg.photo_url)}
                  alt={approvalReg.name_en || approvalReg.full_name}
                  sx={{ width: 68, height: 68, borderRadius: 2.5, border: '2px solid', borderColor: 'primary.main' }}
                >
                  {(approvalReg.name_en || approvalReg.full_name || 'P')[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {approvalReg.name_en || approvalReg.full_name}
                    </Typography>
                    {approvalReg.name_bn && (
                      <Typography variant="body2" color="text.secondary">
                        ({approvalReg.name_bn})
                      </Typography>
                    )}
                    <Chip
                      size="small"
                      label={`Reg ID: ${approvalReg.reg_id || approvalReg.id}`}
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {approvalReg.email} • {approvalReg.phone} • Gender: {approvalReg.gender || 'Not specified'}
                  </Typography>
                </Box>
              </Box>

              {/* Form Fields: Club, Division, District */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'primary.main' }}>
                Affiliation & Location
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="approval-club-label">Club / Academy</InputLabel>
                  <Select
                    labelId="approval-club-label"
                    label="Club / Academy"
                    value={approvalData.club_name || ''}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, club_name: e.target.value }))}
                  >
                    <MenuItem value="Independent">
                      <em>Independent / Unattached</em>
                    </MenuItem>
                    {clubs && clubs.map((c) => (
                      <MenuItem key={c.id || c.name} value={c.name}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="approval-div-label">Division</InputLabel>
                  <Select
                    labelId="approval-div-label"
                    label="Division"
                    value={approvalData.division || 'Dhaka'}
                    onChange={(e) => {
                      const newDiv = e.target.value
                      const availableDistricts = BD_DISTRICTS_BY_DIVISION[newDiv] || []
                      setApprovalData(prev => ({
                        ...prev,
                        division: newDiv,
                        district: availableDistricts[0] || ''
                      }))
                    }}
                  >
                    {BD_DIVISIONS.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="approval-dist-label">District</InputLabel>
                  <Select
                    labelId="approval-dist-label"
                    label="District"
                    value={approvalData.district || ''}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, district: e.target.value }))}
                  >
                    {(BD_DISTRICTS_BY_DIVISION[approvalData.division] || ALL_BD_DISTRICTS).map((dist) => (
                      <MenuItem key={dist} value={dist}>
                        {dist}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Technical Carrom Player Attributes */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'primary.main', mt: 1 }}>
                Carrom Player Profile
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="approval-cat-label">Player Category</InputLabel>
                  <Select
                    labelId="approval-cat-label"
                    label="Player Category"
                    value={approvalData.category || 'Senior'}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <MenuItem value="Senior">Senior</MenuItem>
                    <MenuItem value="Junior">Junior (Under 18)</MenuItem>
                    <MenuItem value="Sub-Junior">Sub-Junior (Under 14)</MenuItem>
                    <MenuItem value="Veteran">Veteran (45+)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="approval-hand-label">Dominant Hand</InputLabel>
                  <Select
                    labelId="approval-hand-label"
                    label="Dominant Hand"
                    value={approvalData.dominant_hand || 'Right Hand'}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, dominant_hand: e.target.value }))}
                  >
                    <MenuItem value="Right Hand">Right Hand</MenuItem>
                    <MenuItem value="Left Hand">Left Hand</MenuItem>
                    <MenuItem value="Ambidextrous">Ambidextrous (Both Hands)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="approval-style-label">Playing Style</InputLabel>
                  <Select
                    labelId="approval-style-label"
                    label="Playing Style"
                    value={approvalData.playing_style || 'All-Rounder'}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, playing_style: e.target.value }))}
                  >
                    <MenuItem value="All-Rounder">All-Rounder</MenuItem>
                    <MenuItem value="Aggressive Striker">Aggressive Striker</MenuItem>
                    <MenuItem value="Defensive Board Specialist">Defensive Board Specialist</MenuItem>
                    <MenuItem value="Direct Pocket Specialist">Direct Pocket Specialist</MenuItem>
                    <MenuItem value="Cut Shot Specialist">Cut Shot Specialist</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr 1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="approval-board-label">Board Preference</InputLabel>
                  <Select
                    labelId="approval-board-label"
                    label="Board Preference"
                    value={approvalData.carrom_board_preference || 'Championship 29x29 Standard'}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, carrom_board_preference: e.target.value }))}
                  >
                    <MenuItem value="Championship 29x29 Standard">Championship 29x29 Standard</MenuItem>
                    <MenuItem value="Synco Championship Board">Synco Championship Board</MenuItem>
                    <MenuItem value="Surco WCF Approved Board">Surco WCF Approved Board</MenuItem>
                    <MenuItem value="Siscaa Champion Board">Siscaa Champion Board</MenuItem>
                    <MenuItem value="Standard Tournament Board">Standard Tournament Board</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  label="Elo Rating Points"
                  type="number"
                  value={approvalData.rating_points || 1200}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, rating_points: parseInt(e.target.value, 10) || 1200 }))}
                />

                <TextField
                  size="small"
                  label="White Slams"
                  type="number"
                  value={approvalData.white_slams || 0}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, white_slams: parseInt(e.target.value, 10) || 0 }))}
                />

                <TextField
                  size="small"
                  label="Black Slams"
                  type="number"
                  value={approvalData.black_slams || 0}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, black_slams: parseInt(e.target.value, 10) || 0 }))}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={() => {
              setApprovalOpen(false)
              setApprovalReg(null)
            }}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmApproval}
            startIcon={<CheckCircleIcon />}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            Confirm Approval & Register Player
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------- REJECTION & DEACTIVATION CONFIRMATION DIALOG ----------------- */}
      <Dialog
        open={rejectConfirmOpen}
        onClose={() => {
          setRejectConfirmOpen(false)
          setRejectReg(null)
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'error.main', width: 44, height: 44 }}>
              <WarningIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Reject Approved Player?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deactivate player record in National Players registry
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 1 }}>
          {rejectReg && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Notice: This player is currently Approved and listed in National Players.
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Rejecting this registration will automatically set their status to <strong>'Inactive'</strong> in the National Players list, removing active tournament rights and active ranking visibility.
                </Typography>
              </Alert>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Avatar
                  src={getMediaUrl(rejectReg.photo_url)}
                  alt={rejectReg.name_en || rejectReg.full_name}
                  sx={{ width: 52, height: 52, borderRadius: 2 }}
                >
                  {(rejectReg.name_en || rejectReg.full_name || 'P')[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {rejectReg.name_en || rejectReg.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reg ID: {rejectReg.player_id || rejectReg.id} • {rejectReg.phone || rejectReg.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={() => {
              setRejectConfirmOpen(false)
              setRejectReg(null)
            }}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            startIcon={<CloseIcon />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Confirm Rejection & Disable Player
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
