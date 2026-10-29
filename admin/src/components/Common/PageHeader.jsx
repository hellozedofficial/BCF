import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Typography, Box } from '@mui/material'

export function PageHeader({ title, subtitle, description, actions, action }) {
  const [targetSlots, setTargetSlots] = useState(() => ({
    titleEl: typeof document !== 'undefined' ? document.getElementById('bcf-main-header-title-slot') : null,
    actionsEl: typeof document !== 'undefined' ? document.getElementById('bcf-main-header-actions-slot') : null
  }))

  const resolvedActions = actions || action

  useEffect(() => {
    if (!targetSlots.titleEl || !targetSlots.actionsEl) {
      const titleEl = document.getElementById('bcf-main-header-title-slot')
      const actionsEl = document.getElementById('bcf-main-header-actions-slot')
      if (titleEl || actionsEl) {
        setTargetSlots({ titleEl, actionsEl })
      }
    }
  }, [targetSlots.titleEl, targetSlots.actionsEl])

  return (
    <>
      {title && targetSlots.titleEl && createPortal(
        <Typography
          component="h1"
          noWrap
          sx={{
            fontSize: '0.96rem',
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '-0.015em',
            lineHeight: 1.2
          }}
        >
          {title}
        </Typography>,
        targetSlots.titleEl
      )}

      {resolvedActions && targetSlots.actionsEl && createPortal(
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'nowrap',
            '& .MuiButton-root': {
              fontSize: '0.82rem',
              py: 0.6,
              px: 1.8,
              minHeight: 34,
              borderRadius: 2
            }
          }}
        >
          {resolvedActions}
        </Box>,
        targetSlots.actionsEl
      )}
    </>
  )
}

