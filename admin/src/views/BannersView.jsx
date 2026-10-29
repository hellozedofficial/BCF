import React, { useState } from 'react'
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
  MenuItem,
  useTheme,
  Grid
} from '@mui/material'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import {
  ViewCarouselOutlined as BannersIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Link as LinkIcon,
  OpenInNew as ExternalIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Image as ImageIcon
} from '@mui/icons-material'
import { getMediaUrl } from '../services/api'

export function BannersView({
  banners = [],
  onCreate,
  onUpdate,
  onDelete
}) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [imageInputMode, setImageInputMode] = useState('upload') // 'upload' or 'url'

  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    order_num: 1,
    status: 'Active'
  })

  const [errorMsg, setErrorMsg] = useState('')

  const handleOpenDialog = (banner = null) => {
    setErrorMsg('')
    if (banner) {
      setEditingItem(banner)
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        order_num: banner.order_num ?? 1,
        status: banner.status || 'Active'
      })
      setImageInputMode(banner.image_url && banner.image_url.startsWith('http') ? 'url' : 'upload')
    } else {
      setEditingItem(null)
      const maxOrder = banners.reduce((max, b) => Math.max(max, b.order_num || 0), 0)
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        order_num: maxOrder + 1,
        status: 'Active'
      })
      setImageInputMode('upload')
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setErrorMsg('')
  }

  // Handle local image file selection and conversion to base64
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP)')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 8MB')
      return
    }

    setErrorMsg('')
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result
      setFormData((prev) => ({ ...prev, image_url: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setErrorMsg('Banner title is required')
      return
    }
    if (!formData.image_url.trim()) {
      setErrorMsg('Banner image is required (upload a file or provide a URL)')
      return
    }

    try {
      if (editingItem) {
        if (onUpdate) await onUpdate(editingItem.id, formData)
      } else {
        if (onCreate) await onCreate(formData)
      }
      handleCloseDialog()
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed')
    }
  }

  const filteredBanners = banners.filter((banner) => {
    const matchesFilter =
      activeFilter === 'All' ? true : banner.status === activeFilter
    const matchesSearch =
      (banner.title && banner.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (banner.subtitle && banner.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const activeCount = banners.filter((b) => b.status === 'Active').length
  const inactiveCount = banners.filter((b) => b.status === 'Inactive').length

  return (
    <Box sx={{ pb: 6 }}>
      {/* 1. Header Section */}
      <PageHeader
        title="Hero Banners (CMS)"
        subtitle="Manage 16:9 interactive carousel slides, announcements and promotional hero imagery on the portal."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 650,
              px: 2.5,
              py: 1,
              boxShadow: 2
            }}
          >
            Add New Banner
          </Button>
        }
      />

      {/* 3. Search and Filter Bar */}
      <Card
        sx={{
          mb: 3,
          p: 1.5,
          borderRadius: 3,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          {/* Pill Tabs */}
          <Box
            sx={{
              display: 'inline-flex',
              p: '4px',
              borderRadius: '12px',
              backgroundColor: isDark ? '#18181B' : '#F1F5F9',
              border: 'none',
              '& .MuiTabs-indicator': { display: 'none !important', height: '0 !important' }
            }}
          >
            {['All', 'Active', 'Inactive'].map((tab) => {
              const selected = activeFilter === tab
              return (
                <Button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    px: 2,
                    py: 0.6,
                    fontSize: '0.82rem',
                    fontWeight: selected ? 700 : 500,
                    textTransform: 'none',
                    minWidth: 'auto',
                    backgroundColor: selected
                      ? (theme) => theme.palette.primary.main
                      : 'transparent',
                    color: selected
                      ? (theme) => theme.palette.primary.contrastText
                      : 'text.secondary',
                    '&:hover': {
                      backgroundColor: selected
                        ? (theme) => theme.palette.primary.dark
                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                      color: selected
                        ? (theme) => theme.palette.primary.contrastText
                        : 'text.primary'
                    }
                  }}
                >
                  {tab}
                </Button>
              )
            })}
          </Box>

          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search banner by title or subtitle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', sm: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />
        </Box>
      </Card>

      {/* 4. Banners Table Card */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}
      >
        <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
          <Table>
            <TableHead sx={{ backgroundColor: isDark ? '#18181B' : '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ width: 60, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>#Order</TableCell>
                <TableCell sx={{ width: 180, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Thumbnail</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Banner Title & Subtitle</TableCell>
                <TableCell sx={{ width: 140, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Link / Action</TableCell>
                <TableCell sx={{ width: 120, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Status</TableCell>
                <TableCell sx={{ width: 110, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBanners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <BannersIcon sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1.5, display: 'block', mx: 'auto' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>No banners found</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      Click "+ Add New Banner" to add a hero slider image to the client website.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanners.map((banner) => {
                  const mediaSrc = getMediaUrl(banner.image_url)
                  const isActive = banner.status === 'Active'

                  return (
                    <TableRow
                      key={banner.id}
                      hover
                      sx={{
                        transition: 'background-color 0.15s ease',
                        '&:last-child td': { borderBottom: 0 }
                      }}
                    >
                      {/* Order Badge */}
                      <TableCell>
                        <Chip
                          label={`#${banner.order_num || 1}`}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 750,
                            borderRadius: 1.5,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>

                      {/* 16:9 Thumbnail Preview */}
                      <TableCell>
                        <Box
                          onClick={() => setPreviewImage(mediaSrc)}
                          sx={{
                            width: 140,
                            height: 78, // strictly 16:9 ratio
                            borderRadius: 2,
                            overflow: 'hidden',
                            backgroundColor: isDark ? '#27272A' : '#E2E8F0',
                            position: 'relative',
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.03)',
                              boxShadow: 3
                            }
                          }}
                        >
                          {mediaSrc ? (
                            <img
                              src={mediaSrc}
                              alt={banner.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                              <ImageIcon />
                            </Box>
                          )}
                        </Box>
                      </TableCell>

                      {/* Title & Caption */}
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.3 }}>
                          {banner.title}
                        </Typography>
                        {banner.subtitle ? (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                            {banner.subtitle}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                            No caption provided
                          </Typography>
                        )}
                      </TableCell>

                      {/* Link / Action */}
                      <TableCell>
                        {banner.link_url ? (
                          <Chip
                            icon={<LinkIcon sx={{ fontSize: '14px !important' }} />}
                            label={banner.link_url}
                            size="small"
                            variant="outlined"
                            sx={{
                              maxWidth: 130,
                              borderRadius: 1.5,
                              fontSize: '0.72rem'
                            }}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            None
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          icon={isActive ? <ActiveIcon sx={{ fontSize: '14px !important' }} /> : <InactiveIcon sx={{ fontSize: '14px !important' }} />}
                          label={banner.status}
                          size="small"
                          color={isActive ? 'success' : 'default'}
                          sx={{
                            fontWeight: 700,
                            borderRadius: 2,
                            fontSize: '0.74rem'
                          }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Tooltip title="Edit Banner">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(banner)}
                            sx={{ color: 'primary.main', mr: 0.5 }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Banner">
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete banner "${banner.title}"?`)) {
                                if (onDelete) onDelete(banner.id)
                              }
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 5. Add / Edit Banner SideSheet with Fixed Header & Footer */}
      <SideSheet
        open={isDialogOpen}
        onClose={handleCloseDialog}
        title={editingItem ? 'Edit Hero Banner' : 'Create New Hero Banner'}
        subtitle="Configure 16:9 carousel slides and announcements on the portal."
        icon={<BannersIcon />}
        width={{ xs: '100%', sm: 540, md: 620 }}
        footerActions={
          <>
            <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 650,
                px: 3
              }}
            >
              {editingItem ? 'Save Changes' : 'Create Banner'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
          {errorMsg && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'error.main',
                color: '#fff',
                fontSize: '0.84rem',
                fontWeight: 600
              }}
            >
              {errorMsg}
            </Box>
          )}

          {/* Banner Title */}
          <TextField
            label="Banner Title *"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. 43rd National Carrom Championship"
            size="small"
            required
          />

          {/* Subtitle / Caption */}
          <TextField
            label="Subtitle / Caption"
            fullWidth
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="e.g. 16 District Franchises Competing for the National Trophy"
            size="small"
          />

          {/* Image Input Selection Tab: Upload vs URL */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
              BANNER IMAGE (STRICTLY 16:9 RATIO RECOMMENDED) *
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Button
                size="small"
                variant={imageInputMode === 'upload' ? 'contained' : 'outlined'}
                onClick={() => setImageInputMode('upload')}
                startIcon={<UploadIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}
              >
                Upload File
              </Button>
              <Button
                size="small"
                variant={imageInputMode === 'url' ? 'contained' : 'outlined'}
                onClick={() => setImageInputMode('url')}
                startIcon={<LinkIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}
              >
                Direct Image URL
              </Button>
            </Box>

            {imageInputMode === 'upload' ? (
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  borderRadius: 2.5,
                  p: 2.5,
                  cursor: 'pointer',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: (theme) => `${theme.palette.primary.main}0D`
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
                <UploadIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary' }}>
                  Click to browse or drop high-res banner image
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Supports PNG, JPG, WEBP (Max 8MB, auto-compressed for performance)
                </Typography>
              </Box>
            ) : (
              <TextField
                label="Image URL *"
                fullWidth
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                size="small"
              />
            )}

            {/* 16:9 Live Preview Box */}
            {formData.image_url && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  16:9 Live Preview:
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 180,
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    mt: 0.5,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    backgroundColor: '#000'
                  }}
                >
                  <img
                    src={getMediaUrl(formData.image_url)}
                    alt="Banner Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </Box>
              </Box>
            )}
          </Box>

          {/* Target Link & Display Order Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Link URL / Navigation Action"
                fullWidth
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="e.g. /tournaments or /about"
                size="small"
                helperText="Optional link when clicking the banner slide"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Display Order"
                type="number"
                fullWidth
                value={formData.order_num}
                onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value, 10) || 1 })}
                size="small"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>

          {/* Status Select */}
          <TextField
            select
            label="Banner Status"
            fullWidth
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            size="small"
          >
            <MenuItem value="Active">Active (Visible on Portal Homepage)</MenuItem>
            <MenuItem value="Inactive">Inactive (Hidden / Draft)</MenuItem>
          </TextField>
        </Box>
      </SideSheet>

      {/* 6. Lightbox Full Image Preview Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: '#000',
            boxShadow: 24
          }}
        >
          {previewImage && (
            <img
              src={previewImage}
              alt="Banner Fullscreen Preview"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  )
}
