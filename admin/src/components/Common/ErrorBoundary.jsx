import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { Refresh as RefreshIcon, WarningAmber as WarningIcon } from '@mui/icons-material'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Admin Error Boundary caught error]:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Paper
            sx={{
              p: 4,
              maxWidth: 520,
              width: '100%',
              textAlign: 'center',
              borderRadius: 3,
              backgroundColor: 'background.paper',
              boxShadow: 4
            }}
          >
            <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Something went wrong loading this section
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
            >
              Reload Page
            </Button>
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}
