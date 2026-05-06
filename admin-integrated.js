function renderScenes() {
  const tbody = document.getElementById('scenes-tbody');
  const scenes = DB.getScenes();

  tbody.innerHTML = '';

  scenes.forEach(scene => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="td-primary">${scene.title}</td>
      <td class="td-secondary">${scene.movie}</td>
      <td>—</td>
      <td><span class="pill">${scene.level}</span></td>
      <td>${scene.xp}</td>
      <td><span class="pill">${scene.status}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn danger" onclick="deleteScene(${scene.id})">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.getElementById('scenes-count').textContent = scenes.length;
}

renderScenes();

function addSceneFromUI() {
  const title = document.querySelector('#add-title')?.value;
  const movie = document.querySelector('#add-movie')?.value;
  const xp = document.querySelector('#add-xp')?.value;
  const level = document.querySelector('#add-level')?.value;

  if (!title || !movie) {
    alert("Fill all fields");
    return;
  }

  const scenes = DB.getScenes();

  scenes.push({
    id: Date.now(),
    title,
    movie,
    xp: Number(xp),
    level,
    status: "Live"
  });

  DB.saveScenes(scenes);
  renderScenes();

  showToast("Scene added 🚀");
}

function deleteScene(id) {
  let scenes = DB.getScenes();
  scenes = scenes.filter(s => s.id !== id);

  DB.saveScenes(scenes);
  renderScenes();

  showToast("Deleted");
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;

  toast.style.display = 'flex';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}



function publishSong() {


    let youtubeId = "";

if (link.includes("youtube.com")) {
  youtubeId = link.split("v=")[1]?.split("&")[0];
} else if (link.includes("youtu.be")) {
  youtubeId = link.split("/").pop().split("?")[0];
}

  // 1. Get existing songs (or empty array)
  const songs = JSON.parse(localStorage.getItem('songs')) || [];

  // 2. Get values from form
  const title = document.getElementById('song-title').value;
  const artist = document.getElementById('song-artist').value;
  const difficulty = document.getElementById('song-difficulty').value;
  const xp = document.getElementById('song-xp').value;
  const lyricsRaw = document.getElementById('song-lyrics').value;
  const vocab = document.getElementById('song-vocab').value;
  const link = document.getElementById('song-link').value;

  // 3. Check required fields
  if (!title || !artist || !link) {
    alert("Please fill required fields");
    return;
  }

  // 4. Convert lyrics into array
  const lyrics = lyricsRaw.split('\n').filter(line => line.trim() !== '');

  // 5. Extract YouTube ID
  let youtubeId = "";

  if (link.includes("youtube.com")) {
    youtubeId = link.split("v=")[1]?.split("&")[0];
  } else if (link.includes("youtu.be")) {
    youtubeId = link.split("/").pop();
  }

  // 6. Create song object
  const newSong = {
    id: Date.now(),
    title,
    artist,
    difficulty,
    xp: Number(xp),
    lyrics,
    vocab,
    youtubeId
  };

  // 7. Save to localStorage
  songs.push(newSong);
  localStorage.setItem('songs', JSON.stringify(songs));

  // 8. Confirmation
  alert("Song added successfully 🎵");

  // 9. Clear form
  document.getElementById('song-title').value = "";
  document.getElementById('song-artist').value = "";
  document.getElementById('song-lyrics').value = "";
  document.getElementById('song-vocab').value = "";
  document.getElementById('song-link').value = "";



}
