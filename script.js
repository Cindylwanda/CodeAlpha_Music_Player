const PLAYLIST = [
    { src: 'Music/song1.mp3' },
    { src: 'Music/song2.mp3' },
    { src: 'Music/song3.mp3' },
    { src: 'Music/song4.mp3' },
    { src: 'Music/song5.mp3' },
    { src: 'Music/song6.mp3' }
];

const audio = new Audio();
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const playlistEl = document.getElementById('playlist');
const playlistCount = document.getElementById('playlistCount');
const volumeSlider = document.getElementById('volumeSlider');
const volumeDisplay = document.getElementById('volumeDisplay');
const autoplayToggle = document.getElementById('autoplayToggle');
const autoplayStatus = document.getElementById('autoplayStatus');
const player = document.getElementById('musicPlayer');

let currentIndex = 0;
let isPlaying = false;
let isDragging = false;
let autoplayEnabled = false;
let metadataCache = [];

function extractMetadata(filePath, index) {
    return new Promise((resolve) => {
        jsmediatags.read(filePath, {
            onSuccess: function(tag) {
                const tags = tag.tags;
                resolve({
                    title: tags.title || `Track ${index + 1}`,
                    artist: tags.artist || 'Unknown Artist',
                    album: tags.album || '',
                    year: tags.year || '',
                    genre: tags.genre || '',
                    picture: tags.picture || null,
                    duration: '0:00'
                });
            },
            onError: function(error) {
                const fallbackTitle = filePath.split('/').pop().replace(/\.[^/.]+$/, '');
                resolve({
                    title: fallbackTitle,
                    artist: 'Unknown Artist',
                    album: '',
                    year: '',
                    genre: '',
                    picture: null,
                    duration: '0:00'
                });
            }
        });
    });
}

async function loadAllMetadata() {
    const promises = PLAYLIST.map((track, index) => extractMetadata(track.src, index));
    metadataCache = await Promise.all(promises);
    renderPlaylist();
    loadTrack(0);
    isPlaying = false;
    updatePlayButton();
    player.classList.remove('playing');
}

function renderPlaylist() {
    playlistEl.innerHTML = '';
    metadataCache.forEach((track, index) => {
        const li = document.createElement('li');
        li.dataset.index = index;
        li.innerHTML = `
            <span class="track-info">
                <span class="index">${String(index + 1).padStart(2, '0')}</span>
                <span class="title">${track.title}</span>
                <span class="artist">${track.artist}</span>
            </span>
            <span class="duration">${track.duration || '0:00'}</span>
            <span class="play-indicator">▶</span>
        `;
        li.addEventListener('click', () => playTrack(index));
        playlistEl.appendChild(li);
    });
    playlistCount.textContent = `${metadataCache.length} tracks`;
    highlightActiveTrack();
}

function highlightActiveTrack() {
    const items = playlistEl.querySelectorAll('li');
    items.forEach((li, i) => {
        li.classList.toggle('active', i === currentIndex);
    });
}

function loadTrack(index) {
    const track = PLAYLIST[index];
    const meta = metadataCache[index];
    if (!track || !meta) return;

    audio.src = track.src;
    songTitle.textContent = meta.title;
    songArtist.textContent = meta.artist;
    totalDurationEl.textContent = meta.duration || '0:00';
    currentTimeEl.textContent = '0:00';
    progressFill.style.width = '0%';
    currentIndex = index;
    highlightActiveTrack();

    if (audio.readyState >= 2) {
        updateDurationDisplay();
    }
}

function playTrack(index) {
    if (index !== currentIndex) {
        loadTrack(index);
    }
    audio.play().catch(err => {
        if (err.name === 'NotSupportedError' || err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            alert('Audio file not found!\n\nMake sure your MP3 files are in the "Music" folder.');
        }
    });
    isPlaying = true;
    updatePlayButton();
    player.classList.add('playing');
}

function togglePlay() {
    if (audio.src === '') {
        loadTrack(0);
    }

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        player.classList.remove('playing');
    } else {
        audio.play().catch(err => {
            if (err.name === 'NotSupportedError' || err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                alert('Audio file not found!\n\nMake sure your MP3 files are in the "Music" folder.');
            }
        });
        isPlaying = true;
        player.classList.add('playing');
    }
    updatePlayButton();
}

function updatePlayButton() {
    playBtn.textContent = isPlaying ? '⏸' : '▶';
}

function prevTrack() {
    const newIndex = (currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    playTrack(newIndex);
}

function nextTrack() {
    const newIndex = (currentIndex + 1) % PLAYLIST.length;
    playTrack(newIndex);
}

function updateProgress() {
    if (isDragging) return;
    if (audio.duration && !isNaN(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = percent + '%';
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalDurationEl.textContent = formatTime(audio.duration);

        if (metadataCache[currentIndex]) {
            metadataCache[currentIndex].duration = formatTime(audio.duration);
        }
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

function updateDurationDisplay() {
    if (audio.duration && !isNaN(audio.duration)) {
        totalDurationEl.textContent = formatTime(audio.duration);
        if (metadataCache[currentIndex]) {
            metadataCache[currentIndex].duration = formatTime(audio.duration);
        }
        updatePlaylistDuration(currentIndex, formatTime(audio.duration));
    }
}

function updatePlaylistDuration(index, duration) {
    const items = playlistEl.querySelectorAll('li');
    if (items[index]) {
        const durationSpan = items[index].querySelector('.duration');
        if (durationSpan) {
            durationSpan.textContent = duration;
        }
    }
}

function setProgress(e) {
    const rect = progressBar.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    if (audio.duration && !isNaN(audio.duration)) {
        audio.currentTime = x * audio.duration;
        progressFill.style.width = (x * 100) + '%';
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
}

progressBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    setProgress(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) setProgress(e);
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        if (audio.duration) {
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    }
});

progressBar.addEventListener('touchstart', (e) => {
    isDragging = true;
    const touch = e.touches[0];
    setProgress({ clientX: touch.clientX });
});

progressBar.addEventListener('touchmove', (e) => {
    if (isDragging) {
        const touch = e.touches[0];
        setProgress({ clientX: touch.clientX });
    }
});

progressBar.addEventListener('touchend', () => {
    isDragging = false;
});

volumeSlider.addEventListener('input', () => {
    const val = parseInt(volumeSlider.value);
    audio.volume = val / 100;
    volumeDisplay.textContent = val + '%';
});

audio.volume = 0.7;

autoplayToggle.addEventListener('change', () => {
    autoplayEnabled = autoplayToggle.checked;
    autoplayStatus.textContent = autoplayEnabled ? 'on' : 'off';
});

audio.addEventListener('ended', () => {
    if (autoplayEnabled) {
        nextTrack();
    } else {
        isPlaying = false;
        updatePlayButton();
        player.classList.remove('playing');
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        audio.currentTime = 0;
    }
});

audio.addEventListener('timeupdate', updateProgress);

audio.addEventListener('loadedmetadata', () => {
    updateDurationDisplay();
    if (audio.duration && !isNaN(audio.duration)) {
        totalDurationEl.textContent = formatTime(audio.duration);
        if (metadataCache[currentIndex]) {
            metadataCache[currentIndex].duration = formatTime(audio.duration);
        }
        updatePlaylistDuration(currentIndex, formatTime(audio.duration));
    }
});

audio.addEventListener('error', (e) => {
    if (autoplayEnabled) {
        nextTrack();
    } else {
        isPlaying = false;
        updatePlayButton();
        player.classList.remove('playing');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        togglePlay();
    }
    if (e.key === 'ArrowRight') nextTrack();
    if (e.key === 'ArrowLeft') prevTrack();
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 5);
        volumeSlider.dispatchEvent(new Event('input'));
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 5);
        volumeSlider.dispatchEvent(new Event('input'));
    }
});

async function init() {
    try {
        if (typeof jsmediatags === 'undefined') {
            PLAYLIST.forEach((track, index) => {
                const filename = track.src.split('/').pop().replace(/\.[^/.]+$/, '');
                metadataCache[index] = {
                    title: filename,
                    artist: 'Unknown Artist',
                    duration: '0:00'
                };
            });
            renderPlaylist();
            loadTrack(0);
            isPlaying = false;
            updatePlayButton();
            player.classList.remove('playing');
            return;
        }

        await loadAllMetadata();
    } catch (error) {
        PLAYLIST.forEach((track, index) => {
            const filename = track.src.split('/').pop().replace(/\.[^/.]+$/, '');
            metadataCache[index] = {
                title: filename,
                artist: 'Unknown Artist',
                duration: '0:00'
            };
        });
        renderPlaylist();
        loadTrack(0);
        isPlaying = false;
        updatePlayButton();
        player.classList.remove('playing');
    }
}

init();