// =====================================================
// EKAIDAN — site.js
// Shared DB layer used by both admin and player pages
// =====================================================

const DB = {
  /* ── SCENES ── */
  getScenes() {
    return JSON.parse(localStorage.getItem('scenes') || '[]');
  },
  saveScenes(data) {
    localStorage.setItem('scenes', JSON.stringify(data));
  },

  /* ── SONGS ── */
  getSongs() {
    return JSON.parse(localStorage.getItem('songs') || '[]');
  },
  saveSongs(data) {
    localStorage.setItem('songs', JSON.stringify(data));
  }
};

// ── Seed default scene on first load ──
if (!localStorage.getItem('scenes')) {
  DB.saveScenes([
    {
      id: Date.now(),
      title: "You've got to be kidding me",
      movie: "Spider-Man: Homecoming",
      level: "Intermediate",
      xp: 120,
      status: "Live",
      videoUrl: "",
      line: "",
      jp: "",
      explanation: ""
    }
  ]);
}

// ── Seed default song on first load ──
if (!localStorage.getItem('songs')) {
  DB.saveSongs([
    {
      id: Date.now() + 1,
      title: "Shape of You",
      artist: "Ed Sheeran",
      difficulty: "Intermediate",
      xp: 75,
      status: "Live",
      lyrics: ["The shape of you"],
      vocab: "shape → 形",
      youtubeId: "JGwWNGJdvx8"
    }
  ]);
}
