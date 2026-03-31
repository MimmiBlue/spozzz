import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const auth = {
  signUp: (email, password, username) =>
    supabase.auth.signUp({ email, password, options: { data: { username } } }),
  signIn: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser(),
  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb)
}

// ─── ENRICH: adds like_count, save_count, user_liked, user_saved ─────────────
async function enrichSpots(rawSpots, userId) {
  if (!rawSpots?.length) return []
  const ids = rawSpots.map(s => s.id)
  const [likesRes, savesRes, userLikesRes, userSavesRes] = await Promise.all([
    supabase.from('likes').select('spot_id').in('spot_id', ids),
    supabase.from('saves').select('spot_id').in('spot_id', ids),
    userId ? supabase.from('likes').select('spot_id').in('spot_id', ids).eq('user_id', userId) : { data: [] },
    userId ? supabase.from('saves').select('spot_id').in('spot_id', ids).eq('user_id', userId) : { data: [] },
  ])
  const likeMap  = {}; (likesRes.data  || []).forEach(r => { likeMap[r.spot_id]  = (likeMap[r.spot_id]  || 0) + 1 })
  const saveMap  = {}; (savesRes.data  || []).forEach(r => { saveMap[r.spot_id]  = (saveMap[r.spot_id]  || 0) + 1 })
  const likedSet = new Set((userLikesRes.data || []).map(r => r.spot_id))
  const savedSet = new Set((userSavesRes.data || []).map(r => r.spot_id))
  return rawSpots.map(s => ({
    ...s,
    like_count:  likeMap[s.id]   || 0,
    save_count:  saveMap[s.id]   || 0,
    user_liked:  likedSet.has(s.id),
    user_saved:  savedSet.has(s.id),
  }))
}

// ─── IMAGE RESIZE (compress before upload) ────────────────────────────────────
function resizeImage(file, maxWidth = 1200) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale  = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = img.width  * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob) }, 'image/jpeg', 0.82)
    }
    img.src = url
  })
}

// ─── SPOTS ───────────────────────────────────────────────────────────────────
export const spots = {

  getNearby: async (userId, category = null) => {
    let q = supabase
      .from('spots')
      .select('*, profiles(id, username, avatar_url)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20)
    if (category) q = q.eq('category', category)
    const { data, error } = await q
    if (error) return { data: [], error }
    return { data: await enrichSpots(data, userId), error: null }
  },

  // ✅ FIXED: two-step query — first get following IDs, then their spots
  getFriendsSpots: async (userId, category = null) => {
    const { data: followRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
    if (!followRows?.length) return { data: [], error: null }
    const followingIds = followRows.map(f => f.following_id)
    let q = supabase
      .from('spots')
      .select('*, profiles(id, username, avatar_url)')
      .in('author_id', followingIds)
      .in('visibility', ['public', 'friends'])
      .order('created_at', { ascending: false })
      .limit(50)
    if (category) q = q.eq('category', category)
    const { data, error } = await q
    if (error) return { data: [], error }
    return { data: await enrichSpots(data, userId), error: null }
  },

  getMySpots: async (userId) => {
    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
    if (error) return { data: [], error }
    return { data: await enrichSpots(data, userId), error: null }
  },

  getById: async (id, userId) => {
    const { data, error } = await supabase
      .from('spots')
      .select('*, profiles(id, username, avatar_url, bio)')
      .eq('id', id)
      .single()
    if (error || !data) return { data: null, error }
    const enriched = await enrichSpots([data], userId)
    return { data: enriched[0], error: null }
  },

  getUserSpots: async (authorId, viewerId) => {
    const { data, error } = await supabase
      .from('spots')
      .select('*, profiles(id, username, avatar_url)')
      .eq('author_id', authorId)
      .in('visibility', ['public', 'friends'])
      .order('created_at', { ascending: false })
    if (error) return { data: [], error }
    return { data: await enrichSpots(data, viewerId), error: null }
  },

  create: async (spotData) =>
    supabase.from('spots').insert(spotData).select().single(),

  update: async (id, updates) =>
    supabase.from('spots').update(updates).eq('id', id).select().single(),

  delete: async (id) =>
    supabase.from('spots').delete().eq('id', id),

  uploadPhoto: async (file, userId) => {
    const resized = await resizeImage(file, 1200)
    const path = `${userId}/${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('spot-photos')
      .upload(path, resized, { contentType: 'image/jpeg' })
    if (error) return { url: null, error }
    const { data: { publicUrl } } = supabase.storage.from('spot-photos').getPublicUrl(path)
    return { url: publicUrl, error: null }
  }
}

// ─── LIKES ───────────────────────────────────────────────────────────────────
export const likes = {
  toggle: async (userId, spotId) => {
    const { data: existing } = await supabase
      .from('likes').select('id').eq('user_id', userId).eq('spot_id', spotId).single()
    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id)
      return { liked: false }
    }
    await supabase.from('likes').insert({ user_id: userId, spot_id: spotId })
    return { liked: true }
  }
}

// ─── SAVES ───────────────────────────────────────────────────────────────────
export const saves = {
  toggle: async (userId, spotId) => {
    const { data: existing } = await supabase
      .from('saves').select('id').eq('user_id', userId).eq('spot_id', spotId).single()
    if (existing) {
      await supabase.from('saves').delete().eq('id', existing.id)
      return { saved: false }
    }
    await supabase.from('saves').insert({ user_id: userId, spot_id: spotId })
    return { saved: true }
  },
  getSavedSpots: async (userId) => {
    const { data, error } = await supabase
      .from('saves')
      .select('spot_id, spots(*, profiles(id, username, avatar_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) return { data: [], error }
    const rawSpots = (data || []).map(d => d.spots).filter(Boolean)
    const enriched = await enrichSpots(rawSpots, userId)
    return { data: enriched.map(s => ({ ...s, user_saved: true })), error: null }
  }
}

// ─── FOLLOWS ─────────────────────────────────────────────────────────────────
export const follows = {
  toggle: async (followerId, followingId) => {
    const { data: existing } = await supabase
      .from('follows').select('id')
      .eq('follower_id', followerId).eq('following_id', followingId).single()
    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id)
      return { following: false }
    }
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
    return { following: true }
  },
  isFollowing: async (followerId, followingId) => {
    const { data } = await supabase
      .from('follows').select('id')
      .eq('follower_id', followerId).eq('following_id', followingId).single()
    return !!data
  },
  getFollowing: async (userId) =>
    supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url, bio)')
      .eq('follower_id', userId),
  getFollowers: async (userId) =>
    supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, bio)')
      .eq('following_id', userId)
}

// ─── FRIEND REQUESTS ─────────────────────────────────────────────────────────
export const friendRequests = {
  send: async (fromId, toId) =>
    supabase.from('friend_requests').insert({ from_id: fromId, to_id: toId, status: 'pending' }),
  accept: async (requestId) =>
    supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId),
  decline: async (requestId) =>
    supabase.from('friend_requests').delete().eq('id', requestId),
  getPending: async (userId) =>
    supabase
      .from('friend_requests')
      .select('id, from_id, profiles!friend_requests_from_id_fkey(id, username, avatar_url, bio)')
      .eq('to_id', userId).eq('status', 'pending'),
  getSent: async (userId) =>
    supabase.from('friend_requests').select('to_id, status').eq('from_id', userId)
}

// ─── PROFILES ────────────────────────────────────────────────────────────────
export const profiles = {
  get: async (userId) =>
    supabase.from('profiles').select('*').eq('id', userId).single(),
  update: async (userId, updates) =>
    supabase.from('profiles').update(updates).eq('id', userId),
  searchByEmail: async (email) =>
    supabase.from('profiles').select('id, username, avatar_url, bio, email')
      .ilike('email', `%${email}%`).limit(10),
  getStats: async (userId) => {
    const [spotsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('spots').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    return {
      spots:     spotsRes.count     || 0,
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
    }
  }
}
