import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Chip,
  Snackbar,
  Alert,
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
  PaletteOutlined as BrandingIcon
} from '@mui/icons-material'
import { PageHeader } from '@/components/Common/PageHeader'

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
    description: 'Upload size limits, cPanel assets & CDN',
    icon: <StorageIcon sx={{ fontSize: 28 }} />,
    color: '#6366F1',
    category: 'Infrastructure'
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

  const handleCardClick = (module) => {
    setToast({
      message: `"${module.name}" is scheduled for next release. Settings can be configured soon!`,
      severity: 'info'
    })
  }

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Page Header */}
      <PageHeader
        title="Settings & Preferences"
        subtitle="Configure platform modules, integrations, security policies, and system preferences"
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
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark
                  ? '0 12px 28px rgba(0, 0, 0, 0.5)'
                  : '0 12px 28px rgba(0, 0, 0, 0.08)',
                borderColor: item.color
              }
            }}
          >
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
                label={item.category}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 650,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  color: 'text.secondary',
                  mt: 'auto'
                }}
              />
            </CardActionArea>
          </Card>
        ))}
      </Box>

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

