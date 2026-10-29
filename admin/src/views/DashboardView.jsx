import React from 'react'
import { useNavigate } from 'react-router-dom'
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
  Avatar,
  useTheme
} from '@mui/material'
import { PageHeader } from '../components/Common/PageHeader'
import { getClientWebsiteUrl } from '../services/api'
import {
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  Sensors as LiveIcon,
  Assignment as RegistrationsIcon,
  FlashOn as SlamsIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Place as PlaceIcon,
  CalendarToday as CalendarIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material'

export function DashboardView({
  stats = {},
  liveMatches = [],
  pendingRegistrations = [],
  tournaments = [],
  onApproveRegistration,
  onRejectRegistration
}) {
  const navigate = useNavigate()
  const theme = useTheme()

  const statCards = [
    {
      title: 'Registered Athletes',
      value: stats.total_players || 0,
      sub: 'Across 64 Districts',
      icon: <PeopleIcon sx={{ fontSize: 26 }} />,
      color: 'primary',
      path: '/players'
    },
    {
      title: 'Championships',
      value: stats.total_tournaments || 0,
      sub: 'Sanctioned Events',
      icon: <TrophyIcon sx={{ fontSize: 26 }} />,
      color: 'secondary',
      path: '/tournaments'
    },
    {
      title: 'Live Scoreboards',
      value: stats.live_matches || 0,
      sub: 'Real-time Courts',
      icon: <LiveIcon sx={{ fontSize: 26 }} />,
      color: 'error',
      isLive: true,
      path: '/matches'
    },
    {
      title: 'Pending Applications',
      value: stats.pending_registrations || 0,
      sub: 'Needs Verification',
      icon: <RegistrationsIcon sx={{ fontSize: 26 }} />,
      color: 'warning',
      path: '/registrations'
    },
    {
      title: 'White Slams',
      value: stats.white_slams || 0,
      sub: 'Break to Finish Records',
      icon: <SlamsIcon sx={{ fontSize: 26 }} />,
      color: 'info',
      path: '/players'
    }
  ]

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Material 3 Page Header */}
      <PageHeader
        title="Federation Overview"
        subtitle="Bangladesh Carrom Federation executive control & operations"
        actions={
          <>
            <Button
              variant="outlined"
              component="a"
              href={getClientWebsiteUrl()}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ px: 2.5 }}
            >
              Preview Portal
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/registrations')}
              sx={{ px: 2.5 }}
            >
              Registrations
            </Button>
          </>
        }
      />

      {/* Top Stat Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)'
          },
          gap: 2.5
        }}
      >
        {statCards.map((card, idx) => (
          <Card
            key={idx}
            onClick={() => navigate(card.path)}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 24px rgba(0,0,0,0.6)'
                  : '0 8px 24px rgba(0,0,0,0.08)'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.title}
                </Typography>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    color: `${card.color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {card.icon}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {card.value}
                </Typography>
                {card.isLive && (
                  <Chip
                    label="LIVE"
                    size="small"
                    color="error"
                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, px: 0.5 }}
                  />
                )}
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                {card.sub}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Live Match Console Quick Preview */}
      {liveMatches.length > 0 && (
        <Card sx={{ borderLeft: `4px solid ${theme.palette.error.main}` }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'error.main',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                  }}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Active Live Match Court
                </Typography>
                <Chip label="Real-time Scoring" size="small" color="error" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }} />
              </Box>

              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => navigate('/matches')}
                endIcon={<ArrowForwardIcon fontSize="small" />}
                sx={{ fontSize: '0.75rem' }}
              >
                Open Live Match Console
              </Button>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2
              }}
            >
              {liveMatches.slice(0, 2).map((m) => (
                <Box
                  key={m.id}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {m.round_name || 'Quarter Final'} • Board {m.current_board || 1}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ minWidth: 100 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {m.player1_name}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                          {m.player1_score || 0}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        VS
                      </Typography>
                      <Box sx={{ minWidth: 100 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {m.player2_name}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                          {m.player2_score || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/matches')}
                    sx={{ fontSize: '0.75rem', borderRadius: 2 }}
                  >
                    Control
                  </Button>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Pending Applications & Tournaments */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3
        }}
      >
        {/* Pending Registrations Queue */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Recent Applications Queue
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Awaiting executive verification
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                onClick={() => navigate('/registrations')}
                endIcon={<ArrowForwardIcon fontSize="small" />}
                sx={{ fontSize: '0.75rem' }}
              >
                View All ({pendingRegistrations.length})
              </Button>
            </Box>

            {pendingRegistrations.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No pending registration applications to review.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Applicant</TableCell>
                      <TableCell>District</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRegistrations.slice(0, 5).map((reg) => (
                      <TableRow key={reg.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {reg.full_name || reg.name_en}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                            {reg.phone || reg.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reg.district || 'Dhaka'}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.68rem', borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Approve Application">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => onApproveRegistration && onApproveRegistration(reg.id)}
                                sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Application">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => onRejectRegistration && onRejectRegistration(reg.id)}
                                sx={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Sanctioned Tournaments */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Championship Schedule
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Sanctioned BCF national calendar
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                onClick={() => navigate('/tournaments')}
                endIcon={<ArrowForwardIcon fontSize="small" />}
                sx={{ fontSize: '0.75rem' }}
              >
                Manage ({tournaments.length})
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {tournaments.slice(0, 4).map((t) => (
                <Box
                  key={t.id}
                  sx={{
                    p: 1.8,
                    borderRadius: 2.5,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {t.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.72rem' }}>
                        <PlaceIcon sx={{ fontSize: 13 }} />
                        {t.venue ? t.venue.split(',')[0] : 'Dhaka'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.72rem' }}>
                        <CalendarIcon sx={{ fontSize: 13 }} />
                        {t.start_date}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={t.status || 'Upcoming'}
                    size="small"
                    color={
                      t.status === 'Live' ? 'error' : t.status === 'Ongoing' ? 'primary' : 'default'
                    }
                    variant={t.status === 'Live' ? 'filled' : 'outlined'}
                    sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
