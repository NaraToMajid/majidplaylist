// ============================================
// player.js - SIMPLE & FIX (4 LAGU PASTI BISA)
// ============================================

// PAKAI SEMUA LAGU, GAK DI-FILTER APAPUN
const playlist = songs;

let cur = 0;
let playing = false;
let looping = false;
let shuffling = false;

const audio = new Audio();
audio.volume = 0.8;

// Elemen DOM
const bg = document.getElementById('bg');
const covImg = document.getElementById('cov');
const ttlEl = document.getElementById('ttl');
const artEl = document.getElementById('art');
const filEl = document.getElementById('fil');
const trkEl = document.getElementById('trk');
const tcEl = document.getElementById('tc');
const tdEl = document.getElementById('td');
const pIco = document.getElementById('pIco');
const plEl = document.getElementById('pl');
const volSlider = document.getElementById('vol');
const volIcon = document.getElementById('volIcon');

// Format waktu
function fmt(s) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}

// MUAT LAGU
function load(index, autoplay) {
  if (!playlist[index]) return;
  
  const song = playlist[index];
  
  audio.pause();
  audio.currentTime = 0;
  
  // Path
  let audioPath = song.src;
  let coverPath = song.cover;
  
  if (typeof SONG_DIR !== 'undefined' && SONG_DIR) {
    audioPath = SONG_DIR + audioPath;
    coverPath = COVER_DIR + coverPath;
  }
  
  console.log("Memuat:", index, audioPath);
  
  audio.src = audioPath;
  if (covImg) covImg.src = coverPath;
  if (ttlEl) ttlEl.textContent = song.title;
  if (artEl) artEl.textContent = song.artist;
  if (bg) bg.style.backgroundImage = `url('${coverPath}')`;
  if (filEl) filEl.style.width = '0%';
  if (tcEl) tcEl.textContent = '0:00';
  if (tdEl) tdEl.textContent = '0:00';
  
  if (autoplay) {
    setTimeout(() => {
      audio.play().then(() => {
        setPlaying(true);
      }).catch(e => {
        console.log("Play error:", e);
        setPlaying(false);
      });
    }, 100);
  } else {
    setPlaying(false);
  }
  
  renderPlaylist();
}

// SET PLAYING STATE
function setPlaying(v) {
  playing = v;
  if (pIco) {
    pIco.className = v ? 'ti ti-player-pause' : 'ti ti-player-play';
  }
  if (covImg) {
    v ? covImg.classList.add('spin') : covImg.classList.remove('spin');
  }
  renderPlaylist();
}

// RENDER PLAYLIST (PASTIKAN SEMUA LAGU KELUAR)
function renderPlaylist() {
  if (!plEl) return;
  plEl.innerHTML = '';
  
  console.log("Rendering playlist, total:", playlist.length);
  
  playlist.forEach((song, i) => {
    const el = document.createElement('div');
    el.className = 'plitem' + (i === cur ? ' active' : '');
    
    let numHtml = (i === cur) ? '▶' : (i + 1).toString();
    
    let coverPath = song.cover;
    if (typeof COVER_DIR !== 'undefined' && COVER_DIR) {
      coverPath = COVER_DIR + coverPath;
    }
    
    el.innerHTML = `
      <div class="plnum">${numHtml}</div>
      <img class="plthumb" src="${coverPath}" style="width:40px;height:40px;object-fit:cover;">
      <div class="plinfo">
        <div class="plname">${song.title}</div>
        <div class="plartist">${song.artist}</div>
      </div>
    `;
    
    el.addEventListener('click', () => {
      cur = i;
      load(cur, true);
    });
    
    plEl.appendChild(el);
  });
}

// TOMBOL PLAY
const playBtn = document.getElementById('bPl');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    
    if (!audio.src || audio.readyState === 0) {
      load(cur, true);
      return;
    }
    
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(e => load(cur, true));
    }
  });
}

// TOMBOL NEXT
const nextBtn = document.getElementById('bN');
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (shuffling) {
      let newCur;
      do { newCur = Math.floor(Math.random() * playlist.length); } 
      while (playlist.length > 1 && newCur === cur);
      cur = newCur;
    } else {
      cur = (cur + 1) % playlist.length;
    }
    load(cur, playing);
  });
}

// TOMBOL PREV
const prevBtn = document.getElementById('bP');
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    cur = (cur - 1 + playlist.length) % playlist.length;
    load(cur, playing);
  });
}

// TOMBOL LOOP
const loopBtn = document.getElementById('bL');
if (loopBtn) {
  loopBtn.addEventListener('click', function() {
    looping = !looping;
    audio.loop = looping;
    this.classList.toggle('on', looping);
  });
}

// TOMBOL SHUFFLE
const shuffleBtn = document.getElementById('bS');
if (shuffleBtn) {
  shuffleBtn.addEventListener('click', function() {
    shuffling = !shuffling;
    this.classList.toggle('on', shuffling);
  });
}

// VOLUME
if (volSlider) {
  volSlider.addEventListener('input', function() {
    audio.volume = this.value / 100;
    if (volIcon) {
      volIcon.className = audio.volume === 0 ? 'ti ti-volume-off' : 
                         (audio.volume < 0.5 ? 'ti ti-volume-low' : 'ti ti-volume-high');
    }
  });
}

if (volIcon) {
  volIcon.addEventListener('click', () => {
    if (audio.volume > 0) {
      audio.volume = 0;
      if (volSlider) volSlider.value = 0;
    } else {
      audio.volume = 0.8;
      if (volSlider) volSlider.value = 80;
    }
  });
}

// PROGRESS BAR
if (trkEl) {
  trkEl.addEventListener('click', e => {
    if (!audio.duration) return;
    const rect = trkEl.getBoundingClientRect();
    const seekTo = ((e.clientX - rect.left) / rect.width) * audio.duration;
    audio.currentTime = seekTo;
  });
}

audio.addEventListener('timeupdate', () => {
  if (audio.duration && !isNaN(audio.duration)) {
    if (filEl) filEl.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
    if (tcEl) tcEl.textContent = fmt(audio.currentTime);
    if (tdEl) tdEl.textContent = fmt(audio.duration);
  }
});

audio.addEventListener('ended', () => {
  if (!looping) {
    if (shuffling) {
      let newCur;
      do { newCur = Math.floor(Math.random() * playlist.length); } 
      while (newCur === cur);
      cur = newCur;
    } else {
      cur = (cur + 1) % playlist.length;
    }
    load(cur, true);
  }
});

audio.addEventListener('error', (e) => {
  console.error("ERROR AUDIO:", audio.error ? audio.error.code : 'unknown');
  console.error("SRC:", audio.src);
});

// KEYBOARD
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (playBtn) playBtn.click();
  } else if (e.code === 'ArrowLeft') {
    if (prevBtn) prevBtn.click();
  } else if (e.code === 'ArrowRight') {
    if (nextBtn) nextBtn.click();
  }
});

// MULAI
console.log("=== TOTAL LAGU DI PLAYLIST:", playlist.length, "===");
playlist.forEach((s, i) => console.log(i + ":", s.title, "-", s.src));

if (playlist.length > 0) {
  load(0, false);
}
