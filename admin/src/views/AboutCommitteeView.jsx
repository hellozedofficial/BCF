import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  useTheme,
  InputAdornment,
  Divider
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import SortRoundedIcon from '@mui/icons-material/SortRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded'

import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import { getApiBaseUrl, getMediaUrl } from '../services/api'

const API_BASE = getApiBaseUrl()

export function AboutCommitteeView() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [activeTab, setActiveTab] = useState(0) // 0: Committee, 1: About Section
  const [loading, setLoading] = useState(true)
  const [savingAbout, setSavingAbout] = useState(false)
  const [savingMember, setSavingMember] = useState(false)
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' })

  // Committee State
  const [committee, setCommittee] = useState([])
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [memberForm, setMemberForm] = useState({
    name: '',
    designation: '',
    organization: 'Bangladesh Carrom Federation',
    contact_email: '',
    phone: '',
    image_url: '',
    display_order: 0
  })

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState({ open: false, member: null })

  // About CMS State
  const [aboutForm, setAboutForm] = useState({
    badge: 'Official National Authority',
    headline: 'Governing Carrom Excellence Across Bangladesh',
    story_p1: '',
    story_p2: '',
    history_story: '',
    mission: '',
    vision: '',
    office_address: '',
    official_colors: '',
    bounce_images: []
  })
  const [newImageUrl, setNewImageUrl] = useState('')

  // Fetch all initial data
  const loadData = async () => {
    setLoading(true)
    try {
      const [commRes, aboutRes] = await Promise.all([
        fetch(`${API_BASE}/committee`).then(r => r.json()),
        fetch(`${API_BASE}/about`).then(r => r.json())
      ])

      if (commRes.success) setCommittee(commRes.data || [])
      if (aboutRes.success && aboutRes.data) {
        setAboutForm({
          badge: aboutRes.data.badge || 'Official National Authority',
          headline: aboutRes.data.headline || 'Governing Carrom Excellence Across Bangladesh',
          story_p1: aboutRes.data.story_p1 || '',
          story_p2: aboutRes.data.story_p2 || '',
          history_story: aboutRes.data.history_story || '',
          mission: aboutRes.data.mission || '',
          vision: aboutRes.data.vision || '',
          office_address: aboutRes.data.office_address || '',
          official_colors: aboutRes.data.official_colors || '',
          bounce_images: Array.isArray(aboutRes.data.bounce_images) ? aboutRes.data.bounce_images : []
        })
      }
    } catch (err) {
      console.error('Error fetching About & Committee data:', err)
      showAlert('error', 'Failed to load committee or about settings from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message })
    setTimeout(() => {
      setAlert(prev => ({ ...prev, open: false }))
    }, 4000)
  }

  // Handle open create/edit member
  const handleOpenMemberSheet = (member = null) => {
    if (member) {
      setEditingMember(member)
      setMemberForm({
        name: member.name || '',
        designation: member.designation || '',
        organization: member.organization || 'Bangladesh Carrom Federation',
        contact_email: member.contact_email || '',
        phone: member.phone || '',
        image_url: member.image_url || '',
        display_order: member.display_order || 0
      })
    } else {
      setEditingMember(null)
      setMemberForm({
        name: '',
        designation: '',
        organization: 'Bangladesh Carrom Federation',
        contact_email: '',
        phone: '',
        image_url: '',
        display_order: committee.length + 1
      })
    }
    setIsMemberSheetOpen(true)
  }

  // Save Committee Member
  const handleSaveMember = async (e) => {
    e?.preventDefault()
    if (!memberForm.name.trim()) {
      showAlert('error', 'Member full name is required.')
      return
    }
    if (!memberForm.designation.trim()) {
      showAlert('error', 'Position or designation is required.')
      return
    }

    setSavingMember(true)
    try {
      const url = editingMember
        ? `${API_BASE}/committee/${editingMember.id}`
        : `${API_BASE}/committee`
      const method = editingMember ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm)
      })
      const data = await res.json()

      if (data.success) {
        showAlert('success', editingMember ? 'Member updated successfully' : 'Member added successfully')
        setIsMemberSheetOpen(false)
        loadData()
      } else {
        showAlert('error', data.message || 'Failed to save committee member')
      }
    } catch (err) {
      console.error('Error saving member:', err)
      showAlert('error', 'Network error while saving member')
    } finally {
      setSavingMember(false)
    }
  }

  // Delete Committee Member
  const handleDeleteMember = async () => {
    if (!deleteDialog.member) return
    try {
      const res = await fetch(`${API_BASE}/committee/${deleteDialog.member.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showAlert('success', 'Member deleted successfully')
        setDeleteDialog({ open: false, member: null })
        loadData()
      } else {
        showAlert('error', data.message || 'Failed to delete member')
      }
    } catch (err) {
      console.error('Error deleting member:', err)
      showAlert('error', 'Network error while deleting member')
    }
  }

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Please select a valid image file (JPEG, PNG, WEBP).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setMemberForm(prev => ({ ...prev, image_url: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  // Save About Section Form
  const handleSaveAbout = async () => {
    setSavingAbout(true)
    try {
      const res = await fetch(`${API_BASE}/about`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aboutForm)
      })
      const data = await res.json()
      if (data.success) {
        showAlert('success', 'About information and gallery images saved successfully!')
      } else {
        showAlert('error', data.message || 'Failed to update about information.')
      }
    } catch (err) {
      console.error('Error saving about settings:', err)
      showAlert('error', 'Network error while saving about information.')
    } finally {
      setSavingAbout(false)
    }
  }

  // Add / Remove Bounce Image
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return
    setAboutForm(prev => ({
      ...prev,
      bounce_images: [...prev.bounce_images, newImageUrl.trim()]
    }))
    setNewImageUrl('')
  }

  const handleRemoveImage = (index) => {
    setAboutForm(prev => ({
      ...prev,
      bounce_images: prev.bounce_images.filter((_, i) => i !== index)
    }))
  }

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Alert Notification */}
      {alert.open && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert(prev => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2.5, boxShadow: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Page Header */}
      <PageHeader
        title="About & Committee CMS"
        subtitle="Manage the landing page About narrative, action image gallery, and the Executive Committee directory."
        actions={
          activeTab === 0 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenMemberSheet()}
              sx={{
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.8,
                py: 1,
                textTransform: 'none',
                boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`
              }}
            >
              Add Committee Member
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveRoundedIcon />}
              onClick={handleSaveAbout}
              disabled={savingAbout}
              sx={{
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.8,
                py: 1,
                textTransform: 'none',
                boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`
              }}
            >
              {savingAbout ? 'Saving...' : 'Save About Changes'}
            </Button>
          )
        }
      />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              minHeight: 48,
              gap: 1
            }
          }}
        >
          <Tab icon={<PeopleRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label={`Executive Committee (${committee.length})`} />
          <Tab icon={<InfoRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Landing Page About & Story" />
        </Tabs>
      </Box>

      {/* TAB 0: COMMITTEE MEMBERS DIRECTORY */}
      {activeTab === 0 && (
        <Card sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ minWidth: 750 }}>
              <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.78rem' }}>MEMBER</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.78rem' }}>DESIGNATION / POSITION</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.78rem' }}>EMAIL</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.78rem' }}>PHONE</TableCell>
                  <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.78rem' }}>ORDER</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.78rem' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                      <Typography sx={{ mt: 1.5, color: 'text.secondary', fontSize: '0.9rem' }}>Loading committee directory...</Typography>
                    </TableCell>
                  </TableRow>
                ) : committee.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <PeopleRoundedIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                      <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>No Committee Members Found</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Click &quot;Add Committee Member&quot; to add your first member.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  committee.map((member) => (
                    <TableRow
                      key={member.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      {/* Member Info */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                          <Avatar
                            src={member.image_url ? getMediaUrl(member.image_url) : undefined}
                            alt={member.name}
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: 'primary.main',
                              fontWeight: 800,
                              fontSize: '1rem',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            {(member.name || 'M').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 750, fontSize: '0.92rem', color: 'text.primary' }}>
                              {member.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                              {member.organization || 'Bangladesh Carrom Federation'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Designation */}
                      <TableCell>
                        <Chip
                          label={member.designation}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(4, 120, 87, 0.08)',
                            color: isDark ? '#34D399' : '#047857',
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(4, 120, 87, 0.2)'
                          }}
                        />
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        {member.contact_email ? (
                          <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                            {member.contact_email}
                          </Typography>
                        ) : (
                          <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>
                            Not specified
                          </Typography>
                        )}
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        {member.phone ? (
                          <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                            {member.phone}
                          </Typography>
                        ) : (
                          <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Order */}
                      <TableCell>
                        <Chip
                          label={`#${member.display_order ?? 0}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.74rem', fontWeight: 700 }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.8 }}>
                          <Tooltip title="Edit Member">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenMemberSheet(member)}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main', bgcolor: 'primary.light' }
                              }}
                            >
                              <EditRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Member">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteDialog({ open: true, member })}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { color: 'error.main', bgcolor: 'error.light' }
                              }}
                            >
                              <DeleteRoundedIcon sx={{ fontSize: 18 }} />
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
        </Card>
      )}

      {/* TAB 1: ABOUT CMS & STORY SETTINGS */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Left Column: Narrative texts */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3, display: 'flex', flexDirection: 'column', gap: 2.8 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Landing Page Section Content
              </Typography>

              <TextField
                label="Section Badge Tag"
                value={aboutForm.badge}
                onChange={(e) => setAboutForm({ ...aboutForm, badge: e.target.value })}
                fullWidth
                helperText="Appears as small tag pill above headline on landing page"
              />

              <TextField
                label="Main Section Headline"
                value={aboutForm.headline}
                onChange={(e) => setAboutForm({ ...aboutForm, headline: e.target.value })}
                fullWidth
                helperText="Primary H2 headline of the About section"
              />

              <TextField
                label="Narrative Paragraph 1 (Lead Intro)"
                value={aboutForm.story_p1}
                onChange={(e) => setAboutForm({ ...aboutForm, story_p1: e.target.value })}
                fullWidth
                multiline
                rows={3}
                helperText="First paragraph explaining federation affiliation and origins"
              />

              <TextField
                label="Narrative Paragraph 2 (Grassroots & Championship)"
                value={aboutForm.story_p2}
                onChange={(e) => setAboutForm({ ...aboutForm, story_p2: e.target.value })}
                fullWidth
                multiline
                rows={3}
                helperText="Second paragraph explaining tournaments, referee academies, and players"
              />

              <Divider sx={{ my: 1 }} />

              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Detailed /about Page Content
              </Typography>

              <TextField
                label="Full Federation History & Background"
                value={aboutForm.history_story}
                onChange={(e) => setAboutForm({ ...aboutForm, history_story: e.target.value })}
                fullWidth
                multiline
                rows={4}
                helperText="Extended history displayed on the full dedicated /about page"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mission Statement"
                    value={aboutForm.mission}
                    onChange={(e) => setAboutForm({ ...aboutForm, mission: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Vision Statement"
                    value={aboutForm.vision}
                    onChange={(e) => setAboutForm({ ...aboutForm, vision: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Head Office Address"
                    value={aboutForm.office_address}
                    onChange={(e) => setAboutForm({ ...aboutForm, office_address: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Official Federation Colors"
                    value={aboutForm.official_colors}
                    onChange={(e) => setAboutForm({ ...aboutForm, official_colors: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Right Column: BounceCards Action Image Gallery */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  Interactive Bounce Cards Imagery
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Images displayed in the dynamic stacked BounceCards animation on the landing page and /about gallery.
                </Typography>
              </Box>

              {/* Add New Image Input */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Add Image URL"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleAddImage}
                  startIcon={<AddPhotoAlternateRoundedIcon />}
                  sx={{ flexShrink: 0, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  Add
                </Button>
              </Box>

              {/* Gallery Image List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 480, overflowY: 'auto' }}>
                {aboutForm.bounce_images.map((imgUrl, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
                    }}
                  >
                    <Box
                      component="img"
                      src={getMediaUrl(imgUrl)}
                      alt={`Bounce card ${index + 1}`}
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=200&auto=format&fit=crop'
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
                        Image #{index + 1}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.74rem',
                          color: 'text.secondary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {imgUrl}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveRoundedIcon />}
                onClick={handleSaveAbout}
                disabled={savingAbout}
                fullWidth
                sx={{
                  py: 1.2,
                  borderRadius: 2.5,
                  fontWeight: 750,
                  textTransform: 'none',
                  boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`,
                  mt: 1
                }}
              >
                {savingAbout ? 'Saving All Changes...' : 'Save About & Gallery Changes'}
              </Button>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* SIDESHEET: CREATE / EDIT COMMITTEE MEMBER */}
      <SideSheet
        open={isMemberSheetOpen}
        onClose={() => setIsMemberSheetOpen(false)}
        title={editingMember ? 'Edit Committee Member' : 'Add Committee Member'}
        subtitle={editingMember ? `Updating record for ${editingMember.name}` : 'Create executive officer or member profile'}
        icon={<PeopleRoundedIcon sx={{ fontSize: 22 }} />}
        width={{ xs: '100%', sm: 540, md: 620 }}
        footerActions={
          <>
            <Button
              variant="outlined"
              onClick={() => setIsMemberSheetOpen(false)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 650, px: 2.5 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveMember}
              disabled={savingMember}
              startIcon={savingMember ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 750, px: 3 }}
            >
              {savingMember ? 'Saving...' : (editingMember ? 'Save Changes' : 'Create Member')}
            </Button>
          </>
        }
      >
        <Box component="form" onSubmit={handleSaveMember} sx={{ display: 'flex', flexDirection: 'column', gap: 2.8 }}>
          {/* Photo Upload & Preview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
            <Avatar
              src={memberForm.image_url ? getMediaUrl(memberForm.image_url) : undefined}
              alt={memberForm.name}
              sx={{
                width: 76,
                height: 76,
                borderRadius: 2.5,
                bgcolor: 'primary.main',
                fontWeight: 900,
                fontSize: '1.6rem',
                border: '2px solid',
                borderColor: 'divider',
                boxShadow: 2
              }}
            >
              {(memberForm.name || 'M').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 750, fontSize: '0.9rem', color: 'text.primary', mb: 0.5 }}>
                Member Portrait / Photo
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1.5 }}>
                Upload a 1:1 square headshot photo or provide an external image URL.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCameraRoundedIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  Upload Photo
                  <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                </Button>
                {memberForm.image_url && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setMemberForm(prev => ({ ...prev, image_url: '' }))}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Photo URL Input (Alternative to file upload) */}
          <TextField
            label="Photo Image URL (Optional)"
            placeholder="https://..."
            value={memberForm.image_url?.startsWith('data:') ? 'Image uploaded from computer' : memberForm.image_url}
            onChange={(e) => setMemberForm({ ...memberForm, image_url: e.target.value })}
            disabled={memberForm.image_url?.startsWith('data:')}
            fullWidth
            size="small"
            helperText="Direct image link or use the upload button above"
          />

          {/* Full Name */}
          <TextField
            label="Full Name *"
            value={memberForm.name}
            onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
            required
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Designation / Position */}
          <TextField
            label="Position / Designation *"
            placeholder="e.g. President, General Secretary, Vice President, Treasurer"
            value={memberForm.designation}
            onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
            required
            fullWidth
            helperText="Official title held within the Bangladesh Carrom Federation"
          />

          {/* Contact Email */}
          <TextField
            label="Official Contact Email"
            type="email"
            placeholder="e.g. president@bcf.org.bd"
            value={memberForm.contact_email}
            onChange={(e) => setMemberForm({ ...memberForm, contact_email: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Phone Number */}
          <TextField
            label="Official Phone / Mobile"
            placeholder="e.g. +880 1711-000000"
            value={memberForm.phone}
            onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Organization */}
          <TextField
            label="Organization"
            value={memberForm.organization}
            onChange={(e) => setMemberForm({ ...memberForm, organization: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Display Order */}
          <TextField
            label="Display Priority Order"
            type="number"
            value={memberForm.display_order}
            onChange={(e) => setMemberForm({ ...memberForm, display_order: parseInt(e.target.value, 10) || 0 })}
            fullWidth
            helperText="Lower numbers appear first (e.g. 1 for President, 2 for General Secretary)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SortRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />
        </Box>
      </SideSheet>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, member: null })}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Member Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{deleteDialog.member?.name}</strong> ({deleteDialog.member?.designation}) from the committee directory? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, member: null })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 650 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteMember}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Delete Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AboutCommitteeView
