// =====================================================
// EKAIDAN — main-integrated.js
// Player page: loads scenes & songs from Supabase
// =====================================================

/* ── PLAYER ── */
function openPlayer(title, youtubeId) {
  const player  = document.getElementById('player');
  const titleEl = document.getElementById('player-title');
  const videoEl = document.getElementById('player-video');
  if (!player || !titleEl || !videoEl) return;
  titleEl.textContent = title;
  videoEl.src = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1` : '';
  player.style.display = 'block';
}

function closePlayer() {
  const player  = document.getElementById('player');
  const videoEl = document.getElementById('player-video');
  if (videoEl) videoEl.src = '';
  if (player)  player.style.display = 'none';
}

/* ── RENDER SCENES ── */
async function renderScenes() {
  try {
    const all    = await DB.getScenes();
    const scenes = all.filter(s => s.status === 'Live');
    if (!scenes.length) return;

    const old = document.getElementById('dynamic-scenes');
    if (old) old.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'dynamic-scenes';
    wrapper.style.cssText = 'max-width:860px;margin:0 auto;padding:0 28px 48px';
    wrapper.innerHTML = `<div class="sec-head"><div class="sec-title">🎬 Published Scenes</div></div>`;

    const grid = document.createElement('div');
    grid.className = 'cards-3';

    scenes.forEach(scene => {
      const card = document.createElement('div');
      card.className = 'mini-card';
      card.innerHTML = `
        <div class="mc-icon">🎬</div>
        <div class="mc-title">${scene.title}</div>
        <div class="mc-sub">${scene.movie || ''} · ${scene.level || ''}</div>
        <div class="mc-xp">+${scene.xp || 0} XP</div>`;
      if (scene.video_url) {
        card.style.cursor = 'pointer';
        const vid = scene.video_url.includes('youtu')
          ? (scene.video_url.split('v=')[1]?.split('&')[0] || scene.video_url.split('/').pop().split('?')[0])
          : scene.video_url;
        card.onclick = () => openPlayer(scene.title, vid);
      }
      grid.appendChild(card);
    });

    wrapper.appendChild(grid);
    const firstSection = document.querySelector('.section');
    if (firstSection) firstSection.parentNode.insertBefore(wrapper, firstSection);
    else document.body.appendChild(wrapper);
  } catch(e) {
    console.error('Could not load scenes:', e);
  }
}

/* ── RENDER SONGS ── */
async function renderSongs() {
  const containers = document.querySelectorAll('.songs-container');
  if (!containers.length) return;

  try {
    const all   = await DB.getSongs();
    const songs = all.filter(s => s.status === 'Live' || !s.status);

    containers.forEach(container => {
      container.innerHTML = '';

      if (!songs.length) {
        container.innerHTML = '<p style="color:var(--txt3);font-size:13px;padding:12px 0">No songs published yet.</p>';
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
        card.innerHTML = `
          ${thumb}
          <div class="mc-title">${song.title}</div>
          <div class="mc-sub">${song.artist || ''} · ${song.difficulty || ''}</div>
          <div class="mc-xp">+${song.xp || 0} XP</div>
          ${song.vocab ? `<div style="font-size:11px;color:var(--txt2);margin-top:6px;line-height:1.5">${song.vocab}</div>` : ''}`;

        if (youtubeId) {
          card.style.cursor = 'pointer';
          card.onclick = () => openPlayer(`${song.title} — ${song.artist}`, youtubeId);
        }
        container.appendChild(card);
      });
    });
  } catch(e) {
    console.error('Could not load songs:', e);
    containers.forEach(c => c.innerHTML = '<p style="color:var(--txt3);font-size:13px">Could not load songs.</p>');
  }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  renderScenes();
  renderSongs();
});
