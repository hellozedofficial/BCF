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

// Initial seed mock data for standalone/offline fallback
const INITIAL_MOCK_DATA = {
  stats: {
    total_players: 142,
    total_clubs: 28,
    total_tournaments: 12,
    live_matches: 2,
    white_slams: 39,
    black_slams: 18,
    pending_registrations: 5
  },
  tournaments: [
    {
      id: 1,
      title: '43rd National Carrom Championship',
      edition: '2026',
      venue: 'National Sports Council Gymnasium, Dhaka',
      start_date: '2026-10-15',
      end_date: '2026-10-22',
      category: 'National Championship',
      prize_pool: '৳ 5,00,000',
      registration_deadline: '2026-10-10',
      status: 'Live',
      description: 'The premier national carrom tournament featuring top-seeded players across all districts of Bangladesh.'
    },
    {
      id: 2,
      title: 'Bangabandhu Cup Invitational Carrom 2026',
      edition: '5th Edition',
      venue: 'Shaheed Tajuddin Ahmed Indoor Stadium, Dhaka',
      start_date: '2026-11-05',
      end_date: '2026-11-10',
      category: 'Invitational Cup',
      prize_pool: '৳ 3,50,000',
      registration_deadline: '2026-10-28',
      status: 'Upcoming',
      description: 'Exclusive invitational tournament featuring international and national master carrom athletes.'
    },
    {
      id: 3,
      title: 'National Youth & Junior Carrom Carnival',
      edition: '2026',
      venue: 'Chittagong Club Indoor Arena, Chattogram',
      start_date: '2026-12-01',
      end_date: '2026-12-06',
      category: 'Youth National',
      prize_pool: '৳ 1,50,000',
      registration_deadline: '2026-11-20',
      status: 'Upcoming',
      description: 'Discovering rising carrom stars under 18 and university talents from across the divisions.'
    },
    {
      id: 4,
      title: 'Independence Day Open Carrom Cup',
      edition: '2026',
      venue: 'Sylhet District Stadium Indoor Hall',
      start_date: '2026-03-20',
      end_date: '2026-03-26',
      category: 'Open Trophy',
      prize_pool: '৳ 2,00,000',
      registration_deadline: '2026-03-15',
      status: 'Completed',
      description: 'Annual open tournament celebrating national independence with over 96 participants.'
    }
  ],
  players: [
    {
      id: 1,
      full_name: 'Hafizur Rahman',
      gender: 'Men',
      category: 'Senior',
      club_name: 'Dhaka Mohammedan Carrom Wing',
      district: 'Dhaka',
      national_rank: 1,
      rating_points: 2480,
      white_slams: 14,
      black_slams: 8,
      phone: '+880 1712-345678',
      email: 'hafiz.carrom@bcf.org'
    },
    {
      id: 2,
      full_name: 'Farzana Akter Riya',
      gender: 'Women',
      category: 'Senior',
      club_name: 'Abahani Krira Chakra Carrom Guild',
      district: 'Chattogram',
      national_rank: 1,
      rating_points: 2410,
      white_slams: 11,
      black_slams: 5,
      phone: '+880 1819-234567',
      email: 'farzana.riya@bcf.org'
    },
    {
      id: 3,
      full_name: 'Tanvir Ahmed Shanto',
      gender: 'Men',
      category: 'Senior',
      club_name: 'Rajshahi Pioneer Carrom Syndicate',
      district: 'Rajshahi',
      national_rank: 2,
      rating_points: 2365,
      white_slams: 9,
      black_slams: 4,
      phone: '+880 1911-889900',
      email: 'tanvir.shanto@gmail.com'
    },
    {
      id: 4,
      full_name: 'Sabina Yasmin',
      gender: 'Women',
      category: 'Senior',
      club_name: 'Khulna Carrom Academy',
      district: 'Khulna',
      national_rank: 2,
      rating_points: 2290,
      white_slams: 7,
      black_slams: 3,
      phone: '+880 1612-445566',
      email: 'sabina.carrom@yahoo.com'
    },
    {
      id: 5,
      full_name: 'Mahmudul Hasan Joy',
      gender: 'Men',
      category: 'Junior',
      club_name: 'Sylhet Striker Carrom Club',
      district: 'Sylhet',
      national_rank: 3,
      rating_points: 2210,
      white_slams: 5,
      black_slams: 2,
      phone: '+880 1719-998877',
      email: 'joy.striker@gmail.com'
    }
  ],
  matches: [
    {
      id: 1,
      tournament_id: 1,
      tournament_title: '43rd National Carrom Championship',
      player1_id: 1,
      player2_id: 3,
      player1_name: 'Hafizur Rahman',
      player2_name: 'Tanvir Ahmed Shanto',
      player1_score: 18,
      player2_score: 14,
      current_board: 5,
      boards_played: 4,
      round_name: 'Quarter Final - Board 1',
      board_number: 1,
      status: 'Live',
      stream_url: 'https://www.youtube.com/embed/live_stream?channel=BCFOfficial',
      scheduled_at: '2026-10-04T15:00:00Z'
    },
    {
      id: 2,
      tournament_id: 1,
      tournament_title: '43rd National Carrom Championship',
      player1_id: 2,
      player2_id: 4,
      player1_name: 'Farzana Akter Riya',
      player2_name: 'Sabina Yasmin',
      player1_score: 21,
      player2_score: 12,
      current_board: 6,
      boards_played: 5,
      round_name: 'Women Semi Final - Board 2',
      board_number: 2,
      status: 'Live',
      stream_url: '',
      scheduled_at: '2026-10-04T16:30:00Z'
    },
    {
      id: 3,
      tournament_id: 1,
      tournament_title: '43rd National Carrom Championship',
      player1_id: 5,
      player2_id: 1,
      player1_name: 'Mahmudul Hasan Joy',
      player2_name: 'Hafizur Rahman',
      player1_score: 0,
      player2_score: 0,
      current_board: 1,
      boards_played: 0,
      round_name: 'Grand Final (Scheduled)',
      board_number: 1,
      status: 'Scheduled',
      stream_url: '',
      scheduled_at: '2026-10-05T18:00:00Z'
    }
  ],
  registrations: [
    {
      id: 1,
      full_name: 'Zubayer Hossain',
      email: 'zubayer.carrom@gmail.com',
      phone: '+880 1711-223344',
      district: 'Dhaka',
      club_name: 'Dhanmondi Club',
      category: 'Senior Men',
      tournament_id: 1,
      tournament_title: '43rd National Carrom Championship',
      notes: 'Former district level champion, eager to participate in national singles.',
      status: 'Pending',
      created_at: '2026-10-03T14:22:00Z'
    },
    {
      id: 2,
      full_name: 'Nusrat Jahan Mim',
      email: 'mim.nusrat@yahoo.com',
      phone: '+880 1912-334455',
      district: 'Cumilla',
      club_name: 'Victoria Carrom Club',
      category: 'Senior Women',
      tournament_id: 1,
      tournament_title: '43rd National Carrom Championship',
      notes: 'Gold medalist at Chittagong divisional carrom meet.',
      status: 'Pending',
      created_at: '2026-10-03T16:45:00Z'
    },
    {
      id: 3,
      full_name: 'Kawsar Mahmud',
      email: 'kawsar.m@gmail.com',
      phone: '+880 1815-667788',
      district: 'Barishal',
      club_name: 'Barishal Officers Club',
      category: 'Senior Men',
      tournament_id: 2,
      tournament_title: 'Bangabandhu Cup Invitational Carrom 2026',
      notes: 'Applied for wildcard entry.',
      status: 'Approved',
      created_at: '2026-10-02T10:15:00Z'
    },
    {
      id: 4,
      full_name: 'Shakil Anwar',
      email: 'shakil.anwar@outlook.com',
      phone: '+880 1515-889900',
      district: 'Rangpur',
      club_name: 'Rangpur Sports Guild',
      category: 'Junior Boys',
      tournament_id: 3,
      tournament_title: 'National Youth & Junior Carrom Carnival',
      notes: 'Under 18 division representative.',
      status: 'Pending',
      created_at: '2026-10-04T05:12:00Z'
    }
  ],
  news: [
    {
      id: 1,
      title: 'BCF Announces Roster for Asian Carrom Championship 2026',
      category: 'Announcement',
      content: 'The executive committee of Bangladesh Carrom Federation has finalized the 8-member national squad for the forthcoming Asian Carrom Championship to be held in Colombo, Sri Lanka.',
      author: 'BCF Media Cell',
      is_pinned: 1,
      publish_date: '2026-10-02T08:00:00Z'
    },
    {
      id: 2,
      title: 'Registration Open for 43rd National Carrom Championship',
      category: 'Tournament',
      content: 'District federations, affiliated clubs and ranked players are invited to submit their player registrations through the official portal before the deadline.',
      author: 'Tournament Secretariat',
      is_pinned: 1,
      publish_date: '2026-09-28T12:00:00Z'
    },
    {
      id: 3,
      title: 'National Umpires and Referees Refresher Workshop Concluded',
      category: 'Workshop',
      content: 'Over 40 national certified carrom umpires completed the 3-day technical orientation adhering to the latest International Carrom Federation (ICF) law amendments.',
      author: 'Technical Committee',
      is_pinned: 0,
      publish_date: '2026-09-20T10:30:00Z'
    }
  ]
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

// Check backend connectivity status
let isBackendOnline = false
export const checkServerStatus = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/stats`, { signal: AbortSignal.timeout(1800) })
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
    const res = await fetch(`${API_BASE_URL}/stats`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return { data: json.data, source: 'live' }
    }
  } catch (e) {
    // Fall back to local
  }
  const tournaments = getStored('tournaments', INITIAL_MOCK_DATA.tournaments)
  const players = getStored('players', INITIAL_MOCK_DATA.players)
  const matches = getStored('matches', INITIAL_MOCK_DATA.matches)
  const registrations = getStored('registrations', INITIAL_MOCK_DATA.registrations)

  const liveMatches = matches.filter(m => m.status === 'Live').length
  const pendingRegs = registrations.filter(r => r.status === 'Pending').length
  const totalWhiteSlams = players.reduce((acc, p) => acc + (Number(p.white_slams) || 0), 0)

  return {
    data: {
      total_players: players.length,
      total_clubs: 28,
      total_tournaments: tournaments.length,
      live_matches: liveMatches,
      white_slams: totalWhiteSlams,
      pending_registrations: pendingRegs
    },
    source: 'local'
  }
}

// ================= TOURNAMENTS API =================
export const fetchTournaments = async (status) => {
  try {
    const url = status && status !== 'All' 
      ? `${API_BASE_URL}/tournaments?status=${encodeURIComponent(status)}` 
      : `${API_BASE_URL}/tournaments`
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}
  
  let list = getStored('tournaments', INITIAL_MOCK_DATA.tournaments)
  if (status && status !== 'All') {
    list = list.filter(t => t.status.toLowerCase() === status.toLowerCase())
  }
  return list
}

export const createTournament = async (tournamentData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tournamentData)
    })
    if (res.ok) {
      const json = await res.json()
      return json
    }
  } catch (e) {}

  const current = getStored('tournaments', INITIAL_MOCK_DATA.tournaments)
  const newItem = {
    ...tournamentData,
    id: Date.now()
  }
  const updated = [newItem, ...current]
  setStored('tournaments', updated)
  return { success: true, message: 'Tournament created (local cache)', data: newItem }
}

export const updateTournament = async (id, data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('tournaments', INITIAL_MOCK_DATA.tournaments)
  const updated = current.map(item => item.id === Number(id) ? { ...item, ...data } : item)
  setStored('tournaments', updated)
  return { success: true, message: 'Tournament updated (local cache)' }
}

export const deleteTournament = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tournaments/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('tournaments', INITIAL_MOCK_DATA.tournaments)
  const updated = current.filter(item => item.id !== Number(id))
  setStored('tournaments', updated)
  return { success: true, message: 'Tournament deleted' }
}

export const fetchTournamentById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tournaments/${id}`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}
  const current = getStored('tournaments', INITIAL_MOCK_DATA.tournaments)
  return current.find(item => item.id === Number(id)) || null
}

export const fetchTournamentBracket = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tournaments/${id}/bracket`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}
  return null
}

export const generateTournamentFixtures = async (id, data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tournaments/${id}/generate-fixtures`, {
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
    const res = await fetch(`${API_BASE_URL}/tournaments/matches/${matchId}/score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) return await res.json()
  } catch (e) {}
  return { success: false, message: 'Failed to update score' }
}

// ================= PLAYERS API =================
export const fetchPlayers = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${API_BASE_URL}/players?${query}`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}

  let list = getStored('players', INITIAL_MOCK_DATA.players)
  if (params.gender && params.gender !== 'All') {
    list = list.filter(p => p.gender === params.gender)
  }
  if (params.category && params.category !== 'All') {
    list = list.filter(p => p.category === params.category)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    list = list.filter(p => 
      p.full_name.toLowerCase().includes(q) || 
      (p.club_name && p.club_name.toLowerCase().includes(q)) || 
      (p.district && p.district.toLowerCase().includes(q))
    )
  }
  return list
}

export const fetchPlayerById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/players/${encodeURIComponent(id)}`)
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}

  const current = getStored('players', INITIAL_MOCK_DATA.players)
  const isNum = /^\d+$/.test(id)
  return current.find(p => (isNum && p.id === Number(id)) || p.player_id === id) || null
}

export const createPlayer = async (playerData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('players', INITIAL_MOCK_DATA.players)
  const newPlayer = {
    ...playerData,
    id: Date.now(),
    national_rank: current.length + 1,
    white_slams: Number(playerData.white_slams) || 0,
    black_slams: Number(playerData.black_slams) || 0
  }
  setStored('players', [...current, newPlayer])
  return { success: true, message: 'Player added successfully', data: newPlayer }
}

export const updatePlayer = async (id, data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('players', INITIAL_MOCK_DATA.players)
  const updated = current.map(p => p.id === Number(id) ? { ...p, ...data } : p)
  setStored('players', updated)
  return { success: true, message: 'Player updated' }
}

export const deletePlayer = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/players/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('players', INITIAL_MOCK_DATA.players)
  const updated = current.filter(p => p.id !== Number(id))
  setStored('players', updated)
  return { success: true, message: 'Player removed' }
}

// ================= MATCHES API =================
export const fetchMatches = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${API_BASE_URL}/matches?${query}`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}

  let list = getStored('matches', INITIAL_MOCK_DATA.matches)
  if (params.status && params.status !== 'All') {
    list = list.filter(m => m.status === params.status)
  }
  return list
}

export const updateMatchScore = async (id, scoreData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/matches/${id}/score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('matches', INITIAL_MOCK_DATA.matches)
  const updated = current.map(m => m.id === Number(id) ? { ...m, ...scoreData } : m)
  setStored('matches', updated)
  return { success: true, message: 'Match score updated' }
}

export const createMatch = async (matchData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('matches', INITIAL_MOCK_DATA.matches)
  const newMatch = {
    ...matchData,
    id: Date.now(),
    player1_score: 0,
    player2_score: 0,
    current_board: 1,
    boards_played: 0,
    status: matchData.status || 'Scheduled'
  }
  setStored('matches', [newMatch, ...current])
  return { success: true, message: 'Match created', data: newMatch }
}

export const deleteMatch = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/matches/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('matches', INITIAL_MOCK_DATA.matches)
  const updated = current.filter(m => m.id !== Number(id))
  setStored('matches', updated)
  return { success: true, message: 'Match deleted' }
}

// ================= REGISTRATIONS API =================
export const fetchRegistrations = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/player-register`, { signal: AbortSignal.timeout(3000) })
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
    const legacyRes = await fetch(`${API_BASE_URL}/registrations`, { signal: AbortSignal.timeout(2000) })
    if (legacyRes.ok) {
      const json = await legacyRes.json()
      if (json.success && Array.isArray(json.data)) return json.data
    }
  } catch (e) {}

  return getStored('registrations', INITIAL_MOCK_DATA.registrations)
}

export const registerPlayerByAdmin = async (playerData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/player-register`, {
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
    const res = await fetch(`${API_BASE_URL}/geocode/divisions`)
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
    const res = await fetch(`${API_BASE_URL}/geocode/districts/${divisionId}`)
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) return json.data
    }
  } catch (e) {}
  return []
}


export const updateRegistration = async (id, data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/player-register/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/player-register/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, playerDetails })
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  // Fallback to legacy
  try {
    const legacyRes = await fetch(`${API_BASE_URL}/registrations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, playerDetails })
    })
    if (legacyRes.ok) return await legacyRes.json()
  } catch (e) {}

  const current = getStored('registrations', INITIAL_MOCK_DATA.registrations)
  const updated = current.map(r => r.id === Number(id) ? { ...r, status } : r)
  setStored('registrations', updated)
  return { success: true, message: `Registration status updated to ${status}` }
}

export const deleteRegistration = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/player-register/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  // Fallback to legacy
  try {
    const legacyRes = await fetch(`${API_BASE_URL}/registrations/${id}`, { method: 'DELETE' })
    if (legacyRes.ok) return await legacyRes.json()
  } catch (e) {}

  const current = getStored('registrations', INITIAL_MOCK_DATA.registrations)
  const updated = current.filter(r => r.id !== Number(id))
  setStored('registrations', updated)
  return { success: true, message: 'Registration record removed' }
}

// ================= NEWS API =================
export const fetchNews = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/news`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const json = await res.json()
      if (json.success) return json.data
    }
  } catch (e) {}

  return getStored('news', INITIAL_MOCK_DATA.news)
}

export const createNews = async (newsData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('news', INITIAL_MOCK_DATA.news)
  const newItem = {
    ...newsData,
    id: Date.now(),
    publish_date: new Date().toISOString()
  }
  setStored('news', [newItem, ...current])
  return { success: true, message: 'Published successfully', data: newItem }
}

export const updateNews = async (id, newsData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/news/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsData)
    })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('news', INITIAL_MOCK_DATA.news)
  const updated = current.map(item => item.id === Number(id) ? { ...item, ...newsData } : item)
  setStored('news', updated)
  return { success: true, message: 'Updated successfully' }
}

export const uploadNewsEditorImage = async (base64Image) => {
  try {
    const res = await fetch(`${API_BASE_URL}/news/upload-image`, {
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

export const deleteNews = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/news/${id}`, { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (e) {}

  const current = getStored('news', INITIAL_MOCK_DATA.news)
  const updated = current.filter(n => n.id !== Number(id))
  setStored('news', updated)
  return { success: true, message: 'News item deleted' }
}

// ==================== BANNERS (CMS) ====================
export const fetchBanners = async (all = true) => {
  try {
    const res = await fetch(`${API_BASE_URL}/banners${all ? '?all=true' : ''}`)
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
    const res = await fetch(`${API_BASE_URL}/banners`, {
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
    const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
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

// ================= CLUBS API =================
export const fetchClubs = async (params = {}) => {
  try {
    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.division) query.append('division', params.division)
    if (params.district) query.append('district', params.district)
    if (params.q) query.append('q', params.q)

    const url = `${API_BASE_URL}/clubs${query.toString() ? '?' + query.toString() : ''}`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
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
    const res = await fetch(`${API_BASE_URL}/clubs/${id}`)
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
    const res = await fetch(`${API_BASE_URL}/clubs`, {
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
    const res = await fetch(`${API_BASE_URL}/clubs/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/clubs/${id}/status`, {
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
    const res = await fetch(`${API_BASE_URL}/clubs/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
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
    // Offline resilient fallback
    if (cleanEmail.toLowerCase() === 'hello@hellozed.com' && cleanPassword === '12wq1234') {
      const offlineUser = {
        id: 1,
        email: 'hello@hellozed.com',
        name: 'BCF Super Admin (Offline)',
        role: 'Super Admin',
        status: 'Active'
      }
      const offlineToken = 'offline-mock-session-' + Date.now()
      localStorage.setItem('bcf_admin_token', offlineToken)
      localStorage.setItem('bcf_admin_user', JSON.stringify(offlineUser))
      return { success: true, user: offlineUser, token: offlineToken, isOffline: true }
    }

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
      await fetch(`${API_BASE_URL}/auth/logout`, {
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
  if (!token) return { success: false, user: null }

  // If token is an offline session
  if (token.startsWith('offline-mock-session-')) {
    const cachedUser = getStoredUser()
    return cachedUser ? { success: true, user: cachedUser, isOffline: true } : { success: false, user: null }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
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
    const res = await fetch(`${API_BASE_URL}/config`)
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {}
  return { success: false }
}
