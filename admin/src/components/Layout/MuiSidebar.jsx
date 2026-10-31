import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Collapse,
  Badge,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  EmojiEventsOutlined as TrophyIcon,
  Sensors as LiveIcon,
  People as PlayersIcon,
  AssignmentOutlined as RegistrationsIcon,
  ArticleOutlined as NewsIcon,
  ShieldOutlined as ClubIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  OpenInNew as ExternalIcon,
  RadioButtonChecked as CircleDotIcon,
  ViewCarouselOutlined as BannersIcon,
  GroupsOutlined as CommitteeIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Logout as LogoutIcon,
  LockReset as LockResetIcon,
  ManageAccountsOutlined as UsersIcon,
  SettingsOutlined as SettingsIcon
} from '@mui/icons-material'
import { getClientWebsiteUrl } from '@/services/api'
import { ChangePasswordDialog } from '@/components/Common/ChangePasswordDialog'

const EXPANDED_WIDTH = 250
const COLLAPSED_WIDTH = 72

export function MuiSidebar({
  counts = {},
  isCollapsed = false,
  onToggleCollapse,
  user,
  onToggleTheme,
  onLogout
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()

  const [anchorEl, setAnchorEl] = useState(null)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)

  const handleOpenUserMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseUserMenu = () => {
    setAnchorEl(null)
  }

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : (user?.email ? user.email.charAt(0).toUpperCase() : 'S')

  const [componentsOpen, setComponentsOpen] = useState(true)
  const [cmsOpen, setCmsOpen] = useState(true)
  const [systemOpen, setSystemOpen] = useState(true)

  const currentPath = location.pathname === '/' ? '/dashboard' : location.pathname
  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  const systemItems = [
    {
      path: '/users',
      label: 'Users',
      icon: <UsersIcon sx={{ fontSize: 19 }} />,
      badge: null
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <SettingsIcon sx={{ fontSize: 19 }} />,
      badge: null
    }
  ]

  const cmsItems = [
    {
      path: '/banners',
      label: 'Banners',
      icon: <BannersIcon sx={{ fontSize: 19 }} />,
      badge: null
    },
    {
      path: '/news',
      label: 'News & Blogs',
      icon: <NewsIcon sx={{ fontSize: 19 }} />,
      badge: null
    },
    {
      path: '/about-cms',
      label: 'About & Committee',
      icon: <CommitteeIcon sx={{ fontSize: 19 }} />
    }
  ]

  const navItems = [
    {
      path: '/tournaments',
      label: 'Tournaments',
      icon: <TrophyIcon sx={{ fontSize: 19 }} />,
      badge: null
    },
    {
      path: '/matches',
      label: 'Live Matches',
      icon: <LiveIcon sx={{ fontSize: 19 }} />,
      badge: counts.liveMatches ? `${counts.liveMatches}` : null,
      isLive: true
    },
    {
      path: '/players',
      label: 'Players Directory',
      icon: <PlayersIcon sx={{ fontSize: 19 }} />,
      badge: null
    },
    {
      path: '/clubs',
      label: 'Clubs & Academies',
      icon: <ClubIcon sx={{ fontSize: 19 }} />,
      badge: null
    },
    {
      path: '/registrations',
      label: 'Registrations',
      icon: <RegistrationsIcon sx={{ fontSize: 19 }} />,
      badge: counts.pendingRegistrations ? String(counts.pendingRegistrations) : null,
      badgeColor: 'warning'
    }
  ]

  const isDark = theme.palette.mode === 'dark'

  const tooltipSlotProps = {
    tooltip: {
      sx: {
        bgcolor: isDark ? '#27272A' : '#18181B',
        color: '#FFFFFF',
        fontWeight: 650,
        fontSize: '0.78rem',
        py: 0.6,
        px: 1.2,
        borderRadius: 2,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        border: 'none'
      }
    },
    arrow: {
      sx: {
        color: isDark ? '#27272A' : '#18181B'
      }
    }
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100vh - 64px)',
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderRight: 'none',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1100
        }
      }}
    >
      <Box sx={{ flex: 1, py: 2, px: isCollapsed ? 1 : 1.8, overflowY: 'auto' }}>
        {/* Top Item: Dashboard (Matching Screenshot's ⌂ Dashboard) */}
        <ListItem disablePadding sx={{ mb: 0.6, display: 'block' }}>
          {isCollapsed ? (
            <Tooltip title="Dashboard" placement="right" arrow slotProps={tooltipSlotProps}>
              <ListItemButton
                onClick={() => navigate('/dashboard')}
                sx={{
                  minHeight: 44,
                  borderRadius: 2.5,
                  justifyContent: 'center',
                  px: 0,
                  backgroundColor: (theme) => currentPath === '/dashboard' ? `${theme.palette.primary.main}22` : 'transparent',
                  color: currentPath === '/dashboard' ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    color: 'text.primary'
                  }
                }}
              >
                <DashboardIcon sx={{ fontSize: 20 }} />
              </ListItemButton>
            </Tooltip>
          ) : (
            <ListItemButton
              onClick={() => navigate('/dashboard')}
              sx={{
                minHeight: 42,
                borderRadius: 2.5,
                px: 1.5,
                backgroundColor: (theme) => currentPath === '/dashboard' ? `${theme.palette.primary.main}22` : 'transparent',
                color: currentPath === '/dashboard' ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  color: 'text.primary'
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: currentPath === '/dashboard' ? 'primary.main' : 'inherit'
                }}
              >
                <DashboardIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Dashboard"
                primaryTypographyProps={{
                  fontSize: '0.86rem',
                  fontWeight: currentPath === '/dashboard' ? 700 : 500,
                  letterSpacing: '-0.01em'
                }}
              />
            </ListItemButton>
          )}
        </ListItem>

        {/* Section / Group Header (Matching Screenshot: ⊕ Components ⌃) */}
        {!isCollapsed && (
          <Box
            onClick={() => setComponentsOpen((prev) => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
              mt: 1.5,
              mb: 0.5,
              cursor: 'pointer',
              borderRadius: 2,
              userSelect: 'none',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <CircleDotIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  color: 'text.primary',
                  letterSpacing: '-0.01em'
                }}
              >
                Components
              </Typography>
            </Box>
            <IconButton size="small" sx={{ p: 0.2, color: 'text.secondary' }}>
              {componentsOpen ? <ArrowUpIcon sx={{ fontSize: 16 }} /> : <ArrowDownIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        )}

        {/* Nested List Items (Matching screenshot indented sub-items) */}
        <Collapse in={isCollapsed ? true : componentsOpen} timeout="auto" unmountOnExit>
          <List sx={{ p: 0 }}>
            {navItems.map((item) => {
              const isActive = currentPath === item.path

              const itemContent = (
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 38,
                    borderRadius: 2.2,
                    py: 0.8,
                    px: isCollapsed ? 0 : 2,
                    pl: isCollapsed ? 0 : 3.8, // indent like sub-items in screenshot
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    backgroundColor: (theme) => isActive
                      ? `${theme.palette.primary.main}22`
                      : 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: (theme) => isActive
                        ? `${theme.palette.primary.main}33`
                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                      color: 'text.primary'
                    }
                  }}
                >
                  {isCollapsed && (
                    <ListItemIcon
                      sx={{
                        minWidth: 'auto',
                        color: isActive ? 'primary.main' : 'inherit',
                        justifyContent: 'center'
                      }}
                    >
                      {item.badge ? (
                        <Badge
                          variant="dot"
                          color={item.isLive ? 'error' : item.badgeColor || 'primary'}
                        >
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </ListItemIcon>
                  )}

                  {!isCollapsed && (
                    <>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.82rem',
                          fontWeight: isActive ? 700 : 450,
                          letterSpacing: '-0.01em',
                          color: 'inherit'
                        }}
                      />
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color={item.isLive ? 'error' : item.badgeColor || 'default'}
                          sx={{
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 750,
                            borderRadius: 9999,
                            ...(item.isLive && {
                              animation: 'pulse 1.5s infinite'
                            })
                          }}
                        />
                      )}
                    </>
                  )}
                </ListItemButton>
              )

              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.3, display: 'block' }}>
                  {isCollapsed ? (
                    <Tooltip
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <span>{item.label}</span>
                          {item.badge && (
                            <Chip
                              label={item.badge}
                              size="small"
                              color={item.isLive ? 'error' : 'default'}
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                          )}
                        </Box>
                      }
                      placement="right"
                      arrow
                      slotProps={tooltipSlotProps}
                    >
                      {itemContent}
                    </Tooltip>
                  ) : (
                    itemContent
                  )}
                </ListItem>
              )
            })}
          </List>
        </Collapse>

        {/* Section / Group Header: CMS */}
        {!isCollapsed && (
          <Box
            onClick={() => setCmsOpen((prev) => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
              mt: 1.8,
              mb: 0.5,
              cursor: 'pointer',
              borderRadius: 2,
              userSelect: 'none',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <CircleDotIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  color: 'text.primary',
                  letterSpacing: '-0.01em'
                }}
              >
                CMS
              </Typography>
            </Box>
            <IconButton size="small" sx={{ p: 0.2, color: 'text.secondary' }}>
              {cmsOpen ? <ArrowUpIcon sx={{ fontSize: 16 }} /> : <ArrowDownIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        )}

        {/* CMS Nested List Items */}
        <Collapse in={isCollapsed ? true : cmsOpen} timeout="auto" unmountOnExit>
          <List sx={{ p: 0 }}>
            {cmsItems.map((item) => {
              const isActive = currentPath === item.path

              const itemContent = (
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 38,
                    borderRadius: 2.2,
                    py: 0.8,
                    px: isCollapsed ? 0 : 2,
                    pl: isCollapsed ? 0 : 3.8,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    backgroundColor: (theme) => isActive
                      ? `${theme.palette.primary.main}22`
                      : 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: (theme) => isActive
                        ? `${theme.palette.primary.main}33`
                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                      color: 'text.primary'
                    }
                  }}
                >
                  {isCollapsed && (
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        justifyContent: 'center',
                        color: 'inherit'
                      }}
                    >
                      {item.badge ? (
                        <Badge
                          badgeContent={item.badge}
                          color="primary"
                        >
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </ListItemIcon>
                  )}

                  {!isCollapsed && (
                    <>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.82rem',
                          fontWeight: isActive ? 700 : 450,
                          letterSpacing: '-0.01em',
                          color: 'inherit'
                        }}
                      />
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color="default"
                          sx={{
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 750,
                            borderRadius: 9999
                          }}
                        />
                      )}
                    </>
                  )}
                </ListItemButton>
              )

              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.3, display: 'block' }}>
                  {isCollapsed ? (
                    <Tooltip
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <span>{item.label}</span>
                          {item.badge && (
                            <Chip
                              label={item.badge}
                              size="small"
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                          )}
                        </Box>
                      }
                      placement="right"
                      arrow
                      slotProps={tooltipSlotProps}
                    >
                      {itemContent}
                    </Tooltip>
                  ) : (
                    itemContent
                  )}
                </ListItem>
              )
            })}
          </List>
        </Collapse>

        {/* Section / Group Header: SYSTEM */}
        {!isCollapsed && (
          <Box
            onClick={() => setSystemOpen((prev) => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
              mt: 1.8,
              mb: 0.5,
              cursor: 'pointer',
              borderRadius: 2,
              userSelect: 'none',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <CircleDotIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  color: 'text.primary',
                  letterSpacing: '-0.01em'
                }}
              >
                SYSTEM
              </Typography>
            </Box>
            <IconButton size="small" sx={{ p: 0.2, color: 'text.secondary' }}>
              {systemOpen ? <ArrowUpIcon sx={{ fontSize: 16 }} /> : <ArrowDownIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        )}

        {/* System Nested List Items */}
        <Collapse in={isCollapsed ? true : systemOpen} timeout="auto" unmountOnExit>
          <List sx={{ p: 0 }}>
            {systemItems.map((item) => {
              const isActive = currentPath === item.path

              const itemContent = (
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 38,
                    borderRadius: 2.2,
                    py: 0.8,
                    px: isCollapsed ? 0 : 2,
                    pl: isCollapsed ? 0 : 3.8,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    backgroundColor: (theme) => isActive
                      ? `${theme.palette.primary.main}22`
                      : 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      color: 'text.primary'
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isCollapsed ? 0 : 32,
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 700 : 500,
                        color: 'inherit',
                        letterSpacing: '-0.01em'
                      }}
                    />
                  )}
                </ListItemButton>
              )

              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.3, display: 'block' }}>
                  {isCollapsed ? (
                    <Tooltip
                      title={item.label}
                      placement="right"
                      arrow
                      slotProps={tooltipSlotProps}
                    >
                      {itemContent}
                    </Tooltip>
                  ) : (
                    itemContent
                  )}
                </ListItem>
              )
            })}
          </List>
        </Collapse>
      </Box>

      {/* Bottom Footer: User Profile & Theme Mode Toggle */}
      <Box
        sx={{
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          p: isCollapsed ? 1 : 1.5,
          transition: 'all 0.2s ease'
        }}
      >
        {isCollapsed ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle Button (Collapsed) */}
            {onToggleTheme && (
              <Tooltip title={isDark ? 'Switch to Light' : 'Switch to Dark'} placement="right" arrow slotProps={tooltipSlotProps}>
                <IconButton
                  size="small"
                  onClick={onToggleTheme}
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'text.primary',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                    }
                  }}
                >
                  {isDark ? <LightIcon sx={{ fontSize: 19 }} /> : <DarkIcon sx={{ fontSize: 19 }} />}
                </IconButton>
              </Tooltip>
            )}

            {/* Quick Change Password Icon (Collapsed) */}
            <Tooltip title="Change Password" placement="right" arrow slotProps={tooltipSlotProps}>
              <IconButton
                size="small"
                onClick={() => setIsPasswordDialogOpen(true)}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                  }
                }}
              >
                <LockResetIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>

            {/* User Avatar Circle (Collapsed) */}
            <Tooltip title={user?.name || user?.email || 'Admin Profile'} placement="right" arrow slotProps={tooltipSlotProps}>
              <Box
                onClick={handleOpenUserMenu}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#27272A' : '#E4E4E7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.primary',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: isDark ? '#3F3F46' : '#D4D4D8',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                {userInitial}
              </Box>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            {/* User Info (Expanded) - click opens menu */}
            <Box
              onClick={handleOpenUserMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                minWidth: 0,
                flex: 1,
                cursor: 'pointer',
                p: 0.6,
                borderRadius: 2,
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#27272A' : '#E4E4E7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.primary',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {userInitial}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    lineHeight: 1.2
                  }}
                >
                  {user?.name || 'Super Admin'}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    fontSize: '0.72rem',
                    color: 'text.secondary',
                    display: 'block',
                    mt: 0.2
                  }}
                >
                  {user?.email || 'admin@bcf.org.bd'}
                </Typography>
              </Box>
            </Box>

            {/* Quick Change Password Icon (Expanded) */}
            <Tooltip title="Change Password" arrow slotProps={tooltipSlotProps}>
              <IconButton
                size="small"
                onClick={() => setIsPasswordDialogOpen(true)}
                sx={{
                  p: 0.8,
                  borderRadius: 2,
                  color: 'primary.main',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                  }
                }}
              >
                <LockResetIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle Button (Expanded) */}
            {onToggleTheme && (
              <Tooltip title={isDark ? 'Switch to Light' : 'Switch to Dark'} arrow slotProps={tooltipSlotProps}>
                <IconButton
                  size="small"
                  onClick={onToggleTheme}
                  sx={{
                    p: 0.8,
                    borderRadius: 2,
                    color: 'text.secondary',
                    flexShrink: 0,
                    '&:hover': {
                      color: 'text.primary',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                    }
                  }}
                >
                  {isDark ? <LightIcon sx={{ fontSize: 18 }} /> : <DarkIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* User Dropdown Menu (Anchored upwards from the bottom of the sidebar) */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseUserMenu}
          anchorOrigin={{
            vertical: 'top',
            horizontal: isCollapsed ? 'right' : 'center'
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: isCollapsed ? 'left' : 'center'
          }}
          PaperProps={{
            sx: {
              width: 220,
              mb: 1.2,
              borderRadius: 3,
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: isDark ? '0 12px 32px rgba(0, 0, 0, 0.6)' : '0 12px 32px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {user?.name || 'Super Admin'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', wordBreak: 'break-all' }}>
              {user?.email || 'admin@bcf.org.bd'}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            component="a"
            href={getClientWebsiteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCloseUserMenu}
            sx={{ fontSize: '0.85rem' }}
          >
            <ListItemIcon>
              <ExternalIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Public Website" />
          </MenuItem>

          {/* Change Password right above Log Out */}
          <MenuItem
            onClick={() => {
              handleCloseUserMenu()
              setIsPasswordDialogOpen(true)
            }}
            sx={{ fontSize: '0.85rem', color: 'primary.main', fontWeight: 650 }}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>
              <LockResetIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Change Password" />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          {onLogout && (
            <MenuItem
              onClick={() => {
                handleCloseUserMenu()
                onLogout()
              }}
              sx={{ fontSize: '0.85rem', color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Log Out" />
            </MenuItem>
          )}
        </Menu>

        {/* Change Password Dialog */}
        <ChangePasswordDialog
          open={isPasswordDialogOpen}
          onClose={() => setIsPasswordDialogOpen(false)}
        />
      </Box>
    </Drawer>
  )
}

