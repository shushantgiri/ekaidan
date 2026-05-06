// ===== SIMPLE DATABASE =====
const DB = {
  getScenes() {
    return JSON.parse(localStorage.getItem('scenes')) || [];
  },
  saveScenes(data) {
    localStorage.setItem('scenes', JSON.stringify(data));
  }
};

// ===== INIT DEFAULT (ONLY FIRST TIME) =====
if (!localStorage.getItem('scenes')) {
  DB.saveScenes([
    {
      id: Date.now(),
      title: "You've got to be kidding me",
      movie: "Spider-Man",
      level: "Intermediate",
      xp: 120,
      status: "Live"
    }
  ]);
}

// ===== SONGS =====
const SongDB = {
  get() {
    return JSON.parse(localStorage.getItem('songs')) || [];
  },
  save(data) {
    localStorage.setItem('songs', JSON.stringify(data));
  }
};