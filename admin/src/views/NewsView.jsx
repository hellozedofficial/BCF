import React, { useState, useEffect, useMemo } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  TablePagination,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  useTheme
} from '@mui/material'
import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import { RichTextEditor } from '../components/Common/RichTextEditor'
import {
  Article as NewsIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PushPin as PinIcon,
  Person as AuthorIcon,
  OpenInNew as ExternalIcon,
  PhotoCamera as PhotoIcon,
  Visibility as ViewIcon,
  MenuBook as BlogIcon,
  Category as CategoryIcon,
  CalendarToday as DateIcon,
  Link as LinkIcon
} from '@mui/icons-material'
import { getClientWebsiteUrl, getApiBaseUrl } from '@/services/api'

const CATEGORIES = [
  'Announcement',
  'Tournament',
  'Selection',
  'Federation Notice',
  'Press Release',
  'Analysis',
  'Editorial',
  'Interview',
  'Technique & Training'
]

function generateSlug(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function NewsView({
  news = [],
  onCreate,
  onUpdate,
  onDelete
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All') // 'All', 'News', 'Blog'
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'News', // Radio: 'News' | 'Blog'
    slug: '',
    image_url: '',
    image: null,
    summary: '',
    category: 'Announcement',
    author: 'BCF Media Cell',
    publish_date: new Date().toISOString().split('T')[0],
    is_pinned: 0,
    status: 'Published',
    content: ''
  })

  const [imagePreview, setImagePreview] = useState('')
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true)

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Reset page when search or tab changes
  useEffect(() => {
    setPage(0)
  }, [searchQuery, typeFilter])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = news.length
    const newsCount = news.filter((n) => (n.type || 'News') === 'News').length
    const blogCount = news.filter((n) => n.type === 'Blog').length
    const publishedCount = news.filter((n) => (n.status || 'Published') === 'Published').length
    return { total, newsCount, blogCount, publishedCount }
  }, [news])

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.summary && n.summary.toLowerCase().includes(q)) ||
        (n.category && n.category.toLowerCase().includes(q)) ||
        (n.author && n.author.toLowerCase().includes(q))

      const matchesType =
        typeFilter === 'All'
          ? true
          : (n.type || 'News').toLowerCase() === typeFilter.toLowerCase()

      return matchesSearch && matchesType
    })
  }, [news, searchQuery, typeFilter])

  const paginatedNews = useMemo(() => {
    return filteredNews.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    )
  }, [filteredNews, page, rowsPerPage])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      title: '',
      type: 'News',
      slug: '',
      image_url: '',
      image: null,
      summary: '',
      category: 'Announcement',
      author: 'BCF Media Cell',
      publish_date: new Date().toISOString().split('T')[0],
      is_pinned: 0,
      status: 'Published',
      content: ''
    })
    setImagePreview('')
    setAutoGenerateSlug(true)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      title: item.title || '',
      type: item.type || 'News',
      slug: item.slug || '',
      image_url: item.image_url || '',
      image: null,
      summary: item.summary || '',
      category: item.category || 'Announcement',
      author: item.author || 'BCF Media Cell',
      publish_date: item.publish_date ? item.publish_date.split('T')[0] : new Date().toISOString().split('T')[0],
      is_pinned: item.is_pinned ? 1 : 0,
      status: item.status || 'Published',
      content: item.content || ''
    })

    let prev = item.image_url || ''
    if (prev.startsWith('/uploads/')) {
      const base = getApiBaseUrl().replace(/\/api$/, '')
      prev = `${base}${prev}`
    }
    setImagePreview(prev)
    setAutoGenerateSlug(false)
    setIsDialogOpen(true)
  }

  const handleTitleChange = (e) => {
    const titleVal = e.target.value
    setFormData((prev) => ({
      ...prev,
      title: titleVal,
      slug: autoGenerateSlug ? generateSlug(titleVal) : prev.slug
    }))
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setImagePreview(base64)
      setFormData((prev) => ({
        ...prev,
        image: base64,
        image_url: ''
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleImageUrlChange = (e) => {
    const url = e.target.value
    setImagePreview(url)
    setFormData((prev) => ({
      ...prev,
      image_url: url,
      image: null
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    setIsSubmitting(true)
    try {
      if (editingItem) {
        if (onUpdate) {
          await onUpdate(editingItem.id, formData)
        }
      } else {
        if (onCreate) {
          await onCreate(formData)
        }
      }
      setIsDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFullImageUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/uploads/')) {
      const base = getApiBaseUrl().replace(/\/api$/, '')
      return `${base}${path}`
    }
    return path
  }

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Page Header */}
      <PageHeader
        title="News & Blogs CMS"
        subtitle="Publish official BCF federation bulletins, tournament announcements, master analyses, and editorial blogs."
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              fontWeight: 700,
              borderRadius: 2.5,
              px: 2.8,
              py: 1,
              textTransform: 'none',
              boxShadow: (theme) => `0 4px 14px ${theme.palette.primary.main}40`
            }}
          >
            Create News / Blog
          </Button>
        }
      />

      {/* KPI Cards */}
      {/* <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>
                TOTAL POSTS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: '-0.02em' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Archived in repository
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.05em' }}>
                NEWS BULLETINS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: '-0.02em', color: 'primary.main' }}>
                {stats.newsCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Official press notices
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#8B5CF6', fontWeight: 700, letterSpacing: '0.05em' }}>
                EDITORIAL BLOGS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: '-0.02em', color: '#8B5CF6' }}>
                {stats.blogCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                In-depth articles & tactics
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, letterSpacing: '0.05em' }}>
                PUBLISHED LIVE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: '-0.02em', color: 'success.main' }}>
                {stats.publishedCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Active on public portal
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* Main Content Card */}
      <Card sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
        {/* Filters Header */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F9FAFB'
          }}
        >
          {/* Tabs Filter */}
          <Tabs
            value={typeFilter}
            onChange={(e, val) => setTypeFilter(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                fontWeight: 750,
                fontSize: '0.84rem',
                textTransform: 'none',
                px: 2
              }
            }}
          >
            <Tab label={`All Articles (${stats.total})`} value="All" />
            <Tab label={`News (${stats.newsCount})`} value="News" />
            <Tab label={`Blogs (${stats.blogCount})`} value="Blog" />
          </Tabs>

          {/* Search Box */}
          <TextField
            placeholder="Search by title, category, author..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
            sx={{
              minWidth: { xs: '100%', md: 320 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: isDark ? '#18181B' : '#FFFFFF'
              }
            }}
          />
        </Box>

        {/* Articles Table */}
        <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 1.8, width: 80 }}>COVER</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 1.8 }}>TITLE & SLUG</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 1.8 }}>TYPE</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 1.8 }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 1.8 }}>AUTHOR & DATE</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 1.8 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 1.8, textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedNews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                    <NewsIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      No articles match your criteria
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                      Click "Create News / Blog" above to publish your first publication.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedNews.map((item) => {
                  const isBlog = item.type === 'Blog'
                  const fullCover = getFullImageUrl(item.image_url)
                  const clientPortalUrl = `${getClientWebsiteUrl()}/news/${item.slug || item.id}`

                  return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)'
                        }
                      }}
                    >
                      {/* Cover Thumbnail */}
                      <TableCell sx={{ py: 1.6 }}>
                        <Box
                          sx={{
                            width: 64,
                            height: 40,
                            borderRadius: 1.8,
                            overflow: 'hidden',
                            backgroundColor: isDark ? '#27272A' : '#E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          {fullCover ? (
                            <Box
                              component="img"
                              src={fullCover}
                              alt=""
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <PhotoIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                          )}
                        </Box>
                      </TableCell>

                      {/* Title & Slug */}
                      <TableCell sx={{ py: 1.6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.is_pinned === 1 && (
                            <Tooltip title="Pinned Notice">
                              <PinIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                            </Tooltip>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary' }}>
                            {item.title}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontFamily: 'monospace',
                              fontSize: '0.72rem',
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                              px: 0.8,
                              py: 0.1,
                              borderRadius: 1
                            }}
                          >
                            /news/{item.slug || item.id}
                          </Typography>

                          <Tooltip title="Preview on public website">
                            <IconButton
                              size="small"
                              href={clientPortalUrl}
                              target="_blank"
                              sx={{ p: 0.2, color: 'primary.main' }}
                            >
                              <ExternalIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          icon={isBlog ? <BlogIcon sx={{ fontSize: 14 }} /> : <NewsIcon sx={{ fontSize: 14 }} />}
                          label={isBlog ? 'Blog' : 'News'}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            bgcolor: isBlog ? 'rgba(139, 92, 246, 0.14)' : 'rgba(16, 185, 129, 0.14)',
                            color: isBlog ? '#A78BFA' : '#10B981',
                            borderRadius: 1.8
                          }}
                        />
                      </TableCell>

                      {/* Category */}
                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          label={item.category || 'General'}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 650,
                            fontSize: '0.72rem',
                            borderRadius: 1.5,
                            borderColor: 'divider'
                          }}
                        />
                      </TableCell>

                      {/* Author & Date */}
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                          {item.author || 'BCF Media'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          label={item.status || 'Published'}
                          size="small"
                          color={item.status === 'Draft' ? 'default' : 'success'}
                          sx={{ fontWeight: 750, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ py: 1.6, textAlign: 'right' }}>
                        <Tooltip title="Edit Post">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(item)}
                            sx={{ color: 'text.secondary', mr: 0.5 }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
                                onDelete(item.id)
                              }
                            }}
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

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredNews.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Card>

      {/* Create / Edit SideSheet with Fixed Header & Footer */}
      <SideSheet
        open={isDialogOpen}
        onClose={() => !isSubmitting && setIsDialogOpen(false)}
        title={editingItem ? 'Edit Article / Publication' : 'Create New News or Blog Post'}
        subtitle={editingItem ? `Editing: ${editingItem.title}` : 'Draft official announcement, circular or editorial blog'}
        icon={<NewsIcon />}
        width={{ xs: '100%', sm: 680, md: 840 }}
        footerActions={
          <>
            <Button
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
              sx={{
                px: 3,
                fontWeight: 750,
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 14px ${theme.palette.primary.main}40`
              }}
            >
              {isSubmitting ? 'Saving...' : editingItem ? 'Update Post' : 'Publish Post'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.8 }}>
            {/* 1. Radio Button Selector: News vs Blog */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <FormControl component="fieldset">
                <FormLabel
                  component="legend"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    color: 'text.primary',
                    mb: 1,
                    letterSpacing: '0.04em'
                  }}
                >
                  SELECT PUBLICATION TYPE
                </FormLabel>
                <RadioGroup
                  row
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <FormControlLabel
                    value="News"
                    control={<Radio color="primary" />}
                    label={
                      <Box sx={{ ml: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          Official News & Bulletins
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Notices, press releases, federation executive circulars
                        </Typography>
                      </Box>
                    }
                    sx={{ mr: 4 }}
                  />

                  <FormControlLabel
                    value="Blog"
                    control={<Radio color="secondary" />}
                    label={
                      <Box sx={{ ml: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          Editorial & Tactical Blog
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Player masterclasses, match analyses, interviews, opinion
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* 2. Title & Generated Slug */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                label="Article Title *"
                placeholder="e.g. 42nd National Championship Schedule Finalized"
                fullWidth
                value={formData.title}
                onChange={handleTitleChange}
                required
                InputProps={{
                  sx: { fontWeight: 700 }
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TextField
                  label="URL Slug (SEO friendly)"
                  placeholder="article-url-slug"
                  fullWidth
                  size="small"
                  value={formData.slug}
                  onChange={(e) => {
                    setAutoGenerateSlug(false)
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }}
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                  }}
                />

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setAutoGenerateSlug(true)
                    setFormData((prev) => ({ ...prev, slug: generateSlug(prev.title) }))
                  }}
                  sx={{ textTransform: 'none', whiteSpace: 'nowrap', height: 40, px: 2, borderRadius: 2 }}
                >
                  Auto Generate
                </Button>
              </Box>
            </Box>

            {/* 3. Featured Cover Image (Upload or URL) */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                Featured Cover Image (16:9 / 1200x675)
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<PhotoIcon />}
                    sx={{ height: 44, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    Upload Cover Image File
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageFileChange}
                    />
                  </Button>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    Auto-optimized to 1200x675 WebP for SEO and fast loading
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Or Paste Cover Image URL"
                    placeholder="https://images.unsplash.com/..."
                    size="small"
                    fullWidth
                    value={formData.image_url}
                    onChange={handleImageUrlChange}
                  />
                </Grid>
              </Grid>

              {imagePreview && (
                <Box sx={{ mt: 2, position: 'relative', width: '100%', maxWidth: 360 }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Cover preview"
                    sx={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      setImagePreview('')
                      setFormData((prev) => ({ ...prev, image: null, image_url: '' }))
                    }}
                    sx={{ mt: 0.5, fontSize: '0.72rem', textTransform: 'none' }}
                  >
                    Remove Cover
                  </Button>
                </Box>
              )}
            </Box>

            {/* 4. Category, Author, Date, Status */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="Category"
                  fullWidth
                  size="small"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Author / Bureau"
                  fullWidth
                  size="small"
                  value={formData.author}
                  onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Publish Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={formData.publish_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, publish_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="Published">Published (Live)</MenuItem>
                  <MenuItem value="Draft">Draft (Internal)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* 5. Short Summary / Excerpt for SEO */}
            <TextField
              label="SEO Excerpt / Summary (Optional)"
              placeholder="A brief 1-2 sentence overview for social media cards and search engines..."
              fullWidth
              multiline
              rows={2}
              size="small"
              value={formData.summary}
              onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
              helperText="If left blank, will automatically be extracted from article content."
            />

            {/* 6. Rich Text Editor */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Full Article Content & Rich Media *
              </Typography>
              <RichTextEditor
                value={formData.content}
                onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                minHeight={340}
                placeholder="Compose your article here. Use the toolbar to insert headings, blockquotes, lists, and images..."
              />
            </Box>

            {/* 7. Pinned Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formData.is_pinned)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_pinned: e.target.checked ? 1 : 0 }))}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 750 }}>
                    Pin to Top of Portal
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Feature prominently at the top of the News & Blogs page
                  </Typography>
                </Box>
              }
            />
        </Box>
      </SideSheet>
    </Box>
  )
}

export default NewsView
