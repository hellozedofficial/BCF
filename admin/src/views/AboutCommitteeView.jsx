import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  useTheme,
  InputAdornment,
  Divider,
  MenuItem
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import SortRoundedIcon from '@mui/icons-material/SortRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded'
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded'

import { PageHeader } from '../components/Common/PageHeader'
import { SideSheet } from '../components/Common/SideSheet'
import { getApiBaseUrl, getMediaUrl, getAuthHeaders } from '../services/api'

const API_BASE = getApiBaseUrl()

const PRESET_GROUPS = [
  { name: 'President', defaultOrder: 1 },
  { name: 'Vice Presidents', defaultOrder: 2 },
  { name: 'General Secretary', defaultOrder: 3 },
  { name: 'Joint Secretaries', defaultOrder: 4 },
  { name: 'Treasurer', defaultOrder: 5 },
  { name: 'Executive Members', defaultOrder: 6 },
  { name: 'Advisors & Patrons', defaultOrder: 7 }
]

function inferGroupFromDesignation(designation = '') {
  const d = (designation || '').toLowerCase()
  if (d.includes('vice') && d.includes('president')) return 'Vice Presidents'
  if (d.includes('president')) return 'President'
  if (d.includes('general') && d.includes('secretary')) return 'General Secretary'
  if ((d.includes('joint') || d.includes('assistant')) && d.includes('secretary')) return 'Joint Secretaries'
  if (d.includes('treasurer')) return 'Treasurer'
  if (d.includes('advisor') || d.includes('patron')) return 'Advisors & Patrons'
  return 'Executive Members'
}

export function AboutCommitteeView() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [activeTab, setActiveTab] = useState(0) // 0: Committee, 1: About Section
  const [loading, setLoading] = useState(true)
  const [savingAbout, setSavingAbout] = useState(false)
  const [savingMember, setSavingMember] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' })

  // Committee State
  const [committee, setCommittee] = useState([])
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [useCustomGroup, setUseCustomGroup] = useState(false)
  const [memberForm, setMemberForm] = useState({
    name: '',
    designation: '',
    group_name: 'Executive Members',
    group_order: 6,
    organization: 'Bangladesh Carrom Federation',
    contact_email: '',
    phone: '',
    image_url: '',
    display_order: 1
  })

  // Drag-and-drop state
  const [dragState, setDragState] = useState({
    type: null, // 'member' | 'group'
    memberId: null,
    sourceGroup: null,
    overMemberId: null,
    overGroup: null
  })

  // Rename Group Dialog State
  const [renameDialog, setRenameDialog] = useState({
    open: false,
    oldName: '',
    newName: ''
  })

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState({ open: false, member: null })

  // About CMS State
  const [aboutForm, setAboutForm] = useState({
    badge: 'Official National Authority',
    headline: 'Governing Carrom Excellence Across Bangladesh',
    story_p1: '',
    story_p2: '',
    history_story: '',
    mission: '',
    vision: '',
    office_address: '',
    official_colors: '',
    bounce_images: []
  })
  const [newImageUrl, setNewImageUrl] = useState('')

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message })
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, open: false }))
    }, 4000)
  }

  // Fetch all initial data
  const loadData = async () => {
    setLoading(true)
    try {
      const [commRes, aboutRes] = await Promise.all([
        fetch(`${API_BASE}/committee`).then((r) => r.json()),
        fetch(`${API_BASE}/about`).then((r) => r.json())
      ])

      if (commRes.success) setCommittee(commRes.data || [])
      if (aboutRes.success && aboutRes.data) {
        setAboutForm({
          badge: aboutRes.data.badge || 'Official National Authority',
          headline: aboutRes.data.headline || 'Governing Carrom Excellence Across Bangladesh',
          story_p1: aboutRes.data.story_p1 || '',
          story_p2: aboutRes.data.story_p2 || '',
          history_story: aboutRes.data.history_story || '',
          mission: aboutRes.data.mission || '',
          vision: aboutRes.data.vision || '',
          office_address: aboutRes.data.office_address || '',
          official_colors: aboutRes.data.official_colors || '',
          bounce_images: Array.isArray(aboutRes.data.bounce_images) ? aboutRes.data.bounce_images : []
        })
      }
    } catch (err) {
      console.error('Error fetching About & Committee data:', err)
      showAlert('error', 'Failed to load committee or about settings from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Build ordered groups with their ordered members
  const groupedSections = useMemo(() => {
    const map = new Map()
    const sorted = [...committee].sort((a, b) => {
      const goA = a.group_order ?? 99
      const goB = b.group_order ?? 99
      if (goA !== goB) return goA - goB
      const doA = a.display_order ?? 0
      const doB = b.display_order ?? 0
      if (doA !== doB) return doA - doB
      return (a.id || 0) - (b.id || 0)
    })

    for (const member of sorted) {
      const gName = (member.group_name || '').trim() || inferGroupFromDesignation(member.designation)
      if (!map.has(gName)) {
        const preset = PRESET_GROUPS.find((p) => p.name.toLowerCase() === gName.toLowerCase())
        map.set(gName, {
          name: gName,
          group_order: member.group_order ?? preset?.defaultOrder ?? map.size + 1,
          members: []
        })
      }
      map.get(gName).members.push(member)
    }

    return Array.from(map.values()).sort((a, b) => a.group_order - b.group_order)
  }, [committee])

  // Available group options (presets + any custom groups in DB)
  const allGroupOptions = useMemo(() => {
    const names = new Set(PRESET_GROUPS.map((g) => g.name))
    for (const m of committee) {
      if (m.group_name && m.group_name.trim()) {
        names.add(m.group_name.trim())
      }
    }
    return Array.from(names)
  }, [committee])

  // Persist bulk reorder to backend
  const persistSectionsOrder = async (sections, successMsg = 'Committee order saved') => {
    const payloadItems = []
    const flattened = []

    sections.forEach((sec, gIdx) => {
      const gOrder = gIdx + 1
      sec.members.forEach((m, mIdx) => {
        const dOrder = mIdx + 1
        const updatedMember = {
          ...m,
          group_name: sec.name,
          group_order: gOrder,
          display_order: dOrder
        }
        flattened.push(updatedMember)
        payloadItems.push({
          id: m.id,
          group_name: sec.name,
          group_order: gOrder,
          display_order: dOrder
        })
      })
    })

    // Optimistic UI update
    setCommittee(flattened)
    setReordering(true)

    try {
      const res = await fetch(`${API_BASE}/committee/reorder`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: payloadItems })
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setCommittee(data.data)
        if (successMsg) showAlert('success', successMsg)
      } else {
        showAlert('error', data.message || 'Failed to save new order')
        loadData()
      }
    } catch (err) {
      console.error('Error reordering committee:', err)
      showAlert('error', 'Network error while saving committee order')
      loadData()
    } finally {
      setReordering(false)
    }
  }

  // Move group up/down
  const handleMoveGroup = (groupIdx, direction) => {
    const targetIdx = groupIdx + direction
    if (targetIdx < 0 || targetIdx >= groupedSections.length) return
    const nextSections = groupedSections.map((s) => ({ ...s, members: [...s.members] }))
    const [moved] = nextSections.splice(groupIdx, 1)
    nextSections.splice(targetIdx, 0, moved)
    persistSectionsOrder(nextSections, `Moved "${moved.name}" group`)
  }

  // Move member up/down within its group
  const handleMoveMemberInGroup = (groupIdx, memberIdx, direction) => {
    const section = groupedSections[groupIdx]
    if (!section) return
    const targetIdx = memberIdx + direction
    if (targetIdx < 0 || targetIdx >= section.members.length) return

    const nextSections = groupedSections.map((s) => ({ ...s, members: [...s.members] }))
    const [moved] = nextSections[groupIdx].members.splice(memberIdx, 1)
    nextSections[groupIdx].members.splice(targetIdx, 0, moved)
    persistSectionsOrder(nextSections, `Updated order for ${moved.name}`)
  }

  // HTML5 Drag & Drop Handlers for Members and Groups
  const handleGroupDragStart = (e, groupName) => {
    e.stopPropagation()
    setDragState({
      type: 'group',
      memberId: null,
      sourceGroup: groupName,
      overMemberId: null,
      overGroup: groupName
    })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleMemberDragStart = (e, member, groupName) => {
    e.stopPropagation()
    setDragState({
      type: 'member',
      memberId: member.id,
      sourceGroup: groupName,
      overMemberId: member.id,
      overGroup: groupName
    })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverGroup = (e, groupName) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragState.overGroup !== groupName) {
      setDragState((prev) => ({ ...prev, overGroup: groupName }))
    }
  }

  const handleDragOverMember = (e, memberId, groupName) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (dragState.overMemberId !== memberId || dragState.overGroup !== groupName) {
      setDragState((prev) => ({ ...prev, overMemberId: memberId, overGroup: groupName }))
    }
  }

  const handleDropOnGroup = (e, targetGroupName) => {
    e.preventDefault()
    e.stopPropagation()

    if (dragState.type === 'group' && dragState.sourceGroup && dragState.sourceGroup !== targetGroupName) {
      const nextSections = groupedSections.map((s) => ({ ...s, members: [...s.members] }))
      const fromIdx = nextSections.findIndex((s) => s.name === dragState.sourceGroup)
      const toIdx = nextSections.findIndex((s) => s.name === targetGroupName)
      if (fromIdx !== -1 && toIdx !== -1) {
        const [movedGroup] = nextSections.splice(fromIdx, 1)
        nextSections.splice(toIdx, 0, movedGroup)
        persistSectionsOrder(nextSections, `Reordered group "${movedGroup.name}"`)
      }
    } else if (dragState.type === 'member' && dragState.memberId) {
      const nextSections = groupedSections.map((s) => ({ ...s, members: [...s.members] }))
      const sourceSec = nextSections.find((s) => s.name === dragState.sourceGroup)
      const targetSec = nextSections.find((s) => s.name === targetGroupName)
      if (sourceSec && targetSec) {
        const mIdx = sourceSec.members.findIndex((m) => m.id === dragState.memberId)
        if (mIdx !== -1) {
          const [movedMember] = sourceSec.members.splice(mIdx, 1)
          targetSec.members.push(movedMember)
          const nonEmpty = nextSections.filter((s) => s.members.length > 0)
          persistSectionsOrder(nonEmpty, `Moved ${movedMember.name} to "${targetGroupName}"`)
        }
      }
    }

    setDragState({ type: null, memberId: null, sourceGroup: null, overMemberId: null, overGroup: null })
  }

  const handleDropOnMember = (e, targetMember, targetGroupName) => {
    e.preventDefault()
    e.stopPropagation()

    if (dragState.type === 'group') {
      handleDropOnGroup(e, targetGroupName)
      return
    }

    if (dragState.type !== 'member' || !dragState.memberId) {
      setDragState({ type: null, memberId: null, sourceGroup: null, overMemberId: null, overGroup: null })
      return
    }

    if (dragState.memberId === targetMember.id && dragState.sourceGroup === targetGroupName) {
      setDragState({ type: null, memberId: null, sourceGroup: null, overMemberId: null, overGroup: null })
      return
    }

    const nextSections = groupedSections.map((s) => ({ ...s, members: [...s.members] }))
    const sourceSec = nextSections.find((s) => s.name === dragState.sourceGroup)
    const targetSec = nextSections.find((s) => s.name === targetGroupName)

    if (sourceSec && targetSec) {
      const fromIdx = sourceSec.members.findIndex((m) => m.id === dragState.memberId)
      if (fromIdx !== -1) {
        const [movedMember] = sourceSec.members.splice(fromIdx, 1)
        const toIdx = targetSec.members.findIndex((m) => m.id === targetMember.id)
        if (toIdx !== -1) {
          targetSec.members.splice(toIdx, 0, movedMember)
        } else {
          targetSec.members.push(movedMember)
        }
        const nonEmpty = nextSections.filter((s) => s.members.length > 0)
        persistSectionsOrder(nonEmpty, `Updated order for ${movedMember.name}`)
      }
    }

    setDragState({ type: null, memberId: null, sourceGroup: null, overMemberId: null, overGroup: null })
  }

  const handleDragEnd = () => {
    setDragState({ type: null, memberId: null, sourceGroup: null, overMemberId: null, overGroup: null })
  }

  // Rename an entire group
  const handleConfirmRenameGroup = async () => {
    const trimmed = renameDialog.newName.trim()
    if (!trimmed || trimmed === renameDialog.oldName) {
      setRenameDialog({ open: false, oldName: '', newName: '' })
      return
    }
    const nextSections = groupedSections.map((s) =>
      s.name === renameDialog.oldName
        ? { ...s, name: trimmed, members: s.members.map((m) => ({ ...m, group_name: trimmed })) }
        : { ...s, members: [...s.members] }
    )
    setRenameDialog({ open: false, oldName: '', newName: '' })
    await persistSectionsOrder(nextSections, `Renamed group to "${trimmed}"`)
  }

  // Handle open create/edit member
  const handleOpenMemberSheet = (member = null, presetGroupName = null) => {
    if (member) {
      const gName = (member.group_name || '').trim() || inferGroupFromDesignation(member.designation)
      setEditingMember(member)
      setUseCustomGroup(!allGroupOptions.includes(gName))
      setMemberForm({
        name: member.name || '',
        designation: member.designation || '',
        group_name: gName,
        group_order: member.group_order || 1,
        organization: member.organization || 'Bangladesh Carrom Federation',
        contact_email: member.contact_email || '',
        phone: member.phone || '',
        image_url: member.image_url || '',
        display_order: member.display_order || 1
      })
    } else {
      const targetGroup = presetGroupName || 'Executive Members'
      const existingSec = groupedSections.find((s) => s.name === targetGroup)
      const presetInfo = PRESET_GROUPS.find((p) => p.name === targetGroup)
      const gOrder = existingSec
        ? existingSec.group_order
        : presetInfo
        ? presetInfo.defaultOrder
        : groupedSections.length + 1
      const nextDisplayOrder = existingSec ? existingSec.members.length + 1 : 1

      setEditingMember(null)
      setUseCustomGroup(false)
      setMemberForm({
        name: '',
        designation: presetGroupName === 'President' ? 'President' : presetGroupName === 'General Secretary' ? 'General Secretary' : '',
        group_name: targetGroup,
        group_order: gOrder,
        organization: 'Bangladesh Carrom Federation',
        contact_email: '',
        phone: '',
        image_url: '',
        display_order: nextDisplayOrder
      })
    }
    setIsMemberSheetOpen(true)
  }

  // Save Committee Member
  const handleSaveMember = async (e) => {
    e?.preventDefault()
    if (!memberForm.name.trim()) {
      showAlert('error', 'Member full name is required.')
      return
    }
    if (!memberForm.designation.trim()) {
      showAlert('error', 'Position or designation is required.')
      return
    }

    const finalGroupName = (memberForm.group_name || '').trim() || inferGroupFromDesignation(memberForm.designation)
    const existingSec = groupedSections.find((s) => s.name.toLowerCase() === finalGroupName.toLowerCase())
    const presetInfo = PRESET_GROUPS.find((p) => p.name.toLowerCase() === finalGroupName.toLowerCase())
    const finalGroupOrder = existingSec
      ? existingSec.group_order
      : presetInfo
      ? presetInfo.defaultOrder
      : memberForm.group_order || groupedSections.length + 1

    setSavingMember(true)
    try {
      const url = editingMember
        ? `${API_BASE}/committee/${editingMember.id}`
        : `${API_BASE}/committee`
      const method = editingMember ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...memberForm,
          group_name: finalGroupName,
          group_order: finalGroupOrder
        })
      })
      const data = await res.json()

      if (data.success) {
        showAlert('success', editingMember ? 'Member updated successfully' : 'Member added successfully')
        setIsMemberSheetOpen(false)
        loadData()
      } else {
        showAlert('error', data.message || 'Failed to save committee member')
      }
    } catch (err) {
      console.error('Error saving member:', err)
      showAlert('error', 'Network error while saving member')
    } finally {
      setSavingMember(false)
    }
  }

  // Delete Committee Member
  const handleDeleteMember = async () => {
    if (!deleteDialog.member) return
    try {
      const res = await fetch(`${API_BASE}/committee/${deleteDialog.member.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        showAlert('success', 'Member deleted successfully')
        setDeleteDialog({ open: false, member: null })
        loadData()
      } else {
        showAlert('error', data.message || 'Failed to delete member')
      }
    } catch (err) {
      console.error('Error deleting member:', err)
      showAlert('error', 'Network error while deleting member')
    }
  }

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Please select a valid image file (JPEG, PNG, WEBP).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setMemberForm((prev) => ({ ...prev, image_url: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  // Save About Section Form
  const handleSaveAbout = async () => {
    setSavingAbout(true)
    try {
      const res = await fetch(`${API_BASE}/about`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(aboutForm)
      })
      const data = await res.json()
      if (data.success) {
        showAlert('success', 'About information and gallery images saved successfully!')
      } else {
        showAlert('error', data.message || 'Failed to update about information.')
      }
    } catch (err) {
      console.error('Error saving about settings:', err)
      showAlert('error', 'Network error while saving about information.')
    } finally {
      setSavingAbout(false)
    }
  }

  // Add / Remove Bounce Image
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return
    setAboutForm((prev) => ({
      ...prev,
      bounce_images: [...prev.bounce_images, newImageUrl.trim()]
    }))
    setNewImageUrl('')
  }

  const handleRemoveImage = (index) => {
    setAboutForm((prev) => ({
      ...prev,
      bounce_images: prev.bounce_images.filter((_, i) => i !== index)
    }))
  }

  return (
    <Box sx={{ width: '100%', pb: 6, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Alert Notification */}
      {alert.open && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2.5, boxShadow: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Page Header */}
      <PageHeader
        title="About & Committee CMS"
        subtitle="Organize Executive Committee members into hierarchical groups with drag-and-drop ordering, and manage the About narrative."
        actions={
          activeTab === 0 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenMemberSheet()}
              sx={{
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.8,
                py: 1,
                textTransform: 'none',
                boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`
              }}
            >
              Add Committee Member
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveRoundedIcon />}
              onClick={handleSaveAbout}
              disabled={savingAbout}
              sx={{
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.8,
                py: 1,
                textTransform: 'none',
                boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`
              }}
            >
              {savingAbout ? 'Saving...' : 'Save About Changes'}
            </Button>
          )
        }
      />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              minHeight: 48,
              gap: 1
            }
          }}
        >
          <Tab
            icon={<PeopleRoundedIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`Executive Committee (${committee.length} Members in ${groupedSections.length} Groups)`}
          />
          <Tab icon={<InfoRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Landing Page About & Story" />
        </Tabs>
      </Box>

      {/* TAB 0: GROUPED COMMITTEE MEMBERS WITH DRAG & DROP */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Drag & Drop Instructions Bar + Quick Group Preset Buttons */}
          <Card
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(4, 120, 87, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DragIndicatorRoundedIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.primary' }}>
                  Drag & Drop Committee Grouping & Ordering
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  Drag any member row to reorder within a group or move across groups. Drag group headers (or use ↑ / ↓) to reorder sections on the website.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {reordering && (
                <Chip
                  icon={<CircularProgress size={12} />}
                  label="Saving order..."
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {PRESET_GROUPS.slice(0, 5).map((preset) => (
                <Button
                  key={preset.name}
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                  onClick={() => handleOpenMemberSheet(null, preset.name)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: 2,
                    py: 0.4,
                    px: 1.2
                  }}
                >
                  {preset.name}
                </Button>
              ))}
            </Box>
          </Card>

          {loading ? (
            <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CircularProgress size={32} />
              <Typography sx={{ mt: 1.5, color: 'text.secondary', fontSize: '0.9rem' }}>
                Loading committee groups...
              </Typography>
            </Card>
          ) : groupedSections.length === 0 ? (
            <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <PeopleRoundedIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
              <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                No Committee Members Found
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2 }}>
                Click &quot;Add Committee Member&quot; to create your first group (e.g. President, Vice Presidents, General Secretary).
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenMemberSheet(null, 'President')}>
                Add President
              </Button>
            </Card>
          ) : (
            groupedSections.map((section, groupIdx) => {
              const isGroupDragOver =
                dragState.overGroup === section.name &&
                ((dragState.type === 'group' && dragState.sourceGroup !== section.name) ||
                  (dragState.type === 'member' && dragState.sourceGroup !== section.name))

              return (
                <Card
                  key={section.name}
                  onDragOver={(e) => handleDragOverGroup(e, section.name)}
                  onDrop={(e) => handleDropOnGroup(e, section.name)}
                  sx={{
                    borderRadius: 3.5,
                    border: '2px solid',
                    borderColor: isGroupDragOver ? 'primary.main' : 'divider',
                    boxShadow: isGroupDragOver ? (t) => `0 0 0 3px ${t.palette.primary.main}25` : 'none',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  {/* Group Header Bar (Draggable to reorder entire Group) */}
                  <Box
                    draggable
                    onDragStart={(e) => handleGroupDragStart(e, section.name)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      px: 2.5,
                      py: 1.6,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.5,
                      cursor: 'grab',
                      '&:active': { cursor: 'grabbing' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Tooltip title="Drag to reorder this group section">
                        <DragIndicatorRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </Tooltip>

                      <Chip
                        label={`Group #${groupIdx + 1}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 800, fontSize: '0.72rem', height: 24 }}
                      />

                      <FolderSpecialRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />

                      <Typography sx={{ fontWeight: 850, fontSize: '1rem', color: 'text.primary' }}>
                        {section.name}
                      </Typography>

                      <Chip
                        label={`${section.members.length} ${section.members.length === 1 ? 'Member' : 'Members'}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                      />

                      <Tooltip title="Rename Group">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenameDialog({ open: true, oldName: section.name, newName: section.name })
                          }}
                          sx={{ color: 'text.secondary' }}
                        >
                          <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Group Actions: Move Group Up/Down + Add Member to Group */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Tooltip title="Move Group Up">
                        <span>
                          <IconButton
                            size="small"
                            disabled={groupIdx === 0}
                            onClick={() => handleMoveGroup(groupIdx, -1)}
                          >
                            <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Move Group Down">
                        <span>
                          <IconButton
                            size="small"
                            disabled={groupIdx === groupedSections.length - 1}
                            onClick={() => handleMoveGroup(groupIdx, 1)}
                          >
                            <ArrowDownwardRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                        onClick={() => handleOpenMemberSheet(null, section.name)}
                        sx={{
                          ml: 1,
                          textTransform: 'none',
                          fontWeight: 750,
                          fontSize: '0.78rem',
                          borderRadius: 2
                        }}
                      >
                        Add to {section.name}
                      </Button>
                    </Box>
                  </Box>

                  {/* Members Table inside Group */}
                  <TableContainer>
                    <Table sx={{ minWidth: 750 }}>
                      <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.01)' }}>
                        <TableRow>
                          <TableCell sx={{ width: 90, fontWeight: 750, color: 'text.secondary', fontSize: '0.74rem' }}>
                            ORDER
                          </TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.74rem' }}>
                            MEMBER
                          </TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.74rem' }}>
                            DESIGNATION / POSITION
                          </TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.74rem' }}>
                            EMAIL
                          </TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.74rem' }}>
                            PHONE
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.74rem' }}>
                            ACTIONS
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {section.members.map((member, memberIdx) => {
                          const isBeingDragged = dragState.type === 'member' && dragState.memberId === member.id
                          const isDropTarget =
                            dragState.type === 'member' &&
                            dragState.overMemberId === member.id &&
                            dragState.memberId !== member.id

                          return (
                            <TableRow
                              key={member.id}
                              hover
                              draggable
                              onDragStart={(e) => handleMemberDragStart(e, member, section.name)}
                              onDragOver={(e) => handleDragOverMember(e, member.id, section.name)}
                              onDrop={(e) => handleDropOnMember(e, member, section.name)}
                              onDragEnd={handleDragEnd}
                              sx={{
                                cursor: 'grab',
                                '&:active': { cursor: 'grabbing' },
                                opacity: isBeingDragged ? 0.45 : 1,
                                bgcolor: isDropTarget
                                  ? isDark
                                    ? 'rgba(16, 185, 129, 0.14)'
                                    : 'rgba(16, 185, 129, 0.08)'
                                  : 'transparent',
                                borderTop: isDropTarget ? '2px solid #10B981' : undefined,
                                '&:last-child td, &:last-child th': { border: 0 },
                                transition: 'background-color 0.12s ease'
                              }}
                            >
                              {/* Drag Handle & Order Position */}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <DragIndicatorRoundedIcon sx={{ color: 'text.disabled', fontSize: 19 }} />
                                  <Chip
                                    label={`#${memberIdx + 1}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.74rem', fontWeight: 800, height: 24 }}
                                  />
                                </Box>
                              </TableCell>

                              {/* Member Info */}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                                  <Avatar
                                    src={member.image_url ? getMediaUrl(member.image_url) : undefined}
                                    alt={member.name}
                                    sx={{
                                      width: 44,
                                      height: 44,
                                      bgcolor: 'primary.main',
                                      fontWeight: 800,
                                      fontSize: '1rem',
                                      border: '1px solid',
                                      borderColor: 'divider'
                                    }}
                                  >
                                    {(member.name || 'M').charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography sx={{ fontWeight: 750, fontSize: '0.92rem', color: 'text.primary' }}>
                                      {member.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                      {member.organization || 'Bangladesh Carrom Federation'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>

                              {/* Designation */}
                              <TableCell>
                                <Chip
                                  label={member.designation}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.76rem',
                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(4, 120, 87, 0.08)',
                                    color: isDark ? '#34D399' : '#047857',
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(4, 120, 87, 0.2)'
                                  }}
                                />
                              </TableCell>

                              {/* Email */}
                              <TableCell>
                                {member.contact_email ? (
                                  <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                                    {member.contact_email}
                                  </Typography>
                                ) : (
                                  <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                    Not specified
                                  </Typography>
                                )}
                              </TableCell>

                              {/* Phone */}
                              <TableCell>
                                {member.phone ? (
                                  <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                                    {member.phone}
                                  </Typography>
                                ) : (
                                  <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                    —
                                  </Typography>
                                )}
                              </TableCell>

                              {/* Actions: Up / Down / Edit / Delete */}
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.4 }}>
                                  <Tooltip title="Move Up in Group">
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={memberIdx === 0}
                                        onClick={() => handleMoveMemberInGroup(groupIdx, memberIdx, -1)}
                                      >
                                        <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>

                                  <Tooltip title="Move Down in Group">
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={memberIdx === section.members.length - 1}
                                        onClick={() => handleMoveMemberInGroup(groupIdx, memberIdx, 1)}
                                      >
                                        <ArrowDownwardRoundedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>

                                  <Tooltip title="Edit Member">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenMemberSheet(member)}
                                      sx={{
                                        color: 'text.secondary',
                                        '&:hover': { color: 'primary.main', bgcolor: 'primary.light' }
                                      }}
                                    >
                                      <EditRoundedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Delete Member">
                                    <IconButton
                                      size="small"
                                      onClick={() => setDeleteDialog({ open: true, member })}
                                      sx={{
                                        color: 'text.secondary',
                                        '&:hover': { color: 'error.main', bgcolor: 'error.light' }
                                      }}
                                    >
                                      <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )
            })
          )}
        </Box>
      )}

      {/* TAB 1: ABOUT CMS & STORY SETTINGS */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Left Column: Narrative texts */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3, display: 'flex', flexDirection: 'column', gap: 2.8 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Landing Page Section Content
              </Typography>

              <TextField
                label="Section Badge Tag"
                value={aboutForm.badge}
                onChange={(e) => setAboutForm({ ...aboutForm, badge: e.target.value })}
                fullWidth
                helperText="Appears as small tag pill above headline on landing page"
              />

              <TextField
                label="Main Section Headline"
                value={aboutForm.headline}
                onChange={(e) => setAboutForm({ ...aboutForm, headline: e.target.value })}
                fullWidth
                helperText="Primary H2 headline of the About section"
              />

              <TextField
                label="Narrative Paragraph 1 (Lead Intro)"
                value={aboutForm.story_p1}
                onChange={(e) => setAboutForm({ ...aboutForm, story_p1: e.target.value })}
                fullWidth
                multiline
                rows={3}
                helperText="First paragraph explaining federation affiliation and origins"
              />

              <TextField
                label="Narrative Paragraph 2 (Grassroots & Championship)"
                value={aboutForm.story_p2}
                onChange={(e) => setAboutForm({ ...aboutForm, story_p2: e.target.value })}
                fullWidth
                multiline
                rows={3}
                helperText="Second paragraph explaining tournaments, referee academies, and players"
              />

              <Divider sx={{ my: 1 }} />

              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Detailed /about Page Content
              </Typography>

              <TextField
                label="Full Federation History & Background"
                value={aboutForm.history_story}
                onChange={(e) => setAboutForm({ ...aboutForm, history_story: e.target.value })}
                fullWidth
                multiline
                rows={4}
                helperText="Extended history displayed on the full dedicated /about page"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mission Statement"
                    value={aboutForm.mission}
                    onChange={(e) => setAboutForm({ ...aboutForm, mission: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Vision Statement"
                    value={aboutForm.vision}
                    onChange={(e) => setAboutForm({ ...aboutForm, vision: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Head Office Address"
                    value={aboutForm.office_address}
                    onChange={(e) => setAboutForm({ ...aboutForm, office_address: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Official Federation Colors"
                    value={aboutForm.official_colors}
                    onChange={(e) => setAboutForm({ ...aboutForm, official_colors: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Right Column: BounceCards Action Image Gallery */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  Interactive Bounce Cards Imagery
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Images displayed in the dynamic stacked BounceCards animation on the landing page and /about gallery.
                </Typography>
              </Box>

              {/* Add New Image Input */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Add Image URL"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleAddImage}
                  startIcon={<AddPhotoAlternateRoundedIcon />}
                  sx={{ flexShrink: 0, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  Add
                </Button>
              </Box>

              {/* Gallery Image List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 480, overflowY: 'auto' }}>
                {aboutForm.bounce_images.map((imgUrl, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
                    }}
                  >
                    <Box
                      component="img"
                      src={getMediaUrl(imgUrl)}
                      alt={`Bounce card ${index + 1}`}
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=200&auto=format&fit=crop'
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
                        Image #{index + 1}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.74rem',
                          color: 'text.secondary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {imgUrl}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveRoundedIcon />}
                onClick={handleSaveAbout}
                disabled={savingAbout}
                fullWidth
                sx={{
                  py: 1.2,
                  borderRadius: 2.5,
                  fontWeight: 750,
                  textTransform: 'none',
                  boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`,
                  mt: 1
                }}
              >
                {savingAbout ? 'Saving All Changes...' : 'Save About & Gallery Changes'}
              </Button>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* SIDESHEET: CREATE / EDIT COMMITTEE MEMBER */}
      <SideSheet
        open={isMemberSheetOpen}
        onClose={() => setIsMemberSheetOpen(false)}
        title={editingMember ? 'Edit Committee Member' : 'Add Committee Member'}
        subtitle={editingMember ? `Updating record for ${editingMember.name}` : 'Create executive officer or member profile'}
        icon={<PeopleRoundedIcon sx={{ fontSize: 22 }} />}
        width={{ xs: '100%', sm: 540, md: 620 }}
        footerActions={
          <>
            <Button
              variant="outlined"
              onClick={() => setIsMemberSheetOpen(false)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 650, px: 2.5 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveMember}
              disabled={savingMember}
              startIcon={savingMember ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 750, px: 3 }}
            >
              {savingMember ? 'Saving...' : editingMember ? 'Save Changes' : 'Create Member'}
            </Button>
          </>
        }
      >
        <Box component="form" onSubmit={handleSaveMember} sx={{ display: 'flex', flexDirection: 'column', gap: 2.8 }}>
          {/* Photo Upload & Preview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
            <Avatar
              src={memberForm.image_url ? getMediaUrl(memberForm.image_url) : undefined}
              alt={memberForm.name}
              sx={{
                width: 76,
                height: 76,
                borderRadius: 2.5,
                bgcolor: 'primary.main',
                fontWeight: 900,
                fontSize: '1.6rem',
                border: '2px solid',
                borderColor: 'divider',
                boxShadow: 2
              }}
            >
              {(memberForm.name || 'M').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 750, fontSize: '0.9rem', color: 'text.primary', mb: 0.5 }}>
                Member Portrait / Photo
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1.5 }}>
                Upload a 1:1 square headshot photo or provide an external image URL.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCameraRoundedIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  Upload Photo
                  <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                </Button>
                {memberForm.image_url && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setMemberForm((prev) => ({ ...prev, image_url: '' }))}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Photo URL Input (Alternative to file upload) */}
          <TextField
            label="Photo Image URL (Optional)"
            placeholder="https://..."
            value={memberForm.image_url?.startsWith('data:') ? 'Image uploaded from computer' : memberForm.image_url}
            onChange={(e) => setMemberForm({ ...memberForm, image_url: e.target.value })}
            disabled={memberForm.image_url?.startsWith('data:')}
            fullWidth
            size="small"
            helperText="Direct image link or use the upload button above"
          />

          {/* Full Name */}
          <TextField
            label="Full Name *"
            value={memberForm.name}
            onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
            required
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Committee Group / Section Selector */}
          <Box sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderSpecialRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                Committee Group / Section *
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  setUseCustomGroup((prev) => !prev)
                  if (!useCustomGroup) {
                    setMemberForm((prev) => ({ ...prev, group_name: '' }))
                  } else {
                    setMemberForm((prev) => ({ ...prev, group_name: allGroupOptions[0] || 'Executive Members' }))
                  }
                }}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
              >
                {useCustomGroup ? 'Choose Existing Group' : '+ Create Custom Group'}
              </Button>
            </Box>

            {useCustomGroup ? (
              <TextField
                label="Custom Group Title *"
                placeholder="e.g. Tournament Committee, Disciplinary Committee, Advisors"
                value={memberForm.group_name}
                onChange={(e) => setMemberForm({ ...memberForm, group_name: e.target.value })}
                fullWidth
                size="small"
                helperText="Members with the same group title will be displayed together under this section heading."
              />
            ) : (
              <TextField
                select
                label="Select Committee Group *"
                value={allGroupOptions.includes(memberForm.group_name) ? memberForm.group_name : 'Executive Members'}
                onChange={(e) => setMemberForm({ ...memberForm, group_name: e.target.value })}
                fullWidth
                size="small"
                helperText="Determines which section heading this member appears under (e.g. President, Vice Presidents)."
              >
                {allGroupOptions.map((gName) => (
                  <MenuItem key={gName} value={gName}>
                    {gName}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          {/* Designation / Position */}
          <TextField
            label="Position / Designation *"
            placeholder="e.g. President, Senior Vice President, Vice President, General Secretary"
            value={memberForm.designation}
            onChange={(e) => {
              const val = e.target.value
              setMemberForm((prev) => ({
                ...prev,
                designation: val,
                group_name: !editingMember && !useCustomGroup ? inferGroupFromDesignation(val) : prev.group_name
              }))
            }}
            required
            fullWidth
            helperText="Official title displayed on the member's card"
          />

          {/* Contact Email */}
          <TextField
            label="Official Contact Email"
            type="email"
            placeholder="e.g. president@bcf.org.bd"
            value={memberForm.contact_email}
            onChange={(e) => setMemberForm({ ...memberForm, contact_email: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Phone Number */}
          <TextField
            label="Official Phone / Mobile"
            placeholder="e.g. +880 1711-000000"
            value={memberForm.phone}
            onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Organization */}
          <TextField
            label="Organization"
            value={memberForm.organization}
            onChange={(e) => setMemberForm({ ...memberForm, organization: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Display Order within Group */}
          <TextField
            label="Order Within Group"
            type="number"
            value={memberForm.display_order}
            onChange={(e) => setMemberForm({ ...memberForm, display_order: parseInt(e.target.value, 10) || 1 })}
            fullWidth
            helperText="Order of this member inside their group (you can also drag & drop anytime in the table)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SortRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />
        </Box>
      </SideSheet>

      {/* RENAME GROUP DIALOG */}
      <Dialog
        open={renameDialog.open}
        onClose={() => setRenameDialog({ open: false, oldName: '', newName: '' })}
        PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Rename Committee Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Title"
            fullWidth
            value={renameDialog.newName}
            onChange={(e) => setRenameDialog((prev) => ({ ...prev, newName: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setRenameDialog({ open: false, oldName: '', newName: '' })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 650 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmRenameGroup}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Save Group Title
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, member: null })}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Member Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{deleteDialog.member?.name}</strong> ({deleteDialog.member?.designation}) from the committee directory? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, member: null })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 650 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteMember}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Delete Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AboutCommitteeView
