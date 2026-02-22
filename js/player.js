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

    if (!playerEl || !playBtn || !prevBtn || !nextBtn || !progressWrap || !progressBar || !currentTimeEl || !durationEl || !artistEl || !titleEl || !volumeEl) {
        return;
    }

    audio.volume = 0.8;
    playerEl.setAttribute('aria-hidden', 'true');
    playerEl.setAttribute('inert', '');

    function formatTime(sec) {
        if (isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function updateSeekAria() {
        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
        progressWrap.setAttribute('aria-valuemin', '0');
        progressWrap.setAttribute('aria-valuemax', String(Math.floor(duration)));
        progressWrap.setAttribute('aria-valuenow', String(Math.floor(currentTime)));
        progressWrap.setAttribute('aria-valuetext', formatTime(currentTime) + ' of ' + formatTime(duration));
    }

    function showPlayer() {
        playerEl.classList.add('visible');
        playerEl.removeAttribute('inert');
        playerEl.setAttribute('aria-hidden', 'false');
    }

    function updatePlayButton() {
        if (audio.paused) {
            playBtn.innerHTML = '&#9654;';
            playBtn.setAttribute('aria-label', 'Play');
            playBtn.setAttribute('aria-pressed', 'false');
            return;
        }
        playBtn.innerHTML = '&#9646;&#9646;';
        playBtn.setAttribute('aria-label', 'Pause');
        playBtn.setAttribute('aria-pressed', 'true');
    }

    function safePlay() {
        const playResult = audio.play();
        if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(function() {
                updatePlayButton();
            });
        }
    }

    function clearActiveTrack() {
        document.querySelectorAll('.track.playing').forEach(function(el) {
            el.classList.remove('playing');
            el.removeAttribute('aria-current');
        });
    }

    function setActiveTrack() {
        clearActiveTrack();
        if (currentIndex >= 0 && playlist[currentIndex] && playlist[currentIndex].element) {
            playlist[currentIndex].element.classList.add('playing');
            playlist[currentIndex].element.setAttribute('aria-current', 'true');
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
        updateSeekAria();
    }

    function playTrack(index) {
        loadTrack(index);
        safePlay();
        updatePlayButton();
    }

    function toggleTrack(index) {
        if (index === currentIndex) {
            if (audio.paused) {
                safePlay();
            } else {
                audio.pause();
            }
            updatePlayButton();
            return;
        }
        playTrack(index);
    }

    // Collect all tracks from the page
    function initPlaylist() {
        playlist = [];
        document.querySelectorAll('.track').forEach(function(el, index) {
            const title = el.dataset.title || 'Track';
            const artist = el.dataset.artist || 'Unknown artist';
            playlist.push({
                src: el.dataset.src,
                title: title,
                artist: artist,
                element: el
            });

            el.setAttribute('tabindex', '0');
            el.setAttribute('role', 'button');
            el.setAttribute('aria-label', 'Play ' + title + ' by ' + artist);

            el.addEventListener('click', function() {
                toggleTrack(index);
            });

            el.addEventListener('keydown', function(e) {
                if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    toggleTrack(index);
                }
            });
        });
    }

    // Controls
    playBtn.addEventListener('click', function() {
        if (playlist.length === 0) return;
        if (currentIndex < 0 && playlist.length > 0) {
            playTrack(0);
        } else if (audio.paused) {
            safePlay();
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
        updateSeekAria();
    });

    audio.addEventListener('loadedmetadata', function() {
        durationEl.textContent = formatTime(audio.duration);
        updateSeekAria();
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
            var ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
            audio.currentTime = ratio * audio.duration;
            updateSeekAria();
        }
    });

    progressWrap.addEventListener('keydown', function(e) {
        if (!audio.duration) return;
        var step = Math.max(audio.duration * 0.02, 5);
        var nextTime = audio.currentTime;

        if (e.key === 'ArrowLeft') {
            nextTime = audio.currentTime - step;
        } else if (e.key === 'ArrowRight') {
            nextTime = audio.currentTime + step;
        } else if (e.key === 'PageDown') {
            nextTime = audio.currentTime - 30;
        } else if (e.key === 'PageUp') {
            nextTime = audio.currentTime + 30;
        } else if (e.key === 'Home') {
            nextTime = 0;
        } else if (e.key === 'End') {
            nextTime = audio.duration;
        } else {
            return;
        }

        e.preventDefault();
        audio.currentTime = clamp(nextTime, 0, audio.duration);
        updateSeekAria();
    });

    // Volume
    volumeEl.addEventListener('input', function() {
        audio.volume = parseFloat(volumeEl.value);
    });

    // Lightbox
    var lightboxEl = document.getElementById('lightbox');
    var lightboxCloseBtn = lightboxEl ? lightboxEl.querySelector('.lightbox-close') : null;
    var lightboxReturnTarget = null;
    var mainEl = document.querySelector('main');
    var footerEl = document.querySelector('footer');
    var headerEl = document.querySelector('header');

    function openLightbox(triggerEl, src, alt) {
        if (!lightboxEl) return;
        var img = lightboxEl.querySelector('img');
        if (img) {
            img.src = src;
            img.alt = alt || 'Gallery image';
        }
        lightboxReturnTarget = triggerEl;
        lightboxEl.classList.add('active');
        // Trap focus: make background inert
        if (mainEl) mainEl.setAttribute('inert', '');
        if (playerEl) playerEl.setAttribute('inert', '');
        if (footerEl) footerEl.setAttribute('inert', '');
        if (headerEl) headerEl.setAttribute('inert', '');
        // Move focus to close button
        if (lightboxCloseBtn) lightboxCloseBtn.focus();
    }

    function closeLightbox() {
        if (!lightboxEl) return;
        var img = lightboxEl.querySelector('img');
        lightboxEl.classList.remove('active');
        if (img) {
            img.src = '';
            img.alt = 'Full size image';
        }
        // Restore inert state
        if (mainEl) mainEl.removeAttribute('inert');
        if (playerEl && playerEl.classList.contains('visible')) {
            playerEl.removeAttribute('inert');
        }
        if (footerEl) footerEl.removeAttribute('inert');
        if (headerEl) headerEl.removeAttribute('inert');
        // Return focus to the triggering image
        if (lightboxReturnTarget) {
            lightboxReturnTarget.focus();
            lightboxReturnTarget = null;
        }
    }

    // Tab trapping inside lightbox
    if (lightboxEl) {
        lightboxEl.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                // Only the close button is focusable, keep focus there
                e.preventDefault();
                if (lightboxCloseBtn) lightboxCloseBtn.focus();
            }
        });
    }

    // Make gallery images keyboard-accessible
    document.querySelectorAll('.gallery img').forEach(function(img) {
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(img, img.src, img.alt);
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (e.target.matches('.gallery img')) {
            openLightbox(e.target, e.target.src, e.target.alt);
        }
        if (e.target.matches('.lightbox, .lightbox-close')) {
            closeLightbox();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightboxEl && lightboxEl.classList.contains('active')) {
            closeLightbox();
            return;
        }

        if (e.target.closest('input, textarea, select, button, a, [role="button"]')) return;
        if (e.code === 'Space') {
            if (playlist.length === 0) return;
            e.preventDefault();
            playBtn.click();
        }
    });

    // Init
    initPlaylist();
    updatePlayButton();
    updateSeekAria();
})();
