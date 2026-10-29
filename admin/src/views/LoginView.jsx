import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material'
import {
  EmailOutlined as EmailIcon,
  LockOutlined as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Shield as ShieldIcon,
  ArrowForward as ArrowForwardIcon,
  AutoFixHigh as AutoFixIcon,
  RadioButtonChecked as CircleDotIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon
} from '@mui/icons-material'
import * as api from '@/services/api'

export function LoginView({ onLoginSuccess, isDark, onToggleTheme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [autoFilled, setAutoFilled] = useState(false)

  const theme = useTheme()

  const handleFillDemo = () => {
    setEmail('hello@hellozed.com')
    setPassword('12wq1234')
    setError('')
    setAutoFilled(true)
    setTimeout(() => setAutoFilled(false), 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your admin email address.')
      return
    }
    if (!password) {
      setError('Please enter your admin password.')
      return
    }

    setIsLoading(true)
    try {
      const res = await api.login(email, password)
      if (res.success) {
        onLoginSuccess(res.user)
      } else {
        setError(res.message || 'Invalid credentials. Please verify email and password.')
      }
    } catch (err) {
      setError('An error occurred during authentication.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'background.default',
        color: 'text.primary',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambient Glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 350,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Navbar */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              backgroundColor: 'primary.main',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <CircleDotIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
                BCF ADMIN
              </Typography>
              <Chip
                label="RESTRICTED"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
              Bangladesh Carrom Federation
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onToggleTheme}
          size="small"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            color: 'text.secondary'
          }}
        >
          {isDark ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Main Login Card */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2.5,
          zIndex: 2
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 430,
            borderRadius: 4,
            p: { xs: 2.5, sm: 3.5 },
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0, 0, 0, 0.6)'
              : '0 12px 40px rgba(0, 0, 0, 0.08)'
          }}
        >
          <CardContent sx={{ p: 0 }}>

            {/* Title */}
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              Executive Login
            </Typography>
            {/* Quick Demo Autofill Banner */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'text.primary', fontSize: '0.75rem' }}>
                  Initial Credentials
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontSize: '0.72rem' }}>
                  hello@hellozed.com
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={handleFillDemo}
                startIcon={<AutoFixIcon sx={{ fontSize: '14px !important' }} />}
                sx={{
                  height: 28,
                  fontSize: '0.72rem',
                  borderColor: theme.palette.divider
                }}
              >
                {autoFilled ? 'Applied' : 'Auto Fill'}
              </Button>
            </Box>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.8rem' }}>
                {error}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Admin Email"
                placeholder="hello@hellozed.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                placeholder="Enter admin password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                size="small"
                helperText="Initial password: 12wq1234"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
                sx={{
                  py: 1.2,
                  mt: 1,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                {isLoading ? 'Verifying...' : 'Sign In to Admin Panel'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 2.5, textAlign: 'center', zIndex: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} Bangladesh Carrom Federation. National Sports Council (NSC), Dhaka.
        </Typography>
      </Box>
    </Box>
  )
}
