// =====================================================
// EKAIDAN — admin-integrated.js
// Wires the admin panel's Publish buttons to localStorage
// and renders scenes/songs tables from real data
// =====================================================

/* ══════════════════════════════════════
   PILL HELPERS
══════════════════════════════════════ */
function levelPill(level) {
  const map = { Beginner: 'pill-blue', Intermediate: 'pill-amber', Advanced: 'pill-red' };
  const cls = map[level] || 'pill-violet';
  return `<span class="pill ${cls}">${level}</span>`;
}

function statusPill(status) {
  if (status === 'Live') {
    return `<span class="pill pill-green"><i class="ti ti-circle-check"></i>Live</span>`;
  }
  return `<span class="pill pill-amber"><i class="ti ti-clock"></i>Draft</span>`;
}

/* ══════════════════════════════════════
   RENDER SCENES TABLE
══════════════════════════════════════ */
function renderScenes() {
  const tbody = document.getElementById('scenes-tbody');
  if (!tbody) return;

  const scenes = DB.getScenes();
  tbody.innerHTML = '';

  scenes.forEach(scene => {
    const tr = document.createElement('tr');
    tr.dataset.level = scene.level || '';
    tr.dataset.status = scene.status || 'Live';

    tr.innerHTML = `
      <td class="td-primary">${scene.title}</td>
      <td class="td-secondary">${scene.movie || '—'}</td>
      <td>${scene.lines || '—'}</td>
      <td>${levelPill(scene.level)}</td>
      <td>${scene.xp}</td>
      <td>${statusPill(scene.status)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" onclick="editScene(${scene.id})" title="Edit"><i class="ti ti-edit"></i></button>
          <button class="icon-btn danger" onclick="deleteScene(${scene.id})" title="Delete"><i class="ti ti-trash"></i></button>
          <button class="icon-btn" onclick="toggleSceneStatus(${scene.id}, this)" title="Toggle status"><i class="ti ti-toggle-right"></i></button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  const countEl = document.getElementById('scenes-count');
  if (countEl) countEl.textContent = scenes.length;
}

/* ══════════════════════════════════════
   RENDER SONGS TABLE
══════════════════════════════════════ */
function renderSongs() {
  const tbody = document.getElementById('songs-tbody');
  if (!tbody) return;

  const songs = DB.getSongs();
  tbody.innerHTML = '';

  songs.forEach(song => {
    const level = song.difficulty || song.level || 'Beginner';
    const status = song.status || 'Live';
    const tr = document.createElement('tr');
    tr.dataset.level = level;

    tr.innerHTML = `
      <td class="td-primary">${song.title}</td>
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
      </td>
    `;

    tbody.appendChild(tr);
  });

  const countEl = document.getElementById('songs-count');
  if (countEl) countEl.textContent = songs.length;
}

/* ══════════════════════════════════════
   PUBLISH SCENE  (replaces fake stub)
══════════════════════════════════════ */
function publishContent(type, asDraft) {
  if (type === 'scene') {
    const movie  = document.getElementById('add-scene-movie')?.value?.trim();
    const line   = document.getElementById('add-scene-line')?.value?.trim();
    const jp     = document.getElementById('add-scene-jp')?.value?.trim();
    const exp    = document.getElementById('add-scene-exp')?.value?.trim();
    const url    = document.getElementById('add-scene-url')?.value?.trim();
    const diff   = document.getElementById('add-scene-diff')?.value;
    const xp     = Number(document.getElementById('add-scene-xp')?.value) || 80;

    if (!movie) { alert('Please fill in the Movie title.'); return; }

    const scenes = DB.getScenes();
    scenes.push({
      id: Date.now(),
      title: line || movie,
      movie,
      level: diff,
      xp,
      status: asDraft ? 'Draft' : 'Live',
      line,
      jp,
      explanation: exp,
      videoUrl: url
    });
    DB.saveScenes(scenes);
    renderScenes();

    // Clear form
    ['add-scene-movie','add-scene-line','add-scene-jp','add-scene-exp','add-scene-url'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    showToast(asDraft ? 'Scene saved as draft.' : `"${movie}" published and live for players! 🎬`);

  } else if (type === 'song') {
    const title  = document.getElementById('add-song-title')?.value?.trim();
    const artist = document.getElementById('add-song-artist')?.value?.trim();
    const lyrics = document.getElementById('add-song-lyrics')?.value?.trim();
    const vocab  = document.getElementById('add-song-vocab')?.value?.trim();
    const url    = document.getElementById('add-song-url')?.value?.trim();
    const diff   = document.getElementById('add-song-diff')?.value;
    const xp     = Number(document.getElementById('add-song-xp')?.value) || 60;

    if (!title || !artist) { alert('Please fill in Song title and Artist.'); return; }

    // Extract YouTube ID from URL
    let youtubeId = '';
    if (url) {
      if (url.includes('youtube.com')) youtubeId = url.split('v=')[1]?.split('&')[0] || '';
      else if (url.includes('youtu.be')) youtubeId = url.split('/').pop().split('?')[0] || '';
      else youtubeId = url; // assume raw ID was pasted
    }

    const songs = DB.getSongs();
    songs.push({
      id: Date.now(),
      title,
      artist,
      difficulty: diff,
      level: diff,
      xp,
      status: asDraft ? 'Draft' : 'Live',
      lyrics: lyrics ? lyrics.split('\n').filter(l => l.trim()) : [],
      vocab,
      youtubeId,
      youtubeUrl: url
    });
    DB.saveSongs(songs);
    renderSongs();

    // Clear form
    ['add-song-title','add-song-artist','add-song-lyrics','add-song-vocab','add-song-url'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    showToast(asDraft ? 'Song saved as draft.' : `"${title}" published and live for players! 🎵`);
  }
}

/* ── Override saveDraft to use real logic ── */
function saveDraft(type) {
  publishContent(type, true);
}

/* ══════════════════════════════════════
   DELETE
══════════════════════════════════════ */
function deleteScene(id) {
  if (!confirm('Delete this scene?')) return;
  DB.saveScenes(DB.getScenes().filter(s => s.id !== id));
  renderScenes();
  showToast('Scene deleted.');
}

function deleteSong(id) {
  if (!confirm('Delete this song?')) return;
  DB.saveSongs(DB.getSongs().filter(s => s.id !== id));
  renderSongs();
  showToast('Song deleted.');
}

/* ══════════════════════════════════════
   TOGGLE SCENE STATUS
══════════════════════════════════════ */
function toggleSceneStatus(id, btn) {
  const scenes = DB.getScenes();
  const scene = scenes.find(s => s.id === id);
  if (!scene) return;
  scene.status = scene.status === 'Live' ? 'Draft' : 'Live';
  DB.saveScenes(scenes);
  renderScenes();
  showToast(`Status changed to ${scene.status}.`);
}

/* ══════════════════════════════════════
   EDIT (opens modal with real data)
══════════════════════════════════════ */
function editScene(id) {
  const scene = DB.getScenes().find(s => s.id === id);
  if (!scene) return;
  openEditModal('scene', scene.title, scene.movie, scene.xp, scene.level, scene.status, id);
}

function editSong(id) {
  const song = DB.getSongs().find(s => s.id === id);
  if (!song) return;
  openEditModal('song', song.title, song.artist, song.xp, song.difficulty || song.level, song.status, id);
}

/* ══════════════════════════════════════
   SAVE MODAL (persist edits)
══════════════════════════════════════ */
let _editId = null;
let _editType = null;

const _origOpenEditModal = typeof openEditModal === 'function' ? openEditModal : null;

function openEditModal(type, title, secondary, xp, level, status, id) {
  _editId   = id;
  _editType = type;

  const titleEl = document.getElementById('modal-title');
  const bodyEl  = document.getElementById('modal-body');
  if (!titleEl || !bodyEl) return;

  titleEl.textContent = 'Edit ' + (type === 'scene' ? 'Scene' : 'Song');
  bodyEl.innerHTML = `
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
          <option${level === 'Beginner' ? ' selected' : ''}>Beginner</option>
          <option${level === 'Intermediate' ? ' selected' : ''}>Intermediate</option>
          <option${level === 'Advanced' ? ' selected' : ''}>Advanced</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">XP Reward</label>
        <input type="number" value="${xp}" id="m-xp" min="0">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select id="m-status">
        <option${status === 'Live' ? ' selected' : ''}>Live</option>
        <option${status === 'Draft' ? ' selected' : ''}>Draft</option>
      </select>
    </div>
  `;

  document.getElementById('edit-modal').classList.add('open');
}

function saveModal() {
  const title     = document.getElementById('m-title')?.value?.trim();
  const secondary = document.getElementById('m-secondary')?.value?.trim();
  const level     = document.getElementById('m-level')?.value;
  const xp        = Number(document.getElementById('m-xp')?.value) || 0;
  const status    = document.getElementById('m-status')?.value;

  if (_editType === 'scene') {
    const scenes = DB.getScenes();
    const idx = scenes.findIndex(s => s.id === _editId);
    if (idx !== -1) {
      scenes[idx] = { ...scenes[idx], title, movie: secondary, level, xp, status };
      DB.saveScenes(scenes);
      renderScenes();
    }
  } else if (_editType === 'song') {
    const songs = DB.getSongs();
    const idx = songs.findIndex(s => s.id === _editId);
    if (idx !== -1) {
      songs[idx] = { ...songs[idx], title, artist: secondary, difficulty: level, level, xp, status };
      DB.saveSongs(songs);
      renderSongs();
    }
  }

  closeModal();
  showToast('Changes saved successfully.');
}

/* ══════════════════════════════════════
   TOAST (safe override)
══════════════════════════════════════ */
let _toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !msgEl) { console.log('[Toast]', msg); return; }
  msgEl.textContent = msg;
  toast.style.display = 'flex';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.style.display = 'none', 3200);
}

/* ══════════════════════════════════════
   INIT — render tables on page load
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderScenes();
  renderSongs();
});

// Also fire immediately in case DOMContentLoaded already fired
if (document.readyState !== 'loading') {
  renderScenes();
  renderSongs();
}
