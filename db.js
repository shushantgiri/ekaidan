// =====================================================
// EKAIDAN — db.js  (shared Supabase layer)
// Paste your Supabase URL + anon key below OR enter
// them in Settings → Database & Integrations and
// they'll be saved to localStorage automatically.
// =====================================================

const SUPABASE_URL_KEY = 'ek_supa_url';
const SUPABASE_ANON_KEY = 'ek_supa_key';

/* ── resolve credentials ─────────────────────────── */
function _url() { return localStorage.getItem(SUPABASE_URL_KEY) || ''; }
function _key() { return localStorage.getItem(SUPABASE_ANON_KEY) || ''; }

function _headers() {
    return {
        'Content-Type': 'application/json',
        'apikey': _key(),
        'Authorization': 'Bearer ' + _key(),
        'Prefer': 'return=representation'
    };
}

async function _rpc(path, method = 'GET', body = null) {
    const base = _url().replace(/\/$/, '');
    if (!base || !_key()) throw new Error('Supabase credentials not set. Go to Settings → Database & Integrations.');
    const res = await fetch(base + '/rest/v1/' + path, {
        method,
        headers: _headers(),
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : [];
    if (!res.ok) throw new Error((json && json.message) || res.statusText);
    return json;
}

/* ── SCENES ──────────────────────────────────────── */
const DB = {
    saveCredentials(url, key) {
        localStorage.setItem(SUPABASE_URL_KEY, url.trim());
        localStorage.setItem(SUPABASE_ANON_KEY, key.trim());
    },

    // ── Scenes ──
    async getScenes(onlyLive = false) {
        const filter = onlyLive ? '?status=eq.Live&order=created_at.desc' : '?order=created_at.desc';
        return _rpc('scenes' + filter);
    },
    async insertScene(data) {
        // map from admin form fields → DB columns
        const row = {
            title: data.title || null,
            movie: data.movie || null,
            video_url: data.video_url || null,
            status: data.status || 'Live',
            xp: Number(data.xp) || 0
        };
        return _rpc('scenes', 'POST', row);
    },
    async updateScene(id, patch) {
        return _rpc('scenes?id=eq.' + id, 'PATCH', patch);
    },
    async deleteScene(id) {
        return _rpc('scenes?id=eq.' + id, 'DELETE');
    },

    // ── Songs ──
    async getSongs(onlyLive = false) {
        const filter = onlyLive ? '?status=eq.Live&order=created_at.desc' : '?order=created_at.desc';
        return _rpc('songs' + filter);
    },
    async insertSong(data) {
        const row = {
            title: data.title || null,
            artist: data.artist || null,
            video_url: data.video_url || null,   // YouTube URL stored here
            status: data.status || 'Live',
            xp: Number(data.xp) || 0,
            // extra columns – add these to your Supabase table via SQL below
            difficulty: data.difficulty || 'Beginner',
            lyrics: data.lyrics || [],      // text[]
            vocab: data.vocab || null,
            youtube_id: data.youtube_id || null
        };
        return _rpc('songs', 'POST', row);
    },
    async updateSong(id, patch) {
        return _rpc('songs?id=eq.' + id, 'PATCH', patch);
    },
    async deleteSong(id) {
        return _rpc('songs?id=eq.' + id, 'DELETE');
    },

    // ── Challenges ──
    async getChallenges(onlyLive = false) {
        const filter = onlyLive ? '?status=eq.Live&order=created_at.desc' : '?order=created_at.desc';
        return _rpc('challenges' + filter);
    },
    async insertChallenge(data) {
        const row = {
            type: data.type || 'lyrics',
            source: data.source || null,
            sentence: data.sentence || null,
            answer: data.answer || null,
            distractors: data.distractors || [],
            translation: data.translation || null,
            explanation: data.explanation || null,
            status: data.status || 'Live'
        };
        return _rpc('challenges', 'POST', row);
    },

    // ── Leaderboard (placeholder – wire to your users table) ──
    async getLeaderboard(limit = 20) {
        // If you have a profiles / users table, swap this
        return [];
    }
};

/* ── wire Settings form save ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Pre-fill Settings fields from localStorage
    const urlEl = document.getElementById('cfg-supa-url');
    const keyEl = document.getElementById('cfg-supa-key');
    if (urlEl) urlEl.value = _url();
    if (keyEl) keyEl.value = _key();

    // Intercept the "Save Integrations" button
    document.querySelectorAll('[onclick*="Integration"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            const url = document.getElementById('cfg-supa-url')?.value?.trim();
            const key = document.getElementById('cfg-supa-key')?.value?.trim();
            if (!url || !key) { alert('Please enter both Supabase URL and Anon Key.'); return; }
            DB.saveCredentials(url, key);
            if (typeof showToast === 'function') showToast('Supabase credentials saved ✓');
        }, true);
    });
});