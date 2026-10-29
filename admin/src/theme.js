import { createTheme, responsiveFontSizes } from '@mui/material/styles'

// Helper to retrieve color from environment variables or defined globals
export const getEnvPrimaryColor = () => {
  try {
    if (typeof __APP_PRIMARY_COLOR__ !== 'undefined' && __APP_PRIMARY_COLOR__) {
      return __APP_PRIMARY_COLOR__
    }
  } catch (e) {}
  return import.meta.env.VITE_PRIMARY_COLOR ||
         import.meta.env.PRIMARY_COLOR ||
         import.meta.env.ADMIN_PRIMARY_COLOR ||
         '#A3E635'
}

// Robust color utility to compute light, dark, contrastText, and alpha tints
export const parseColor = (hexInput) => {
  let hex = (hexInput || '#A3E635').trim()
  if (!hex.startsWith('#')) {
    hex = '#' + hex
  }
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    hex = '#A3E635'
  }

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // Relative luminance calculation for automatic contrast text
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const contrastText = luminance > 0.45 ? '#121215' : '#FFFFFF'

  const clamp = (val) => Math.min(255, Math.max(0, val))
  const toHex = (n) => n.toString(16).padStart(2, '0')

  const adjust = (factor) => {
    const adjR = clamp(Math.round(r + (factor > 0 ? (255 - r) * factor : r * factor)))
    const adjG = clamp(Math.round(g + (factor > 0 ? (255 - g) * factor : g * factor)))
    const adjB = clamp(Math.round(b + (factor > 0 ? (255 - b) * factor : b * factor)))
    return `#${toHex(adjR)}${toHex(adjG)}${toHex(adjB)}`
  }

  return {
    main: hex,
    light: adjust(0.22),
    dark: adjust(-0.25),
    contrastText,
    rgba: (alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
}

export const getAppTheme = (mode = 'dark', overrideColor = null) => {
  const isDark = mode === 'dark'
  const primaryScheme = parseColor(overrideColor || getEnvPrimaryColor())

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: primaryScheme.main,
        light: primaryScheme.light,
        dark: primaryScheme.dark,
        contrastText: primaryScheme.contrastText
      },
      secondary: {
        main: primaryScheme.dark,
        light: primaryScheme.light,
        dark: primaryScheme.dark,
        contrastText: primaryScheme.contrastText
      },
      success: {
        main: '#34D399',
        light: '#6EE7B7',
        dark: '#059669',
        contrastText: '#064E3B'
      },
      warning: {
        main: '#FBBF24',
        light: '#FDE68A',
        dark: '#D97706',
        contrastText: '#451A03'
      },
      error: {
        main: '#F87171',
        light: '#FCA5A5',
        dark: '#DC2626',
        contrastText: '#450A0A'
      },
      info: {
        main: '#93C5FD',
        light: '#BFDBFE',
        dark: '#3B82F6',
        contrastText: '#172554'
      },
      background: {
        default: isDark ? '#121215' : '#F8FAFC',
        paper: isDark ? '#18181B' : '#FFFFFF'
      },
      text: {
        primary: isDark ? '#F4F4F5' : '#0F172A',
        secondary: isDark ? '#A1A1AA' : '#64748B'
      },
      divider: isDark ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.08)'
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.025em'
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.02em'
      },
      h6: {
        fontWeight: 700,
        letterSpacing: '-0.015em'
      },
      subtitle1: {
        fontWeight: 500,
        letterSpacing: '-0.01em'
      },
      subtitle2: {
        fontWeight: 600,
        letterSpacing: '-0.005em'
      },
      button: {
        fontWeight: 650,
        textTransform: 'none',
        letterSpacing: '-0.01em'
      }
    },
    shape: {
      borderRadius: 16
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            border: 'none !important',
            borderBottom: 'none !important',
            boxShadow: 'none'
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none !important',
            borderRight: 'none !important',
            boxShadow: 'none'
          }
        }
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true
        },
        styleOverrides: {
          root: {
            borderRadius: 9999, // Material 3 Pill Button Style
            padding: '8px 20px',
            fontWeight: 650,
            textTransform: 'none',
            fontSize: '0.85rem'
          },
          containedPrimary: {
            backgroundColor: primaryScheme.main,
            color: primaryScheme.contrastText,
            '&:hover': {
              backgroundColor: primaryScheme.light,
              boxShadow: `0 4px 14px ${primaryScheme.rgba(0.35)}`
            }
          },
          outlined: {
            borderRadius: 9999,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.16)',
            color: isDark ? '#F4F4F5' : '#0F172A',
            '&:hover': {
              borderColor: primaryScheme.main,
              backgroundColor: primaryScheme.rgba(isDark ? 0.08 : 0.12)
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 20,
            backgroundColor: isDark ? '#18181B' : '#FFFFFF',
            border: 'none',
            boxShadow: isDark
              ? '0 4px 20px rgba(0, 0, 0, 0.35)'
              : '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? '#121215' : '#F8FAFC',
            '& fieldset': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
            },
            '&:hover fieldset': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.28)'
            },
            '&.Mui-focused fieldset': {
              borderColor: primaryScheme.main,
              borderWidth: 1.5
            }
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            padding: '14px 20px'
          },
          head: {
            fontWeight: 650,
            fontSize: '0.76rem',
            color: isDark ? '#A1A1AA' : '#64748B',
            backgroundColor: isDark ? '#141418' : '#F1F5F9',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 9999
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 'unset'
          },
          indicator: {
            display: 'none !important',
            height: '0px !important',
            opacity: '0 !important',
            visibility: 'hidden !important'
          }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 44,
            height: 26,
            padding: 0,
            '& .MuiSwitch-switchBase': {
              padding: 0,
              margin: 3,
              transitionDuration: '250ms',
              '&.Mui-checked': {
                transform: 'translateX(18px)',
                color: primaryScheme.contrastText,
                '& + .MuiSwitch-track': {
                  backgroundColor: primaryScheme.main,
                  opacity: 1,
                  border: 0
                }
              }
            },
            '& .MuiSwitch-thumb': {
              boxSizing: 'border-box',
              width: 20,
              height: 20,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            },
            '& .MuiSwitch-track': {
              borderRadius: 26 / 2,
              backgroundColor: isDark ? '#27272A' : '#E2E8F0',
              opacity: 1
            }
          }
        }
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: primaryScheme.main,
            height: 8,
            '& .MuiSlider-track': {
              border: 'none',
              backgroundColor: primaryScheme.main
            },
            '& .MuiSlider-rail': {
              opacity: 0.35,
              backgroundColor: isDark ? '#3F3F46' : '#CBD5E1'
            },
            '& .MuiSlider-thumb': {
              height: 20,
              width: 8,
              borderRadius: 4,
              backgroundColor: primaryScheme.light,
              border: '2px solid #121215',
              '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                boxShadow: `0 0 0 8px ${primaryScheme.rgba(0.2)}`
              }
            }
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            backgroundColor: isDark ? '#18181B' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)'
          }
        }
      }
    }
  })

  return responsiveFontSizes(theme)
}


