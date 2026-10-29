import React, { useRef, useState, useEffect } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  useTheme
} from '@mui/material'
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatStrikethrough as StrikeIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  FormatQuote as QuoteIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  InsertLink as LinkIcon,
  InsertPhoto as ImageIcon,
  HorizontalRule as HrIcon,
  FormatClear as ClearIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Code as CodeIcon,
  UploadFile as UploadIcon,
  Link as UrlLinkIcon
} from '@mui/icons-material'
import { uploadNewsEditorImage, getApiBaseUrl } from '@/services/api'

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write full article, report or editorial content...',
  minHeight = 320
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)

  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [htmlContent, setHtmlContent] = useState(value || '')

  // Link dialog
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const savedSelectionRef = useRef(null)

  // Image dialog
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Sync internal state when external value changes and not in HTML mode
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || ''
      }
    }
    setHtmlContent(value || '')
  }, [value, isHtmlMode])

  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection()
      if (sel.getRangeAt && sel.rangeCount) {
        savedSelectionRef.current = sel.getRangeAt(0)
      }
    }
  }

  const restoreSelection = () => {
    if (savedSelectionRef.current && window.getSelection) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(savedSelectionRef.current)
    }
  }

  const emitChange = (content) => {
    setHtmlContent(content)
    if (onChange) {
      onChange(content)
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      emitChange(editorRef.current.innerHTML)
    }
  }

  const executeCommand = (command, val = null) => {
    if (isHtmlMode) return
    editorRef.current?.focus()
    document.execCommand(command, false, val)
    handleInput()
  }

  // Heading format
  const handleHeading = (tag) => {
    executeCommand('formatBlock', `<${tag}>`)
  }

  // Link handling
  const handleOpenLinkDialog = () => {
    saveSelection()
    const sel = window.getSelection()
    const text = sel ? sel.toString() : ''
    setLinkText(text)
    setLinkUrl('')
    setIsLinkDialogOpen(true)
  }

  const handleInsertLink = () => {
    setIsLinkDialogOpen(false)
    restoreSelection()
    if (!linkUrl) return

    if (linkText && (!savedSelectionRef.current || savedSelectionRef.current.collapsed)) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
      executeCommand('insertHTML', linkHtml)
    } else {
      executeCommand('createLink', linkUrl)
    }
  }

  // Image handling
  const handleOpenImageDialog = () => {
    saveSelection()
    setImageUrl('')
    setImageAlt('')
    setIsImageDialogOpen(true)
  }

  const handleInsertImageUrl = () => {
    if (!imageUrl) return
    setIsImageDialogOpen(false)
    restoreSelection()
    insertImageIntoEditor(imageUrl, imageAlt || 'Article image')
  }

  const insertImageIntoEditor = (src, altText = '') => {
    let finalSrc = src
    if (finalSrc.startsWith('/uploads/')) {
      const base = getApiBaseUrl().replace(/\/api$/, '')
      finalSrc = `${base}${finalSrc}`
    }

    const imgHtml = `<p><img src="${finalSrc}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 12px; margin: 16px 0; display: block; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" /></p><p><br></p>`
    executeCommand('insertHTML', imgHtml)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target.result
      try {
        const res = await uploadNewsEditorImage(base64)
        if (res.success && res.url) {
          setIsImageDialogOpen(false)
          restoreSelection()
          insertImageIntoEditor(res.url, file.name)
        } else {
          // Fallback to base64 if server upload fails
          setIsImageDialogOpen(false)
          restoreSelection()
          insertImageIntoEditor(base64, file.name)
        }
      } catch (err) {
        console.error('Image upload failed, fallback to base64', err)
        setIsImageDialogOpen(false)
        restoreSelection()
        insertImageIntoEditor(base64, file.name)
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle paste image from clipboard directly
  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault()
        const blob = items[i].getAsFile()
        const reader = new FileReader()
        reader.onload = async (event) => {
          const base64 = event.target.result
          const res = await uploadNewsEditorImage(base64)
          if (res.success && res.url) {
            insertImageIntoEditor(res.url, 'Pasted image')
          } else {
            insertImageIntoEditor(base64, 'Pasted image')
          }
        }
        reader.readAsDataURL(blob)
        break
      }
    }
  }

  const handleToggleHtml = () => {
    if (isHtmlMode) {
      setIsHtmlMode(false)
    } else {
      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML)
      }
      setIsHtmlMode(true)
    }
  }

  const handleHtmlSourceChange = (e) => {
    const val = e.target.value
    emitChange(val)
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        borderRadius: 2.5,
        overflow: 'hidden',
        backgroundColor: isDark ? '#18181B' : '#FFFFFF',
        transition: 'border-color 0.15s ease',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}33`
        }
      }}
    >
      {/* Top Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.5,
          p: 1,
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          backgroundColor: isDark ? '#27272A' : '#F8FAFC'
        }}
      >
        {/* Headings */}
        <Tooltip title="Heading 2 (H2)">
          <Button
            size="small"
            onClick={() => handleHeading('h2')}
            disabled={isHtmlMode}
            sx={{
              minWidth: 32,
              px: 1,
              py: 0.2,
              fontWeight: 800,
              fontSize: '0.78rem',
              color: 'text.primary'
            }}
          >
            H2
          </Button>
        </Tooltip>

        <Tooltip title="Heading 3 (H3)">
          <Button
            size="small"
            onClick={() => handleHeading('h3')}
            disabled={isHtmlMode}
            sx={{
              minWidth: 32,
              px: 1,
              py: 0.2,
              fontWeight: 750,
              fontSize: '0.74rem',
              color: 'text.primary'
            }}
          >
            H3
          </Button>
        </Tooltip>

        <Tooltip title="Normal Paragraph">
          <Button
            size="small"
            onClick={() => handleHeading('p')}
            disabled={isHtmlMode}
            sx={{
              minWidth: 30,
              px: 0.8,
              py: 0.2,
              fontWeight: 650,
              fontSize: '0.74rem',
              color: 'text.secondary'
            }}
          >
            ¶
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

        {/* Text Formats */}
        <Tooltip title="Bold (Ctrl+B)">
          <IconButton size="small" onClick={() => executeCommand('bold')} disabled={isHtmlMode}>
            <BoldIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Italic (Ctrl+I)">
          <IconButton size="small" onClick={() => executeCommand('italic')} disabled={isHtmlMode}>
            <ItalicIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Underline (Ctrl+U)">
          <IconButton size="small" onClick={() => executeCommand('underline')} disabled={isHtmlMode}>
            <UnderlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Strikethrough">
          <IconButton size="small" onClick={() => executeCommand('strikeThrough')} disabled={isHtmlMode}>
            <StrikeIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

        {/* Lists & Quotes */}
        <Tooltip title="Bulleted List">
          <IconButton size="small" onClick={() => executeCommand('insertUnorderedList')} disabled={isHtmlMode}>
            <BulletListIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Numbered List">
          <IconButton size="small" onClick={() => executeCommand('insertOrderedList')} disabled={isHtmlMode}>
            <NumberListIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Quote">
          <IconButton size="small" onClick={() => executeCommand('formatBlock', '<blockquote>')} disabled={isHtmlMode}>
            <QuoteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

        {/* Alignment */}
        <Tooltip title="Align Left">
          <IconButton size="small" onClick={() => executeCommand('justifyLeft')} disabled={isHtmlMode}>
            <AlignLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Align Center">
          <IconButton size="small" onClick={() => executeCommand('justifyCenter')} disabled={isHtmlMode}>
            <AlignCenterIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Align Right">
          <IconButton size="small" onClick={() => executeCommand('justifyRight')} disabled={isHtmlMode}>
            <AlignRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

        {/* Link & Image Insertion */}
        <Tooltip title="Insert Link">
          <IconButton size="small" onClick={handleOpenLinkDialog} disabled={isHtmlMode} color="primary">
            <LinkIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Insert Image into Article (Upload or URL)">
          <Button
            size="small"
            startIcon={<ImageIcon sx={{ fontSize: 17 }} />}
            onClick={handleOpenImageDialog}
            disabled={isHtmlMode}
            variant="outlined"
            color="primary"
            sx={{
              py: 0.2,
              px: 1.2,
              height: 28,
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: 1.5,
              textTransform: 'none'
            }}
          >
            Insert Image
          </Button>
        </Tooltip>

        <Tooltip title="Horizontal Rule">
          <IconButton size="small" onClick={() => executeCommand('insertHorizontalRule')} disabled={isHtmlMode}>
            <HrIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear Formatting">
          <IconButton size="small" onClick={() => executeCommand('removeFormat')} disabled={isHtmlMode}>
            <ClearIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

        <Tooltip title="Undo">
          <IconButton size="small" onClick={() => executeCommand('undo')} disabled={isHtmlMode}>
            <UndoIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Redo">
          <IconButton size="small" onClick={() => executeCommand('redo')} disabled={isHtmlMode}>
            <RedoIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <Tooltip title={isHtmlMode ? 'Switch to Visual WYSIWYG Editor' : 'Switch to Raw HTML Code View'}>
            <Button
              size="small"
              onClick={handleToggleHtml}
              startIcon={<CodeIcon sx={{ fontSize: 16 }} />}
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                py: 0.3,
                px: 1,
                color: isHtmlMode ? 'primary.main' : 'text.secondary',
                bgcolor: isHtmlMode ? `${theme.palette.primary.main}18` : 'transparent'
              }}
            >
              {isHtmlMode ? 'Visual Editor' : 'HTML Source'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Editor Content Area */}
      {isHtmlMode ? (
        <TextField
          multiline
          fullWidth
          minRows={12}
          value={htmlContent}
          onChange={handleHtmlSourceChange}
          placeholder="<p>Enter raw HTML content here...</p>"
          sx={{
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
              fontSize: '0.84rem',
              p: 2,
              borderRadius: 0,
              backgroundColor: isDark ? '#121214' : '#F1F5F9'
            },
            '& fieldset': { border: 'none' }
          }}
        />
      ) : (
        <Box
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          sx={{
            minHeight: minHeight,
            maxHeight: 650,
            overflowY: 'auto',
            p: 2.5,
            outline: 'none',
            fontSize: '0.94rem',
            lineHeight: 1.7,
            color: 'text.primary',
            '&[data-placeholder]:empty:before': {
              content: 'attr(data-placeholder)',
              color: 'text.disabled',
              pointerEvents: 'none',
              display: 'block'
            },
            '& h2': {
              fontSize: '1.45rem',
              fontWeight: 800,
              mt: 2,
              mb: 1,
              letterSpacing: '-0.015em'
            },
            '& h3': {
              fontSize: '1.2rem',
              fontWeight: 750,
              mt: 1.8,
              mb: 0.8
            },
            '& p': {
              my: 1
            },
            '& blockquote': {
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              pl: 2,
              py: 0.5,
              my: 2,
              fontStyle: 'italic',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '0 8px 8px 0'
            },
            '& ul, & ol': {
              pl: 3,
              my: 1.2
            },
            '& li': {
              mb: 0.5
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'underline'
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '12px',
              my: 2,
              display: 'block',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            },
            '& hr': {
              border: 'none',
              borderTop: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              my: 2
            }
          }}
        />
      )}

      {/* Link Insertion Dialog */}
      <Dialog open={isLinkDialogOpen} onClose={() => setIsLinkDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Insert Hyperlink</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Link URL (https://...)"
            placeholder="https://example.com"
            fullWidth
            size="small"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            autoFocus
          />
          <TextField
            label="Display Text (optional)"
            placeholder="Click here"
            fullWidth
            size="small"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInsertLink} disabled={!linkUrl}>
            Insert Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Insertion Dialog */}
      <Dialog open={isImageDialogOpen} onClose={() => setIsImageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Insert Image into Content</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Box
            sx={{
              p: 2.5,
              border: '2px dashed',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Button
              variant="contained"
              startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              sx={{ borderRadius: 2, px: 2.5, mb: 1 }}
            >
              {isUploading ? 'Uploading & Optimizing...' : 'Upload Image from Computer'}
            </Button>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              Auto-compressed to webp. Supports JPG, PNG, WEBP.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              OR INSERT VIA URL
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          <TextField
            label="Image Web Address (URL)"
            placeholder="https://images.unsplash.com/photo-..."
            fullWidth
            size="small"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            InputProps={{
              startAdornment: <UrlLinkIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
            }}
          />

          <TextField
            label="Image Caption / Alt Text"
            placeholder="e.g. Finals celebration at NSC arena"
            fullWidth
            size="small"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
          />

          {imageUrl && (
            <Box
              component="img"
              src={imageUrl}
              alt="Preview"
              sx={{
                width: '100%',
                maxHeight: 180,
                objectFit: 'cover',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsImageDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInsertImageUrl} disabled={!imageUrl}>
            Insert into Article
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RichTextEditor
