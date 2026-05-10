// ============================================================
//  player.js — logika pemutar musik lengkap
// ============================================================

// Filter slot kosong agar tidak muncul di playlist
const playlist = songs.filter(s => s.title.trim() !== "");

let cur      = 0;
let playing  = false;
let looping  = false;
let shuffling = false;
let audioCtx, analyser, sourceNode, dataArray;

const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.volume = 0.8;

// Elemen DOM
const bg      = document.getElementById('bg');
const covImg  = document.getElementById('cov');
const ttlEl   = document.getElementById('ttl');
const artEl   = document.getElementById('art');
const beatsEl = document.getElementById('beats');
const filEl   = document.getElementById('fil');
const trkEl   = document.getElementById('trk');
const tcEl    = document.getElementById('tc');
const tdEl    = document.getElementById('td');
const pIco    = document.getElementById('pIco');
const plEl    = document.getElementById('pl');
const volSlider = document.getElementById('vol');
const volIcon = document.getElementById('volIcon');

// Buat bar visualizer
const BAR_COUNT = 28;
const bars = [];
for (let i = 0; i < BAR_COUNT; i++) {
  const b = document.createElement('div');
  b.className = 'b';
  beatsEl.appendChild(b);
  bars.push(b);
}

// Format detik → m:ss
function fmt(s) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m  = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}

// Format waktu untuk display
function updateTimeDisplay() {
  if (!isNaN(audio.duration) && isFinite(audio.duration)) {
    tdEl.textContent = fmt(audio.duration);
  } else {
    tdEl.textContent = '0:00';
  }
  tcEl.textContent = fmt(audio.currentTime);
}

// Muat lagu ke player
function load(index, autoplay) {
  if (!playlist[index]) return;
  
  const song = playlist[index];
  
  // Hentikan audio lama
  audio.pause();
  audio.currentTime = 0;
  
  // Set sumber audio dan cover
  audio.src    = SONG_DIR + song.src;
  covImg.src   = COVER_DIR + song.cover;
  ttlEl.textContent = song.title;
  artEl.textContent = song.artist;
  bg.style.backgroundImage = `url('${COVER_DIR + song.cover}')`;
  
  // Reset progress bar dan time display
  filEl.style.width = '0%';
  tcEl.textContent  = '0:00';
  tdEl.textContent  = '0:00';
  
  // Load audio
  audio.load();
  
  // Set autoplay setelah audio siap
  if (autoplay) {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setPlaying(true);
      }).catch(error => {
        console.log("Autoplay prevented:", error);
        setPlaying(false);
      });
    }
  } else {
    setPlaying(false);
  }
  
  renderPlaylist();
}

// Ubah state play/pause
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

// Inisialisasi Web Audio API (harus dipanggil setelah interaksi user)
function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    analyser   = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    dataArray  = new Uint8Array(analyser.frequencyBinCount);
    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    animateBars();
  } catch (error) {
    console.log("Web Audio API not supported:", error);
  }
}

// Animasi bar visualizer
function animateBars() {
  if (!analyser || !bars.length) return;
  
  function update() {
    requestAnimationFrame(update);
    if (!analyser || !playing) {
      // Jika tidak playing, set semua bar ke height minimal
      bars.forEach(bar => {
        bar.style.height = '3px';
      });
      return;
    }
    
    analyser.getByteFrequencyData(dataArray);
    const step = Math.floor(dataArray.length / BAR_COUNT);
    for (let i = 0; i < BAR_COUNT; i++) {
      const value = dataArray[i * step] || 0;
      const h = Math.max(3, (value / 255) * 40);
      bars[i].style.height = h + 'px';
    }
  }
  
  update();
}

// Render daftar playlist
function renderPlaylist() {
  if (!plEl) return;
  plEl.innerHTML = '';
  
  playlist.forEach((song, i) => {
    const el  = document.createElement('div');
    el.className = 'plitem' + (i === cur ? ' active' : '');

    let numHtml;
    if (i === cur) {
      numHtml = `<div class="pulse${playing ? ' go' : ''}" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>`;
    } else {
      numHtml = (i + 1).toString();
    }

    el.innerHTML = `
      <div class="plnum">${numHtml}</div>
      <img class="plthumb" src="${COVER_DIR + song.cover}" alt="" onerror="this.src='default-cover.jpg'">
      <div class="plinfo">
        <div class="plname">${escapeHtml(song.title)}</div>
        <div class="plartist">${escapeHtml(song.artist)}</div>
      </div>
    `;

    el.addEventListener('click', () => {
      cur = i;
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      initAudio();
      load(cur, true);
    });

    plEl.appendChild(el);
  });
}

// Escape HTML untuk keamanan
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update volume icon
function updateVolumeIcon(volume) {
  if (!volIcon) return;
  
  if (volume === 0) {
    volIcon.className = 'ti ti-volume-off';
  } else if (volume < 0.5) {
    volIcon.className = 'ti ti-volume-low';
  } else {
    volIcon.className = 'ti ti-volume-high';
  }
}

// ── Event listener tombol ──

// Play/Pause button
const playBtn = document.getElementById('bPl');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    if (!audio.src || audio.src === window.location.href) {
      load(cur, true);
      return;
    }
    
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => {
        setPlaying(true);
      }).catch(error => {
        console.log("Playback failed:", error);
      });
    }
  });
}

// Previous button
const prevBtn = document.getElementById('bP');
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    cur = (cur - 1 + playlist.length) % playlist.length;
    load(cur, playing);
  });
}

// Next button
const nextBtn = document.getElementById('bN');
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    
    if (shuffling) {
      let newCur;
      do {
        newCur = Math.floor(Math.random() * playlist.length);
      } while (playlist.length > 1 && newCur === cur);
      cur = newCur;
    } else {
      cur = (cur + 1) % playlist.length;
    }
    load(cur, playing);
  });
}

// Loop button
const loopBtn = document.getElementById('bL');
if (loopBtn) {
  loopBtn.addEventListener('click', function () {
    looping = !looping;
    audio.loop = looping;
    this.classList.toggle('on', looping);
  });
}

// Shuffle button
const shuffleBtn = document.getElementById('bS');
if (shuffleBtn) {
  shuffleBtn.addEventListener('click', function () {
    shuffling = !shuffling;
    this.classList.toggle('on', shuffling);
  });
}

// Volume control
if (volSlider) {
  volSlider.addEventListener('input', function () {
    const volume = this.value / 100;
    audio.volume = volume;
    updateVolumeIcon(volume);
  });
  
  // Initialize volume icon
  updateVolumeIcon(audio.volume);
}

// Click volume icon to mute/unmute
if (volIcon) {
  volIcon.addEventListener('click', () => {
    if (audio.volume > 0) {
      audio.volume = 0;
      if (volSlider) volSlider.value = 0;
      updateVolumeIcon(0);
    } else {
      audio.volume = 0.8;
      if (volSlider) volSlider.value = 80;
      updateVolumeIcon(0.8);
    }
  });
}

// Update progress bar dengan animasi halus
let updateInterval;
audio.addEventListener('play', () => {
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(() => {
    if (!audio.paused && audio.duration) {
      const percent = (audio.currentTime / audio.duration) * 100;
      if (filEl) filEl.style.width = percent + '%';
      if (tcEl) tcEl.textContent = fmt(audio.currentTime);
    }
  }, 100);
});

audio.addEventListener('pause', () => {
  if (updateInterval) clearInterval(updateInterval);
});

// Update progress bar ketika waktu update
audio.addEventListener('timeupdate', () => {
  if (audio.duration && !isNaN(audio.duration)) {
    filEl.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
    tcEl.textContent  = fmt(audio.currentTime);
    tdEl.textContent  = fmt(audio.duration);
  }
});

// Metadata loaded
audio.addEventListener('loadedmetadata', () => {
  updateTimeDisplay();
});

// Klik progress bar untuk seek
if (trkEl) {
  trkEl.addEventListener('click', e => {
    if (!audio.duration) return;
    const rect = trkEl.getBoundingClientRect();
    const seekTo = ((e.clientX - rect.left) / rect.width) * audio.duration;
    audio.currentTime = Math.max(0, Math.min(seekTo, audio.duration));
  });
  
  // Drag progress bar
  let isDragging = false;
  trkEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = trkEl.getBoundingClientRect();
    const seekTo = ((e.clientX - rect.left) / rect.width) * audio.duration;
    audio.currentTime = Math.max(0, Math.min(seekTo, audio.duration));
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging && audio.duration) {
      const rect = trkEl.getBoundingClientRect();
      let seekTo = ((e.clientX - rect.left) / rect.width) * audio.duration;
      seekTo = Math.max(0, Math.min(seekTo, audio.duration));
      audio.currentTime = seekTo;
    }
  });
}

// Lagu selesai → lanjut otomatis
audio.addEventListener('ended', () => {
  if (!looping) {
    if (shuffling && playlist.length > 1) {
      let newCur;
      do {
        newCur = Math.floor(Math.random() * playlist.length);
      } while (newCur === cur);
      cur = newCur;
    } else {
      cur = (cur + 1) % playlist.length;
    }
    load(cur, true);
  }
});

// Handle error saat loading audio
audio.addEventListener('error', (e) => {
  console.error("Audio error:", e);
  ttlEl.textContent = "Error loading track";
  artEl.textContent = "Check file path";
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Space bar untuk play/pause
  if (e.code === 'Space' && document.activeElement !== playBtn) {
    e.preventDefault();
    if (playBtn) playBtn.click();
  }
  // Left arrow untuk previous
  else if (e.code === 'ArrowLeft') {
    if (prevBtn) prevBtn.click();
  }
  // Right arrow untuk next
  else if (e.code === 'ArrowRight') {
    if (nextBtn) nextBtn.click();
  }
});

// ── Inisialisasi awal ──
if (playlist.length > 0) {
  load(cur, false);
} else {
  if (ttlEl) ttlEl.textContent = "Belum ada lagu";
  if (artEl) artEl.textContent = "Isi songs.js terlebih dahulu";
}