import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  useTheme
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

/**
 * Reusable SideSheet component for admin panel forms
 * Features:
 * - Fixed Header at top with Title, Subtitle, and Close button
 * - Scrollable middle body container
 * - Fixed Footer at bottom with action buttons
 */
export function SideSheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  headerActions,
  footerActions,
  children,
  width = { xs: '100%', sm: 540, md: 640 },
  maxWidth = '100vw',
  hideCloseButton = false,
  paperSx = {}
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Drawer
      anchor="right"
      open={Boolean(open)}
      onClose={onClose}
      transitionDuration={{ enter: 240, exit: 180 }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(15, 23, 42, 0.45)'
          }
        }
      }}
      PaperProps={{
        sx: {
          width,
          maxWidth,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
          boxShadow: isDark
            ? '-12px 0 36px rgba(0, 0, 0, 0.7)'
            : '-12px 0 36px rgba(15, 23, 42, 0.14)',
          overflow: 'hidden',
          ...paperSx
        }
      }}
    >
      {/* 1. FIXED HEADER */}
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 2.5, sm: 3 },
          py: 2.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: isDark ? 'background.paper' : '#FFFFFF',
          zIndex: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (t) => `${t.palette.primary.main}14`,
                color: 'primary.main',
                flexShrink: 0
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.05rem', sm: '1.18rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                color: 'text.primary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.82rem',
                  mt: 0.3,
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {headerActions}
          {!hideCloseButton && (
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close sidesheet"
              sx={{
                color: 'text.secondary',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                p: 0.8,
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: (t) => t.palette.action.hover
                }
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* 2. SCROLLABLE BODY */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: { xs: 2.5, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          '&::-webkit-scrollbar': {
            width: 6
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: (t) => t.palette.divider,
            borderRadius: 3
          }
        }}
      >
        {children}
      </Box>

      {/* 3. FIXED FOOTER */}
      {footerActions && (
        <Box
          sx={{
            flexShrink: 0,
            px: { xs: 2.5, sm: 3 },
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: isDark ? 'background.paper' : '#FAFAFA',
            zIndex: 2
          }}
        >
          {footerActions}
        </Box>
      )}
    </Drawer>
  )
}

export default SideSheet
