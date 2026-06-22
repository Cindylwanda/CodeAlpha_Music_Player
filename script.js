var SONG_FILES = [
    'Music/Ommema.mpeg',
    'Music/Wade in the water.mpeg',
    'Music/Jireh.mpeg',
    'Music/All that matters.mpeg',
    'Music/God will work it out.mpeg',
    'Music/Goals.mpeg'
];

var DEFAULT_PLAYLISTS = {
    'Favourites': [],
    'Most Played': [],
    'Recently Played': [],
    'Last Added': []
};

var songs = [];
var playlists = JSON.parse(localStorage.getItem('playlists')) || JSON.parse(JSON.stringify(DEFAULT_PLAYLISTS));
var queue = [];
var currentIndex = 0;
var isPlaying = false;
var shuffle = false;
var repeatMode = 0;
var volume = 70;
var currentCategory = 'all';
var menuSongId = null;

var audio = new Audio();
var homeView = document.getElementById('homeView');
var playerView = document.getElementById('playerView');
var miniPlayer = document.getElementById('miniPlayer');
var contentArea = document.getElementById('contentArea');
var backBtn = document.getElementById('backBtn');
var playerArtImg = document.getElementById('playerArtImg');
var playerSongTitle = document.getElementById('playerSongTitle');
var playerArtist = document.getElementById('playerArtist');
var progressSlider = document.getElementById('progressSlider');
var currentTimeDisplay = document.getElementById('currentTimeDisplay');
var durationDisplay = document.getElementById('durationDisplay');
var playBtn = document.getElementById('playBtn');
var prevBtn = document.getElementById('prevBtn');
var nextBtn = document.getElementById('nextBtn');
var shuffleBtn = document.getElementById('shuffleBtn');
var repeatBtn = document.getElementById('repeatBtn');
var volumeToggle = document.getElementById('volumeToggle');
var volumePopup = document.getElementById('volumePopup');
var volumeSlider = document.getElementById('volumeSlider');
var volumeDisplay = document.getElementById('volumeDisplay');
var volumeIcon = document.getElementById('volumeIcon');
var lyricsBtn = document.getElementById('lyricsBtn');
var lyricsContainer = document.getElementById('lyricsContainer');
var lyricsText = document.getElementById('lyricsText');
var miniPlay = document.getElementById('miniPlay');
var miniPrev = document.getElementById('miniPrev');
var miniNext = document.getElementById('miniNext');
var miniTitle = document.getElementById('miniTitle');
var miniArtist = document.getElementById('miniArtist');
var miniArt = document.getElementById('miniArt');
var miniProgressFill = document.getElementById('miniProgressFill');
var songMenuModal = document.getElementById('songMenuModal');
var addPlaylistModal = document.getElementById('addPlaylistModal');
var playlistList = document.getElementById('playlistList');
var newPlaylistName = document.getElementById('newPlaylistName');
var createPlaylistBtn = document.getElementById('createPlaylistBtn');
var closeMenuModal = document.getElementById('closeMenuModal');
var closePlaylistModal = document.getElementById('closePlaylistModal');
var songMenuList = document.getElementById('songMenuList');

// allow clicking the player title or mini title to start playback immediately
if (playerSongTitle) {
    playerSongTitle.style.cursor = 'pointer';
    playerSongTitle.addEventListener('click', function() {
        var song = getCurrentSong();
        if (!song) return;
        if (!isPlaying) {
            audio.play().then(function() {
                isPlaying = true;
                updatePlayButton();
            }).catch(function() {});
        }
    });
}
if (miniTitle) {
    miniTitle.style.cursor = 'pointer';
    miniTitle.addEventListener('click', function(e) {
        var song = getCurrentSong();
        if (!song) return;
        if (!isPlaying) {
            audio.play().then(function() {
                isPlaying = true;
                updatePlayButton();
            }).catch(function() {});
        }
        showPlayer();
    });
}

function saveState() {
    localStorage.setItem('songs', JSON.stringify(songs));
    localStorage.setItem('playlists', JSON.stringify(playlists));
    localStorage.setItem('queue', JSON.stringify(queue));
    localStorage.setItem('currentIndex', currentIndex);
    localStorage.setItem('shuffle', JSON.stringify(shuffle));
    localStorage.setItem('repeatMode', repeatMode);
    localStorage.setItem('volume', volume);
}

function getSong(id) {
    for (var i = 0; i < songs.length; i++) {
        if (songs[i].id === id) return songs[i];
    }
    return null;
}

function getCurrentSong() {
    if (queue.length) return queue[currentIndex] || null;
    if (songs.length) return songs[currentIndex] || null;
    return null;
}

function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function fetchAlbumArt(title, artist) {
    return new Promise(function(resolve) {
        var query = encodeURIComponent(title + ' ' + artist);
        var url = 'https://itunes.apple.com/search?term=' + query + '&limit=1&entity=song';
        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.results && data.results.length > 0) {
                    var art = data.results[0].artworkUrl100;
                    if (art) {
                        art = art.replace('100x100', '600x600');
                        resolve(art);
                        return;
                    }
                }
                resolve(null);
            })
            .catch(function() { resolve(null); });
    });
}

function generateFallbackArt(title) {
    var canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    var ctx = canvas.getContext('2d');
    var hue = (title.length * 37) % 360;
    var grad = ctx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, 'hsl(' + hue + ', 70%, 40%)');
    grad.addColorStop(1, 'hsl(' + ((hue + 40) % 360) + ', 70%, 25%)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var letter = title.charAt(0).toUpperCase();
    ctx.fillText(letter, 100, 105);
    return canvas.toDataURL('image/png');
}

function loadSong(index) {
    var song = queue.length ? queue[index] : songs[index];
    if (!song) return;
    audio.src = song.src;
    playerSongTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    miniTitle.textContent = song.title;
    miniArtist.textContent = song.artist;
    document.getElementById('playerTitle').textContent = song.title;

    if (song.cover) {
        playerArtImg.src = song.cover;
        playerArtImg.style.display = 'block';
        playerArtImg.textContent = '';
    } else {
        var fallback = generateFallbackArt(song.title);
        playerArtImg.src = fallback;
        playerArtImg.style.display = 'block';
        playerArtImg.textContent = '';
    }

    if (song.cover) {
        miniArt.src = song.cover;
        miniArt.style.display = 'block';
        miniArt.textContent = '';
    } else {
        miniArt.src = generateFallbackArt(song.title);
        miniArt.style.display = 'block';
        miniArt.textContent = '';
    }

    progressSlider.value = 0;
    currentTimeDisplay.textContent = '0:00';
    durationDisplay.textContent = '0:00';
    miniProgressFill.style.width = '0%';

    if (audio.readyState >= 2) {
        durationDisplay.textContent = formatTime(audio.duration);
    }

    updatePlayButton();
    saveState();
}

function playSong(index) {
  if (queue.length) {
    if (index >= queue.length) return;
    currentIndex = index;
  } else {
    if (index >= songs.length) return;
    currentIndex = index;
  }

  loadSong(currentIndex);

  
  try { audio.pause(); } catch (e) {}
  try { audio.load(); } catch (e) {}
  audio.currentTime = 0;

  audio.play().then(function() {
    isPlaying = true;
    updatePlayButton();
    miniPlayer.classList.add('active');
  }).catch(function(e) {
    console.warn('Playback error:', e);
    isPlaying = false;
    updatePlayButton();
  });

  // update UI/state optimistically
  isPlaying = true;
  updatePlayButton();
  updateRecentlyPlayed(getCurrentSong());
  updateMiniPlayer();
  saveState();
}
function togglePlay() {
    if (!getCurrentSong()) {
        if (songs.length) playSong(0);
        return;
    }
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play().then(function() {
            isPlaying = true;
            updatePlayButton();
        }).catch(function(e) {
            console.warn('Playback error:', e);
        });
        isPlaying = true;
    }
    updatePlayButton();
}

function nextSong() {
    if (queue.length) {
        if (currentIndex < queue.length - 1) {
            playSong(currentIndex + 1);
        } else if (repeatMode === 1) {
            playSong(0);
        } else if (repeatMode === 2) {
            audio.currentTime = 0;
            audio.play().catch(function() {});
            return;
        } else {
            if (songs.length) {
                var current = getCurrentSong();
                var idx = -1;
                for (var i = 0; i < songs.length; i++) {
                    if (songs[i].id === current.id) { idx = i; break; }
                }
                var nextIdx = (idx + 1) % songs.length;
                playSong(nextIdx);
            }
        }
    } else {
        if (repeatMode === 2) {
            audio.currentTime = 0;
            audio.play().catch(function() {});
            return;
        }
        var nextIdx = (currentIndex + 1) % songs.length;
        playSong(nextIdx);
    }
}

function prevSong() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    if (queue.length) {
        var prevIdx = (currentIndex - 1 + queue.length) % queue.length;
        playSong(prevIdx);
    } else {
        var prevIdx = (currentIndex - 1 + songs.length) % songs.length;
        playSong(prevIdx);
    }
}

function updatePlayButton() {
    var icon = isPlaying ? 'fa-pause' : 'fa-play';
    playBtn.querySelector('i').className = 'fas ' + icon;
    miniPlay.querySelector('i').className = 'fas ' + icon;
}

function updateProgress() {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    progressSlider.value = pct;
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
    durationDisplay.textContent = formatTime(audio.duration);
    miniProgressFill.style.width = pct + '%';
}

function updateRecentlyPlayed(song) {
    if (!song) return;
    var rp = playlists['Recently Played'] || [];
    rp = rp.filter(function(s) { return s.id !== song.id; });
    rp.unshift(song);
    if (rp.length > 50) rp.pop();
    playlists['Recently Played'] = rp;
    saveState();
}

function updateMostPlayed(song) {
    if (!song) return;
    var mp = playlists['Most Played'] || [];
    var existing = null;
    for (var i = 0; i < mp.length; i++) {
        if (mp[i].id === song.id) { existing = mp[i]; break; }
    }
    if (existing) {
        existing.count = (existing.count || 0) + 1;
    } else {
        var copy = JSON.parse(JSON.stringify(song));
        copy.count = 1;
        mp.push(copy);
    }
    mp.sort(function(a, b) { return (b.count || 0) - (a.count || 0); });
    playlists['Most Played'] = mp;
    saveState();
}

function updateLastAdded(song) {
    if (!song) return;
    var la = playlists['Last Added'] || [];
    la = la.filter(function(s) { return s.id !== song.id; });
    la.unshift(song);
    if (la.length > 50) la.pop();
    playlists['Last Added'] = la;
    saveState();
}

function toggleShuffle() {
    shuffle = !shuffle;
    if (shuffle) shuffleBtn.classList.add('active');
    else shuffleBtn.classList.remove('active');
    saveState();
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    if (repeatMode > 0) repeatBtn.classList.add('active');
    else repeatBtn.classList.remove('active');
    if (repeatMode === 2) {
        repeatBtn.innerHTML = '<i class="fas fa-redo"></i><sup>1</sup>';
    } else {
        repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
    }
    saveState();
}

function setVolume(val) {
    volume = val;
    audio.volume = val / 100;
    volumeSlider.value = val;
    volumeDisplay.textContent = val + '%';
    var icon = val === 0 ? 'fa-volume-mute' : val < 50 ? 'fa-volume-down' : 'fa-volume-up';
    volumeIcon.className = 'fas ' + icon;
    saveState();
}

function renderHome() {
    contentArea.innerHTML = '';
    if (currentCategory === 'all') renderAllSongs();
    else if (currentCategory === 'playlists') renderPlaylists();
    else if (currentCategory === 'albums') renderAlbums();
    else if (currentCategory === 'artists') renderArtists();
    else if (currentCategory === 'genres') renderGenres();
    updateMiniPlayer();
}

function renderAllSongs() {
    var ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    for (var i = 0; i < songs.length; i++) {
        var li = createSongItem(songs[i]);
        ul.appendChild(li);
    }
    contentArea.appendChild(ul);
}

function createSongItem(song) {
    var li = document.createElement('li');
    li.className = 'song-item';
    li.dataset.id = song.id;
    var art = document.createElement('div');
    art.className = 'art';
    if (song.cover) {
        art.style.backgroundImage = 'url(' + song.cover + ')';
        art.style.backgroundSize = 'cover';
        art.textContent = '';
    } else {
        art.textContent = '🎵';
    }
    var info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = '<div class="title">' + song.title + '</div><div class="artist">' + song.artist + '</div>';
    // make the title text itself clickable (start playback immediately)
    (function() {
        var titleEl = null;
        try { titleEl = info.querySelector('.title'); } catch (e) { titleEl = null; }
        if (titleEl) {
            titleEl.style.cursor = 'pointer';
            titleEl.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                if (queue.length) queue = [];
                var idx = -1;
                for (var i = 0; i < songs.length; i++) {
                    if (songs[i].id === song.id) { idx = i; break; }
                }
                if (idx !== -1) {
                    playSong(idx);
                    showPlayer();
                }
            });
        }
    })();
    var menu = document.createElement('button');
    menu.className = 'menu-btn';
    menu.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        openSongMenu(song.id);
    });
    li.appendChild(art);
    li.appendChild(info);
    li.appendChild(menu);
    li.addEventListener('click', function() {
        if (queue.length) queue = [];
        var idx = -1;
        for (var i = 0; i < songs.length; i++) {
            if (songs[i].id === song.id) { idx = i; break; }
        }
        if (idx !== -1) {
            playSong(idx);
            showPlayer();
        }
    });
    return li;
}
function renderPlaylists() {
    var container = document.createElement('div');
    var list = document.createElement('ul');
    list.style.listStyle = 'none';
    var defaultPlaylists = ['Favourites', 'Most Played', 'Recently Played', 'Last Added'];
    for (var i = 0; i < defaultPlaylists.length; i++) {
        var name = defaultPlaylists[i];
        var li = document.createElement('li');
        li.className = 'playlist-item';
        li.innerHTML = '<i class="fas fa-list" style="margin-right:12px;"></i> ' + name;
        li.addEventListener('click', function(n) {
            return function() {
                var songsInPlaylist = playlists[n] || [];
                showPlaylistSongs(n, songsInPlaylist);
            };
        }(name));
        list.appendChild(li);
    }
    var keys = Object.keys(playlists);
    for (var i = 0; i < keys.length; i++) {
        if (defaultPlaylists.indexOf(keys[i]) === -1) {
            var li = document.createElement('li');
            li.className = 'playlist-item';
            li.innerHTML = '<i class="fas fa-folder" style="margin-right:12px;"></i> ' + keys[i];
            li.addEventListener('click', function(n) {
                return function() {
                    var songsInPlaylist = playlists[n] || [];
                    showPlaylistSongs(n, songsInPlaylist);
                };
            }(keys[i]));
            list.appendChild(li);
        }
    }
    container.appendChild(list);
    contentArea.appendChild(container);
}

function showPlaylistSongs(name, songList) {
    contentArea.innerHTML = '';
    var back = document.createElement('button');
    back.textContent = '← Back';
    back.style.background = 'none';
    back.style.border = 'none';
    back.style.color = '#6c5ce7';
    back.style.fontSize = '16px';
    back.style.cursor = 'pointer';
    back.style.marginBottom = '16px';
    back.addEventListener('click', function() {
        currentCategory = 'playlists';
        renderHome();
    });
    contentArea.appendChild(back);
    var title = document.createElement('h2');
    title.textContent = name;
    title.style.marginBottom = '16px';
    contentArea.appendChild(title);
    if (!songList.length) {
        contentArea.innerHTML += '<p style="color:#aaa;">Empty playlist</p>';
        return;
    }
    var ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    for (var i = 0; i < songList.length; i++) {
        var li = createSongItem(songList[i]);
        ul.appendChild(li);
    }
    contentArea.appendChild(ul);
}

function renderAlbums() {
    var albums = [];
    for (var i = 0; i < songs.length; i++) {
        if (songs[i].album && albums.indexOf(songs[i].album) === -1) {
            albums.push(songs[i].album);
        }
    }
    var grid = document.createElement('div');
    grid.className = 'grid-view';
    for (var i = 0; i < albums.length; i++) {
        var div = document.createElement('div');
        div.className = 'grid-item';
        var cover = document.createElement('div');
        cover.className = 'cover';
        cover.textContent = '📀';
        var name = document.createElement('div');
        name.className = 'name';
        name.textContent = albums[i];
        var sub = document.createElement('div');
        sub.className = 'sub';
        var count = 0;
        for (var j = 0; j < songs.length; j++) {
            if (songs[j].album === albums[i]) count++;
        }
        sub.textContent = count + ' song' + (count > 1 ? 's' : '');
        div.appendChild(cover);
        div.appendChild(name);
        div.appendChild(sub);
        div.addEventListener('click', function(album) {
            return function() {
                var albumSongs = [];
                for (var k = 0; k < songs.length; k++) {
                    if (songs[k].album === album) albumSongs.push(songs[k]);
                }
                showAlbumSongs(album, albumSongs);
            };
        }(albums[i]));
        grid.appendChild(div);
    }
    contentArea.appendChild(grid);
}

function showAlbumSongs(album, songList) {
    contentArea.innerHTML = '';
    var back = document.createElement('button');
    back.textContent = '← Back';
    back.style.background = 'none';
    back.style.border = 'none';
    back.style.color = '#6c5ce7';
    back.style.fontSize = '16px';
    back.style.cursor = 'pointer';
    back.style.marginBottom = '16px';
    back.addEventListener('click', function() {
        currentCategory = 'albums';
        renderHome();
    });
    contentArea.appendChild(back);
    var title = document.createElement('h2');
    title.textContent = album;
    title.style.marginBottom = '16px';
    contentArea.appendChild(title);
    var ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    for (var i = 0; i < songList.length; i++) {
        var li = createSongItem(songList[i]);
        ul.appendChild(li);
    }
    contentArea.appendChild(ul);
}

function renderArtists() {
    var artists = [];
    for (var i = 0; i < songs.length; i++) {
        if (songs[i].artist && artists.indexOf(songs[i].artist) === -1) {
            artists.push(songs[i].artist);
        }
    }
    var grid = document.createElement('div');
    grid.className = 'grid-view';
    for (var i = 0; i < artists.length; i++) {
        var div = document.createElement('div');
        div.className = 'grid-item';
        var cover = document.createElement('div');
        cover.className = 'cover';
        cover.textContent = '👤';
        var name = document.createElement('div');
        name.className = 'name';
        name.textContent = artists[i];
        var sub = document.createElement('div');
        sub.className = 'sub';
        var count = 0;
        for (var j = 0; j < songs.length; j++) {
            if (songs[j].artist === artists[i]) count++;
        }
        sub.textContent = count + ' song' + (count > 1 ? 's' : '');
        div.appendChild(cover);
        div.appendChild(name);
        div.appendChild(sub);
        div.addEventListener('click', function(artist) {
            return function() {
                var artistSongs = [];
                for (var k = 0; k < songs.length; k++) {
                    if (songs[k].artist === artist) artistSongs.push(songs[k]);
                }
                showArtistSongs(artist, artistSongs);
            };
        }(artists[i]));
        grid.appendChild(div);
    }
    contentArea.appendChild(grid);
}

function showArtistSongs(artist, songList) {
    contentArea.innerHTML = '';
    var back = document.createElement('button');
    back.textContent = '← Back';
    back.style.background = 'none';
    back.style.border = 'none';
    back.style.color = '#6c5ce7';
    back.style.fontSize = '16px';
    back.style.cursor = 'pointer';
    back.style.marginBottom = '16px';
    back.addEventListener('click', function() {
        currentCategory = 'artists';
        renderHome();
    });
    contentArea.appendChild(back);
    var title = document.createElement('h2');
    title.textContent = artist;
    title.style.marginBottom = '16px';
    contentArea.appendChild(title);
    var ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    for (var i = 0; i < songList.length; i++) {
        var li = createSongItem(songList[i]);
        ul.appendChild(li);
    }
    contentArea.appendChild(ul);
}

function renderGenres() {
    var genres = [];
    for (var i = 0; i < songs.length; i++) {
        if (songs[i].genre && genres.indexOf(songs[i].genre) === -1) {
            genres.push(songs[i].genre);
        }
    }
    var grid = document.createElement('div');
    grid.className = 'grid-view';
    for (var i = 0; i < genres.length; i++) {
        var div = document.createElement('div');
        div.className = 'grid-item';
        var cover = document.createElement('div');
        cover.className = 'cover';
        cover.textContent = '🎶';
        var name = document.createElement('div');
        name.className = 'name';
        name.textContent = genres[i];
        var sub = document.createElement('div');
        sub.className = 'sub';
        var count = 0;
        for (var j = 0; j < songs.length; j++) {
            if (songs[j].genre === genres[i]) count++;
        }
        sub.textContent = count + ' song' + (count > 1 ? 's' : '');
        div.appendChild(cover);
        div.appendChild(name);
        div.appendChild(sub);
        div.addEventListener('click', function(genre) {
            return function() {
                var genreSongs = [];
                for (var k = 0; k < songs.length; k++) {
                    if (songs[k].genre === genre) genreSongs.push(songs[k]);
                }
                showGenreSongs(genre, genreSongs);
            };
        }(genres[i]));
        grid.appendChild(div);
    }
    contentArea.appendChild(grid);
}

function showGenreSongs(genre, songList) {
    contentArea.innerHTML = '';
    var back = document.createElement('button');
    back.textContent = '← Back';
    back.style.background = 'none';
    back.style.border = 'none';
    back.style.color = '#6c5ce7';
    back.style.fontSize = '16px';
    back.style.cursor = 'pointer';
    back.style.marginBottom = '16px';
    back.addEventListener('click', function() {
        currentCategory = 'genres';
        renderHome();
    });
    contentArea.appendChild(back);
    var title = document.createElement('h2');
    title.textContent = genre;
    title.style.marginBottom = '16px';
    contentArea.appendChild(title);
    var ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    for (var i = 0; i < songList.length; i++) {
        var li = createSongItem(songList[i]);
        ul.appendChild(li);
    }
    contentArea.appendChild(ul);
}

function openSongMenu(songId) {
    menuSongId = songId;
    songMenuModal.style.display = 'flex';
}

function closeSongMenu() {
    songMenuModal.style.display = 'none';
    menuSongId = null;
}

function openAddPlaylistModal() {
    closeSongMenu();
    addPlaylistModal.style.display = 'flex';
    renderPlaylistList();
}

function closeAddPlaylistModal() {
    addPlaylistModal.style.display = 'none';
}

function renderPlaylistList() {
    var list = document.getElementById('playlistList');
    list.innerHTML = '';
    var defaultNames = ['Favourites', 'Most Played', 'Recently Played', 'Last Added'];
    var allNames = defaultNames.slice();
    var keys = Object.keys(playlists);
    for (var i = 0; i < keys.length; i++) {
        if (defaultNames.indexOf(keys[i]) === -1) allNames.push(keys[i]);
    }
    for (var i = 0; i < allNames.length; i++) {
        var name = allNames[i];
        var li = document.createElement('li');
        li.textContent = name;
        li.addEventListener('click', function(n) {
            return function() {
                var song = getSong(menuSongId);
                if (!song) return;
                if (!playlists[n]) playlists[n] = [];
                var exists = false;
                for (var j = 0; j < playlists[n].length; j++) {
                    if (playlists[n][j].id === song.id) { exists = true; break; }
                }
                if (!exists) {
                    playlists[n].push(song);
                    saveState();
                    alert('Added "' + song.title + '" to "' + n + '"');
                } else {
                    alert('Already in this playlist');
                }
                closeAddPlaylistModal();
            };
        }(name));
        list.appendChild(li);
    }
}

createPlaylistBtn.addEventListener('click', function() {
    var name = newPlaylistName.value.trim();
    if (!name) return;
    if (playlists[name]) {
        alert('Playlist already exists');
        return;
    }
    playlists[name] = [];
    saveState();
    newPlaylistName.value = '';
    renderPlaylistList();
    alert('Playlist "' + name + '" created');
});

closeMenuModal.addEventListener('click', closeSongMenu);
closePlaylistModal.addEventListener('click', closeAddPlaylistModal);

songMenuList.addEventListener('click', function(e) {
    var target = e.target.closest('li');
    if (!target) return;
    var action = target.dataset.action;
    if (!action) return;
    var song = getSong(menuSongId);
    if (!song) return;
    switch (action) {
        case 'play':
            if (queue.length) queue = [];
            var idx = -1;
            for (var i = 0; i < songs.length; i++) {
                if (songs[i].id === song.id) { idx = i; break; }
            }
            if (idx !== -1) {
                playSong(idx);
                showPlayer();
            }
            break;
        case 'playnext':
            if (!queue.length) queue = songs.slice();
            var idx2 = -1;
            for (var i = 0; i < queue.length; i++) {
                if (queue[i].id === song.id) { idx2 = i; break; }
            }
            if (idx2 !== -1) queue.splice(idx2, 1);
            queue.splice(currentIndex + 1, 0, song);
            saveState();
            break;
        case 'addqueue':
            if (!queue.length) queue = songs.slice();
            queue.push(song);
            saveState();
            break;
        case 'addplaylist':
            openAddPlaylistModal();
            break;
        case 'delete':
            songs = songs.filter(function(s) { return s.id !== song.id; });
            queue = queue.filter(function(s) { return s.id !== song.id; });
            var keys = Object.keys(playlists);
            for (var i = 0; i < keys.length; i++) {
                playlists[keys[i]] = playlists[keys[i]].filter(function(s) { return s.id !== song.id; });
            }
            saveState();
            closeSongMenu();
            renderHome();
            if (!songs.length) {
                audio.pause();
                isPlaying = false;
                updatePlayButton();
                miniPlayer.classList.remove('active');
            } else {
                var current = getCurrentSong();
                if (current && current.id === song.id) {
                    playSong(0);
                }
            }
            break;
    }
    closeSongMenu();
});

function showPlayer() {
    homeView.classList.remove('active');
    playerView.classList.add('active');
    miniPlayer.classList.remove('active');
    var song = getCurrentSong();
    if (song) {
        loadSong(currentIndex);
        updateProgress();
    }
}

function showHome() {
    playerView.classList.remove('active');
    homeView.classList.add('active');
    miniPlayer.classList.add('active');
    renderHome();
}

backBtn.addEventListener('click', showHome);
playBtn.addEventListener('click', togglePlay);
miniPlay.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
miniPrev.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
miniNext.addEventListener('click', nextSong);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);

volumeToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    volumePopup.classList.toggle('show');
});

document.addEventListener('click', function(e) {
    if (!volumePopup.contains(e.target) && e.target !== volumeToggle) {
        volumePopup.classList.remove('show');
    }
});

// delegate clicks on song title text to play (robust for dynamically created items)
if (contentArea) {
    // use mousedown (earlier user gesture) to improve autoplay reliability
    contentArea.addEventListener('mousedown', function(e) {
        var titleEl = e.target.closest('.title');
        if (!titleEl) return;
        var li = titleEl.closest('.song-item');
        if (!li || !li.dataset.id) return;
        var id = li.dataset.id;
        var idx = -1;
        for (var i = 0; i < songs.length; i++) {
            if (songs[i].id === id) { idx = i; break; }
        }
        if (idx !== -1) {
            if (queue.length) queue = [];
            playSong(idx);
            showPlayer();
        }
    });
}

volumeSlider.addEventListener('input', function(e) {
    setVolume(parseInt(e.target.value));
});

progressSlider.addEventListener('input', function(e) {
    var pct = parseFloat(e.target.value);
    if (audio.duration) {
        audio.currentTime = (pct / 100) * audio.duration;
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
        miniProgressFill.style.width = pct + '%';
    }
});

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', function() {
    durationDisplay.textContent = formatTime(audio.duration);
    var song = getCurrentSong();
    if (song) {
        song.duration = formatTime(audio.duration);
        saveState();
    }
});
audio.addEventListener('ended', function() {
    if (repeatMode === 2) {
        audio.currentTime = 0;
        audio.play().catch(function() {});
        return;
    }
    if (shuffle) {
        var shuffleIndex = Math.floor(Math.random() * (queue.length || songs.length));
        if (queue.length) playSong(shuffleIndex);
        else playSong(shuffleIndex);
    } else {
        nextSong();
    }
});
audio.addEventListener('play', function() {
    isPlaying = true;
    updatePlayButton();
    var song = getCurrentSong();
    if (song) updateMostPlayed(song);
});
audio.addEventListener('pause', function() {
    isPlaying = false;
    updatePlayButton();
});
audio.addEventListener('error', function(e) {
    console.warn('Audio error:', e);
});

lyricsBtn.addEventListener('click', function() {
    var song = getCurrentSong();
    if (!song) return;
    if (lyricsContainer.style.display === 'none') {
        lyricsText.textContent = song.lyrics || 'No lyrics available for this song.';
        lyricsContainer.style.display = 'block';
    } else {
        lyricsContainer.style.display = 'none';
    }
});

function updateMiniPlayer() {
    var song = getCurrentSong();
    if (song) {
        miniPlayer.classList.add('active');
        miniTitle.textContent = song.title;
        miniArtist.textContent = song.artist;
        if (song.cover) {
            miniArt.src = song.cover;
            miniArt.style.display = 'block';
            miniArt.textContent = '';
        } else {
            miniArt.src = generateFallbackArt(song.title);
            miniArt.style.display = 'block';
            miniArt.textContent = '';
        }
    } else {
        miniPlayer.classList.remove('active');
    }
}

miniPlayer.addEventListener('click', function(e) {
    if (e.target.closest('button')) return;
    showPlayer();
});

var catBtns = document.querySelectorAll('.cat-btn');
for (var i = 0; i < catBtns.length; i++) {
    catBtns[i].addEventListener('click', function() {
        for (var j = 0; j < catBtns.length; j++) {
            catBtns[j].classList.remove('active');
        }
        this.classList.add('active');
        currentCategory = this.dataset.cat;
        renderHome();
    });
}

function extractMetadata(filePath) {
    return new Promise(function(resolve) {
        try {
            if (typeof jsmediatags !== 'undefined' && jsmediatags.read) {
                jsmediatags.read(filePath, {
                    onSuccess: function(tag) {
                        var tags = tag.tags;
                        var result = {
                            title: tags.title || filePath.split('/').pop().replace(/\.[^/.]+$/, ''),
                            artist: tags.artist || 'Unknown Artist',
                            album: tags.album || '',
                            genre: tags.genre || '',
                            year: tags.year || '',
                            picture: null,
                            duration: '0:00'
                        };
                        if (tags.picture) {
                            try {
                                var pic = tags.picture;
                                var base64 = '';
                                var bytes = new Uint8Array(pic.data);
                                for (var i = 0; i < bytes.length; i++) {
                                    base64 += String.fromCharCode(bytes[i]);
                                }
                                result.picture = 'data:' + pic.format + ';base64,' + btoa(base64);
                            } catch (e) {
                                result.picture = null;
                            }
                        }
                        resolve(result);
                    },
                    onError: function(error) {
                        var fallbackTitle = filePath.split('/').pop().replace(/\.[^/.]+$/, '');
                        resolve({
                            title: fallbackTitle,
                            artist: 'Unknown Artist',
                            album: '',
                            genre: '',
                            year: '',
                            picture: null,
                            duration: '0:00'
                        });
                    }
                });
            } else {
                var fallbackTitle = filePath.split('/').pop().replace(/\.[^/.]+$/, '');
                resolve({
                    title: fallbackTitle,
                    artist: 'Unknown Artist',
                    album: '',
                    genre: '',
                    year: '',
                    picture: null,
                    duration: '0:00'
                });
            }
        } catch (e) {
            var fallbackTitle = filePath.split('/').pop().replace(/\.[^/.]+$/, '');
            resolve({
                title: fallbackTitle,
                artist: 'Unknown Artist',
                album: '',
                genre: '',
                year: '',
                picture: null,
                duration: '0:00'
            });
        }
    });
}

async function loadAllMetadata() {
    var promises = [];
    for (var i = 0; i < SONG_FILES.length; i++) {
        promises.push(extractMetadata(SONG_FILES[i]));
    }
    var metadata = await Promise.all(promises);
    songs = [];
    for (var i = 0; i < metadata.length; i++) {
        var songData = {
            id: String(i + 1),
            src: SONG_FILES[i],
            title: metadata[i].title || 'Track ' + (i + 1),
            artist: metadata[i].artist || 'Unknown Artist',
            album: metadata[i].album || '',
            genre: metadata[i].genre || '',
            year: metadata[i].year || '',
            cover: metadata[i].picture || null,
            lyrics: '',
            duration: metadata[i].duration || '0:00'
        };

        if (!songData.cover) {
            var fetched = await fetchAlbumArt(songData.title, songData.artist);
            if (fetched) {
                songData.cover = fetched;
            }
        }

        songs.push(songData);
    }
    saveState();
    renderHome();
    if (songs.length) {
        var current = getCurrentSong();
        if (current) {
            loadSong(currentIndex);
            updateMiniPlayer();
            if (isPlaying) {
                audio.play().catch(function() {});
                updatePlayButton();
            }
        } else {
            playSong(0);
        }
    } else {
        miniPlayer.classList.remove('active');
    }
}

function init() {
    setVolume(volume);
    if (shuffle) shuffleBtn.classList.add('active');
    if (repeatMode > 0) {
        repeatBtn.classList.add('active');
        if (repeatMode === 2) {
            repeatBtn.innerHTML = '<i class="fas fa-redo"></i><sup>1</sup>';
        }
    }

    var savedSongs = JSON.parse(localStorage.getItem('songs'));
    if (savedSongs && savedSongs.length === SONG_FILES.length) {
        songs = savedSongs;
        renderHome();
        if (songs.length) {
            var current = getCurrentSong();
            if (current) {
                loadSong(currentIndex);
                updateMiniPlayer();
                if (isPlaying) {
                    audio.play().catch(function() {});
                    updatePlayButton();
                }
            } else {
                playSong(0);
            }
        } else {
            miniPlayer.classList.remove('active');
        }
    } else {
        loadAllMetadata();
    }
}

init();