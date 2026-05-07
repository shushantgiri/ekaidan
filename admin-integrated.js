// =====================================================
// EKAIDAN — admin-integrated.js
// Admin panel: publish/edit/delete via Supabase
// =====================================================

/* ══ PILL HELPERS ══ */
function levelPill(level) {
  const map = { Beginner: 'pill-blue', Intermediate: 'pill-amber', Advanced: 'pill-red' };
  return `<span class="pill ${map[level] || 'pill-violet'}">${level || '—'}</span>`;
}
function statusPill(status) {
  return status === 'Live'
    ? `<span class="pill pill-green"><i class="ti ti-circle-check"></i>Live</span>`
    : `<span class="pill pill-amber"><i class="ti ti-clock"></i>Draft</span>`;
}

/* ══ RENDER SCENES TABLE ══ */
async function renderScenes() {
  const tbody = document.getElementById('scenes-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:20px">Loading…</td></tr>`;

  try {
    const scenes = await DB.getScenes();
    tbody.innerHTML = '';

    if (scenes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:20px">No scenes yet. Add one above.</td></tr>`;
    }

    scenes.forEach(scene => {
      const tr = document.createElement('tr');
      tr.dataset.level  = scene.level  || '';
      tr.dataset.status = scene.status || 'Live';
      tr.dataset.id     = scene.id;
      tr.innerHTML = `
        <td class="td-primary">${scene.title || '—'}</td>
        <td class="td-secondary">${scene.movie || '—'}</td>
        <td>—</td>
        <td>${levelPill(scene.level)}</td>
        <td>${scene.xp || 0}</td>
        <td>${statusPill(scene.status)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" onclick="editScene(${scene.id})" title="Edit"><i class="ti ti-edit"></i></button>
            <button class="icon-btn danger" onclick="deleteScene(${scene.id})" title="Delete"><i class="ti ti-trash"></i></button>
            <button class="icon-btn" onclick="toggleSceneStatus(${scene.id},'${scene.status}')" title="Toggle status"><i class="ti ti-toggle-right"></i></button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    const el = document.getElementById('scenes-count');
    if (el) el.textContent = scenes.length;
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red);padding:16px">Error loading scenes: ${e.message}</td></tr>`;
  }
}

/* ══ RENDER SONGS TABLE ══ */
async function renderSongs() {
  const tbody = document.getElementById('songs-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:20px">Loading…</td></tr>`;

  try {
    const songs = await DB.getSongs();
    tbody.innerHTML = '';

    if (songs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:20px">No songs yet. Add one above.</td></tr>`;
    }

    songs.forEach(song => {
      const level  = song.difficulty || song.level || 'Beginner';
      const status = song.status || 'Live';
      const tr = document.createElement('tr');
      tr.dataset.level = level;
      tr.dataset.id    = song.id;
      tr.innerHTML = `
        <td class="td-primary">${song.title || '—'}</td>
        <td class="td-secondary">${song.artist || '—'}</td>
        <td>${levelPill(level)}</td>
        <td>${song.xp || 0}</td>
        <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">—</td>
        <td>${statusPill(status)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" onclick="editSong(${song.id})" title="Edit"><i class="ti ti-edit"></i></button>
            <button class="icon-btn danger" onclick="deleteSong(${song.id})" title="Delete"><i class="ti ti-trash"></i></button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    const el = document.getElementById('songs-count');
    if (el) el.textContent = songs.length;
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red);padding:16px">Error loading songs: ${e.message}</td></tr>`;
  }
}

/* ══ PUBLISH SCENE ══ */
async function publishContent(type, asDraft = false) {
  if (type === 'scene') {
    const movie  = document.getElementById('add-scene-movie')?.value?.trim();
    const line   = document.getElementById('add-scene-line')?.value?.trim();
    const jp     = document.getElementById('add-scene-jp')?.value?.trim();
    const exp    = document.getElementById('add-scene-exp')?.value?.trim();
    const url    = document.getElementById('add-scene-url')?.value?.trim();
    const diff   = document.getElementById('add-scene-diff')?.value;
    const xp     = Number(document.getElementById('add-scene-xp')?.value) || 80;

    if (!movie) { alert('Please fill in the Movie title.'); return; }

    showToast('Saving…');
    try {
      await DB.insertScene({
        id:          Date.now(),
        title:       line || movie,
        movie,
        level:       diff,
        xp,
        status:      asDraft ? 'Draft' : 'Live',
        line,
        jp,
        explanation: exp,
        video_url:   url
      });

      ['add-scene-movie','add-scene-line','add-scene-jp','add-scene-exp','add-scene-url'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });

      await renderScenes();
      showToast(asDraft ? 'Scene saved as draft.' : `"${movie}" is now live! 🎬`);
    } catch(e) {
      showToast('Error: ' + e.message);
    }

  } else if (type === 'song') {
    const title  = document.getElementById('add-song-title')?.value?.trim();
    const artist = document.getElementById('add-song-artist')?.value?.trim();
    const lyrics = document.getElementById('add-song-lyrics')?.value?.trim();
    const vocab  = document.getElementById('add-song-vocab')?.value?.trim();
    const url    = document.getElementById('add-song-url')?.value?.trim();
    const diff   = document.getElementById('add-song-diff')?.value;
    const xp     = Number(document.getElementById('add-song-xp')?.value) || 60;

    if (!title || !artist) { alert('Please fill in Song title and Artist.'); return; }

    // Extract YouTube ID
    let youtubeId = '';
    if (url) {
      if (url.includes('youtube.com')) youtubeId = url.split('v=')[1]?.split('&')[0] || '';
      else if (url.includes('youtu.be')) youtubeId = url.split('/').pop().split('?')[0] || '';
      else youtubeId = url; // assume raw ID
    }

    showToast('Saving…');
    try {
      await DB.insertSong({
        id:         Date.now(),
        title,
        artist,
        difficulty: diff,
        xp,
        status:     asDraft ? 'Draft' : 'Live',
        lyrics:     lyrics ? lyrics.split('\n').filter(l => l.trim()) : [],
        vocab,
        youtube_id: youtubeId
      });

      ['add-song-title','add-song-artist','add-song-lyrics','add-song-vocab','add-song-url'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });

      await renderSongs();
      showToast(asDraft ? 'Song saved as draft.' : `"${title}" is now live! 🎵`);
    } catch(e) {
      showToast('Error: ' + e.message);
    }
  }
}

function saveDraft(type) { publishContent(type, true); }

/* ══ DELETE ══ */
async function deleteScene(id) {
  if (!confirm('Delete this scene?')) return;
  try {
    await DB.deleteScene(id);
    await renderScenes();
    showToast('Scene deleted.');
  } catch(e) { showToast('Error: ' + e.message); }
}

async function deleteSong(id) {
  if (!confirm('Delete this song?')) return;
  try {
    await DB.deleteSong(id);
    await renderSongs();
    showToast('Song deleted.');
  } catch(e) { showToast('Error: ' + e.message); }
}

/* ══ TOGGLE STATUS ══ */
async function toggleSceneStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Live' ? 'Draft' : 'Live';
  try {
    await DB.updateScene(id, { status: newStatus });
    await renderScenes();
    showToast(`Status changed to ${newStatus}.`);
  } catch(e) { showToast('Error: ' + e.message); }
}

/* ══ EDIT MODAL ══ */
let _editId   = null;
let _editType = null;

async function editScene(id) {
  const scenes = await DB.getScenes();
  const scene  = scenes.find(s => s.id === id);
  if (!scene) return;
  _editId   = id;
  _editType = 'scene';
  openEditModal('scene', scene.title, scene.movie, scene.xp, scene.level, scene.status);
}

async function editSong(id) {
  const songs = await DB.getSongs();
  const song  = songs.find(s => s.id === id);
  if (!song) return;
  _editId   = id;
  _editType = 'song';
  openEditModal('song', song.title, song.artist, song.xp, song.difficulty, song.status);
}

function openEditModal(type, title, secondary, xp, level, status) {
  document.getElementById('modal-title').textContent = 'Edit ' + (type === 'scene' ? 'Scene' : 'Song');
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">${type === 'scene' ? 'Movie' : 'Artist'}</label>
      <input type="text" value="${secondary || ''}" id="m-secondary">
    </div>
    <div class="form-group">
      <label class="form-label">${type === 'scene' ? 'Scene line / title' : 'Song title'}</label>
      <input type="text" value="${title || ''}" id="m-title">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Difficulty</label>
        <select id="m-level">
          <option${level==='Beginner'?' selected':''}>Beginner</option>
          <option${level==='Intermediate'?' selected':''}>Intermediate</option>
          <option${level==='Advanced'?' selected':''}>Advanced</option>
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
        <option${status==='Live'?' selected':''}>Live</option>
        <option${status==='Draft'?' selected':''}>Draft</option>
      </select>
    </div>`;
  document.getElementById('edit-modal').classList.add('open');
}

async function saveModal() {
  const title     = document.getElementById('m-title')?.value?.trim();
  const secondary = document.getElementById('m-secondary')?.value?.trim();
  const level     = document.getElementById('m-level')?.value;
  const xp        = Number(document.getElementById('m-xp')?.value) || 0;
  const status    = document.getElementById('m-status')?.value;

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
  } catch(e) { showToast('Error: ' + e.message); }
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

/* ══ TOAST ══ */
let _toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.style.display = 'flex';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.style.display = 'none', 3200);
}

/* ══ FILTER ══ */
function filterScenes() {
  const lvl = document.getElementById('scene-filter').value;
  const st  = document.getElementById('scene-status').value;
  let visible = 0;
  document.querySelectorAll('#scenes-tbody tr').forEach(r => {
    const show = (!lvl || r.dataset.level === lvl) && (!st || r.dataset.status === st);
    r.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const el = document.getElementById('scenes-count');
  if (el) el.textContent = visible;
}

function filterSongs() {
  const lvl = document.getElementById('song-filter').value;
  let visible = 0;
  document.querySelectorAll('#songs-tbody tr').forEach(r => {
    const show = !lvl || r.dataset.level === lvl;
    r.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const el = document.getElementById('songs-count');
  if (el) el.textContent = visible;
}

/* ══ INIT ══ */
document.addEventListener('DOMContentLoaded', () => {
  renderScenes();
  renderSongs();
});
