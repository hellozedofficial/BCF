import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Chip,
  Snackbar,
  Alert,
  Button,
  TextField,
  Switch,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material'
import {
  Tune as GeneralIcon,
  EmailOutlined as EmailIcon,
  SecurityOutlined as SecurityIcon,
  VpnKeyOutlined as RolesIcon,
  PaymentOutlined as PaymentIcon,
  SmsOutlined as SmsIcon,
  SearchOutlined as SeoIcon,
  CloudUploadOutlined as StorageIcon,
  NotificationsNoneOutlined as NotificationIcon,
  HistoryOutlined as AuditIcon,
  StorageOutlined as DatabaseIcon,
  BuildOutlined as MaintenanceIcon,
  TranslateOutlined as LocalizationIcon,
  AssessmentOutlined as AnalyticsIcon,
  ApiOutlined as ApiIcon,
  InfoOutlined as SystemInfoIcon,
  CleaningServicesOutlined as CacheIcon,
  PaletteOutlined as BrandingIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Bolt as TestIcon,
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  Dns as EndpointIcon,
  FolderSpecial as BucketIcon,
  Public as CdnIcon,
  Key as KeyIcon
} from '@mui/icons-material'
import { PageHeader } from '@/components/Common/PageHeader'
import { SideSheet } from '@/components/Common/SideSheet'
import * as api from '@/services/api'

const SETTINGS_MODULES = [
  {
    id: 'general',
    name: 'General Settings',
    description: 'Platform name, logo, contact & copyright',
    icon: <GeneralIcon sx={{ fontSize: 28 }} />,
    color: '#3B82F6',
    category: 'Core'
  },
  {
    id: 'email',
    name: 'Email SMTP',
    description: 'SMTP host, port, credentials & templates',
    icon: <EmailIcon sx={{ fontSize: 28 }} />,
    color: '#10B981',
    category: 'Communications'
  },
  {
    id: 'security',
    name: 'Security & Auth',
    description: 'Two-factor auth, session expiry, policies',
    icon: <SecurityIcon sx={{ fontSize: 28 }} />,
    color: '#EF4444',
    category: 'Security'
  },
  {
    id: 'roles',
    name: 'Roles & Permissions',
    description: 'Role-based access control (RBAC)',
    icon: <RolesIcon sx={{ fontSize: 28 }} />,
    color: '#8B5CF6',
    category: 'Security'
  },
  {
    id: 'payment',
    name: 'Payment Gateway',
    description: 'bKash, Nagad, Rocket & SSLCommerz',
    icon: <PaymentIcon sx={{ fontSize: 28 }} />,
    color: '#EC4899',
    category: 'Finance'
  },
  {
    id: 'sms',
    name: 'SMS Gateway',
    description: 'OTP gateway, player registration alerts',
    icon: <SmsIcon sx={{ fontSize: 28 }} />,
    color: '#F59E0B',
    category: 'Communications'
  },
  {
    id: 'seo',
    name: 'SEO & Metadata',
    description: 'Sitemaps, OpenGraph tags, search keywords',
    icon: <SeoIcon sx={{ fontSize: 28 }} />,
    color: '#06B6D4',
    category: 'Growth'
  },
  {
    id: 'storage',
    name: 'Media & Storage',
    description: 'Cloud object storage, upload limits & CDN',
    icon: <StorageIcon sx={{ fontSize: 28 }} />,
    color: '#6366F1',
    category: 'Infrastructure',
    isLive: true
  },
  {
    id: 'notifications',
    name: 'Notification Hub',
    description: 'Push alerts, email triggers & events',
    icon: <NotificationIcon sx={{ fontSize: 28 }} />,
    color: '#14B8A6',
    category: 'Communications'
  },
  {
    id: 'audit',
    name: 'Audit Logs',
    description: 'Track admin actions & security events',
    icon: <AuditIcon sx={{ fontSize: 28 }} />,
    color: '#64748B',
    category: 'Security'
  },
  {
    id: 'database',
    name: 'Database Backup',
    description: 'MySQL snapshots, scheduled exports',
    icon: <DatabaseIcon sx={{ fontSize: 28 }} />,
    color: '#0284C7',
    category: 'Infrastructure'
  },
  {
    id: 'maintenance',
    name: 'Maintenance Mode',
    description: 'Offline lock, temporary maintenance banner',
    icon: <MaintenanceIcon sx={{ fontSize: 28 }} />,
    color: '#D97706',
    category: 'Core'
  },
  {
    id: 'localization',
    name: 'Localization',
    description: 'Bengali / English language, timezones',
    icon: <LocalizationIcon sx={{ fontSize: 28 }} />,
    color: '#84CC16',
    category: 'Regional'
  },
  {
    id: 'analytics',
    name: 'Web Analytics',
    description: 'Visitor statistics, Google Analytics tags',
    icon: <AnalyticsIcon sx={{ fontSize: 28 }} />,
    color: '#F97316',
    category: 'Growth'
  },
  {
    id: 'api',
    name: 'API & Webhooks',
    description: 'API keys, third-party webhook receivers',
    icon: <ApiIcon sx={{ fontSize: 28 }} />,
    color: '#A855F7',
    category: 'Developer'
  },
  {
    id: 'system',
    name: 'System Info',
    description: 'Node.js, MySQL version, PHP & memory',
    icon: <SystemInfoIcon sx={{ fontSize: 28 }} />,
    color: '#475569',
    category: 'Infrastructure'
  },
  {
    id: 'cache',
    name: 'Cache Management',
    description: 'Purge browser & API caching, flush state',
    icon: <CacheIcon sx={{ fontSize: 28 }} />,
    color: '#059669',
    category: 'Performance'
  },
  {
    id: 'branding',
    name: 'Theme Branding',
    description: 'Brand green color, favicons, typography',
    icon: <BrandingIcon sx={{ fontSize: 28 }} />,
    color: '#84B701',
    category: 'Appearance'
  }
]

export function SettingsView() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [toast, setToast] = useState(null)
  const [isStorageDrawerOpen, setIsStorageDrawerOpen] = useState(false)
  const [storageLoading, setStorageLoading] = useState(false)
  const [storageSaving, setStorageSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showSecretKey, setShowSecretKey] = useState(false)

  // Storage Form State
  const [storageForm, setStorageForm] = useState({
    enabled: true,
    keyId: '',
    applicationKey: '',
    region: 'eu-central-003',
    bucket: 'bangladeshcarromcdn',
    endpoint: 'https://s3.eu-central-003.backblazeb2.com',
    cdnUrl: 'https://f003.backblazeb2.com/file/bangladeshcarromcdn'
  })

  // Load storage settings
  const loadStorageSettings = async () => {
    setStorageLoading(true)
    try {
      const data = await api.fetchStorageSettings()
      if (data) {
        setStorageForm({
          enabled: data.enabled !== false,
          keyId: data.keyId || '',
          applicationKey: data.applicationKey || '',
          region: data.region || 'eu-central-003',
          bucket: data.bucket || 'bangladeshcarromcdn',
          endpoint: data.endpoint || 'https://s3.eu-central-003.backblazeb2.com',
          cdnUrl: data.cdnUrl || 'https://f003.backblazeb2.com/file/bangladeshcarromcdn'
        })
      }
    } catch (err) {
      console.error('Failed to load storage settings:', err)
    } finally {
      setStorageLoading(false)
    }
  }

  const handleCardClick = (module) => {
    if (module.id === 'storage') {
      loadStorageSettings()
      setTestResult(null)
      setShowSecretKey(false)
      setIsStorageDrawerOpen(true)
    } else {
      setToast({
        message: `"${module.name}" is scheduled for upcoming release. Configuration will be available soon!`,
        severity: 'info'
      })
    }
  }

  // Test Storage Connection
  const handleTestConnection = async () => {
    setTestingConnection(true)
    setTestResult(null)
    try {
      const res = await api.testStorageConnection(storageForm)
      if (res && res.success) {
        setTestResult({
          success: true,
          message: res.message || 'Connection verified successfully! Storage is active and accessible.',
          latency: res.latency
        })
      } else {
        setTestResult({
          success: false,
          message: res?.message || 'Connection failed. Please verify credentials and endpoint.'
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Error occurred while testing connection'
      })
    } finally {
      setTestingConnection(false)
    }
  }

  // Save Storage Settings
  const handleSaveStorage = async () => {
    setStorageSaving(true)
    try {
      const res = await api.updateStorageSettings(storageForm)
      if (res && res.success) {
        setToast({
          message: 'Cloud Storage & CDN configuration saved successfully!',
          severity: 'success'
        })
        setIsStorageDrawerOpen(false)
      } else {
        setToast({
          message: res?.message || 'Failed to save storage settings',
          severity: 'error'
        })
      }
    } catch (err) {
      setToast({
        message: err.message || 'An error occurred while saving',
        severity: 'error'
      })
    } finally {
      setStorageSaving(false)
    }
  }

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Page Header */}
      <PageHeader
        title="Settings & Preferences"
        subtitle="Configure platform modules, cloud storage, security policies, and administrative preferences"
      />

      {/* 6-Column Responsive Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(6, 1fr)'
          },
          gap: 2.2,
          mt: 3
        }}
      >
        {SETTINGS_MODULES.map((item) => (
          <Card
            key={item.id}
            elevation={0}
            sx={{
              borderRadius: 3,
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              border: '1px solid',
              borderColor: item.isLive ? `${item.color}50` : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark
                  ? '0 12px 28px rgba(0, 0, 0, 0.5)'
                  : '0 12px 28px rgba(0, 0, 0, 0.08)',
                borderColor: item.color
              }
            }}
          >
            {item.isLive && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  boxShadow: '0 0 8px #10B981'
                }}
              />
            )}

            <CardActionArea
              onClick={() => handleCardClick(item)}
              sx={{
                p: 2.2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 1.5
              }}
            >
              {/* Icon Container */}
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.08)'
                  }
                }}
              >
                {item.icon}
              </Box>

              {/* Title & Description */}
              <Box sx={{ width: '100%' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    color: 'text.primary',
                    lineHeight: 1.3,
                    mb: 0.5
                  }}
                >
                  {item.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.72rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.35
                  }}
                >
                  {item.description}
                </Typography>
              </Box>

              {/* Category Badge */}
              <Chip
                label={item.isLive ? 'Configure Active' : item.category}
                size="small"
                color={item.isLive ? 'primary' : 'default'}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 650,
                  backgroundColor: item.isLive ? undefined : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  color: item.isLive ? undefined : 'text.secondary',
                  mt: 'auto'
                }}
              />
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Cloud Storage & Media Configuration SideSheet */}
      <SideSheet
        open={isStorageDrawerOpen}
        onClose={() => setIsStorageDrawerOpen(false)}
        title="Cloud Storage & CDN"
        subtitle="Configure S3-compatible cloud object storage and high-speed CDN delivery for all media"
        icon={<StorageIcon sx={{ fontSize: 22 }} />}
        width={{ xs: '100%', sm: 560, md: 640 }}
        footerActions={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={testingConnection ? <CircularProgress size={16} color="inherit" /> : <TestIcon />}
              onClick={handleTestConnection}
              disabled={testingConnection || storageSaving}
              sx={{ borderRadius: 2.2, textTransform: 'none', fontWeight: 650, fontSize: '0.82rem' }}
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </Button>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                onClick={() => setIsStorageDrawerOpen(false)}
                disabled={storageSaving}
                sx={{ borderRadius: 2.2, textTransform: 'none', fontWeight: 650, fontSize: '0.82rem' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={storageSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSaveStorage}
                disabled={storageSaving || testingConnection}
                sx={{
                  borderRadius: 2.2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  px: 2.5,
                  boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`
                }}
              >
                {storageSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.8, py: 1 }}>
          {/* Test Status Feedback Alert */}
          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              icon={testResult.success ? <SuccessIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
              sx={{ borderRadius: 2.5, fontSize: '0.84rem' }}
            >
              {testResult.message}
            </Alert>
          )}

          {/* Toggle Active Status */}
          <Box
            sx={{
              p: 2.2,
              borderRadius: 3,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>
                Cloud Object Storage Status
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                When enabled, all player photos, NID documents, banners, and news images upload directly to cloud CDN.
              </Typography>
            </Box>
            <Switch
              checked={Boolean(storageForm.enabled)}
              onChange={(e) => setStorageForm({ ...storageForm, enabled: e.target.checked })}
              color="success"
            />
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Credentials Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              API Access Credentials
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                  Access Key ID *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={storageForm.keyId}
                  onChange={(e) => setStorageForm({ ...storageForm, keyId: e.target.value })}
                  placeholder="e.g. 003f1a3b7e63fc10000000002"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                  Secret Application Key *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  name="cloud_storage_secret_key"
                  autoComplete="new-password"
                  autoCorrect="off"
                  type={showSecretKey ? 'text' : 'password'}
                  value={storageForm.applicationKey}
                  onChange={(e) => setStorageForm({ ...storageForm, applicationKey: e.target.value })}
                  placeholder="Enter secret application key"
                  helperText="Leave masked if you do not wish to modify the existing secret key"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          edge="end"
                        >
                          {showSecretKey ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Bucket & Endpoint Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BucketIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              Bucket & Cluster Configuration
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                  Bucket Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={storageForm.bucket}
                  onChange={(e) => setStorageForm({ ...storageForm, bucket: e.target.value })}
                  placeholder="e.g. bangladeshcarromcdn"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                  Storage Region *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={storageForm.region}
                  onChange={(e) => setStorageForm({ ...storageForm, region: e.target.value })}
                  placeholder="e.g. eu-central-003"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
                />
              </Box>
            </Box>
          </Box>

          {/* Endpoint and CDN URL */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <EndpointIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                S3 Endpoint URL *
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={storageForm.endpoint}
                onChange={(e) => setStorageForm({ ...storageForm, endpoint: e.target.value })}
                placeholder="https://s3.eu-central-003.backblazeb2.com"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CdnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                Public CDN Delivery URL *
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={storageForm.cdnUrl}
                onChange={(e) => setStorageForm({ ...storageForm, cdnUrl: e.target.value })}
                placeholder="https://f003.backblazeb2.com/file/bangladeshcarromcdn"
                helperText="All uploaded assets will be served to the public via this high-speed CDN base URL"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
              />
            </Box>
          </Box>
        </Box>
      </SideSheet>

      {/* Snackbar feedback */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && (
          <Alert
            severity={toast.severity || 'info'}
            onClose={() => setToast(null)}
            sx={{ borderRadius: 2.5, fontWeight: 600 }}
          >
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  )
}

export default SettingsView
