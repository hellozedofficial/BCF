import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Divider,
  useTheme
} from '@mui/material'
import {
  Menu as MenuIcon
} from '@mui/icons-material'

export function MuiHeader({
  onToggleSidebar,
  isCollapsed = false
}) {
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 1200,
        backgroundColor: theme.palette.mode === 'dark' ? '#18181B' : '#FFFFFF',
        borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
        color: 'text.primary',
        transition: 'background-color 0.2s ease'
      }}
    >
      <Toolbar
        sx={{
          height: 64,
          minHeight: '64px !important',
          px: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        {/* Left Side: Hamburger Menu, Brand Wordmark (Expanded only), and Module Page Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {/* Hamburger Menu Toggle */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle navigation menu"
            onClick={onToggleSidebar}
            sx={{
              p: 0.8,
              borderRadius: 2,
              color: 'text.primary',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
              }
            }}
          >
            <MenuIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* Brand Wordmark (visible only in expanded view) */}
          {!isCollapsed && (
            <Box
              onClick={() => navigate('/dashboard')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                userSelect: 'none',
                flexShrink: 0
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  letterSpacing: '-0.04em',
                  color: theme.palette.mode === 'dark' ? '#F4F4F5' : '#18181B',
                  display: 'inline-flex',
                  alignItems: 'baseline'
                }}
              >
                bcf
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    ml: 0.5,
                    transform: 'translateY(-2px)'
                  }}
                />
              </Typography>
            </Box>
          )}

          {/* Subtle vertical divider between Brand and Page Title */}
          {!isCollapsed && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                height: 18,
                my: 'auto',
                mx: 0.5,
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
              }}
            />
          )}

          {/* Module Page Title Slot (portaled from current view) */}
          <Box
            id="bcf-main-header-title-slot"
            sx={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          />
        </Box>

        {/* Right Side: Module Actions Slot (portaled from current view) */}
        <Box
          id="bcf-main-header-actions-slot"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0
          }}
        />
      </Toolbar>
    </AppBar>
  )
}
