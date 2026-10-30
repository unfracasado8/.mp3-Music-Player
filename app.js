// --- SISTEMA MULTI-IDIOMA (i18n) ---
const translations = {
    es: {
        noTrack: "Sin Canción",
        uploadPrompt: "Carga tus archivos MP3",
        titleFiles: "📁 Gestión de Archivos",
        dropZoneText: "Arrastrá tus .mp3 acá o hacé Click",
        titleFx: "🎛️ Ecualizador & Efectos",
        eqBass: "Graves (Bass)",
        eqMid: "Medios (Mid)",
        eqTreble: "Agudos (Treble)",
        fxSpeed: "Velocidad (Tono)",
        titleLyrics: "🎤 Letras (Lyrics)",
        lyricsWelcome: "Cargá canciones en tu lista y dale play para ver la magia.",
        localTrack: "Archivo de Audio Local",
        lyricsTemplate: "[Letras para {name}]<br><br>♫ Larala laraaa... ♫<br>Disfrutando de la música en tu OS."
    },
    en: {
        noTrack: "No Track Selected",
        uploadPrompt: "Upload your MP3 files",
        titleFiles: "📁 File Management",
        dropZoneText: "Drag your .mp3 here or Click",
        titleFx: "🎛️ Equalizer & Effects",
        eqBass: "Bass",
        eqMid: "Mids",
        eqTreble: "Treble",
        fxSpeed: "Speed (Pitch)",
        titleLyrics: "🎤 Lyrics",
        lyricsWelcome: "Load tracks into your list and press play to see the magic.",
        localTrack: "Local Audio File",
        lyricsTemplate: "[Lyrics for {name}]<br><br>♫ Larala laraaa... ♫<br>Enjoying music inside your OS."
    }
};

let currentLang = 'es'; // Idioma por defecto

function toggleLanguage() {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    updateUIStrings();
}

function updateUIStrings() {
    // Buscar todos los elementos que necesitan traducción en el HTML
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            element.innerHTML = translations[currentLang][key];
        }
    });

    // Actualizar dinámicamente los textos cambiantes del reproductor si no hay track activo
    if (playlist.length === 0) {
        trackTitle.textContent = translations[currentLang].noTrack;
        trackArtist.textContent = translations[currentLang].uploadPrompt;
        lyricsBox.innerHTML = translations[currentLang].lyricsWelcome;
    } else {
        trackArtist.textContent = translations[currentLang].localTrack;
        const file = playlist[currentIndex];
        lyricsBox.innerHTML = translations[currentLang].lyricsTemplate.replace('{name}', file.name);
    }
}


// --- MOTOR DE AUDIO Y VARIABLES NATIVAS ---
let audioCtx;
let trackSource;
let bassFilter, midFilter, trebleFilter;

const audio = new Audio();
const btnPlay = document.getElementById('btnPlay');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationTimeEl = document.getElementById('durationTime');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const playlistView = document.getElementById('playlistView');
const albumArt = document.getElementById('albumArt');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const lyricsBox = document.getElementById('lyricsBox');
const btnLang = document.getElementById('btnLang');

let playlist = [];
let currentIndex = 0;

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
    if(playlist.length === 0) return;
    currentIndex = index;
    const file = playlist[currentIndex];
    
    const fileURL = URL.createObjectURL(file);
    audio.src = fileURL;
    
    trackTitle.textContent = file.name.replace('.mp3', '');
    trackArtist.textContent = translations[currentLang].localTrack;
    albumArt.classList.add('playing');
    
    lyricsBox.innerHTML = translations[currentLang].lyricsTemplate.replace('{name}', file.name);

    document.querySelectorAll('.playlist-ul li').forEach((li, i) => {
        li.classList.toggle('active', i === currentIndex);
    });

    initAudioEngine();
    audio.play();
    btnPlay.textContent = '⏸';
}

// Escuchador para el botón de cambio de idioma
btnLang.addEventListener('click', toggleLanguage);

btnPlay.addEventListener('click', () => {
    initAudioEngine();
    if (audio.paused && playlist.length > 0) {
        audio.play();
        btnPlay.textContent = '⏸';
        albumArt.classList.add('playing');
    } else {
        audio.pause();
        btnPlay.textContent = '▶';
        albumArt.classList.remove('playing');
    }
});

btnNext.addEventListener('click', () => {
    if(playlist.length === 0) return;
    let nextIndex = (currentIndex + 1) % playlist.length;
    loadTrack(nextIndex);
});

btnPrev.addEventListener('click', () => {
    if(playlist.length === 0) return;
    let prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadTrack(prevIndex);
});

audio.addEventListener('timeupdate', () => {
    if(isNaN(audio.duration)) return;
    progressBar.max = audio.duration;
    progressBar.value = audio.currentTime;
    
    let curMin = Math.floor(audio.currentTime / 60);
    let curSec = Math.floor(audio.currentTime % 60);
    let durMin = Math.floor(audio.duration / 60);
    let durSec = Math.floor(audio.duration % 60);
    
    currentTimeEl.textContent = `${curMin}:${curSec < 10 ? '0' : ''}${curSec}`;
    durationTimeEl.textContent = `${durMin}:${durSec < 10 ? '0' : ''}${durSec}`;
});

progressBar.addEventListener('input', () => {
    audio.currentTime = progressBar.value;
    initAudioEngine();
});

audio.addEventListener('ended', () => {
    btnNext.click();
});

document.getElementById('eqBass').addEventListener('input', (e) => {
    if(bassFilter) bassFilter.gain.value = e.target.value;
});
document.getElementById('eqMid').addEventListener('input', (e) => {
    if(midFilter) midFilter.gain.value = e.target.value;
});
document.getElementById('eqTreble').addEventListener('input', (e) => {
    if(trebleFilter) trebleFilter.gain.value = e.target.value;
});
document.getElementById('speedControl').addEventListener('input', (e) => {
    audio.playbackRate = e.target.value;
    document.getElementById('speedVal').textContent = e.target.value + 'x';
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
    const mp3Files = Array.from(files).filter(file => file.type === "audio/mpeg" || file.name.endsWith('.mp3'));
    if(mp3Files.length === 0) return;

    playlist = [...playlist, ...mp3Files];
    updatePlaylistUI();

    if(audio.paused && audio.src === "") {
        loadTrack(playlist.length - mp3Files.length);
    }
}

function updatePlaylistUI() {
    playlistView.innerHTML = "";
    playlist.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = `🎵 ${file.name.replace('.mp3', '')}`;
        if(index === currentIndex && audio.src !== "") li.classList.add('active');
        
        li.addEventListener('click', () => {
            loadTrack(index);
        });
        playlistView.appendChild(li);
    });
}
