// =====================================================
// EKAIDAN — site.js
// Shared Supabase client used by admin + player pages
// =====================================================

const SUPABASE_URL  = 'https://biycswigcsyrehqvgffk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeWNzd2lnY3N5cmVocXZnZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDg2MzcsImV4cCI6MjA5MzcyNDYzN30.EDqEvza14bOJqNfmquIpqVeTAGVLLnyd7Jlim7xcM-4';

const DB = {

  /* ── low-level fetch wrapper ── */
  async _req(path, options = {}) {
    const { prefer, headers: extraHeaders, ...fetchOptions } = options;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey':        SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type':  'application/json',
        'Prefer':        prefer || 'return=representation',
        ...extraHeaders
      },
      ...fetchOptions
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error (${res.status}): ${err}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  },

  /* ══ SCENES ══ */
  getScenes()          { return this._req('scenes?order=created_at.desc'); },
  insertScene(scene)   { return this._req('scenes', { method: 'POST', body: JSON.stringify(scene) }); },
  updateScene(id, patch) { return this._req(`scenes?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); },
  deleteScene(id)      { return this._req(`scenes?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' }); },

  /* ══ SONGS ══ */
  getSongs()           { return this._req('songs?order=created_at.desc'); },
  insertSong(song)     { return this._req('songs', { method: 'POST', body: JSON.stringify(song) }); },
  updateSong(id, patch){ return this._req(`songs?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); },
  deleteSong(id)       { return this._req(`songs?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' }); }
};
