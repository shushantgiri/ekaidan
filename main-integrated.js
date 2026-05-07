// =====================================================
// EKAIDAN — main-integrated.js
// Reads scenes & songs from localStorage (written by admin)
// and renders them on the player-facing index.html
// =====================================================

/* ── HELPERS ── */
function getLevelClass(level) {
  if (!level) return 'diff-med';
  const l = level.toLowerCase();
  if (l === 'beginner') return 'diff-easy';
  if (l === 'advanced') return 'diff-hard';
  return 'diff-med';
}

function extractYoutubeId(url) {
  if (!url) return '';
  if (url.includes('youtube.com')) return url.split('v=')[1]?.split('&')[0] || '';
  if (url.includes('youtu.be')) return url.split('/').pop().split('?')[0] || '';
  // already an ID (no dots)
  if (!url.includes('.') && !url.includes('/')) return url;
  return '';
}

/* ── SCENE PLAYER ── */
function openPlayer(title, youtubeUrl) {
  const player = document.getElementById('player');
  const titleEl = document.getElementById('player-title');
  const videoEl = document.getElementById('player-video');
  if (!player || !titleEl || !videoEl) return;

  const id = extractYoutubeId(youtubeUrl);
  titleEl.textContent = title;
  videoEl.src = id
    ? `https://www.youtube.com/embed/${id}?autoplay=1`
    : '';
  player.style.display = 'block';
}

function closePlayer() {
  const player = document.getElementById('player');
  const videoEl = document.getElementById('player-video');
  if (videoEl) videoEl.src = '';
  if (player) player.style.display = 'none';
}

/* ── RENDER SCENES ── */
function renderScenes() {
  const scenes = DB.getScenes().filter(s => s.status === 'Live');
  const section = document.querySelector('.section');
  if (!section) return;

  // Remove any existing dynamic scene cards (keep static ones)
  const existing = document.getElementById('dynamic-scenes');
  if (existing) existing.remove();

  if (scenes.length === 0) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'dynamic-scenes';
  wrapper.style.cssText = 'max-width:860px;margin:0 auto;padding:0 28px 48px';

  const head = document.createElement('div');
  head.className = 'sec-head';
  head.innerHTML = `<div class="sec-title">🎬 Published Scenes</div>`;
  wrapper.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'cards-3';

  scenes.forEach(scene => {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <div class="mc-icon">🎬</div>
      <div class="mc-title">${scene.title}</div>
      <div class="mc-sub">${scene.movie || ''} · ${scene.level || ''}</div>
      <div class="mc-xp">+${scene.xp || 0} XP</div>
    `;
    if (scene.videoUrl) {
      card.style.cursor = 'pointer';
      card.onclick = () => openPlayer(scene.title, scene.videoUrl);
    }
    grid.appendChild(card);
  });

  wrapper.appendChild(grid);

  // Insert before the first .section
  const firstSection = document.querySelector('.section');
  if (firstSection) {
    firstSection.parentNode.insertBefore(wrapper, firstSection);
  } else {
    document.body.appendChild(wrapper);
  }
}

/* ── RENDER SONGS ── */
function renderSongs() {
  const songs = DB.getSongs().filter(s => s.status === 'Live' || !s.status); // treat no-status as live

  // Target both .songs-container elements (there are two in index.html)
  const containers = document.querySelectorAll('.songs-container');
  if (!containers.length) return;

  containers.forEach(container => {
    container.innerHTML = '';

    if (songs.length === 0) {
      container.innerHTML = '<p style="color:var(--txt3);font-size:13px;padding:12px 0">No songs published yet.</p>';
      return;
    }

    songs.forEach(song => {
      const card = document.createElement('div');
      card.className = 'mini-card';
      card.style.marginBottom = '10px';

      const youtubeId = song.youtubeId || extractYoutubeId(song.youtubeUrl || '');
      const thumb = youtubeId
        ? `<img src="https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg" style="width:100%;border-radius:6px;margin-bottom:8px;object-fit:cover;max-height:80px">`
        : `<div style="font-size:28px;margin-bottom:8px">🎵</div>`;

      card.innerHTML = `
        ${thumb}
        <div class="mc-title">${song.title}</div>
        <div class="mc-sub">${song.artist || ''} · ${song.difficulty || song.level || ''}</div>
        <div class="mc-xp">+${song.xp || 0} XP</div>
        ${song.vocab ? `<div style="font-size:11px;color:var(--txt2);margin-top:6px;line-height:1.5">${song.vocab}</div>` : ''}
      `;

      if (youtubeId) {
        card.style.cursor = 'pointer';
        card.onclick = () => {
          const title = document.getElementById('player-title');
          const video = document.getElementById('player-video');
          const player = document.getElementById('player');
          if (title) title.textContent = `${song.title} — ${song.artist}`;
          if (video) video.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
          if (player) player.style.display = 'block';
        };
      }

      container.appendChild(card);
    });
  });
}

/* ── DAILY CHALLENGE: load from localStorage if set ── */
function loadDailyChallenge() {
  const challenge = JSON.parse(localStorage.getItem('dailyChallenge') || 'null');
  if (!challenge) return;

  const sourceEl = document.querySelector('.challenge-section [style*="text-align:center"]');
  if (sourceEl) sourceEl.textContent = `${challenge.song} — ${challenge.artist}`;

  const questionEl = document.querySelector('.ch-question');
  if (questionEl && challenge.lyricWithBlank) {
    const parts = challenge.lyricWithBlank.split('_____');
    questionEl.innerHTML = `"${parts[0]}<div class="blank" id="blank1">_____</div>${parts[1] || ''}"`;
  }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  renderScenes();
  renderSongs();
  loadDailyChallenge();
});
