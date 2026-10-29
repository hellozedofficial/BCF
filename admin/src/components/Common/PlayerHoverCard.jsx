import React from 'react'
import {
  Box,
  Card,
  Typography,
  Chip,
  Avatar,
  Button,
  useTheme
} from '@mui/material'
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material'

export function PlayerHoverCard({ player, onNavigate }) {
  if (!player) return null
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const playerId = player.player_id || player.bcf_player_id || (player.id ? `BCF${player.id}` : 'BCF-PLAYER')
  const genderCategory = `${(player.gender || 'MEN').toUpperCase()} • ${(player.category || 'SENIOR').toUpperCase()}`
  const clubDistrict = `${player.club_name || 'BCF Affiliated'} • ${player.district || 'Dhaka'}`
  const rating = player.rating_points || player.rating || 1200
  const won = player.matches_won !== undefined ? player.matches_won : (player.won || 0)
  const slams = ((player.white_slams || 0) + (player.black_slams || 0)) || (player.slams || 0)

  return (
    <Card
      elevation={0}
      sx={{
        width: 300,
        p: 2.2,
        borderRadius: 3.5,
        backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
        border: `1px solid ${isDark ? '#333338' : '#E2E8F0'}`,
        boxShadow: isDark
          ? '0 16px 36px rgba(0, 0, 0, 0.55)'
          : '0 16px 36px rgba(15, 23, 42, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.8
      }}
    >
      {/* Top Badges Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={playerId}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.74rem',
            color: '#B45309',
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
            border: '1.5px solid #F59E0B',
            borderRadius: 9999,
            height: 24,
            px: 0.5
          }}
        />
        <Chip
          label={genderCategory}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.7rem',
            color: '#2563EB',
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
            border: '1.5px solid #60A5FA',
            borderRadius: 9999,
            height: 24,
            px: 0.5
          }}
        />
      </Box>

      {/* Profile Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={player.photo_url || player.photo}
          alt={player.full_name}
          sx={{
            width: 48,
            height: 48,
            border: `2px solid ${isDark ? '#3F3F46' : '#E2E8F0'}`,
            fontWeight: 800,
            fontSize: '1.05rem',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            flexShrink: 0
          }}
        >
          {player.full_name?.charAt(0) || 'P'}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 800,
              fontSize: '0.98rem',
              color: 'text.primary',
              lineHeight: 1.2
            }}
          >
            {player.full_name}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.78rem',
              fontWeight: 500,
              mt: 0.3
            }}
          >
            {clubDistrict}
          </Typography>
        </Box>
      </Box>

      {/* Mini Stats Box */}
      <Box
        sx={{
          borderRadius: 2.5,
          backgroundColor: isDark ? '#27272A' : '#F8FAFC',
          border: `1px solid ${isDark ? '#3F3F46' : '#E2E8F0'}`,
          p: 1.3,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          textAlign: 'center'
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
            Rating
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#D97706', fontSize: '0.95rem' }}>
            {rating}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
            Won
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
            {won}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
            Slams
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
            {slams}
          </Typography>
        </Box>
      </Box>

      {/* Bottom Footer Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.2 }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 650, fontSize: '0.8rem' }}>
          {playerId}
        </Typography>

        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            if (onNavigate) onNavigate(playerId)
          }}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
          sx={{
            color: '#059669',
            fontWeight: 700,
            fontSize: '0.78rem',
            p: 0,
            minWidth: 0,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          View Profile
        </Button>
      </Box>
    </Card>
  )
}
