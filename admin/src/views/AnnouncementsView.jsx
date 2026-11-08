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
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme
} from '@mui/material'
import {
  Campaign as CampaignIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Link as LinkIcon,
  Public as PublicIcon,
  VisibilityOff as VisibilityOffIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import * as api from '../services/api'

export function AnnouncementsView({ announcements = [], onRefresh }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    link_url: '',
    button_text: 'Learn More',
    is_published: true
  })
  const [imagePreview, setImagePreview] = useState('')

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      title: '',
      content: '',
      image_url: '',
      link_url: '',
      button_text: 'Learn More',
      is_published: true
    })
    setImagePreview('')
    setIsSheetOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    const resolvedImg = item.image_url ? api.getMediaUrl(item.image_url) : ''
    setFormData({
      title: item.title || '',
      content: item.content || '',
      image_url: item.image_url || '',
      link_url: item.link_url || '',
      button_text: item.button_text || 'Learn More',
      is_published: Number(item.is_published ?? 1) === 1
    })
    setImagePreview(resolvedImg)
    setIsSheetOpen(true)
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setToast({ open: true, message: 'Banner image must be under 10MB', severity: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result
      setFormData((prev) => ({ ...prev, image_url: base64 }))
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!formData.title?.trim() && !formData.content?.trim() && !formData.image_url?.trim()) {
      setToast({
        open: true,
        message: 'Please provide at least announcement text, a title, or a banner image.',
        severity: 'warning'
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        is_published: formData.is_published ? 1 : 0
      }

      if (editingItem) {
        await api.updateAnnouncement(editingItem.id, payload)
        setToast({ open: true, message: 'Announcement updated successfully', severity: 'success' })
      } else {
        await api.createAnnouncement(payload)
        setToast({ open: true, message: 'Announcement created and saved', severity: 'success' })
      }

      setIsSheetOpen(false)
      if (onRefresh) await onRefresh()
    } catch (err) {
      setToast({ open: true, message: err.message || 'Failed to save announcement', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (item) => {
    const currentlyPublished = Number(item.is_published ?? 1) === 1
    try {
      await api.toggleAnnouncementPublish(item.id, !currentlyPublished)
      setToast({
        open: true,
        message: !currentlyPublished
          ? 'Announcement published! Visitors will see the popup modal.'
          : 'Announcement unpublished from website.',
        severity: 'success'
      })
      if (onRefresh) await onRefresh()
    } catch (err) {
      setToast({ open: true, message: err.message || 'Failed to update status', severity: 'error' })
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete announcement "${item.title || 'Untitled Announcement'}"?`)) return
    try {
      await api.deleteAnnouncement(item.id)
      setToast({ open: true, message: 'Announcement deleted', severity: 'success' })
      if (onRefresh) await onRefresh()
    } catch (err) {
      setToast({ open: true, message: err.message || 'Failed to delete announcement', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Website Popup Announcements"
        subtitle="Manage promotional & notice popups (banner image, text, and target link) shown when visitors enter bcf.org.bd"
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ px: 2.5, fontWeight: 700 }}
          >
            New Announcement
          </Button>
        }
      />

      <Alert
        severity="info"
        icon={<CampaignIcon fontSize="inherit" />}
        sx={{ borderRadius: 2.5, fontSize: '0.84rem' }}
      >
        When an announcement is <strong>Published</strong>, it automatically appears in a modal popup when a visitor enters <strong>bcf.org.bd</strong>. Once the visitor closes the modal, their browser remembers it in <code>localStorage</code> so it won&apos;t interrupt them again.
      </Alert>

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 780 }}>
            <TableHead>
              <TableRow>
                <TableCell>Banner Preview</TableCell>
                <TableCell>Announcement Title & Message</TableCell>
                <TableCell>Target Link</TableCell>
                <TableCell>Status (Publish / Unpublish)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 7, textAlign: 'center' }}>
                    <CampaignIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      No Popup Announcements Created Yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Create an announcement with a banner image, text, and optional link to greet website visitors.
                    </Typography>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
                      Create First Announcement
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((item) => {
                  const isPublished = Number(item.is_published ?? 1) === 1
                  const imgSrc = item.image_url ? api.getMediaUrl(item.image_url) : ''

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ width: 140 }}>
                        {imgSrc ? (
                          <Box
                            component="img"
                            src={imgSrc}
                            alt={item.title || 'Announcement'}
                            sx={{
                              width: 112,
                              height: 64,
                              objectFit: 'cover',
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              display: 'block'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 112,
                              height: 64,
                              borderRadius: 2,
                              border: `1px dashed ${theme.palette.divider}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'text.disabled',
                              fontSize: '0.72rem'
                            }}
                          >
                            Text Only
                          </Box>
                        )}
                      </TableCell>

                      <TableCell sx={{ maxWidth: 360 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.4 }}>
                          {item.title || 'Official Federation Announcement'}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.8rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {item.content || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {item.link_url ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                            <Chip
                              icon={<LinkIcon sx={{ fontSize: '13px !important' }} />}
                              label={item.button_text || 'Learn More'}
                              size="small"
                              variant="outlined"
                              sx={{ width: 'fit-content', height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                            <Typography
                              variant="caption"
                              component="a"
                              href={item.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: 'primary.main',
                                textDecoration: 'none',
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              {item.link_url}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            No link attached
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Switch
                            size="small"
                            color="success"
                            checked={isPublished}
                            onChange={() => handleTogglePublish(item)}
                          />
                          <Chip
                            icon={
                              isPublished ? (
                                <PublicIcon sx={{ fontSize: '13px !important' }} />
                              ) : (
                                <VisibilityOffIcon sx={{ fontSize: '13px !important' }} />
                              )
                            }
                            label={isPublished ? 'Published' : 'Unpublished'}
                            size="small"
                            color={isPublished ? 'success' : 'default'}
                            variant={isPublished ? 'filled' : 'outlined'}
                            onClick={() => handleTogglePublish(item)}
                            sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
                          <Tooltip title="Edit Announcement">
                            <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Announcement">
                            <IconButton size="small" color="error" onClick={() => handleDelete(item)}>
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
      </Card>

      {/* Create / Edit Announcement SideSheet */}
      <SideSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingItem ? 'Edit Popup Announcement' : 'Create Popup Announcement'}
        subtitle="Configure announcement banner image, text content, target link, and publish visibility"
        icon={<CampaignIcon />}
        width={{ xs: '100%', sm: 540, md: 600 }}
        footerActions={
          <>
            <Button onClick={() => setIsSheetOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
            >
              {saving ? 'Saving...' : editingItem ? 'Update Announcement' : 'Save Announcement'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Publish Status Card */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: `1px solid ${formData.is_published ? 'rgba(16, 185, 129, 0.45)' : theme.palette.divider}`,
              backgroundColor: formData.is_published
                ? isDark
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(16, 185, 129, 0.05)'
                : isDark
                ? 'rgba(255,255,255,0.02)'
                : '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {formData.is_published ? 'Published (Active Website Modal)' : 'Unpublished (Draft / Hidden)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formData.is_published
                  ? 'Popup modal will appear immediately for visitors entering bcf.org.bd.'
                  : 'Announcement is saved in Admin Panel but hidden from the public website.'}
              </Typography>
            </Box>
            <Switch
              color="success"
              checked={Boolean(formData.is_published)}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            />
          </Box>

          <TextField
            label="Announcement Heading / Title (Optional)"
            fullWidth
            size="small"
            placeholder="e.g. 43rd National Carrom Championship Registration Open!"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <TextField
            label="Announcement Text / Message"
            fullWidth
            multiline
            rows={4}
            size="small"
            placeholder="Enter the announcement details or notice message to display inside the popup modal..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />

          {/* Banner Image Upload & Preview */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.84rem' }}>
              Banner Image (Optional)
            </Typography>

            {imagePreview ? (
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  mb: 1.5,
                  backgroundColor: isDark ? '#18181B' : '#F8FAFC'
                }}
              >
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Announcement Banner Preview"
                  sx={{
                    width: '100%',
                    maxHeight: 240,
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setFormData({ ...formData, image_url: '' })
                    setImagePreview('')
                  }}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    '&:hover': { backgroundColor: 'rgba(239,68,68,0.9)' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : null}

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 650 }}
              >
                {imagePreview ? 'Replace Banner Image' : 'Upload Banner Image'}
                <input type="file" hidden accept="image/*" onChange={handleImageFileChange} />
              </Button>

              <TextField
                size="small"
                placeholder="Or paste direct image URL (https://...)"
                value={formData.image_url?.startsWith('data:') ? '' : formData.image_url}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData({ ...formData, image_url: val })
                  setImagePreview(val ? api.getMediaUrl(val) : '')
                }}
                sx={{ flex: 1, minWidth: 220 }}
              />
            </Box>
          </Box>

          {/* Link & CTA Button */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
            <TextField
              label="Target Link URL (Optional)"
              fullWidth
              size="small"
              placeholder="e.g. https://bcf.org.bd/player-register or /tournaments"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
            />
            <TextField
              label="Button Text"
              fullWidth
              size="small"
              placeholder="Learn More"
              value={formData.button_text}
              onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
            />
          </Box>
        </Box>
      </SideSheet>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

