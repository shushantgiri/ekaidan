// =====================================================
// EKAIDAN — site.js  (v3 — single source of truth)
// Drop this file as "site.js" and delete site_js.js
// =====================================================

const SUPABASE_URL  = 'https://biycswigcsyrehqvgffk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeWNzd2lnY3N5cmVocXZnZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDg2MzcsImV4cCI6MjA5MzcyNDYzN30.EDqEvza14bOJqNfmquIpqVeTAGVLLnyd7Jlim7xcM-4';

// ── AUTH ──────────────────────────────────────────
const AUTH = {
  _base: `${SUPABASE_URL}/auth/v1`,

  async signUp(email, password) {
    const r = await fetch(`${this._base}/signup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },

  async signIn(email, password) {
    const r = await fetch(`${this._base}/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },

  async signOut() {
    const session = this.getSession();
    if (session?.access_token) {
      await fetch(`${this._base}/logout`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${session.access_token}` }
      });
    }
    sessionStorage.removeItem('ekaidan_session');
    sessionStorage.removeItem('ekaidan_user');
    sessionStorage.removeItem('ekaidan_profile');
  },

  async resetPassword(email) {
    return fetch(`${this._base}/recover`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  getSession()    { try { return JSON.parse(sessionStorage.getItem('ekaidan_session')); } catch { return null; } },
  currentUser()   { try { return JSON.parse(sessionStorage.getItem('ekaidan_user'));    } catch { return null; } },
  currentProfile(){ try { return JSON.parse(sessionStorage.getItem('ekaidan_profile')); } catch { return null; } },
  token()         { return this.getSession()?.access_token || SUPABASE_ANON; },

  // Redirect to login if not signed in. Pass the current page path so we return after login.
  requireAuth(redirectAfter) {
    if (!this.currentUser()) {
      sessionStorage.setItem('auth_redirect', redirectAfter || location.pathname);
      window.location.href = 'auth_page.html';
      return false;
    }
    return true;
  },

  isLoggedIn() { return !!this.currentUser(); }
};

// ── DB ────────────────────────────────────────────
const DB = {

  async _req(path, options = {}) {
    const { prefer, headers: extraHeaders, ...fetchOptions } = options;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey:        SUPABASE_ANON,
        Authorization: `Bearer ${AUTH.token()}`,
        'Content-Type':'application/json',
        Prefer:        prefer || 'return=representation',
        ...extraHeaders
      },
      ...fetchOptions
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`DB ${res.status}: ${e}`); }
    const txt = await res.text();
    return txt ? JSON.parse(txt) : [];
  },

  // ── Scenes ──
  getScenes()            { return this._req('scenes?order=created_at.desc'); },
  getLiveScenes()        { return this._req('scenes?status=eq.Live&order=created_at.desc'); },
  insertScene(s)         { return this._req('scenes', { method:'POST', body: JSON.stringify(s) }); },
  updateScene(id, patch) { return this._req(`scenes?id=eq.${id}`, { method:'PATCH', body: JSON.stringify(patch) }); },
  deleteScene(id)        { return this._req(`scenes?id=eq.${id}`, { method:'DELETE', prefer:'return=minimal' }); },

  // ── Songs ──
  getSongs()             { return this._req('songs?order=created_at.desc'); },
  getLiveSongs()         { return this._req('songs?status=eq.Live&order=created_at.desc'); },
  insertSong(s)          { return this._req('songs', { method:'POST', body: JSON.stringify(s) }); },
  updateSong(id, patch)  { return this._req(`songs?id=eq.${id}`, { method:'PATCH', body: JSON.stringify(patch) }); },
  deleteSong(id)         { return this._req(`songs?id=eq.${id}`, { method:'DELETE', prefer:'return=minimal' }); },

  // ── Profiles ──
  getProfile(uid)        { return this._req(`profiles?id=eq.${uid}`).then(r => r[0] || null); },
  getUserByUsername(u)   { return this._req(`profiles?username=eq.${encodeURIComponent(u)}&select=id,username`); },
  insertProfile(p)       { return this._req('profiles', { method:'POST', body: JSON.stringify(p) }); },
  updateProfile(uid, p)  { return this._req(`profiles?id=eq.${uid}`, { method:'PATCH', body: JSON.stringify(p) }); },
  getLeaderboard(n=10)   { return this._req(`profiles?select=username,xp,level,streak&order=xp.desc&limit=${n}`); },

  // ── Challenges ──
  getChallenges()        { return this._req('challenges?status=eq.Live&order=created_at.desc'); },
  insertChallenge(ch)    { return this._req('challenges', { method:'POST', body: JSON.stringify(ch) }); },
  updateChallenge(id, p) { return this._req(`challenges?id=eq.${id}`, { method:'PATCH', body: JSON.stringify(p) }); },
  deleteChallenge(id)    { return this._req(`challenges?id=eq.${id}`, { method:'DELETE', prefer:'return=minimal' }); },
  getAllChallenges()      { return this._req('challenges?order=created_at.desc'); },

  // ── XP ──
  async awardXP(userId, amount) {
    const profile = await this.getProfile(userId);
    if (!profile) return;
    const newXP    = (profile.xp || 0) + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    await this.updateProfile(userId, { xp: newXP, level: newLevel });
    const updated = { ...profile, xp: newXP, level: newLevel };
    sessionStorage.setItem('ekaidan_profile', JSON.stringify(updated));
    return updated;
  }
};
