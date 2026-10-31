import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material'
import {
  LockReset as LockResetIcon,
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  Key as KeyIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import * as api from '@/services/api'

export function ChangePasswordDialog({ open, onClose, onSuccess }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrent(false)
    setShowNew(false)
    setShowConfirm(false)
    setError('')
    setSuccess('')
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    if (onClose) onClose()
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword) {
      setError('Please enter your current password.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.')
      return
    }
    if (currentPassword === newPassword) {
      setError('New password cannot be the same as your current password.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await api.updatePassword({ currentPassword, newPassword })
      if (res && res.success) {
        setSuccess('Password updated successfully! Please keep it secure.')
        setTimeout(() => {
          handleClose()
          if (onSuccess) onSuccess('Password changed successfully')
        }, 1200)
      } else {
        setError(res?.message || 'Failed to update password. Please check your current password.')
      }
    } catch (err) {
      setError(err?.message || 'An error occurred while updating password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={Boolean(open)}
      onClose={isSubmitting ? undefined : handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(5px)',
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.45)'
          }
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 24px 48px rgba(0, 0, 0, 0.8)'
            : '0 24px 48px rgba(15, 23, 42, 0.15)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 1.5,
          px: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              backgroundColor: (t) => `${t.palette.primary.main}18`,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LockResetIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Change Password
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Update your administrative account credentials
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Form Content */}
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              icon={<CheckCircleIcon fontSize="inherit" />}
              severity="success"
              sx={{ borderRadius: 2, fontSize: '0.82rem' }}
            >
              {success}
            </Alert>
          )}

          {/* Current Password */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.6, display: 'block' }}>
              Current Password *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowCurrent(!showCurrent)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showCurrent ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.2,
                  fontSize: '0.88rem'
                }
              }}
            />
          </Box>

          {/* New Password */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.6, display: 'block' }}>
              New Password *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              helperText="Must be at least 6 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockResetIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowNew(!showNew)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showNew ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.2,
                  fontSize: '0.88rem'
                }
              }}
            />
          </Box>

          {/* Confirm New Password */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.6, display: 'block' }}>
              Confirm New Password *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              error={Boolean(confirmPassword && newPassword !== confirmPassword)}
              helperText={
                confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockResetIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowConfirm(!showConfirm)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.2,
                  fontSize: '0.88rem'
                }
              }}
            />
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{
              borderRadius: 2.2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.84rem'
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <LockResetIcon />}
            sx={{
              borderRadius: 2.2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              px: 2.5,
              boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`
            }}
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

