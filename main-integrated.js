// =====================================================
// EKAIDAN — main-integrated.js
// Loads scenes & songs from Supabase, renders them,
// and wires up the study modal + scene player.
// =====================================================

/* ── RENDER SCENES ── */
async function renderScenes() {
  try {
    const all    = await DB.getScenes();
    const scenes = all.filter(s => s.status === 'Live');

    const section = document.getElementById('dynamic-scenes-section');
    const grid    = document.getElementById('dynamic-scenes-grid');
    if (!section || !grid) return;

    if (!scenes.length) { section.style.display = 'none'; return; }

    section.style.display = '';
    grid.innerHTML = '';

    scenes.forEach(scene => {
      const card = document.createElement('div');
      card.className = 'mini-card';

      // Extract YouTube ID from video_url if present
      let youtubeId = '';
      const url = scene.video_url || '';
      if (url.includes('youtube.com')) youtubeId = url.split('v=')[1]?.split('&')[0] || '';
      else if (url.includes('youtu.be')) youtubeId = url.split('/').pop().split('?')[0] || '';
      else if (url && !url.includes('.')) youtubeId = url; // raw ID

      const thumb = youtubeId
        ? `<img src="https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg"
             style="width:100%;border-radius:6px;margin-bottom:8px;object-fit:cover;max-height:80px">`
        : `<div style="font-size:28px;margin-bottom:8px">🎬</div>`;

      card.innerHTML = `
        ${thumb}
        <div class="mc-title">${scene.title}</div>
        <div class="mc-sub">${scene.movie || ''} · ${scene.level || ''}</div>
        <div class="mc-xp">+${scene.xp || 0} XP</div>`;

      if (youtubeId) {
        card.style.cursor = 'pointer';
        card.onclick = () => openScenePlayer(scene.title, youtubeId);
      }

      grid.appendChild(card);
    });
  } catch(e) {
    console.error('Could not load scenes:', e);
  }
}

/* ── RENDER SONGS ── */
async function renderSongs() {
  const grid = document.getElementById('songs-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="color:var(--txt3);font-size:13px;grid-column:1/-1;padding:12px 0">Loading songs…</div>';

  try {
    const all   = await DB.getSongs();
    const songs = all.filter(s => s.status === 'Live' || !s.status);

    grid.innerHTML = '';

    if (!songs.length) {
      grid.innerHTML = '<p style="color:var(--txt3);font-size:13px;grid-column:1/-1">No songs published yet.</p>';
      return;
    }

    songs.forEach(song => {
      const youtubeId = song.youtube_id || '';
      const thumb = youtubeId
        ? `<img src="https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg"
             style="width:100%;border-radius:6px;margin-bottom:8px;object-fit:cover;max-height:80px">`
        : `<div style="font-size:28px;margin-bottom:8px">🎵</div>`;

      const card = document.createElement('div');
      card.className = 'mini-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        ${thumb}
        <div class="mc-title">${song.title}</div>
        <div class="mc-sub">${song.artist || ''} · ${song.difficulty || ''}</div>
        <div class="mc-xp">+${song.xp || 0} XP</div>
        <div style="font-size:11px;color:var(--blue);margin-top:6px">Tap to study →</div>`;

      card.onclick = () => openStudy(song);
      grid.appendChild(card);
    });
  } catch(e) {
    console.error('Could not load songs:', e);
    grid.innerHTML = '<p style="color:var(--red);font-size:13px;grid-column:1/-1">Could not load songs. Check console.</p>';
  }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  renderScenes();
  renderSongs();
});
