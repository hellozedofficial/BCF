import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme
} from '@mui/material'

/**
 * Skeleton loader matching MatchesView layout
 */
export function MatchesViewSkeleton() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header Skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Skeleton variant="text" width={240} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width={380} height={20} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rounded" width={140} height={38} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Filter Bar Skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[90, 110, 120, 100].map((w, idx) => (
            <Skeleton key={idx} variant="rounded" width={w} height={32} sx={{ borderRadius: 99 }} />
          ))}
        </Box>
        <Skeleton variant="rounded" width={220} height={40} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Horizontal Match Switcher Pills Skeleton */}
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'hidden' }}>
        {[180, 200, 190, 210, 170].map((w, idx) => (
          <Skeleton key={idx} variant="rounded" width={w} height={38} sx={{ borderRadius: 2, flexShrink: 0 }} />
        ))}
      </Box>

      {/* 2-Column Scoring & Stream Arena Skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
        {/* Left Card: Scoreboard */}
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Skeleton variant="text" width={200} height={28} />
              <Skeleton variant="text" width={140} height={18} />
            </Box>
            <Skeleton variant="rounded" width={70} height={26} sx={{ borderRadius: 99 }} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 3, p: 3, borderRadius: 3, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', mb: 3 }}>
            <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="text" width={120} height={24} />
              <Skeleton variant="rounded" width={80} height={64} sx={{ borderRadius: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton variant="rounded" width={40} height={32} sx={{ borderRadius: 1.5 }} />
                <Skeleton variant="rounded" width={50} height={32} sx={{ borderRadius: 1.5 }} />
                <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: 1.5 }} />
              </Box>
            </Box>
            <Skeleton variant="circular" width={44} height={44} sx={{ my: 'auto' }} />
            <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="text" width={120} height={24} />
              <Skeleton variant="rounded" width={80} height={64} sx={{ borderRadius: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton variant="rounded" width={40} height={32} sx={{ borderRadius: 1.5 }} />
                <Skeleton variant="rounded" width={50} height={32} sx={{ borderRadius: 1.5 }} />
                <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: 1.5 }} />
              </Box>
            </Box>
          </Box>

          <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: 2 }} />
        </Card>

        {/* Right Card: 16:9 Stream Frame */}
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="text" width={160} height={26} />
            <Skeleton variant="text" width={90} height={22} />
          </Box>
          <Skeleton variant="rounded" width="100%" sx={{ aspectRatio: '16/9', height: 'auto', borderRadius: 2.5 }} />
          <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="text" width="70%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Card>
      </Box>
    </Box>
  )
}

/**
 * Skeleton loader for Table pages (Tournaments, Players, Registrations, Clubs)
 */
export function TablePageSkeleton({ title = 'Loading...', rows = 6 }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Skeleton variant="text" width={260} height={38} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width={420} height={20} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rounded" width={150} height={40} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Filter / Search Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Skeleton variant="rounded" width={280} height={38} sx={{ borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={90} height={32} sx={{ borderRadius: 99 }} />
          <Skeleton variant="rounded" width={100} height={32} sx={{ borderRadius: 99 }} />
          <Skeleton variant="rounded" width={110} height={32} sx={{ borderRadius: 99 }} />
        </Box>
      </Box>

      {/* Table Card Skeleton */}
      <Card sx={{ borderRadius: 3.5, overflow: 'hidden' }}>
        <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                {[80, 180, 140, 120, 90, 80].map((w, idx) => (
                  <TableCell key={idx}>
                    <Skeleton variant="text" width={w} height={22} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: rows }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  <TableCell>
                    <Skeleton variant="rounded" width={40} height={24} sx={{ borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Box>
                        <Skeleton variant="text" width={140} height={20} />
                        <Skeleton variant="text" width={90} height={14} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Skeleton variant="text" width={110} height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} height={20} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: 99 }} /></TableCell>
                  <TableCell align="right"><Skeleton variant="rounded" width={64} height={28} sx={{ borderRadius: 1.5, ml: 'auto' }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}

/**
 * Skeleton loader for Dashboard View
 */
export function DashboardSkeleton() {
  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Metric Cards 4-col strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} sx={{ p: 2.5, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Skeleton variant="text" width={80} height={18} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
            <Skeleton variant="text" width={60} height={38} />
            <Skeleton variant="text" width={110} height={16} sx={{ mt: 0.5 }} />
          </Card>
        ))}
      </Box>

      {/* Main 2-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: 3 }}>
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="text" width={180} height={28} />
            <Skeleton variant="rounded" width={90} height={32} sx={{ borderRadius: 2 }} />
          </Box>
          <Skeleton variant="rounded" width="100%" height={260} sx={{ borderRadius: 2.5 }} />
        </Card>
        <Card sx={{ p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="text" width={140} height={26} />
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} variant="rounded" width="100%" height={48} sx={{ borderRadius: 2 }} />
          ))}
        </Card>
      </Box>
    </Box>
  )
}

/**
 * Skeleton loader for Tournament Detail Console
 */
export function TournamentDetailSkeleton() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top action bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton variant="text" width={280} height={36} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={110} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={130} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={140} height={36} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>

      {/* Top Championship Hero Card */}
      <Card sx={{ p: 3, borderRadius: 3.5 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Skeleton variant="rounded" width={80} height={26} sx={{ borderRadius: 99 }} />
              <Skeleton variant="rounded" width={70} height={26} sx={{ borderRadius: 99 }} />
              <Skeleton variant="rounded" width={140} height={26} sx={{ borderRadius: 99 }} />
            </Box>
            <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="text" width={180} height={20} />
              <Skeleton variant="text" width={160} height={20} />
              <Skeleton variant="text" width={120} height={20} />
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, minWidth: { md: 360 }, p: 1.5, borderRadius: 3, bgcolor: isDark ? '#27272A' : '#F8FAFC' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ textAlign: 'center' }}>
                <Skeleton variant="text" width={40} height={16} sx={{ mx: 'auto' }} />
                <Skeleton variant="text" width={32} height={34} sx={{ mx: 'auto' }} />
              </Box>
            ))}
          </Box>
        </Box>
      </Card>

      {/* Tabs Row */}
      <Box sx={{ display: 'flex', gap: 1, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
        {[140, 160, 120].map((w, idx) => (
          <Skeleton key={idx} variant="rounded" width={w} height={36} sx={{ borderRadius: 2 }} />
        ))}
      </Box>

      {/* Content Skeleton: Bracket / Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} sx={{ p: 2, borderRadius: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Skeleton variant="text" width={70} height={18} />
              <Skeleton variant="rounded" width={50} height={20} sx={{ borderRadius: 99 }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Skeleton variant="text" width={100} height={22} />
              <Skeleton variant="text" width={24} height={22} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton variant="text" width={100} height={22} />
              <Skeleton variant="text" width={24} height={22} />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  )
}


/**
 * Skeleton loader for Player Detail Profile
 */
export function PlayerDetailSkeleton() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top action bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton variant="text" width={240} height={36} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={110} height={36} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>

      {/* Hero Profile Card */}
      <Card sx={{ p: 3, borderRadius: 3.5 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3 }}>
          <Skeleton variant="circular" width={100} height={100} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: 99 }} />
              <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 99 }} />
            </Box>
            <Skeleton variant="text" width={220} height={36} sx={{ mx: { xs: 'auto', md: 0 } }} />
            <Skeleton variant="text" width={160} height={20} sx={{ mx: { xs: 'auto', md: 0 } }} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, minWidth: { md: 340 }, p: 1.5, borderRadius: 3, bgcolor: isDark ? '#27272A' : '#F8FAFC' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ textAlign: 'center' }}>
                <Skeleton variant="text" width={40} height={16} sx={{ mx: 'auto' }} />
                <Skeleton variant="text" width={32} height={32} sx={{ mx: 'auto' }} />
              </Box>
            ))}
          </Box>
        </Box>
      </Card>

      {/* 2-Column Details & Performance */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Box key={i}>
                <Skeleton variant="text" width={80} height={16} />
                <Skeleton variant="text" width={120} height={22} />
              </Box>
            ))}
          </Box>
        </Card>
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" width="100%" height={160} sx={{ borderRadius: 2 }} />
        </Card>
      </Box>
    </Box>
  )
}
