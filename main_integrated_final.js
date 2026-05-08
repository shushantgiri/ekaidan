// =====================================================
// EKAIDAN — main-integrated.js  (v3)
// Runs on index.html — loads live content from Supabase
// =====================================================

/* ── AUTH GATE ──────────────────────────────────────
   Certain actions (Play, Music Mode, Battle, etc.)
   require login. Guest users can browse but not play.
   ─────────────────────────────────────────────────── */
function requireLoginFor(action, callback) {
  if (AUTH.isLoggedIn()) { callback(); return; }
  // Save intent so we can deep-link after login
  sessionStorage.setItem('auth_redirect', location.pathname + '#' + action);
  // Show a brief inline nudge then redirect
  showLoginNudge(() => { window.location.href = 'auth_page.html'; });
}

function showLoginNudge(onConfirm) {
  // Remove any existing nudge
  document.getElementById('login-nudge')?.remove();
  const nudge = document.createElement('div');
  nudge.id = 'login-nudge';
  nudge.innerHTML = `
    <div class="nudge-box">
      <div class="nudge-icon">🎮</div>
      <div class="nudge-text">
        <strong>Sign in to play!</strong>
        <span>Track your XP, compete on the leaderboard, and save your progress.</span>
      </div>
      <button class="nudge-btn" id="nudge-go">Sign in / Sign up →</button>
      <button class="nudge-close" id="nudge-close">✕</button>
    </div>`;
  nudge.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:500;width:min(560px,96vw)';
  nudge.querySelector('.nudge-box').style.cssText =
    'background:var(--bg2);border:0.5px solid rgba(245,197,24,0.4);border-radius:16px;padding:16px 18px;display:flex;align-items:center;gap:14px;box-shadow:0 8px 32px rgba(0,0,0,0.6)';
  nudge.querySelector('.nudge-icon').style.cssText = 'font-size:28px;flex-shrink:0';
  nudge.querySelector('.nudge-text').style.cssText = 'flex:1;display:flex;flex-direction:column;gap:2px;font-size:13px;color:var(--txt)';
  nudge.querySelector('.nudge-text strong').style.cssText = 'font-size:14px;color:var(--yellow)';
  nudge.querySelector('.nudge-text span').style.cssText = 'color:var(--txt2)';
  nudge.querySelector('.nudge-btn').style.cssText =
    'background:var(--yellow);color:#000;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit';
  nudge.querySelector('.nudge-close').style.cssText =
    'background:none;border:none;color:var(--txt3);font-size:18px;cursor:pointer;line-height:1;flex-shrink:0';
  document.body.appendChild(nudge);
  nudge.querySelector('#nudge-go').onclick    = () => { nudge.remove(); onConfirm(); };
  nudge.querySelector('#nudge-close').onclick = () => nudge.remove();
  // Auto-dismiss after 8 s
  setTimeout(() => nudge.remove(), 8000);
}

/* ── MODE BUTTONS ───────────────────────────────── */
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const id = this.id;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    if (id === 'm2') {
      // Music Mode → Music Library (auth required)
      requireLoginFor('music', () => { window.location.href = 'music_library.html'; });
    } else if (id === 'm3') {
      requireLoginFor('speed', () => showComingSoon('Speed Round'));
    } else if (id === 'm4') {
      requireLoginFor('battle', () => showComingSoon('Battle Mode'));
    }
    // m1 (Movie Mode) stays on page — cards below are clickable
  });
});

function showComingSoon(name) {
  alert(`${name} coming soon! 🔥`);
}

/* ── PLAY NOW button in nav ─────────────────────── */
document.querySelector('.nav-btn')?.addEventListener('click', () => {
  requireLoginFor('play', () => {
    document.querySelector('.scene-card-big')?.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ── START PLAYING CTA ───────────────────────────── */
document.querySelector('.cta-dark')?.addEventListener('click', () => {
  if (AUTH.isLoggedIn()) {
    window.location.href = 'music_library.html';
  } else {
    window.location.href = 'auth_page.html?tab=signup';
  }
});

/* ── SEE ALL link ────────────────────────────────── */
document.querySelector('.sec-link')?.addEventListener('click', () => {
  requireLoginFor('seeall', () => { window.location.href = 'music_library.html'; });
});

/* ── LEADERBOARD "Your league" ──────────────────── */
document.querySelectorAll('.sec-link').forEach(el => {
  if (el.textContent.includes('league')) {
    el.addEventListener('click', () => {
      requireLoginFor('leaderboard', () => showComingSoon('Full Leaderboard'));
    });
  }
});

/* ── SCENE CARD (big) ───────────────────────────── */
document.querySelector('.scene-card-big')?.addEventListener('click', () => {
  requireLoginFor('scene', () => openScenePlayer('Spider-Man: Homecoming', 'Zr9ZKQD6kNs'));
});

/* ── MINI CARDS (static fallbacks) ─────────────── */
document.querySelectorAll('.mini-card').forEach(card => {
  const title = card.querySelector('.mc-title')?.textContent || '';
  card.addEventListener('click', () => {
    requireLoginFor('scene', () => openScenePlayer(title, ''));
  });
});

/* ── LOAD LIVE SCENES FROM SUPABASE ─────────────── */
async function loadDynamicScenes() {
  try {
    const scenes = await DB.getLiveScenes();
    if (!scenes.length) return;

    const section = document.getElementById('dynamic-scenes-section');
    const grid    = document.getElementById('dynamic-scenes-grid');
    if (!section || !grid) return;

    grid.innerHTML = '';
    scenes.slice(0, 6).forEach(scene => {
      const card = document.createElement('div');
      card.className = 'mini-card';
      card.innerHTML = `
        <div class="mc-icon">🎬</div>
        <div class="mc-title">${scene.movie || '—'}</div>
        <div class="mc-sub">${scene.title || ''}</div>
        <div class="mc-xp">+${scene.xp || 0} XP</div>`;
      card.addEventListener('click', () => {
        requireLoginFor('scene', () => {
          if (scene.video_url) openScenePlayer(scene.movie, extractYTId(scene.video_url));
          else showComingSoon(`"${scene.movie}" scene`);
        });
      });
      grid.appendChild(card);
    });

    section.style.display = '';
  } catch (e) {
    console.warn('Could not load scenes:', e);
  }
}

/* ── LOAD LIVE SONGS FROM SUPABASE ──────────────── */
async function loadDynamicSongs() {
  try {
    const songs = await DB.getLiveSongs();
    if (!songs.length) return;

    const grid = document.getElementById('songs-grid');
    if (!grid) return;

    grid.innerHTML = '';
    songs.slice(0, 6).forEach(song => {
      const card = document.createElement('div');
      card.className = 'mini-card';
      card.innerHTML = `
        <div class="mc-icon">🎵</div>
        <div class="mc-title">${song.title}</div>
        <div class="mc-sub">${song.artist || ''}</div>
        <div class="mc-xp">+${song.xp || 0} XP</div>`;
      card.addEventListener('click', () => {
        requireLoginFor('song', () => {
          // If on index page, open study modal inline; otherwise go to library
          if (typeof openStudy === 'function') openStudy(song);
          else window.location.href = 'music_library.html';
        });
      });
      grid.appendChild(card);
    });
  } catch (e) {
    console.warn('Could not load songs:', e);
  }
}

/* ── LOAD LIVE LEADERBOARD ───────────────────────── */
async function loadLeaderboard() {
  try {
    const players = await DB.getLeaderboard(5);
    if (!players.length) return;

    const container = document.querySelector('.leaderboard');
    if (!container) return;

    // Keep the head, replace the rows
    const rows = container.querySelectorAll('.lb-row');
    rows.forEach(r => r.remove());

    const rankStyles = ['gold','silver',''];
    const currentUser = AUTH.currentProfile();

    players.forEach((p, i) => {
      const isMe = currentUser && p.username === currentUser.username;
      const row  = document.createElement('div');
      row.className = 'lb-row' + (isMe ? ' me' : '');
      row.innerHTML = `
        <div class="lb-rank ${rankStyles[i] || ''}">${i + 1}</div>
        <div class="lb-avatar" style="background:rgba(245,197,24,0.12);color:var(--yellow)">
          ${p.username.slice(0,2).toUpperCase()}
        </div>
        <div class="lb-name">${p.username}${isMe ? ' <span class="lb-you">★ me</span>' : ''}</div>
        <div class="lb-score">${(p.xp||0).toLocaleString()} XP</div>
        <div class="lb-streak">🔥 ${p.streak||0}</div>`;
      container.appendChild(row);
    });
  } catch (e) {
    console.warn('Leaderboard load failed:', e);
  }
}

/* ── LOAD DAILY CHALLENGE ────────────────────────── */
async function loadDailyChallenge() {
  try {
    const all = await DB.getChallenges();
    if (!all.length) return;

    // Pick challenge by day-of-year so it's consistent for all users
    const dayIdx = Math.floor(Date.now() / 86400000) % all.length;
    const ch     = all[dayIdx];

    renderChallenge(ch);
  } catch (e) {
    console.warn('Challenge load failed:', e);
    // Leave the static fallback in place
  }
}

function renderChallenge(ch) {
  const section = document.querySelector('.challenge-section');
  if (!section || !ch) return;

  const typeLabel = ch.type === 'conversation' ? '🗣️ Native Conversation' :
                    ch.type === 'scene'         ? '🎬 Movie Scene'         :
                                                  '🎵 Song Lyrics';
  section.innerHTML = `
    <div class="ch-head">
      <div class="ch-title">${typeLabel} — Fill in the blank</div>
      <div class="ch-badge">+200 XP bonus</div>
    </div>
    <div style="font-size:12px;color:var(--txt2);margin-bottom:4px;text-align:center">${ch.source || ''}</div>
    <div class="ch-question">
      "${buildBlankHTML(ch.sentence, ch.answer)}"
    </div>
    <div style="font-size:12px;color:var(--txt2);text-align:center;margin-bottom:16px">${ch.translation || ''}</div>
    <div class="ch-options" id="ch-opts"></div>
    <div style="font-size:11px;color:var(--txt3);text-align:center;margin-top:12px" id="ch-hint">
      選んでください — Choose your answer
    </div>`;

  const opts = shuffleArray([ch.answer, ...(ch.distractors || [])]);
  const optsEl = section.querySelector('#ch-opts');
  opts.forEach(opt => {
    const btn = document.createElement('div');
    btn.className = 'ch-opt';
    btn.textContent = opt;
    btn.onclick = () => handleChallengeAnswer(btn, opt, ch.answer, ch.explanation);
    optsEl.appendChild(btn);
  });
}

function buildBlankHTML(sentence, answer) {
  return sentence.replace(answer, `<span class="blank" id="ch-blank">${'_'.repeat(answer.length)}</span>`);
}

function handleChallengeAnswer(btn, chosen, correct, explanation) {
  const section = document.querySelector('.challenge-section');
  if (section.querySelector('.correct') || section.querySelector('.wrong')) return;

  const hint  = document.getElementById('ch-hint');
  const blank = document.getElementById('ch-blank');

  if (chosen === correct) {
    btn.classList.add('correct');
    if (blank) blank.textContent = correct;
    hint.textContent = `✓ 正解！ "${correct}" — ${explanation || ''}`;
    hint.style.color = 'var(--green)';
    // Award XP if logged in
    const user = AUTH.currentUser();
    if (user) DB.awardXP(user.id, 200).catch(() => {});
  } else {
    btn.classList.add('wrong');
    hint.textContent = `✗ 不正解。 The answer was "${correct}"${explanation ? ' — ' + explanation : ''}`;
    hint.style.color = 'var(--red)';
    section.querySelectorAll('.ch-opt').forEach(o => {
      if (o.textContent === correct) o.classList.add('correct');
    });
  }
}

/* ── USER NAV BAR ────────────────────────────────── */
function renderUserNav() {
  const profile = AUTH.currentProfile();
  const xpBar   = document.querySelector('.xp-bar-mini');
  const navBtn  = document.querySelector('.nav-btn');

  if (!xpBar || !navBtn) return;

  if (profile) {
    const pct = Math.min(((profile.xp || 0) % 500) / 5, 100);
    document.getElementById('xpfill') && (document.getElementById('xpfill').style.width = pct + '%');
    document.getElementById('xpnum')  && (document.getElementById('xpnum').textContent = `${(profile.xp||0).toLocaleString()} XP`);
    document.querySelector('.xp-label') && (document.querySelector('.xp-label').textContent = `Lv ${profile.level||1}`);
    navBtn.textContent = profile.username;
    navBtn.onclick = () => { AUTH.signOut().then(() => location.reload()); };
  } else {
    navBtn.textContent = 'Sign in';
    navBtn.onclick = () => { window.location.href = 'auth_page.html'; };
    // Also update level badge
    const badge = document.querySelector('.level-badge');
    if (badge) badge.textContent = '★ Guest';
  }
}

/* ── HELPERS ─────────────────────────────────────── */
function extractYTId(url) {
  if (!url) return '';
  if (url.includes('youtube.com')) return url.split('v=')[1]?.split('&')[0] || '';
  if (url.includes('youtu.be'))    return url.split('/').pop().split('?')[0] || '';
  return url;
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/* ── INIT ────────────────────────────────────────── */
(async function init() {
  renderUserNav();
  await Promise.all([
    loadDynamicScenes(),
    loadDynamicSongs(),
    loadLeaderboard(),
    loadDailyChallenge()
  ]);
})();
