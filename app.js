const translations = {
    es: {
        noTrack: "Sin Canción",
        uploadPrompt: "Carga tus archivos MP3",
        titlePlaylists: "🗂️ Listas de Reproducción",
        titleFiles: "📁 Gestión de Archivos",
        dropZoneText: "Arrastrá tus .mp3 acá o hacé Click",
        titleFx: "🎛️ Ecualizador & Efectos",
        eqBass: "Graves (Bass)",
        eqMid: "Medios (Mid)",
        eqTreble: "Agudos (Treble)",
        fxSpeed: "Velocidad (Tono)",
        titleLyrics: "🎤 Letras (Lyrics)",
        lyricsWelcome: "Cargá canciones en tu lista y dale play para ver la magia.",
        lyricsTemplate: "[Letras para {name}]<br><br>♫ Larala laraaa... ♫<br>Disfrutando en tu OS."
    },
    en: {
        noTrack: "No Track Selected",
        uploadPrompt: "Upload your MP3 files",
        titlePlaylists: "🗂️ Playlists",
        titleFiles: "📁 File Management",
        dropZoneText: "Drag your .mp3 here or Click",
        titleFx: "🎛️ Equalizer & Effects",
        eqBass: "Bass",
        eqMid: "Mids",
        eqTreble: "Treble",
        fxSpeed: "Speed (Pitch)",
        titleLyrics: "🎤 Lyrics",
        lyricsWelcome: "Load tracks into your list and press play to see the magic.",
        lyricsTemplate: "[Lyrics for {name}]<br><br>♫ Larala laraaa... ♫<br>Enjoying music inside your OS."
    }
};

let currentLang = 'es';
let audioCtx, trackSource, bassFilter, midFilter, trebleFilter;

const audio = new Audio();
const btnPlay = document.getElementById('btnPlay');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnShuffle = document.getElementById('btnShuffle');
const btnLoop = document.getElementById('btnLoop');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationTimeEl = document.getElementById('durationTime');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const playlistView = document.getElementById('playlistView');
const albumArt = document.getElementById('albumArt');
const artImage = document.getElementById('artImage');
const artPlaceholder = document.getElementById('artPlaceholder');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackAlbum = document.getElementById('trackAlbum');
const lyricsBox = document.getElementById('lyricsBox');
const btnLang = document.getElementById('btnLang');
const playlistSelector = document.getElementById('playlistSelector');
const playlistNameInput = document.getElementById('playlistNameInput');
const btnAddPlaylist = document.getElementById('btnAddPlaylist');

// Sistema de Playlists en memoria
// Cargar listas guardadas o empezar de cero si es la primera vez
let savedPlaylists = localStorage.getItem('player_playlists');
let playlistsData = savedPlaylists ? JSON.parse(savedPlaylists) : { "Default": [] };

// Como localStorage no guarda los archivos reales, los reseteamos a vacíos pero mantenemos los nombres de tus listas
Object.keys(playlistsData).forEach(key => {
    playlistsData[key] = [];
});

let currentPlaylistName = Object.keys(playlistsData)[0] || "Default";
let currentIndex = 0;
let isShuffle = false;
let isLoop = false;

function initAudioEngine() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    trackSource = audioCtx.createMediaElementSource(audio);

    bassFilter = audioCtx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 200;

    midFilter = audioCtx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.Q.value = 1.0;
    midFilter.frequency.value = 1000;

    trebleFilter = audioCtx.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3000;

    trackSource.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);
    trebleFilter.connect(audioCtx.destination);
}
function loadTrack(index) {
    const list = playlistsData[currentPlaylistName];
    if(!list || list.length === 0) return;
    currentIndex = index;
    const file = list[currentIndex];
    
    // 1. REPRODUCCIÓN INMEDIATA (Evita que se quede colgado)
    audio.src = URL.createObjectURL(file);
    initAudioEngine();
    audio.play();
    btnPlay.textContent = '⏸';
    albumArt.classList.add('playing');
    
    // 2. TEXTOS POR DEFECTO (Mientras lee o por si no tiene tags)
    const defaultArtist = currentLang === 'es' ? "Audio Local" : "Local Audio";
    trackTitle.textContent = file.name.replace('.mp3', '');
    trackArtist.textContent = defaultArtist;
    trackAlbum.textContent = "";
    artImage.style.display = "none";
    artPlaceholder.style.display = "block";

    // 3. LECTURA SEGURO EN SEGUNDO PLANO
    try {
        if (window.jsmediatags) {
            window.jsmediatags.read(file, {
                onSuccess: function(tag) {
                    if(tag.tags.title) trackTitle.textContent = tag.tags.title;
                    if(tag.tags.artist) trackArtist.textContent = tag.tags.artist;
                    if(tag.tags.album) trackAlbum.textContent = tag.tags.album;
                    
                    // Procesar carátula si existe
                    const image = tag.tags.picture;
                    if (image) {
                        let base64String = "";
                        for (let i = 0; i < image.data.length; i++) {
                            base64String += String.fromCharCode(image.data[i]);
                        }
                        const base64 = "data:" + image.format + ";base64," + window.btoa(base64String);
                        artImage.src = base64;
                        artImage.style.display = "block";
                        artPlaceholder.style.display = "none";
                    }
                },
                onError: function(error) {
                    console.log("No se encontraron metadatos, usando los de por defecto.");
                    trackArtist.textContent = defaultArtist;
                }
            });
        }
    } catch (e) {
        console.error("Error con jsmediatags:", e);
        trackArtist.textContent = defaultArtist;
    }
    
    lyricsBox.innerHTML = translations[currentLang].lyricsTemplate.replace('{name}', file.name);
    updatePlaylistUI();
}


// Botones e Interfaz
btnPlay.addEventListener('click', () => {
    initAudioEngine();
    const list = playlistsData[currentPlaylistName];
    if (audio.paused && list && list.length > 0) {
        audio.play();
        btnPlay.textContent = '⏸';
        albumArt.classList.add('playing');
    } else {
        audio.pause();
        btnPlay.textContent = '▶';
        albumArt.classList.remove('playing');
    }
});

btnShuffle.addEventListener('click', () => {
    isShuffle = !isShuffle;
    btnShuffle.classList.toggle('active', isShuffle);
});

btnLoop.addEventListener('click', () => {
    isLoop = !isLoop;
    btnLoop.classList.toggle('active', isLoop);
});

btnNext.addEventListener('click', () => {
    const list = playlistsData[currentPlaylistName];
    if(!list || list.length === 0) return;
    
    if (isLoop && !isShuffle) {
        loadTrack(currentIndex);
    } else if (isShuffle) {
        let rand = Math.floor(Math.random() * list.length);
        loadTrack(rand);
    } else {
        loadTrack((currentIndex + 1) % list.length);
    }
});

btnPrev.addEventListener('click', () => {
    const list = playlistsData[currentPlaylistName];
    if(!list || list.length === 0) return;
    loadTrack((currentIndex - 1 + list.length) % list.length);
});

audio.addEventListener('timeupdate', () => {
    if(isNaN(audio.duration)) return;
    progressBar.max = audio.duration;
    progressBar.value = audio.currentTime;
    let curMin = Math.floor(audio.currentTime / 60), curSec = Math.floor(audio.currentTime % 60);
    let durMin = Math.floor(audio.duration / 60), durSec = Math.floor(audio.duration % 60);
    currentTimeEl.textContent = `${curMin}:${curSec < 10 ? '0' : ''}${curSec}`;
    durationTimeEl.textContent = `${durMin}:${durSec < 10 ? '0' : ''}${durSec}`;
});

progressBar.addEventListener('input', () => { audio.currentTime = progressBar.value; });
audio.addEventListener('ended', () => { btnNext.click(); });

// Gestión de Multi-playlists
function renderSelectors() {
    playlistSelector.innerHTML = "";
    Object.keys(playlistsData).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        playlistSelector.appendChild(opt);
    });
    playlistSelector.value = currentPlaylistName;
}

btnAddPlaylist.addEventListener('click', () => {
    const name = playlistNameInput.value.trim();
    if(name && !playlistsData[name]) {
        playlistsData[name] = [];
        currentPlaylistName = name;
        playlistNameInput.value = "";
        
        // GUARDAR EN EL NAVEGADOR
        localStorage.setItem('player_playlists', JSON.stringify(playlistsData));
        
        renderSelectors();
        updatePlaylistUI();
    }
});


playlistSelector.addEventListener('change', (e) => {
    currentPlaylistName = e.target.value;
    currentIndex = 0;
    updatePlaylistUI();
});

// Drag & Drop
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
dropZone.addEventListener('dragover', (e) => e.preventDefault());
dropZone.addEventListener('drop', (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); });

function handleFiles(files) {
    const mp3Files = Array.from(files).filter(f => f.type === "audio/mpeg" || f.name.endsWith('.mp3'));
    if(mp3Files.length === 0) return;
    playlistsData[currentPlaylistName] = [...(playlistsData[currentPlaylistName] || []), ...mp3Files];
    updatePlaylistUI();
    if(audio.paused && audio.src === "") loadTrack(playlistsData[currentPlaylistName].length - mp3Files.length);
}

function updatePlaylistUI() {
    playlistView.innerHTML = "";
    const list = playlistsData[currentPlaylistName] || [];
    list.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = `🎵 ${file.name.replace('.mp3', '')}`;
        if(index === currentIndex && audio.src !== "") li.classList.add('active');
        li.addEventListener('click', () => loadTrack(index));
        playlistView.appendChild(li);
    });
}

// Idioma
btnLang.addEventListener('click', () => {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) el.innerHTML = translations[currentLang][key];
    });
});

// Inicio
renderSelectors();

// --- CONTROLES DE EFECTOS CORREGIDOS EN TIEMPO REAL ---

document.getElementById('eqBass').addEventListener('input', async (e) => {
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    if (bassFilter) {
        bassFilter.gain.value = parseFloat(e.target.value);
    }
});

document.getElementById('eqMid').addEventListener('input', async (e) => {
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    if (midFilter) {
        midFilter.gain.value = parseFloat(e.target.value);
    }
});

document.getElementById('eqTreble').addEventListener('input', async (e) => {
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    if (trebleFilter) {
        trebleFilter.gain.value = parseFloat(e.target.value);
    }
});

document.getElementById('speedControl').addEventListener('input', async (e) => {
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    audio.playbackRate = parseFloat(e.target.value);
    document.getElementById('speedVal').textContent = e.target.value + 'x';
});
