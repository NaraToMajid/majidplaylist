// ============================================================
//  DAFTAR LAGU — edit bagian ini untuk menambahkan lagu
//
//  Setiap lagu memiliki 4 properti:
//    title  : judul lagu (teks bebas)
//    artist : nama artis (teks bebas)
//    cover  : nama file gambar cover  → taruh di folder covers/
//    src    : nama file audio         → taruh di folder songs/
//
//  Format cover yang didukung : jpg · jpeg · png · webp · avif
//  Format audio yang didukung : mp3 · ogg · flac · wav · m4a
// ============================================================

const songs = [

  { title: "Secret Door", artist: "Arctic Monkeys", cover: "cover1.webp", src: "musik1.mp3" },

  { title: "As The World Caves In", artist: "Matt Maltese", cover: "cover2.webp", src: "musik2.mp3" },

  { title: "Best Friend", artist: "Rex Orange County", cover: "cover3.webp", src: "musik3.mp3" },

  { title: "Heather", artist: "Conan Gray", cover: "cover4.webp", src: "musik4.mp3" },

];

// ============================================================
//  Folder tempat file disimpan (ubah jika perlu)
// ============================================================
const COVER_DIR = "covers/";   // folder untuk gambar cover
const SONG_DIR  = "songs/";    // folder untuk file audio
