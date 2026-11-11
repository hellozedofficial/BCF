// Resilient API Service for Bangladesh Carrom Federation Admin Panel
// Connects to http://localhost:5050/api with local fallback caching

export const getApiBaseUrl = () => {
  try {
    if (typeof window !== 'undefined' && window.__BCF_CONFIG__?.API_URL) {
      return window.__BCF_CONFIG__.API_URL
    }
    if (typeof __APP_API_URL__ !== 'undefined' && __APP_API_URL__) {
      return __APP_API_URL__
    }
  } catch (e) {}
  return import.meta.env.VITE_API_URL || import.meta.env.API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5050/api')
}

export const getServerBaseUrl = () => {
  try {
    if (typeof window !== 'undefined' && window.__BCF_CONFIG__?.SERVER_URL !== undefined) {
      return window.__BCF_CONFIG__.SERVER_URL
    }
    if (typeof __APP_SERVER_URL__ !== 'undefined' && __APP_SERVER_URL__) {
      return __APP_SERVER_URL__
    }
  } catch (e) {}
  return import.meta.env.VITE_SERVER_URL || import.meta.env.SERVER_URL || (import.meta.env.PROD ? '' : 'http://localhost:5050')
}

export const getClientWebsiteUrl = () => {
  try {
    if (typeof window !== 'undefined' && window.__BCF_CONFIG__?.CLIENT_URL) {
      return window.__BCF_CONFIG__.CLIENT_URL
    }
    if (typeof __APP_CLIENT_URL__ !== 'undefined' && __APP_CLIENT_URL__) {
      return __APP_CLIENT_URL__
    }
  } catch (e) {}
  return import.meta.env.VITE_CLIENT_URL || import.meta.env.CLIENT_URL || (import.meta.env.PROD ? 'https://bcf.org.bd' : 'http://localhost:5173')
}

const SERVER_BASE_URL = getServerBaseUrl()
const API_BASE_URL = getApiBaseUrl()

export const getMediaUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  return `${SERVER_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

// LocalStorage persistence helpers
const getStored = (key, fallback) => {
  try {
    const data = localStorage.getItem(`bcf_admin_${key}`)
    return data ? JSON.parse(data) : fallback
  } catch (e) {
    return fallback
  }
}

const setStored = (key, value) => {
  try {
    localStorage.setItem(`bcf_admin_${key}`, JSON.stringify(value))
  } catch (e) {
    console.error('Storage error', e)
  }
}

const apiFetch = (url, options = {}) => {
  const token = getAuthToken()
  const mergedHeaders = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  return fetch(url, { ...options, headers: mergedHeaders })
}

// Check backend connectivity status
let isBackendOnline = false
export const checkServerStatus = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/stats`, { signal: AbortSignal.timeout(1800) })
    isBackendOnline = res.ok
    return isBackendOnline
  } catch (e) {
    isBackendOnline = false
    return false
  }
}

// ================= STATS API =================
export const fetchStats = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/stats`, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return { data: json.data, source: 'live' }
    }
  } catch (e) {
    console.error('[API] Failed to fetch stats:', e)
  }
  return {
    data: {
      total_players: 0,
      total_clubs: 0,
      total_tournaments: 0,
      live_matches: 0,
      white_slams: 0,
      black_slams: 0,
      pending_registrations: 0
    },
    source: 'empty'
  }
}

// ================= TOURNAMENTS API =================
export const fetchTournaments = async (status) => {
  try {
    const url = status && status !== 'All' 
      ? `${API_BASE_URL}/tournaments?include_unpublished=true&status=${encodeURIComponent(status)}` 
      : `${API_BASE_URL}/tournaments?include_unpublished=true`
    const res = await apiFetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) return json.data
    }
  } catch (e) {
    console.error('[API] Error fetching tournaments:', e)
  }
  return []
}

export const createTournament = async (tournamentData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tournamentData)
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) return json
    return { success: false, message: json.message || 'Failed to create tournament' }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

export const updateTournament = async (id, data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) return json
    return { success: false, message: json.message || 'Failed to update tournament' }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

export const toggleTournamentPublish = async (id, is_published) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${id}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published })
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) return json
    return { success: false, message: json.message || 'Failed to toggle tournament visibility' }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

export const deleteTournament = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    if (res.ok) return json
    return { success: false, message: json.message || 'Failed to delete tournament' }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

export const fetchTournamentById = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${id}?include_unpublished=true`, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {
    console.error('[API] Error fetching tournament by id:', e)
  }
  return null
}

export const fetchTournamentBracket = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${id}/bracket?include_unpublished=true`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}
  return null
}

export const generateTournamentFixtures = async (id, data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${id}/generate-fixtures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) return await res.json()
  } catch (e) {}
  return { success: false, message: 'Failed to generate fixtures' }
}

export const updateTournamentMatchScore = async (matchId, data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/matches/${matchId}/score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) return await res.json()
  } catch (e) {}
  return { success: false, message: 'Failed to update score' }
}

export const addTournamentParticipants = async (tournamentId, data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${tournamentId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) return await res.json()
    const errJson = await res.json().catch(() => ({}))
    return { success: false, message: errJson.message || 'Failed to add participants' }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

export const removeTournamentParticipant = async (tournamentId, playerId) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${tournamentId}/participants/${playerId}`, {
      method: 'DELETE'
    })
    if (res.ok) return await res.json()
    const errJson = await res.json().catch(() => ({}))
    return { success: false, message: errJson.message || 'Failed to remove participant' }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

// ================= PLAYERS API =================
export const fetchPlayers = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString()
    const res = await apiFetch(`${API_BASE_URL}/players?${query}`, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}

  return []
}

export const fetchPlayerById = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/players/${encodeURIComponent(id)}`)
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}

  return null
}

export const createPlayer = async (playerData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to create player' }
}

export const updatePlayer = async (id, data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to update player' }
}

export const deletePlayer = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/players/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to delete player' }
}

// ================= MATCHES API =================
export const fetchMatches = async (params = {}) => {
  try {
    const query = new URLSearchParams({ include_unpublished: 'true', ...params }).toString()
    const res = await apiFetch(`${API_BASE_URL}/matches?${query}`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}

  return []
}

export const updateMatchScore = async (id, scoreData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/matches/${id}/score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to update match score' }
}

export const createMatch = async (matchData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to create match' }
}

export const deleteMatch = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/matches/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to delete match' }
}

export const fetchMatchEvents = async (matchId) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/matches/${matchId}/events`)
    if (res.ok) return await res.json()
  } catch (e) {}
  return { success: false, data: [] }
}

export const recordMatchEvent = async (matchId, data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/matches/${matchId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const json = await res.json()
    return json
  } catch (e) {
    return { success: false, message: e.message }
  }
}

export const undoMatchEvent = async (matchId) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/matches/${matchId}/events/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const json = await res.json()
    return json
  } catch (e) {
    return { success: false, message: e.message }
  }
}

// ================= REGISTRATIONS API =================
export const fetchRegistrations = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/player-register`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map(r => ({
          ...r,
          full_name: r.name_en ? (r.nickname ? `${r.name_en} (${r.nickname})` : r.name_en) : (r.full_name || 'Applicant'),
          raw_name_en: r.name_en,
          district: r.district_name || r.district || 'Dhaka',
          category: r.category || (r.player_since && r.player_since <= 2005 ? 'Veteran' : 'Senior'),
          gender: r.gender || 'Men',
          tournament_title: r.player_id ? `Player ID: ${r.player_id}` : (r.tournament_title || 'National Portal Application'),
          download_url: r.player_id ? `${API_BASE_URL}/player-register/download-form/${r.player_id}` : null,
          photo_url: getMediaUrl(r.photo_url),
          nid_front_url: getMediaUrl(r.nid_front_url),
          nid_back_url: getMediaUrl(r.nid_back_url)
        }))
      }
    }
  } catch (e) {}

  // Fallback to legacy tournament registrations endpoint
  try {
    const legacyRes = await apiFetch(`${API_BASE_URL}/registrations`, { signal: AbortSignal.timeout(2000) })
    if (legacyRes.ok) {
      const json = await legacyRes.json()
      if (json.success && Array.isArray(json.data)) return json.data
    }
  } catch (e) {}

  return []
}

export const registerPlayerByAdmin = async (playerData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/player-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    })
    const json = await res.json()
    return json
  } catch (e) {
    return { success: false, message: e.message || 'Failed to submit registration' }
  }
}

export const fetchDivisions = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/geocode/divisions`)
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) return json.data
    }
  } catch (e) {}
  return [
    { id: 1, name: 'Chattagram' },
    { id: 2, name: 'Rajshahi' },
    { id: 3, name: 'Khulna' },
    { id: 4, name: 'Barishal' },
    { id: 5, name: 'Sylhet' },
    { id: 6, name: 'Dhaka' },
    { id: 7, name: 'Rangpur' },
    { id: 8, name: 'Mymensingh' }
  ]
}

export const fetchDistricts = async (divisionId) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/geocode/districts/${divisionId}`)
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) return json.data
    }
  } catch (e) {}
  return []
}


export const updateRegistration = async (id, data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/player-register/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const json = await res.json()
    return json
  } catch (e) {
    return { success: false, message: e.message || 'Failed to update registration' }
  }
}

export const updateRegistrationStatus = async (id, status, playerDetails = null) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/player-register/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, playerDetails })
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  // Fallback to legacy
  try {
    const legacyRes = await apiFetch(`${API_BASE_URL}/registrations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, playerDetails })
    })
    if (legacyRes.ok) return await legacyRes.json()
  } catch (e) {}

  return { success: false, message: 'Failed to update registration status' }
}

export const deleteRegistration = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/player-register/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  // Fallback to legacy
  try {
    const legacyRes = await apiFetch(`${API_BASE_URL}/registrations/${id}`, { method: 'DELETE' })
    if (legacyRes.ok) return await legacyRes.json()
  } catch (e) {}

  return { success: false, message: 'Failed to delete registration' }
}

// ================= NEWS API =================
export const fetchNews = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/news`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}

  return []
}

export const createNews = async (newsData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to create news item' }
}

export const updateNews = async (id, newsData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/news/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to update news item' }
}

export const uploadNewsEditorImage = async (base64Image) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/news/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    })
    if (res.ok) return await res.json()
  } catch (e) {
    console.error('Editor image upload error:', e)
  }
  return { success: false, message: 'Upload failed' }
}

export const fetchVideoThumbnail = async (videoUrl) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/news/video-thumbnail?url=${encodeURIComponent(videoUrl)}`)
    const json = await res.json()
    return json
  } catch (e) {
    console.error('Video thumbnail fetch error:', e)
    return { success: false, message: e.message || 'Failed to fetch video thumbnail' }
  }
}

export const deleteNews = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/news/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  return { success: false, message: 'Failed to delete news item' }
}

// ==================== BANNERS (CMS) ====================
export const fetchBanners = async (all = true) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/banners${all ? '?all=true' : ''}`)
    if (res.ok) {
      const data = await res.json()
      if (data.data) {
        setStored('banners', data.data)
        return data.data
      }
    }
  } catch (e) {
    console.warn('[API] Failed to fetch banners, using cache:', e.message)
  }
  return getStored('banners', [])
}

export const createBanner = async (bannerData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerData)
    })
    if (res.ok) {
      return await res.json()
    }
    const err = await res.json()
    throw new Error(err.message || 'Failed to create banner')
  } catch (e) {
    console.error('[API] Error creating banner:', e)
    throw e
  }
}

export const updateBanner = async (id, bannerData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerData)
    })
    if (res.ok) {
      return await res.json()
    }
    const err = await res.json()
    throw new Error(err.message || 'Failed to update banner')
  } catch (e) {
    console.error('[API] Error updating banner:', e)
    throw e
  }
}

export const deleteBanner = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/banners/${id}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      return await res.json()
    }
    const err = await res.json()
    throw new Error(err.message || 'Failed to delete banner')
  } catch (e) {
    console.error('[API] Error deleting banner:', e)
    throw e
  }
}

// ==================== ANNOUNCEMENTS (POPUP CMS) ====================
export const fetchAnnouncements = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/announcements`)
    if (res.ok) {
      const json = await res.json()
      if (json.data) {
        setStored('announcements', json.data)
        return json.data
      }
    }
  } catch (e) {
    console.warn('[API] Failed to fetch announcements, using cache:', e.message)
  }
  return getStored('announcements', [])
}

export const createAnnouncement = async (data) => {
  const res = await apiFetch(`${API_BASE_URL}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to create announcement')
  return json
}

export const updateAnnouncement = async (id, data) => {
  const res = await apiFetch(`${API_BASE_URL}/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to update announcement')
  return json
}

export const toggleAnnouncementPublish = async (id, is_published) => {
  const res = await apiFetch(`${API_BASE_URL}/announcements/${id}/publish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_published })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to toggle announcement status')
  return json
}

export const deleteAnnouncement = async (id) => {
  const res = await apiFetch(`${API_BASE_URL}/announcements/${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to delete announcement')
  return json
}

// ================= CLUBS API =================
export const fetchClubs = async (params = {}) => {
  try {
    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.division) query.append('division', params.division)
    if (params.district) query.append('district', params.district)
    if (params.q) query.append('q', params.q)

    const url = `${API_BASE_URL}/clubs${query.toString() ? '?' + query.toString() : ''}`
    const res = await apiFetch(url, { signal: AbortSignal.timeout(4000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
    }
  } catch (e) {
    console.error('[API] Error fetching clubs:', e)
  }
  return []
}

export const fetchClub = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/clubs/${id}`)
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {
    console.error('[API] Error fetching club details:', e)
  }
  return null
}

export const createClub = async (clubData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/clubs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clubData)
    })
    const json = await res.json()
    return json
  } catch (e) {
    console.error('[API] Error creating club:', e)
    return { success: false, message: e.message || 'Failed to create club' }
  }
}

export const updateClub = async (id, clubData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/clubs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clubData)
    })
    const json = await res.json()
    return json
  } catch (e) {
    console.error('[API] Error updating club:', e)
    return { success: false, message: e.message || 'Failed to update club' }
  }
}

export const toggleClubStatus = async (id, status) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/clubs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    const json = await res.json()
    return json
  } catch (e) {
    console.error('[API] Error toggling club status:', e)
    return { success: false, message: e.message || 'Failed to toggle status' }
  }
}

export const deleteClub = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/clubs/${id}`, {
      method: 'DELETE'
    })
    const json = await res.json()
    return json
  } catch (e) {
    console.error('[API] Error deleting club:', e)
    return { success: false, message: e.message || 'Failed to delete club' }
  }
}

// ================= AUTHENTICATION API =================
export const getAuthToken = () => {
  try {
    return localStorage.getItem('bcf_admin_token') || null
  } catch (e) {
    return null
  }
}

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('bcf_admin_user')
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export const getCurrentUser = () => {
  return getStoredUser()
}

export const isAuthenticated = () => {
  return Boolean(getAuthToken())
}

export const getAuthHeaders = (additionalHeaders = {}) => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...additionalHeaders
  }
}

export const login = async (email, password) => {
  const cleanEmail = email?.trim() || ''
  const cleanPassword = password || ''

  try {
    const res = await apiFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      signal: AbortSignal.timeout(3500)
    })

    const json = await res.json()

    if (res.ok && json.success) {
      localStorage.setItem('bcf_admin_token', json.token)
      localStorage.setItem('bcf_admin_user', JSON.stringify(json.user))
      return { success: true, user: json.user, token: json.token }
    } else {
      return {
        success: false,
        message: json.message || 'Invalid email or password'
      }
    }
  } catch (e) {
    return {
      success: false,
      message: 'Unable to reach authentication server. Please check your connection or credentials.'
    }
  }
}

export const logout = async () => {
  try {
    const token = getAuthToken()
    if (token) {
      await apiFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(1500)
      })
    }
  } catch (e) {
    // Ignore network error on logout
  } finally {
    localStorage.removeItem('bcf_admin_token')
    localStorage.removeItem('bcf_admin_user')
  }
  return { success: true }
}

export const verifyAuth = async () => {
  const token = getAuthToken()
  if (!token || token.startsWith('offline-mock-session-')) {
    localStorage.removeItem('bcf_admin_token')
    localStorage.removeItem('bcf_admin_user')
    return { success: false, user: null }
  }

  try {
    const res = await apiFetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(3000)
    })

    if (res.ok) {
      const json = await res.json()
      if (json.success && json.user) {
        localStorage.setItem('bcf_admin_user', JSON.stringify(json.user))
        return { success: true, user: json.user }
      }
    } else if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('bcf_admin_token')
      localStorage.removeItem('bcf_admin_user')
      return { success: false, user: null }
    }
  } catch (e) {
    // Server is unreachable, trust cached user session
    const cachedUser = getStoredUser()
    if (cachedUser) {
      return { success: true, user: cachedUser, isOffline: true }
    }
  }

  return { success: false, user: null }
}

export const fetchAppConfig = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/config`)
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {}
  return { success: false }
}

// ================= PASSWORD UPDATE API =================
export const updatePassword = async ({ currentPassword, newPassword }) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/auth/update-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    })
    const json = await res.json()
    return json
  } catch (e) {
    console.error('[API] Error updating password:', e)
    return { success: false, message: e.message || 'Failed to update password' }
  }
}

// ================= USERS MANAGEMENT API =================
export const fetchUsers = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    })
    const json = await res.json()
    if (json.success && Array.isArray(json.users)) {
      setStored('users', json.users)
      return json.users
    }
  } catch (e) {
    console.warn('[API] Could not fetch users from server, falling back to local cache...', e)
  }
  return []
}

export const createUser = async (userData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    })
    const json = await res.json()
    if (json.success && json.user) {
      const users = await fetchUsers()
      const updated = [json.user, ...users.filter(u => u.id !== json.user.id)]
      setStored('users', updated)
    }
    return json
  } catch (e) {
    console.error('[API] Error creating user:', e)
    return { success: false, message: e.message || 'Failed to create user' }
  }
}

export const updateUser = async (id, userData) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    })
    const json = await res.json()
    if (json.success && json.user) {
      const users = await fetchUsers()
      const updated = users.map(u => u.id === Number(id) ? json.user : u)
      setStored('users', updated)
    }
    return json
  } catch (e) {
    console.error('[API] Error updating user:', e)
    return { success: false, message: e.message || 'Failed to update user' }
  }
}

export const toggleUserStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
  try {
    const res = await apiFetch(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    })
    const json = await res.json()
    if (json.success) {
      const users = await fetchUsers()
      const updated = users.map(u => u.id === Number(id) ? { ...u, status: newStatus } : u)
      setStored('users', updated)
    }
    return json
  } catch (e) {
    console.error('[API] Error toggling user status:', e)
    return { success: false, message: e.message || 'Failed to update user status' }
  }
}

export const deleteUser = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    const json = await res.json()
    if (json.success) {
      const users = await fetchUsers()
      const updated = users.filter(u => u.id !== Number(id))
      setStored('users', updated)
    }
    return json
  } catch (e) {
    console.error('[API] Error deleting user:', e)
    return { success: false, message: e.message || 'Failed to delete user' }
  }
}

// Safe API JSON parser helper to prevent "Unexpected token < in JSON" crashes
const parseApiResponse = async (res, fallbackMessage = 'Server response error') => {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return await res.json()
    } catch (e) {
      console.warn('JSON parsing error:', e)
    }
  }

  if (res.status === 404) {
    return {
      success: false,
      message: 'Backend endpoint not found (404). Please run "git pull" in cPanel repositories/BCF and restart the Node.js application.'
    }
  }

  return {
    success: false,
    message: `Server returned HTTP ${res.status} (${res.statusText || fallbackMessage}). Please restart backend.`
  }
}

// ================= STORAGE & MEDIA SETTINGS API =================
export const fetchStorageSettings = async () => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/settings/storage`, {
      headers: getAuthHeaders()
    })
    const json = await parseApiResponse(res, 'Could not fetch storage settings')
    if (json && json.success && json.settings) {
      return json.settings
    }
  } catch (e) {
    console.warn('[API] Could not fetch storage settings:', e)
  }
  return {
    enabled: true,
    keyId: '003f1a3b7e63fc10000000002',
    applicationKey: 'K003••••••••TG5Igg',
    region: 'eu-central-003',
    bucket: 'bangladeshcarromcdn',
    endpoint: 'https://s3.eu-central-003.backblazeb2.com',
    cdnUrl: 'https://f003.backblazeb2.com/file/bangladeshcarromcdn'
  }
}

export const updateStorageSettings = async (settings) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/settings/storage`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    })
    return await parseApiResponse(res, 'Failed to update storage settings')
  } catch (e) {
    console.error('[API] Error updating storage settings:', e)
    return { success: false, message: e.message || 'Failed to update storage settings' }
  }
}

export const testStorageConnection = async (settings = {}) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/settings/storage/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    })
    return await parseApiResponse(res, 'Failed to connect to storage server')
  } catch (e) {
    console.error('[API] Error testing storage connection:', e)
    return { success: false, message: e.message || 'Failed to connect to storage server' }
  }
}

// -------------------------------------------------------------
// UMPIRES API
// -------------------------------------------------------------
export const fetchUmpires = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    if (filters.status && filters.status !== 'All') params.append('status', filters.status)
    if (filters.gender && filters.gender !== 'All') params.append('gender', filters.gender)
    if (filters.search) params.append('search', filters.search)

    const url = `${API_BASE_URL}/umpires${params.toString() ? `?${params.toString()}` : ''}`
    const res = await apiFetch(url, { headers: getAuthHeaders() })
    if (res.ok) {
      const json = await res.json()
      return json.data || []
    }
  } catch (e) {
    console.error('[API] Error fetching umpires:', e)
  }
  return []
}

export const fetchUmpire = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/umpires/${id}`, { headers: getAuthHeaders() })
    if (res.ok) {
      const json = await res.json()
      return json.data || null
    }
  } catch (e) {
    console.error('[API] Error fetching umpire detail:', e)
  }
  return null
}

export const createUmpire = async (data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/umpires`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return await parseApiResponse(res, 'Failed to create umpire')
  } catch (e) {
    console.error('[API] Error creating umpire:', e)
    return { success: false, message: e.message || 'Failed to create umpire' }
  }
}

export const updateUmpire = async (id, data) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/umpires/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return await parseApiResponse(res, 'Failed to update umpire')
  } catch (e) {
    console.error('[API] Error updating umpire:', e)
    return { success: false, message: e.message || 'Failed to update umpire' }
  }
}

export const deleteUmpire = async (id) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/umpires/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return await parseApiResponse(res, 'Failed to delete umpire')
  } catch (e) {
    console.error('[API] Error deleting umpire:', e)
    return { success: false, message: e.message || 'Failed to delete umpire' }
  }
}

export const bulkAssignUmpire = async ({ match_ids, umpire_id, umpire_name }) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/matches/bulk-assign-umpire`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ match_ids, umpire_id, umpire_name })
    })
    return await parseApiResponse(res, 'Failed to bulk assign umpire')
  } catch (e) {
    console.error('[API] Error bulk assigning umpire:', e)
    return { success: false, message: e.message || 'Failed to bulk assign umpire' }
  }
}

export const uploadTournamentGallery = async (tournamentId, images, replace_all = false) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/tournaments/${tournamentId}/gallery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ images, replace_all })
    })
    return await parseApiResponse(res, 'Failed to update tournament gallery')
  } catch (e) {
    console.error('[API] Error uploading tournament gallery:', e)
    return { success: false, message: e.message || 'Failed to update tournament gallery' }
  }
}
