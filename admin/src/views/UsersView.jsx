import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Switch,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  EditOutlined as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  CancelOutlined as InactiveIcon,
  PhotoCamera as CameraIcon,
  DeleteForever as RemovePhotoIcon,
  Key as KeyIcon,
  Visibility,
  VisibilityOff,
  PeopleAltOutlined as UsersIcon,
  AdminPanelSettingsOutlined as SuperAdminIcon,
  ShieldOutlined as AdminIcon,
  BlockOutlined as SuspendedIcon,
  RefreshOutlined as RefreshIcon,
  Phone as PhoneIcon,
  EmailOutlined as EmailIcon,
  BadgeOutlined as PositionIcon
} from '@mui/icons-material'
import { PageHeader } from '@/components/Common/PageHeader'
import { SideSheet } from '@/components/Common/SideSheet'
import * as api from '@/services/api'

export function UsersView() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // SideSheet Form State
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
    designation: '',
    position: '',
    phone: '',
    avatar_url: '',
    status: 'Active'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  // Toast State
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  const showToast = (message, severity = 'success') => {
    setToast({ message, severity })
  }

  // Load Users
  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await api.fetchUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load users:', e)
      showToast('Failed to load users list', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // KPI calculations
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === 'Active').length
    const superAdmins = users.filter((u) => u.role === 'Super Admin').length
    const inactive = total - active
    return { total, active, superAdmins, inactive }
  }, [users])

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase().trim()
      const matchSearch =
        !query ||
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.position && u.position.toLowerCase().includes(query)) ||
        (u.designation && u.designation.toLowerCase().includes(query))

      const matchRole = roleFilter === 'All' || u.role === roleFilter
      const matchStatus = statusFilter === 'All' || u.status === statusFilter

      return matchSearch && matchRole && matchStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Handle Open Create Form
  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Admin',
      designation: '',
      position: '',
      phone: '',
      avatar_url: '',
      status: 'Active'
    })
    setFormErrors({})
    setShowPassword(false)
    setIsSideSheetOpen(true)
  }

  // Handle Open Edit Form
  const handleOpenEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // blank unless changing
      role: user.role || 'Admin',
      designation: user.designation || '',
      position: user.position || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url || '',
      status: user.status || 'Active'
    })
    setFormErrors({})
    setShowPassword(false)
    setIsSideSheetOpen(true)
  }

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, avatar_url: event.target.result }))
    }
    reader.readAsDataURL(file)
  }

  // Handle Remove Photo
  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, avatar_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Validate Form
  const validateForm = () => {
    const errors = {}
    if (!formData.name?.trim()) errors.name = 'Full Name is required'
    if (!formData.email?.trim()) {
      errors.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'Password is required for new accounts'
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      }
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'New password must be at least 6 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Submit (Create or Update)
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (editingUser) {
        const payload = { ...formData }
        if (!payload.password) delete payload.password // don't send empty password

        const res = await api.updateUser(editingUser.id, payload)
        if (res && res.success) {
          showToast('User profile updated successfully')
          setIsSideSheetOpen(false)
          loadUsers()
        } else {
          showToast(res?.message || 'Failed to update user', 'error')
        }
      } else {
        const res = await api.createUser(formData)
        if (res && res.success) {
          showToast('New user created successfully')
          setIsSideSheetOpen(false)
          loadUsers()
        } else {
          showToast(res?.message || 'Failed to create user', 'error')
        }
      }
    } catch (e) {
      showToast(e.message || 'Operation failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Status Toggle
  const handleToggleStatus = async (user) => {
    try {
      const res = await api.toggleUserStatus(user.id, user.status)
      if (res && res.success) {
        showToast(`User status set to ${user.status === 'Active' ? 'Inactive' : 'Active'}`)
        loadUsers()
      } else {
        showToast(res?.message || 'Failed to update status', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Failed to toggle status', 'error')
    }
  }

  // Handle Delete User
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    try {
      const res = await api.deleteUser(userToDelete.id)
      if (res && res.success) {
        showToast('User deleted successfully')
        loadUsers()
      } else {
        showToast(res?.message || 'Failed to delete user', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Failed to delete user', 'error')
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Page Header */}
      <PageHeader
        title="Users Management"
        subtitle="Manage administrative accounts, role assignments, designations, and security access"
        actions={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadUsers}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 650 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`
              }}
            >
              Add New User
            </Button>
          </Box>
        }
      />

      {/* KPI Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mt: 3,
          mb: 3
        }}
      >
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            backgroundColor: isDark ? '#18181B' : '#FFFFFF',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
          }}
        >
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Total Accounts
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UsersIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, letterSpacing: '-0.02em' }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Configured administrators
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            backgroundColor: isDark ? '#18181B' : '#FFFFFF',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
          }}
        >
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', textTransform: 'uppercase' }}>
                Active Users
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'success.main', opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActiveIcon sx={{ fontSize: 20, color: 'success.main' }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, letterSpacing: '-0.02em', color: 'success.main' }}>
              {stats.active}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Full system access
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            backgroundColor: isDark ? '#18181B' : '#FFFFFF',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
          }}
        >
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main', textTransform: 'uppercase' }}>
                Super Admins
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'warning.main', opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SuperAdminIcon sx={{ fontSize: 20, color: 'warning.main' }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, letterSpacing: '-0.02em', color: 'warning.main' }}>
              {stats.superAdmins}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Root privileges
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            backgroundColor: isDark ? '#18181B' : '#FFFFFF',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
          }}
        >
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', textTransform: 'uppercase' }}>
                Inactive / Suspended
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'error.main', opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SuspendedIcon sx={{ fontSize: 20, color: 'error.main' }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, letterSpacing: '-0.02em', color: stats.inactive > 0 ? 'error.main' : 'text.secondary' }}>
              {stats.inactive}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Access revoked
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filter and Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2
        }}
      >
        <TextField
          size="small"
          placeholder="Search by name, email, designation, or position..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 260px' },
            '& .MuiOutlinedInput-root': { borderRadius: 2.2 }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            )
          }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="role-filter-label">Role</InputLabel>
          <Select
            labelId="role-filter-label"
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ borderRadius: 2.2 }}
          >
            <MenuItem value="All">All Roles</MenuItem>
            <MenuItem value="Super Admin">Super Admin</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Editor">Editor</MenuItem>
            <MenuItem value="Moderator">Moderator</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ borderRadius: 2.2 }}
          >
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary', fontWeight: 600 }}>
          Showing {filteredUsers.length} of {users.length} users
        </Typography>
      </Paper>

      {/* Users Data Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          overflow: 'hidden'
        }}
      >
        <Table sx={{ minWidth: 750 }}>
          <TableHead sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>USER / AVATAR</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>POSITION & DESIGNATION</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>CONTACT</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>ROLE</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>LAST LOGIN</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                    Loading users directory...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'action.hover', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                    <UsersIcon sx={{ fontSize: 26, color: 'text.secondary' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    No users found
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {searchQuery ? 'Try adjusting your search criteria' : 'Click "Add New User" to create the first administrative profile'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const userInitial = user.name
                  ? user.name.charAt(0).toUpperCase()
                  : user.email.charAt(0).toUpperCase()

                return (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
                      }
                    }}
                  >
                    {/* User DP + Name + Email */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                        <Avatar
                          src={user.avatar_url || ''}
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2.5,
                            bgcolor: isDark ? '#27272A' : '#E4E4E7',
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
                          }}
                        >
                          {userInitial}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 750, lineHeight: 1.2 }}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            <EmailIcon sx={{ fontSize: 13 }} /> {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Position & Designation */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary', lineHeight: 1.2 }}>
                        {user.position || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
                        {user.designation || 'Staff / Officer'}
                      </Typography>
                    </TableCell>

                    {/* Contact Phone */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.84rem', color: user.phone ? 'text.primary' : 'text.secondary' }}>
                        {user.phone ? (
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            {user.phone}
                          </Box>
                        ) : (
                          '—'
                        )}
                      </Typography>
                    </TableCell>

                    {/* Role Chip */}
                    <TableCell>
                      <Chip
                        label={user.role || 'Admin'}
                        size="small"
                        icon={user.role === 'Super Admin' ? <SuperAdminIcon sx={{ fontSize: '14px !important' }} /> : <AdminIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{
                          height: 24,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: user.role === 'Super Admin' ? '#84B70120' : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                          color: user.role === 'Super Admin' ? '#84B701' : 'text.primary',
                          border: user.role === 'Super Admin' ? '1px solid #84B70150' : 'none'
                        }}
                      />
                    </TableCell>

                    {/* Status Toggle & Chip */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          size="small"
                          checked={user.status === 'Active'}
                          onChange={() => handleToggleStatus(user)}
                          color="success"
                        />
                        <Chip
                          label={user.status}
                          size="small"
                          color={user.status === 'Active' ? 'success' : 'default'}
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      </Box>
                    </TableCell>

                    {/* Last Login */}
                    <TableCell>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Never logged in'}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(user)}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setUserToDelete(user)
                              setDeleteDialogOpen(true)
                            }}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* SideSheet for Add & Edit User Form */}
      <SideSheet
        open={isSideSheetOpen}
        onClose={() => !isSubmitting && setIsSideSheetOpen(false)}
        title={editingUser ? 'Edit User Profile' : 'Add New User'}
        subtitle={
          editingUser
            ? `Update credentials & administrative permissions for ${editingUser.name}`
            : 'Register a new administrative user with designated platform access'
        }
        icon={<UsersIcon sx={{ fontSize: 22 }} />}
        width={{ xs: '100%', sm: 560, md: 620 }}
        footerActions={
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="outlined"
              onClick={() => setIsSideSheetOpen(false)}
              disabled={isSubmitting}
              sx={{ borderRadius: 2.2, textTransform: 'none', fontWeight: 650 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                borderRadius: 2.2,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}40`
              }}
            >
              {isSubmitting
                ? 'Saving...'
                : editingUser
                ? 'Update User'
                : 'Create User'}
            </Button>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.8, py: 1 }}>
          {/* Avatar (DP) Section */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: '1px dashed',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 2.5
            }}
          >
            <Avatar
              src={formData.avatar_url || ''}
              sx={{
                width: 72,
                height: 72,
                borderRadius: 3,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
              }}
            >
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 0.5 }}>
                Profile Picture (DP)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                Upload JPEG, PNG or WebP under 2MB.
              </Typography>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', fontWeight: 650 }}
                >
                  Upload Image
                </Button>
                {formData.avatar_url && (
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    startIcon={<RemovePhotoIcon />}
                    onClick={handleRemovePhoto}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Full Name & Email */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                Full Name *
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Kabir Ahmed"
                error={Boolean(formErrors.name)}
                helperText={formErrors.name}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                Email Address *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@bcf.org.bd"
                error={Boolean(formErrors.email)}
                helperText={formErrors.email}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
              />
            </Box>
          </Box>

          {/* Position & Designation */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                Position (Federation / Board)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. General Secretary, Joint Secretary"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                Designation / Job Title
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Head of Operations, Media Manager"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
              />
            </Box>
          </Box>

          {/* Role & Phone */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                Administrative Role
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  sx={{ borderRadius: 2.2 }}
                >
                  <MenuItem value="Super Admin">Super Admin (Full Root Access)</MenuItem>
                  <MenuItem value="Admin">Admin (Tournament & Player Operations)</MenuItem>
                  <MenuItem value="Editor">Editor (CMS, News & Media Only)</MenuItem>
                  <MenuItem value="Moderator">Moderator (Live Matches & Scorer)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
                Phone Number
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+880 1711-XXXXXX"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
              />
            </Box>
          </Box>

          {/* Password Field */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.6, display: 'block' }}>
              {editingUser ? 'Change Password (Optional)' : 'Account Password *'}
            </Typography>
            <TextField
              fullWidth
              size="small"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Leave blank to keep existing password' : 'Enter secure password (min 6 chars)'}
              error={Boolean(formErrors.password)}
              helperText={formErrors.password}
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
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.2 } }}
            />
          </Box>

          {/* Account Status Switch */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>
                Account Active Status
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Inactive accounts cannot sign in to the administration portal
              </Typography>
            </Box>
            <Switch
              checked={formData.status === 'Active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'Active' : 'Inactive' })}
              color="success"
            />
          </Box>
        </Box>
      </SideSheet>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete administrative user{' '}
            <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 1.5, px: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 650 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && (
          <Alert
            severity={toast.severity || 'success'}
            onClose={() => setToast(null)}
            sx={{ borderRadius: 2.5, fontWeight: 600 }}
          >
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  )
}

export default UsersView
