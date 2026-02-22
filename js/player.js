(function() {
    'use strict';

    const audio = new Audio();
    let playlist = [];
    let currentIndex = -1;

    const playerEl = document.getElementById('player');
    const playBtn = document.getElementById('player-play');
    const prevBtn = document.getElementById('player-prev');
    const nextBtn = document.getElementById('player-next');
    const progressWrap = document.getElementById('player-progress-wrap');
    const progressBar = document.getElementById('player-progress');
    const currentTimeEl = document.getElementById('player-current');
    const durationEl = document.getElementById('player-duration');
    const artistEl = document.getElementById('player-artist');
    const titleEl = document.getElementById('player-title');
    const volumeEl = document.getElementById('player-volume');

    audio.volume = 0.8;

    function formatTime(sec) {
        if (isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function showPlayer() {
        playerEl.classList.add('visible');
    }

    function updatePlayButton() {
        playBtn.innerHTML = audio.paused ? '&#9654;' : '&#9646;&#9646;';
    }

    function clearActiveTrack() {
        document.querySelectorAll('.track.playing').forEach(function(el) {
            el.classList.remove('playing');
        });
    }

    function setActiveTrack() {
        clearActiveTrack();
        if (currentIndex >= 0 && playlist[currentIndex] && playlist[currentIndex].element) {
            playlist[currentIndex].element.classList.add('playing');
        }
    }

    function loadTrack(index) {
        if (index < 0 || index >= playlist.length) return;
        currentIndex = index;
        var track = playlist[currentIndex];
        audio.src = track.src;
        artistEl.textContent = track.artist;
        titleEl.textContent = track.title;
        setActiveTrack();
        showPlayer();
    }

    function playTrack(index) {
        loadTrack(index);
        audio.play();
        updatePlayButton();
    }

    // Collect all tracks from the page
    function initPlaylist() {
        playlist = [];
        document.querySelectorAll('.track').forEach(function(el) {
            playlist.push({
                src: el.dataset.src,
                title: el.dataset.title,
                artist: el.dataset.artist,
                element: el
            });

            el.addEventListener('click', function() {
                var idx = playlist.findIndex(function(t) { return t.element === el; });
                if (idx === currentIndex && !audio.paused) {
                    audio.pause();
                    updatePlayButton();
                } else if (idx === currentIndex && audio.paused) {
                    audio.play();
                    updatePlayButton();
                } else {
                    playTrack(idx);
                }
            });
        });
    }

    // Controls
    playBtn.addEventListener('click', function() {
        if (currentIndex < 0 && playlist.length > 0) {
            playTrack(0);
        } else if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
        updatePlayButton();
    });

    prevBtn.addEventListener('click', function() {
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else if (currentIndex > 0) {
            playTrack(currentIndex - 1);
        }
    });

    nextBtn.addEventListener('click', function() {
        if (currentIndex < playlist.length - 1) {
            playTrack(currentIndex + 1);
        }
    });

    // Progress
    audio.addEventListener('timeupdate', function() {
        if (audio.duration) {
            progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    });

    audio.addEventListener('loadedmetadata', function() {
        durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', function() {
        if (currentIndex < playlist.length - 1) {
            playTrack(currentIndex + 1);
        } else {
            updatePlayButton();
        }
    });

    audio.addEventListener('play', updatePlayButton);
    audio.addEventListener('pause', updatePlayButton);

    // Seek
    progressWrap.addEventListener('click', function(e) {
        if (audio.duration) {
            var rect = progressWrap.getBoundingClientRect();
            var ratio = (e.clientX - rect.left) / rect.width;
            audio.currentTime = ratio * audio.duration;
        }
    });

    // Volume
    volumeEl.addEventListener('input', function() {
        audio.volume = parseFloat(volumeEl.value);
    });

    // Lightbox
    document.addEventListener('click', function(e) {
        if (e.target.matches('.gallery img')) {
            var lb = document.getElementById('lightbox');
            if (lb) {
                lb.querySelector('img').src = e.target.src;
                lb.classList.add('active');
            }
        }
        if (e.target.matches('.lightbox, .lightbox-close')) {
            var lb = document.getElementById('lightbox');
            if (lb) lb.classList.remove('active');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            playBtn.click();
        }
    });

    // Init
    initPlaylist();
})();
