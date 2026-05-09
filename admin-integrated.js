// =====================================================
// EKAIDAN — admin-integrated.js  (rewrite)
// Requires db.js loaded BEFORE this file.
// =====================================================

/* ══ PILL HELPERS ══════════════════════════════════ */
function levelPill(level) {
  const map = { Beginner: 'pill-blue', Intermediate: 'pill-amber', Advanced: 'pill-red' };
  return `<span class="pill ${map[level] || 'pill-violet'}">${level || '—'}</span>`;
}
function statusPill(s) {
  return s === 'Live'
    ? `<span class="pill pill-green"><i class="ti ti-circle-check"></i>Live</span>`
    : `<span class="pill pill-amber"><i class="ti ti-clock"></i>Draft</span>`;
}

/* ══ TOAST (safe wrapper) ══════════════════════════ */
let _toastTimer;
function showToast(msg = 'Done.') {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  if (!t || !m) return;
  m.textContent = msg;
  t.style.display = 'flex';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3400);
}

/* ══ RENDER SCENES TABLE ═══════════════════════════ */
async function renderScenes() {
  const tbody = document.getElementById('scenes-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px;font-family:var(--mono)">Loading scenes…</td></tr>`;

  try {
    const scenes = await DB.getScenes();
    tbody.innerHTML = '';

    if (!scenes.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px;font-family:var(--mono)">No scenes yet — add one above ↑</td></tr>`;
      document.getElementById('scenes-count').textContent = '0';
      return;
    }

    scenes.forEach(scene => {
      const tr = document.createElement('tr');
      tr.dataset.level = scene.level || 'Beginner';
      tr.dataset.status = scene.status || 'Live';
      tr.dataset.id = scene.id;

      // derive level from movie field if missing (fallback)
      const lvl = scene.level || 'Beginner';

      tr.innerHTML = `
        <td class="td-primary">${escHtml(scene.title || '—')}</td>
        <td class="td-secondary">${escHtml(scene.movie || '—')}</td>
        <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">—</td>
        <td>${levelPill(lvl)}</td>
        <td style="font-family:var(--mono);font-size:12px">${scene.xp || 0}</td>
        <td>${statusPill(scene.status)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-action="edit-scene" data-id="${scene.id}" title="Edit"><i class="ti ti-edit"></i></button>
            <button class="icon-btn danger" data-action="del-scene" data-id="${scene.id}" title="Delete"><i class="ti ti-trash"></i></button>
            <button class="icon-btn" data-action="toggle-scene" data-id="${scene.id}" data-status="${scene.status}" title="Toggle status"><i class="ti ti-toggle-right"></i></button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    const el = document.getElementById('scenes-count');
    if (el) el.textContent = scenes.length;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red);padding:16px;font-family:var(--mono)">⚠ ${escHtml(e.message)}</td></tr>`;
  }
}

/* ══ RENDER SONGS TABLE ════════════════════════════ */
async function renderSongs() {
  const tbody = document.getElementById('songs-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px;font-family:var(--mono)">Loading songs…</td></tr>`;

  try {
    const songs = await DB.getSongs();
    tbody.innerHTML = '';

    if (!songs.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px;font-family:var(--mono)">No songs yet — add one above ↑</td></tr>`;
      document.getElementById('songs-count').textContent = '0';
      return;
    }

    songs.forEach(song => {
      const level = song.difficulty || 'Beginner';
      const status = song.status || 'Live';
      const tr = document.createElement('tr');
      tr.dataset.level = level;
      tr.dataset.id = song.id;

      tr.innerHTML = `
        <td class="td-primary">${escHtml(song.title || '—')}</td>
        <td class="td-secondary">${escHtml(song.artist || '—')}</td>
        <td>${levelPill(level)}</td>
        <td style="font-family:var(--mono);font-size:12px">${song.xp || 0}</td>
        <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">—</td>
        <td>${statusPill(status)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-action="edit-song" data-id="${song.id}" title="Edit"><i class="ti ti-edit"></i></button>
            <button class="icon-btn danger" data-action="del-song" data-id="${song.id}" title="Delete"><i class="ti ti-trash"></i></button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    const el = document.getElementById('songs-count');
    if (el) el.textContent = songs.length;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red);padding:16px;font-family:var(--mono)">⚠ ${escHtml(e.message)}</td></tr>`;
  }
}

/* ══ TABLE ACTION DELEGATION ═══════════════════════ */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'del-scene') {
    if (!confirm('Delete this scene permanently?')) return;
    try { await DB.deleteScene(id); await renderScenes(); showToast('Scene deleted.'); }
    catch (err) { showToast('Error: ' + err.message); }
  }

  if (action === 'del-song') {
    if (!confirm('Delete this song permanently?')) return;
    try { await DB.deleteSong(id); await renderSongs(); showToast('Song deleted.'); }
    catch (err) { showToast('Error: ' + err.message); }
  }

  if (action === 'toggle-scene') {
    const newStatus = btn.dataset.status === 'Live' ? 'Draft' : 'Live';
    try {
      await DB.updateScene(id, { status: newStatus });
      await renderScenes();
      showToast(`Status → ${newStatus}`);
    } catch (err) { showToast('Error: ' + err.message); }
  }

  if (action === 'edit-scene') {
    try {
      const scenes = await DB.getScenes();
      const scene = scenes.find(s => s.id === id);
      if (!scene) return;
      _editId = id;
      _editType = 'scene';
      openEditModal('scene', scene.title, scene.movie, scene.xp, scene.level || 'Beginner', scene.status);
    } catch (err) { showToast('Error: ' + err.message); }
  }

  if (action === 'edit-song') {
    try {
      const songs = await DB.getSongs();
      const song = songs.find(s => s.id === id);
      if (!song) return;
      _editId = id;
      _editType = 'song';
      openEditModal('song', song.title, song.artist, song.xp, song.difficulty || 'Beginner', song.status);
    } catch (err) { showToast('Error: ' + err.message); }
  }
});

/* ══ PUBLISH / SAVE DRAFT ══════════════════════════ */
async function publishContent(type, asDraft = false) {
  const status = asDraft ? 'Draft' : 'Live';

  /* ── Scene ── */
  if (type === 'scene') {
    const movie = v('add-scene-movie');
    const line = v('add-scene-line');
    const jp = v('add-scene-jp');
    const exp = v('add-scene-exp');
    const url = v('add-scene-url');
    const diff = val('add-scene-diff');
    const xp = num('add-scene-xp', 80);

    if (!movie) { alert('Movie title is required.'); return; }

    showToast('Saving…');
    try {
      await DB.insertScene({ title: line || movie, movie, video_url: url, level: diff, xp, status });
      clearFields(['add-scene-movie', 'add-scene-line', 'add-scene-jp', 'add-scene-exp', 'add-scene-url']);
      await renderScenes();
      showToast(asDraft ? 'Scene saved as draft.' : `🎬 "${movie}" is now live!`);
    } catch (e) { showToast('Error: ' + e.message); }

    /* ── Song ── */
  } else if (type === 'song') {
    const title = v('add-song-title');
    const artist = v('add-song-artist');
    const lyrics = v('add-song-lyrics');
    const vocab = v('add-song-vocab');
    const url = v('add-song-url');
    const diff = val('add-song-diff');
    const xp = num('add-song-xp', 60);

    if (!title) { alert('Song title is required.'); return; }
    if (!artist) { alert('Artist name is required.'); return; }

    // Extract YouTube ID from any URL format
    const youtubeId = extractYouTubeId(url);

    showToast('Saving…');
    try {
      await DB.insertSong({
        title, artist,
        video_url: url,
        youtube_id: youtubeId,
        difficulty: diff,
        xp, status,
        lyrics: lyrics ? lyrics.split('\n').map(l => l.trim()).filter(Boolean) : [],
        vocab
      });
      clearFields(['add-song-title', 'add-song-artist', 'add-song-lyrics', 'add-song-vocab', 'add-song-url']);
      await renderSongs();
      showToast(asDraft ? 'Song saved as draft.' : `🎵 "${title}" is now live!`);
    } catch (e) { showToast('Error: ' + e.message); }

    /* ── Challenge ── */
  } else if (type === 'challenge') {
    const source = v('add-challenge-source');
    const sentence = v('add-challenge-sentence');
    const answer = v('add-challenge-answer');
    const distractors = v('add-challenge-distractors').split(',').map(d => d.trim()).filter(Boolean);
    const translation = v('add-challenge-translation');
    const explanation = v('add-challenge-explanation');
    const typeVal = val('add-challenge-type');

    if (!source || !sentence || !answer) { alert('Source, Sentence and Answer are required.'); return; }

    showToast('Saving…');
    try {
      await DB.insertChallenge({ type: typeVal, source, sentence, answer, distractors, translation, explanation, status });
      clearFields(['add-challenge-source', 'add-challenge-sentence', 'add-challenge-answer', 'add-challenge-distractors', 'add-challenge-translation', 'add-challenge-explanation']);
      showToast(asDraft ? 'Challenge saved as draft.' : `🧠 "${source}" challenge is live!`);
    } catch (e) { showToast('Error: ' + e.message); }
  }
}

function saveDraft(type) { publishContent(type, true); }

/* ══ EDIT MODAL ════════════════════════════════════ */
let _editId = null;
let _editType = null;

function openEditModal(type, title, secondary, xp, level, status) {
  document.getElementById('modal-title').textContent = 'Edit ' + (type === 'scene' ? 'Scene' : 'Song');
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">${type === 'scene' ? 'Movie' : 'Artist'}</label>
      <input type="text" value="${escHtml(secondary || '')}" id="m-secondary">
    </div>
    <div class="form-group">
      <label class="form-label">${type === 'scene' ? 'Scene line / title' : 'Song title'}</label>
      <input type="text" value="${escHtml(title || '')}" id="m-title">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Difficulty</label>
        <select id="m-level">
          <option${level === 'Beginner' ? ' selected' : ''}>Beginner</option>
          <option${level === 'Intermediate' ? ' selected' : ''}>Intermediate</option>
          <option${level === 'Advanced' ? ' selected' : ''}>Advanced</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">XP Reward</label>
        <input type="number" value="${xp || 0}" id="m-xp" min="0">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select id="m-status">
        <option${status === 'Live' ? ' selected' : ''}>Live</option>
        <option${status === 'Draft' ? ' selected' : ''}>Draft</option>
      </select>
    </div>`;
  document.getElementById('edit-modal').classList.add('open');
}

async function saveModal() {
  const title = v('m-title');
  const secondary = v('m-secondary');
  const level = val('m-level');
  const xp = num('m-xp', 0);
  const status = val('m-status');

  try {
    if (_editType === 'scene') {
      await DB.updateScene(_editId, { title, movie: secondary, level, xp, status });
      await renderScenes();
    } else {
      await DB.updateSong(_editId, { title, artist: secondary, difficulty: level, xp, status });
      await renderSongs();
    }
    closeModal();
    showToast('Changes saved.');
  } catch (e) { showToast('Error: ' + e.message); }
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

/* ══ FILTER SCENES & SONGS ═════════════════════════ */
function filterScenes() {
  const lvl = document.getElementById('scene-filter').value;
  const st = document.getElementById('scene-status').value;
  let vis = 0;
  document.querySelectorAll('#scenes-tbody tr').forEach(r => {
    const show = (!lvl || r.dataset.level === lvl) && (!st || r.dataset.status === st);
    r.style.display = show ? '' : 'none';
    if (show) vis++;
  });
  const el = document.getElementById('scenes-count');
  if (el) el.textContent = vis;
}

function filterSongs() {
  const lvl = document.getElementById('song-filter').value;
  let vis = 0;
  document.querySelectorAll('#songs-tbody tr').forEach(r => {
    const show = !lvl || r.dataset.level === lvl;
    r.style.display = show ? '' : 'none';
    if (show) vis++;
  });
  const el = document.getElementById('songs-count');
  if (el) el.textContent = vis;
}

/* ══ RESOLVE FLAGS ═════════════════════════════════ */
function resolveFlag(btn) {
  const item = btn.closest('.flag-item');
  item.style.transition = 'opacity 0.3s';
  item.style.opacity = '0';
  setTimeout(() => { item.remove(); updateFlagCount(); }, 300);
}

function resolveAll() {
  const items = document.querySelectorAll('.flag-item');
  items.forEach((item, i) => {
    setTimeout(() => {
      item.style.transition = 'opacity 0.25s';
      item.style.opacity = '0';
      setTimeout(() => item.remove(), 250);
    }, i * 80);
  });
  setTimeout(() => { updateFlagCount(); showToast('All flags resolved.'); }, items.length * 80 + 350);
}

function updateFlagCount() {
  const n = document.querySelectorAll('.flag-item').length;
  ['flag-count', 'flag-badge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = n;
  });
}

/* ══ XP EDIT ═══════════════════════════════════════ */
function xpEdit(btn) {
  const row = btn.closest('.user-row');
  const xpDiv = row.querySelector('.user-xp');
  const cur = parseInt(xpDiv.dataset.xp) || 0;
  const val = prompt('Set XP for this user:', cur);
  if (val === null) return;
  const n = parseInt(val);
  if (isNaN(n) || n < 0) { alert('Invalid XP value.'); return; }
  xpDiv.dataset.xp = n;
  xpDiv.textContent = n.toLocaleString() + ' XP';
  showToast('XP updated to ' + n.toLocaleString() + '.');
}

/* ══ HELPERS ═══════════════════════════════════════ */
function v(id) { return (document.getElementById(id)?.value || '').trim(); }
function val(id) { return document.getElementById(id)?.value || ''; }
function num(id, def) { return Number(document.getElementById(id)?.value) || def; }
function clearFields(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
function escHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function extractYouTubeId(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return url;
}

/* ══ INIT ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderScenes();
  renderSongs();
});