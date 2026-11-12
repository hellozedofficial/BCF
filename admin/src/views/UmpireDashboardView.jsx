import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Divider,
  useTheme
} from '@mui/material'
import {
  Sports as UmpireIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Sensors as LiveIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  EmojiEvents as TrophyIcon,
  ArrowForward as ArrowIcon,
  Gavel as RulesIcon,
  VerifiedUser as BadgeIcon,
  Today as TodayIcon
} from '@mui/icons-material'
import { PageHeader } from '../components/Common/PageHeader'
import { MatchesViewSkeleton } from '../components/Common/PageSkeletons'

function toDateKey(raw) {
  if (!raw) return ''
  try {
    const str = String(raw).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const d = new Date(str)
      if (!isNaN(d.getTime()) && str.includes('T')) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      return str.slice(0, 10)
    }
    const d = new Date(str)
    if (isNaN(d.getTime())) return ''
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function UmpireDashboardView({
  adminUser = null,
  matches = [],
  tournaments = [],
  loading = false
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const navigate = useNavigate()

  const todayKey = useMemo(() => getTodayKey(), [])
  const [cursorMonth, setCursorMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)

  const umpire = adminUser?.umpire_profile || null

  const matchesByDate = useMemo(() => {
    const map = {}
    for (const m of matches) {
      const key = toDateKey(m.match_date || m.scheduled_at || m.created_at)
      if (!key) continue
      if (!map[key]) map[key] = []
      map[key].push(m)
    }
    return map
  }, [matches])

  const liveMatches = useMemo(() => matches.filter((m) => m.status === 'Live'), [matches])
  const todayMatches = useMemo(() => matchesByDate[todayKey] || [], [matchesByDate, todayKey])
  const scheduledMatches = useMemo(() => matches.filter((m) => m.status === 'Scheduled'), [matches])
  const completedMatches = useMemo(() => matches.filter((m) => m.status === 'Completed'), [matches])

  const spotlightMatch = useMemo(() => {
    if (liveMatches.length > 0) return liveMatches[0]
    const upcoming = matches
      .filter((m) => m.status !== 'Completed')
      .sort((a, b) => new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0))
    return upcoming[0] || matches[0] || null
  }, [liveMatches, matches])

  const assignedTournaments = useMemo(() => {
    const tIds = new Set(matches.map((m) => Number(m.tournament_id)).filter(Boolean))
    if (tIds.size === 0) return tournaments.slice(0, 4)
    return tournaments.filter((t) => tIds.has(Number(t.id)))
  }, [matches, tournaments])

  const calendarCells = useMemo(() => {
    const year = cursorMonth.getFullYear()
    const month = cursorMonth.getMonth()
    const firstDayWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push(null)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        day: d,
        dateKey,
        dayMatches: matchesByDate[dateKey] || []
      })
    }
    return cells
  }, [cursorMonth, matchesByDate])

  const visibleScheduleMatches = useMemo(() => {
    if (showAllUpcoming) {
      return matches.filter((m) => m.status !== 'Completed')
    }
    return matchesByDate[selectedDateKey] || []
  }, [matches, matchesByDate, selectedDateKey, showAllUpcoming])

  if (loading) {
    return <MatchesViewSkeleton />
  }

  const surfaceBg = isDark ? '#18181B' : '#FFFFFF'
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
  const monthLabel = cursorMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const kpis = [
    {
      label: 'Assigned Matches',
      value: matches.length,
      icon: UmpireIcon,
      color: theme.palette.primary.main,
      bg: isDark ? 'rgba(132, 183, 1, 0.14)' : '#F2F9E1'
    },
    {
      label: 'Live Courts Now',
      value: liveMatches.length,
      icon: LiveIcon,
      color: '#EF4444',
      bg: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEE2E2'
    },
    {
      label: "Today's Fixtures",
      value: todayMatches.length,
      icon: TodayIcon,
      color: '#3B82F6',
      bg: isDark ? 'rgba(59, 130, 246, 0.14)' : '#EFF6FF'
    },
    {
      label: 'Officiated Done',
      value: completedMatches.length,
      icon: CompletedIcon,
      color: '#10B981',
      bg: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5'
    }
  ]

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Umpire Command Dashboard"
        subtitle="Your match calendar, court assignments & tournament preview overview"
        actions={
          <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<TrophyIcon />}
              onClick={() => navigate('/tournaments')}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Tournaments (Preview)
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<UmpireIcon />}
              onClick={() => navigate('/matches')}
              sx={{ borderRadius: 2, fontWeight: 750, textTransform: 'none', px: 2.5 }}
            >
              Open My Matches
            </Button>
          </Box>
        }
      />

      {/* Umpire Identity & Credential Strip */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(132,183,1,0.16) 0%, rgba(24,24,27,0.98) 70%)'
            : 'linear-gradient(135deg, rgba(132,183,1,0.12) 0%, #FFFFFF 75%)',
          border: `1px solid ${isDark ? 'rgba(132,183,1,0.3)' : 'rgba(132,183,1,0.35)'}`
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={umpire?.photo_url || adminUser?.avatar_url || ''}
              sx={{
                width: 60,
                height: 60,
                bgcolor: 'primary.main',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.3rem',
                border: '2px solid rgba(132,183,1,0.6)'
              }}
            >
              {(umpire?.name || adminUser?.name || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 850, letterSpacing: '-0.02em' }}>
                  {umpire?.name || adminUser?.name || 'Official Umpire'}
                </Typography>
                <Chip
                  icon={<BadgeIcon sx={{ fontSize: '14px !important' }} />}
                  label={umpire?.unique_id || umpire?.federation_id || 'Umpire Access Only'}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 750, fontSize: '0.72rem', height: 24 }}
                />
                {umpire?.status && (
                  <Chip
                    label={umpire.status}
                    size="small"
                    color={umpire.status === 'Active' ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.4 }}>
                {umpire
                  ? `Federation ID: ${umpire.federation_id || 'N/A'} • ${umpire.email || adminUser?.email || ''}`
                  : 'Profile not yet linked to an Umpire record in Umpires Registry — contact Admin to link your user account.'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={<ScheduleIcon sx={{ fontSize: '15px !important' }} />}
              label={`${scheduledMatches.length} Upcoming Scheduled`}
              variant="outlined"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 4 KPI Widgets */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {kpis.map((item) => {
          const IconComp = item.icon
          return (
            <Card key={item.label} elevation={0} sx={{ borderRadius: 2.5, bgcolor: surfaceBg, border: `1px solid ${borderCol}` }}>
              <CardContent sx={{ p: 2.2, display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: item.bg,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <IconComp />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 850, lineHeight: 1.1 }}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                    {item.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Main Grid: Calendar with Match Badges + Selected Day Schedule */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' }, gap: 3, alignItems: 'start' }}>
        {/* Calendar Card */}
        <Card elevation={0} sx={{ borderRadius: 3, bgcolor: surfaceBg, border: `1px solid ${borderCol}` }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="primary" />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    Officiating Match Calendar
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Date badges show how many assigned matches you have each day
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <IconButton
                  size="small"
                  onClick={() => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() - 1, 1))}
                  sx={{ border: `1px solid ${borderCol}` }}
                >
                  <PrevIcon fontSize="small" />
                </IconButton>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const now = new Date()
                    setCursorMonth(new Date(now.getFullYear(), now.getMonth(), 1))
                    setSelectedDateKey(todayKey)
                    setShowAllUpcoming(false)
                  }}
                  sx={{ textTransform: 'none', fontWeight: 750, minWidth: 130, borderRadius: 2 }}
                >
                  {monthLabel}
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1))}
                  sx={{ border: `1px solid ${borderCol}` }}
                >
                  <NextIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Weekday Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
              {WEEKDAYS.map((wd) => (
                <Typography
                  key={wd}
                  variant="caption"
                  align="center"
                  sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  {wd}
                </Typography>
              ))}
            </Box>

            {/* Calendar Day Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <Box key={`empty-${idx}`} sx={{ minHeight: 58 }} />
                }
                const count = cell.dayMatches.length
                const hasLive = cell.dayMatches.some((m) => m.status === 'Live')
                const hasScheduled = cell.dayMatches.some((m) => m.status === 'Scheduled')
                const isSelected = !showAllUpcoming && selectedDateKey === cell.dateKey
                const isToday = cell.dateKey === todayKey

                const badgeBg = hasLive
                  ? '#EF4444'
                  : hasScheduled
                  ? theme.palette.primary.main
                  : '#10B981'

                return (
                  <Box
                    key={cell.dateKey}
                    onClick={() => {
                      setSelectedDateKey(cell.dateKey)
                      setShowAllUpcoming(false)
                    }}
                    sx={{
                      minHeight: 58,
                      p: 0.9,
                      borderRadius: 2,
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1.5px solid',
                      borderColor: isSelected
                        ? 'primary.main'
                        : isToday
                        ? 'rgba(59, 130, 246, 0.55)'
                        : borderCol,
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(132, 183, 1, 0.14)'
                          : 'rgba(132, 183, 1, 0.10)'
                        : count > 0
                        ? isDark
                          ? 'rgba(255,255,255,0.03)'
                          : '#F8FAFC'
                        : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isToday || isSelected ? 850 : 650,
                        color: isSelected ? 'primary.main' : isToday ? '#3B82F6' : 'text.primary'
                      }}
                    >
                      {cell.day}
                    </Typography>

                    {count > 0 && (
                      <Box
                        sx={{
                          alignSelf: 'flex-end',
                          px: 0.7,
                          minWidth: 20,
                          height: 19,
                          borderRadius: 99,
                          bgcolor: badgeBg,
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 850,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {count}
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2.2, pt: 1.8, borderTop: `1px solid ${borderCol}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444' }} />
                <Typography variant="caption" color="text.secondary">Live</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">Scheduled</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981' }} />
                <Typography variant="caption" color="text.secondary">Completed</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Selected Date Schedule + Spotlight Widgets */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Card elevation={0} sx={{ borderRadius: 3, bgcolor: surfaceBg, border: `1px solid ${borderCol}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {showAllUpcoming ? 'All Upcoming Assignments' : `Schedule • ${selectedDateKey}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {visibleScheduleMatches.length} {visibleScheduleMatches.length === 1 ? 'match' : 'matches'} found
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant={showAllUpcoming ? 'contained' : 'outlined'}
                  onClick={() => setShowAllUpcoming((v) => !v)}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  {showAllUpcoming ? 'By Date' : 'All Upcoming'}
                </Button>
              </Box>

              {visibleScheduleMatches.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', border: `1px dashed ${borderCol}`, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    No assigned matches on {showAllUpcoming ? 'your upcoming queue' : selectedDateKey}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click a badged calendar date or open My Matches to inspect all fixtures.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 330, overflowY: 'auto' }}>
                  {visibleScheduleMatches.map((m) => (
                    <Box
                      key={m.id}
                      onClick={() => navigate('/matches')}
                      sx={{
                        p: 1.6,
                        borderRadius: 2,
                        border: `1px solid ${m.status === 'Live' ? '#EF4444' : borderCol}`,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Typography variant="caption" sx={{ fontWeight: 750, color: 'primary.main' }}>
                          {m.tournament_title || 'Championship'} • Board #{m.board_number || 1}
                        </Typography>
                        <Chip
                          label={m.status || 'Scheduled'}
                          size="small"
                          color={m.status === 'Live' ? 'error' : m.status === 'Completed' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 750 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {m.player1_name || 'TBD'} vs {m.player2_name || 'TBD'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.7 }}>
                        <Typography variant="caption" color="text.secondary">
                          {m.round_name || 'Match'} • Score {m.player1_score ?? 0} - {m.player2_score ?? 0}
                        </Typography>
                        <ArrowIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Spotlight / Next Court Card */}
          {spotlightMatch && (
            <Card elevation={0} sx={{ borderRadius: 3, bgcolor: surfaceBg, border: `1px solid ${borderCol}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.06em' }}>
                  {spotlightMatch.status === 'Live' ? 'LIVE COURT ON DUTY' : 'NEXT ASSIGNED FIXTURE'}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, mt: 0.4 }}>
                  {spotlightMatch.player1_name || 'TBD'} vs {spotlightMatch.player2_name || 'TBD'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.8 }}>
                  {spotlightMatch.tournament_title || 'Federation Match'} • {spotlightMatch.round_name || 'Court'} • Board #{spotlightMatch.board_number || 1}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/matches')}
                  endIcon={<ArrowIcon />}
                  sx={{ borderRadius: 2, fontWeight: 750, textTransform: 'none' }}
                >
                  Launch Court Scoring Console
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Bottom Row: Assigned Tournaments Preview & ICF Umpire Quick Guide */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Card elevation={0} sx={{ borderRadius: 3, bgcolor: surfaceBg, border: `1px solid ${borderCol}` }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrophyIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Tournaments Preview
                </Typography>
              </Box>
              <Button size="small" onClick={() => navigate('/tournaments')} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Browse All
              </Button>
            </Box>
            {assignedTournaments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tournaments available yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {assignedTournaments.slice(0, 4).map((t) => (
                  <Box
                    key={t.id}
                    onClick={() => navigate(`/tournaments/${t.id}`)}
                    sx={{
                      p: 1.4,
                      borderRadius: 2,
                      border: `1px solid ${borderCol}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 750 }}>
                        {t.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.venue || 'Venue TBD'} • {t.format || 'Knockout'}
                      </Typography>
                    </Box>
                    <Chip label={t.status || 'Upcoming'} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, bgcolor: surfaceBg, border: `1px solid ${borderCol}` }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <RulesIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                ICF Court & Officiating Checklist
              </Typography>
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <Box component="ul" sx={{ m: 0, pl: 2.2, display: 'flex', flexDirection: 'column', gap: 1, color: 'text.secondary', fontSize: '0.84rem' }}>
              <li>Record coin toss winner & White/Black strike choice before Board #1 break.</li>
              <li>Maximum 1 Queen (+3 points) allowed per board; verify cover before awarding points.</li>
              <li>Standard Federation match runs up to 8 Boards or first to 25 points.</li>
              <li>Use Undo on the Match Arena scorecard immediately to correct mis-tapped board events.</li>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
