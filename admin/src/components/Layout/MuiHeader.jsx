import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Tooltip,
  Avatar,
  useTheme
} from '@mui/material'
import {
  Menu as MenuIcon,
  CalendarMonth as DashboardIcon,
  Sports as MatchesIcon,
  EmojiEvents as TournamentsIcon,
  LightModeOutlined as LightIcon,
  DarkModeOutlined as DarkIcon,
  LogoutOutlined as LogoutIcon
} from '@mui/icons-material'

export function MuiHeader({
  onToggleSidebar,
  isCollapsed = false,
  umpireAccessOnly = false,
  isDark = false,
  onToggleTheme,
  user = null,
  onLogout
}) {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const showBrand = umpireAccessOnly || !isCollapsed
  const umpireNavItems = [
    { label: 'Umpire Dashboard', path: '/dashboard', icon: DashboardIcon },
    { label: 'My Matches', path: '/matches', icon: MatchesIcon },
    { label: 'Tournaments Preview', path: '/tournaments', icon: TournamentsIcon }
  ]

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
        {/* Left Side: Hamburger Menu, Brand Wordmark, Umpire Top Nav (if Umpire Only) and Module Page Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {/* Hamburger Menu Toggle (hidden in Umpire Access Only mode) */}
          {!umpireAccessOnly && (
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
          )}

          {/* Brand Wordmark */}
          {showBrand && (
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
                  fontFamily: "'Tactic Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: theme.palette.mode === 'dark' ? '#F4F4F5' : '#18181B',
                  display: 'inline-flex',
                  alignItems: 'baseline'
                }}
              >
                BCF
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

          {/* Subtle vertical divider between Brand and Page Title / Umpire Nav */}
          {showBrand && (
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

          {/* Umpire Top Navigation Pills (replaces sidebar completely) */}
          {umpireAccessOnly ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, overflowX: 'auto' }}>
              {umpireNavItems.map((item) => {
                const IconComp = item.icon
                const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                return (
                  <Button
                    key={item.path}
                    size="small"
                    variant={active ? 'contained' : 'text'}
                    color={active ? 'primary' : 'inherit'}
                    startIcon={<IconComp sx={{ fontSize: '17px !important' }} />}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: active ? 750 : 650,
                      fontSize: '0.8rem',
                      px: 1.5,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      color: active ? '#fff' : 'text.secondary'
                    }}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </Box>
          ) : (
            /* Module Page Title Slot (portaled from current view) */
            <Box
              id="bcf-main-header-title-slot"
              sx={{
                minWidth: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            />
          )}
        </Box>

        {/* Right Side: Module Actions Slot + Umpire Controls (Theme & Logout when sidebar hidden) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Box
            id="bcf-main-header-actions-slot"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0
            }}
          />
          {umpireAccessOnly && (
            <>
              {onToggleTheme && (
                <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                  <IconButton size="small" onClick={onToggleTheme} sx={{ borderRadius: 2 }}>
                    {isDark ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
              {user && (
                <Avatar
                  src={user.avatar_url || ''}
                  sx={{ width: 30, height: 30, fontSize: '0.8rem', fontWeight: 800, bgcolor: 'primary.main' }}
                >
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
              )}
              {onLogout && (
                <Tooltip title="Sign Out">
                  <IconButton size="small" color="error" onClick={onLogout} sx={{ borderRadius: 2 }}>
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
