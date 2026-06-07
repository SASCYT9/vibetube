// State Management
let audioCtx = null;
let source = null;
let filters = [];
let analyser = null;
let currentPlaylist = [];
let currentIndex = -1;
let historyPlaylist = [];
let isPlaying = false;
let visualizerMode = 'bars'; // 'bars' or 'wave'
let animationId = null;
let isShuffle = false;
let repeatMode = 'none'; // 'none', 'all', 'one'
let isMuted = false;
let previousVolume = 0.7;
let likedTracks = [];
let syncedLyrics = [];
let currentLyricsIndex = -1;
let userPlaylistsLoaded = false;
let userPlaylists = [];
let recentSearches = JSON.parse(localStorage.getItem('vibetube_recent_searches') || '[]');
let activeSuggestionIndex = -1;

// Theme Customization Variables
let themeMode = 'auto'; // 'auto', 'system', 'manual'
let lastManualColor = '#1db954';

// Audio Effects State
let bassBoostActive = false;
let bassBoostGain = 8;
let bassBoostFilter = null;

let reverbActive = false;
let reverbLevel = 0.45;
let reverbDelay = null;
let reverbFeedback = null;
let reverbWetGain = null;
let reverbDryGain = null;

// DOM Elements
const audio = document.getElementById('audio-player');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchClearBtn = document.getElementById('search-clear-btn');
const searchSuggestions = document.getElementById('search-suggestions');
const resultsList = document.getElementById('results-list');
const historyList = document.getElementById('history-list');
const resultsEmpty = document.getElementById('results-empty');
const historyEmpty = document.getElementById('history-empty');
const tabResults = document.getElementById('tab-results');
const tabHistory = document.getElementById('tab-history');
const tabAccount = document.getElementById('tab-account');
const tabLyrics = document.getElementById('tab-lyrics');
const resultsContent = document.getElementById('results-content');
const historyContent = document.getElementById('history-content');
const accountContent = document.getElementById('account-content');
const lyricsContent = document.getElementById('lyrics-content');
const accountList = document.getElementById('account-list');
const accountEmpty = document.getElementById('account-empty');
const accountBtns = document.querySelectorAll('.account-btn');

// New Player Buttons
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const muteBtn = document.getElementById('mute-btn');
const likeBtn = document.getElementById('like-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const loadYtHistoryBtn = document.getElementById('load-yt-history-btn');

// Audio Effects DOM Elements
const bassBoostBtn = document.getElementById('bass-boost-btn');
const bassBoostSlider = document.getElementById('bass-boost-slider');
const bassBoostVal = document.getElementById('bass-boost-val');
const reverbBtn = document.getElementById('reverb-btn');
const reverbSlider = document.getElementById('reverb-slider');
const reverbVal = document.getElementById('reverb-val');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const preservePitchCheckbox = document.getElementById('preserve-pitch-checkbox');
const fxNormalBtn = document.getElementById('fx-normal-btn');
const fxNightcoreBtn = document.getElementById('fx-nightcore-btn');
const fxSlowedBtn = document.getElementById('fx-slowed-btn');
const customPlaylistInput = document.getElementById('custom-playlist-input');
const loadCustomPlaylistBtn = document.getElementById('load-custom-playlist-btn');
const playlistsGrid = document.getElementById('playlists-grid');
const playlistsSelectionView = document.getElementById('playlists-selection-view');
const playlistNavHeader = document.getElementById('playlist-nav-header');
const activePlaylistName = document.getElementById('active-playlist-name');
const accountBackBtn = document.getElementById('account-back-btn');
const eqModalOverlay = document.getElementById('eq-modal-overlay');
const eqToggleBtn = document.getElementById('eq-toggle-btn');
const eqModalCloseBtn = document.getElementById('eq-modal-close-btn');
const miniPlayerBtn = document.getElementById('mini-player-btn');

// Theme Settings Elements
const themeSettingsBtn = document.getElementById('theme-settings-btn');
const themeModalOverlay = document.getElementById('theme-modal-overlay');
const themeModalCloseBtn = document.getElementById('theme-modal-close-btn');
const themeModeAuto = document.getElementById('theme-mode-auto');
const themeModeSystem = document.getElementById('theme-mode-system');
const themeModeManual = document.getElementById('theme-mode-manual');
const themeManualControls = document.getElementById('theme-manual-controls');
const themeCustomPicker = document.getElementById('theme-custom-picker');
const themeBlurSlider = document.getElementById('theme-blur-slider');
const themeBlurVal = document.getElementById('theme-blur-val');
const themeGlowSlider = document.getElementById('theme-glow-slider');
const themeGlowVal = document.getElementById('theme-glow-val');

// Player UI Elements
const trackArtwork = document.getElementById('track-artwork');
const artworkPulse = document.getElementById('artwork-pulse');
const trackTitle = document.getElementById('track-title');
const trackChannel = document.getElementById('track-channel');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeSlider = document.getElementById('volume-slider');
const volumeText = document.getElementById('volume-text');
const volumeIcon = document.getElementById('volume-icon');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressHandle = document.getElementById('progress-handle');
const currentTimeLabel = document.getElementById('current-time');
const totalTimeLabel = document.getElementById('total-time');
const visualizerModeBtn = document.getElementById('visualizer-mode-btn');

// Canvas
const canvas = document.getElementById('visualizer-canvas');
const canvasCtx = canvas.getContext('2d');

// EQ Sliders & Presets
const eqSliders = document.querySelectorAll('.eq-slider');
const presetBtns = document.querySelectorAll('.preset-btn');
const eqValues = {
    0: document.getElementById('val-60hz'),
    1: document.getElementById('val-150hz'),
    2: document.getElementById('val-400hz'),
    3: document.getElementById('val-1khz'),
    4: document.getElementById('val-3khz'),
    5: document.getElementById('val-8khz'),
    6: document.getElementById('val-15khz')
};

// Equalizer Presets config
const PRESETS = {
    flat: [0, 0, 0, 0, 0, 0, 0],
    bass: [6.5, 5, 2.5, 0, -1, -3, -4.5],
    vocal: [-3, -1.5, 1, 4, 3, 1.5, -2],
    pop: [-1.5, 1.5, 3, 2, -1, -1.5, -1],
    rock: [4.5, 2.5, -1, -2, 1, 3, 4.5],
    jazz: [3, 2, 1, 1.5, -1, 1, 2.5],
    electronic: [5.5, 4, 1.5, 0, 2.5, 3, 4]
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Request desktop notification permission on startup
    if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // Custom window control listeners for frameless mode
    const winMinBtn = document.getElementById('win-min-btn');
    const winMaxBtn = document.getElementById('win-max-btn');
    const winCloseBtn = document.getElementById('win-close-btn');

    if (winMinBtn) {
        winMinBtn.addEventListener('click', () => {
            if (window.electronAPI) window.electronAPI.minimize();
        });
    }
    if (winMaxBtn) {
        winMaxBtn.addEventListener('click', () => {
            if (window.electronAPI) window.electronAPI.maximize();
        });
    }
    if (winCloseBtn) {
        winCloseBtn.addEventListener('click', () => {
            if (window.electronAPI) window.electronAPI.close();
        });
    }

    // Load history from localStorage
    loadHistory();
    // Load saved Equalizer from localStorage
    loadEQSettings();
    // Load liked tracks
    loadLikedTracks();
    // Resize visualizer canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('fullscreenchange', () => {
        resizeCanvas();
        const fsOverlay = document.getElementById('fullscreen-overlay');
        if (fsOverlay) {
            if (document.fullscreenElement) {
                fsOverlay.style.display = 'flex';
                // Initialize fullscreen details from active track
                if (currentIndex !== -1 && activePlaylist[currentIndex]) {
                    const track = activePlaylist[currentIndex];
                    const fsTitle = document.getElementById('fullscreen-title');
                    const fsArtist = document.getElementById('fullscreen-artist');
                    const fsArtwork = document.getElementById('fullscreen-artwork');
                    const fsTotalTime = document.getElementById('fs-total-time');
                    if (fsTitle) fsTitle.textContent = track.title;
                    if (fsArtist) fsArtist.textContent = track.channel;
                    if (fsArtwork) fsArtwork.style.backgroundImage = `url('${track.thumbnail}')`;
                    if (fsTotalTime) fsTotalTime.textContent = track.duration;
                }
                const fsPlayIcon = document.querySelector('#fs-play-btn i');
                if (fsPlayIcon) {
                    fsPlayIcon.className = audio.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
                }
            } else {
                fsOverlay.style.display = 'none';
                fsOverlay.classList.remove('idle');
            }
        }
    });
    
    // Bind Event Listeners
    setupEventListeners();

    // Start MPRIS commands poll loop
    pollMprisCommands();

    // Load user playlists by default on startup
    loadUserPlaylistsList();
    
    // Restore last playing state if available
    restoreLastState();

    // Initialize Theme and Customization Settings
    initThemeSettings();

    // Listen to global shortcuts and tray actions from Electron
    if (window.electronAPI && typeof window.electronAPI.onGlobalShortcutMedia === 'function') {
        window.electronAPI.onGlobalShortcutMedia((action) => {
            console.log(`Global media shortcut event: ${action}`);
            if (action === 'play-pause') {
                togglePlayback();
            } else if (action === 'next') {
                playNext();
            } else if (action === 'prev') {
                playPrevious();
            }
        });
    }
});

// Setup All Events
function setupEventListeners() {
    // Search Suggestions and shortcuts
    setupSearchSuggestions();

    // Initialize HTML5 Media Session action handlers (for Windows/macOS controls)
    initMediaSessionHandlers();

    const songRadioBtn = document.getElementById('song-radio-btn');
    if (songRadioBtn) {
        songRadioBtn.addEventListener('click', startSongRadio);
    }

    // Search
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Tabs
    tabResults.addEventListener('click', () => switchTab('results'));
    tabHistory.addEventListener('click', () => switchTab('history'));
    tabAccount.addEventListener('click', () => switchTab('account'));
    tabLyrics.addEventListener('click', () => switchTab('lyrics'));

    // Account playlist load buttons
    accountBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.dataset.type;
            loadUserPlaylist(type);
        });
    });

    // Audio Playback Events
    playBtn.addEventListener('click', togglePlayback);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleTrackEnded);
    audio.addEventListener('play', () => {
        isPlaying = true;
        playIcon.className = 'fa-solid fa-pause';
        const fsPlayIcon = document.querySelector('#fs-play-btn i');
        if (fsPlayIcon) fsPlayIcon.className = 'fa-solid fa-pause';
        trackArtwork.classList.add('playing');
        fetch('/api/mpris_update?status=Playing').catch(err => console.error(err));

        // Update Media Session playback state
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        updateDiscordPresence();
    });
    audio.addEventListener('pause', () => {
        isPlaying = false;
        playIcon.className = 'fa-solid fa-play';
        const fsPlayIcon = document.querySelector('#fs-play-btn i');
        if (fsPlayIcon) fsPlayIcon.className = 'fa-solid fa-play';
        trackArtwork.classList.remove('playing');
        fetch('/api/mpris_update?status=Paused').catch(err => console.error(err));

        // Update Media Session playback state
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
        updateDiscordPresence();
    });

    // Volume
    volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        audio.volume = val;
        updateVolumeUI(val);
        fetch(`/api/mpris_update?volume=${val}`).catch(err => console.error(err));
    });

    // Shuffle Button Event
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        shuffleBtn.title = isShuffle ? "Перемішування (Увімкнено)" : "Перемішувати чергу";
    });

    // Repeat Button Event
    repeatBtn.addEventListener('click', () => {
        if (repeatMode === 'none') {
            repeatMode = 'all';
            repeatBtn.classList.add('active');
            repeatBtn.title = "Повторювати все";
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            repeatBtn.classList.add('active');
            repeatBtn.title = "Повторювати один трек";
            repeatBtn.setAttribute('data-repeat-mode', 'one');
        } else {
            repeatMode = 'none';
            repeatBtn.classList.remove('active');
            repeatBtn.title = "Повторювати (Вимкнено)";
            repeatBtn.removeAttribute('data-repeat-mode');
        }
    });

    // Mute Button Event
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            previousVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
            updateVolumeUI(0);
            fetch('/api/mpris_update?volume=0').catch(err => console.error(err));
        } else {
            audio.volume = previousVolume;
            volumeSlider.value = previousVolume;
            updateVolumeUI(previousVolume);
            fetch(`/api/mpris_update?volume=${previousVolume}`).catch(err => console.error(err));
        }
    });

    // Like Button Event
    likeBtn.addEventListener('click', () => {
        if (!audio.src || currentIndex === -1) return;
        const track = activePlaylist[currentIndex];
        if (!track) return;
        
        const isLiked = likedTracks.some(t => t.id === track.id);
        if (isLiked) {
            likedTracks = likedTracks.filter(t => t.id !== track.id);
            likeBtn.classList.remove('liked');
            likeBtn.querySelector('i').className = 'fa-regular fa-heart';
            likeBtn.title = "Додати до улюблених";
        } else {
            likedTracks.push(track);
            likeBtn.classList.add('liked');
            likeBtn.querySelector('i').className = 'fa-solid fa-heart';
            likeBtn.title = "Вилучити з улюблених";
        }
        localStorage.setItem('vibetube_liked_tracks', JSON.stringify(likedTracks));
    });

    // Scrubber Seeking
    progressContainer.addEventListener('click', seekAudio);

    // Visualizer Mode
    visualizerModeBtn.addEventListener('click', toggleVisualizerMode);

    // Fullscreen Button Event
    const visualizerContainer = document.querySelector('.visualizer-container');
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            visualizerContainer.requestFullscreen().catch(err => console.error("Error enabling fullscreen:", err));
        } else {
            document.exitFullscreen();
        }
    });

    // Double click on visualizer container for fullscreen
    if (visualizerContainer) {
        visualizerContainer.addEventListener('dblclick', () => {
            if (!document.fullscreenElement) {
                visualizerContainer.requestFullscreen().catch(err => console.error("Error enabling fullscreen:", err));
            } else {
                document.exitFullscreen();
            }
        });
    }

    // Fullscreen Overlay Event Listeners
    const fsPlayBtn = document.getElementById('fs-play-btn');
    const fsPrevBtn = document.getElementById('fs-prev-btn');
    const fsNextBtn = document.getElementById('fs-next-btn');
    const fsProgressBar = document.getElementById('fs-progress-bar');
    const fsOverlay = document.getElementById('fullscreen-overlay');

    if (fsPlayBtn) fsPlayBtn.addEventListener('click', togglePlayback);
    if (fsPrevBtn) fsPrevBtn.addEventListener('click', playPrevious);
    if (fsNextBtn) fsNextBtn.addEventListener('click', playNext);

    if (fsProgressBar) {
        fsProgressBar.addEventListener('click', (e) => {
            if (!audio.src || !audio.duration) return;
            const rect = fsProgressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = clickX / width;
            audio.currentTime = percentage * audio.duration;
        });
    }

    // Fullscreen Mouse Idle Auto-hide Controls (3 seconds of inactivity)
    let fsTimeout = null;
    document.addEventListener('mousemove', () => {
        if (document.fullscreenElement && fsOverlay) {
            fsOverlay.classList.remove('idle');
            clearTimeout(fsTimeout);
            fsTimeout = setTimeout(() => {
                fsOverlay.classList.add('idle');
            }, 3000);
        }
    });

    // YouTube History Sync Event
    loadYtHistoryBtn.addEventListener('click', syncYoutubeHistory);

    // Equalizer sliders change
    eqSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.band);
            const value = parseFloat(e.target.value);
            
            // Update UI text label
            const sign = value > 0 ? '+' : '';
            eqValues[index].textContent = `${sign}${value.toFixed(1)}dB`;
            
            // Update Web Audio Filter if initialized
            if (filters[index]) {
                filters[index].gain.setValueAtTime(value, audioCtx.currentTime);
            }

            // Remove active status from presets since it's customized
            presetBtns.forEach(btn => btn.classList.remove('active'));
            
            // Save values
            saveEQSettings();
        });
    });

    // Equalizer Presets click
    presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const presetName = e.target.dataset.preset;
            applyPreset(presetName);
            
            presetBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Audio Effects Event Listeners
    // Bass Boost Toggle
    bassBoostBtn.addEventListener('click', () => {
        initAudio();
        bassBoostActive = !bassBoostActive;
        if (bassBoostActive) {
            bassBoostBtn.classList.add('active');
            bassBoostBtn.textContent = 'УВІМК';
            bassBoostSlider.disabled = false;
        } else {
            bassBoostBtn.classList.remove('active');
            bassBoostBtn.textContent = 'ВИМК';
            bassBoostSlider.disabled = true;
        }
        if (bassBoostFilter) {
            bassBoostFilter.gain.setValueAtTime(bassBoostActive ? bassBoostGain : 0, audioCtx.currentTime);
        }
    });

    // Bass Boost Slider Change
    bassBoostSlider.addEventListener('input', (e) => {
        bassBoostGain = parseFloat(e.target.value);
        bassBoostVal.textContent = `+${bassBoostGain}dB`;
        if (bassBoostFilter && bassBoostActive) {
            bassBoostFilter.gain.setValueAtTime(bassBoostGain, audioCtx.currentTime);
        }
    });

    // Reverb Toggle
    reverbBtn.addEventListener('click', () => {
        initAudio();
        reverbActive = !reverbActive;
        if (reverbActive) {
            reverbBtn.classList.add('active');
            reverbBtn.textContent = 'УВІМК';
            reverbSlider.disabled = false;
        } else {
            reverbBtn.classList.remove('active');
            reverbBtn.textContent = 'ВИМК';
            reverbSlider.disabled = true;
        }
        if (reverbWetGain) {
            reverbWetGain.gain.setValueAtTime(reverbActive ? reverbLevel * 0.75 : 0, audioCtx.currentTime);
        }
    });

    // Reverb Mix Slider
    reverbSlider.addEventListener('input', (e) => {
        reverbLevel = parseFloat(e.target.value);
        reverbVal.textContent = `${Math.round(reverbLevel * 100)}%`;
        if (reverbWetGain && reverbActive) {
            reverbWetGain.gain.setValueAtTime(reverbLevel * 0.75, audioCtx.currentTime);
        }
    });

    // Playback Speed Slider
    speedSlider.addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value);
        speedVal.textContent = `${rate.toFixed(2)}x`;
        audio.playbackRate = rate;
    });

    // Preserve Pitch Checkbox
    preservePitchCheckbox.addEventListener('change', (e) => {
        audio.preservesPitch = e.target.checked;
    });

    // Normal FX Preset
    fxNormalBtn.addEventListener('click', () => {
        initAudio();
        speedSlider.value = 1.0;
        speedVal.textContent = '1.0x';
        audio.playbackRate = 1.0;
        preservePitchCheckbox.checked = true;
        audio.preservesPitch = true;
        
        reverbActive = false;
        reverbBtn.classList.remove('active');
        reverbBtn.textContent = 'ВИМК';
        reverbSlider.disabled = true;
        if (reverbWetGain) {
            reverbWetGain.gain.setValueAtTime(0, audioCtx.currentTime);
        }
    });

    // Nightcore FX Preset
    fxNightcoreBtn.addEventListener('click', () => {
        initAudio();
        speedSlider.value = 1.25;
        speedVal.textContent = '1.25x';
        audio.playbackRate = 1.25;
        preservePitchCheckbox.checked = false;
        audio.preservesPitch = false;
        
        reverbActive = false;
        reverbBtn.classList.remove('active');
        reverbBtn.textContent = 'ВИМК';
        reverbSlider.disabled = true;
        if (reverbWetGain) {
            reverbWetGain.gain.setValueAtTime(0, audioCtx.currentTime);
        }
    });

    // Slowed & Reverb FX Preset
    fxSlowedBtn.addEventListener('click', () => {
        initAudio();
        speedSlider.value = 0.82;
        speedVal.textContent = '0.82x';
        audio.playbackRate = 0.82;
        preservePitchCheckbox.checked = false;
        audio.preservesPitch = false;
        
        reverbActive = true;
        reverbBtn.classList.add('active');
        reverbBtn.textContent = 'УВІМК';
        reverbSlider.disabled = false;
        reverbSlider.value = 0.45;
        reverbVal.textContent = '45%';
        if (reverbWetGain) {
            reverbWetGain.gain.setValueAtTime(0.45 * 0.75, audioCtx.currentTime);
        }
    });

    // Custom Playlist Loader Event
    loadCustomPlaylistBtn.addEventListener('click', loadCustomPlaylist);
    customPlaylistInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadCustomPlaylist();
    });

    // Account Back Button
    accountBackBtn.addEventListener('click', () => {
        playlistNavHeader.style.display = 'none';
        playlistsSelectionView.style.display = 'flex';
        accountList.style.display = 'none';
        accountEmpty.style.display = 'none';
    });

    // Equalizer Modal Toggle
    eqToggleBtn.addEventListener('click', () => {
        eqModalOverlay.classList.add('active');
    });

    // Mini-player Mode Toggle
    let isMiniPlayer = false;
    if (miniPlayerBtn) {
        miniPlayerBtn.addEventListener('click', () => {
            isMiniPlayer = !isMiniPlayer;
            if (isMiniPlayer) {
                document.body.classList.add('mini-player-active');
                miniPlayerBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Звичайний';
                miniPlayerBtn.title = "Повернути стандартний вигляд";
                if (window.electronAPI && window.electronAPI.toggleMiniPlayer) {
                    window.electronAPI.toggleMiniPlayer(true);
                }
            } else {
                document.body.classList.remove('mini-player-active');
                miniPlayerBtn.innerHTML = '<i class="fa-solid fa-window-restore"></i> Міні-плеєр';
                miniPlayerBtn.title = "Компактний міні-плеєр";
                if (window.electronAPI && window.electronAPI.toggleMiniPlayer) {
                    window.electronAPI.toggleMiniPlayer(false);
                }
            }
        });
    }

    eqModalCloseBtn.addEventListener('click', () => {
        eqModalOverlay.classList.remove('active');
    });

    eqModalOverlay.addEventListener('click', (e) => {
        if (e.target === eqModalOverlay) {
            eqModalOverlay.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && eqModalOverlay.classList.contains('active')) {
            eqModalOverlay.classList.remove('active');
        }
    });

    // Setup Hover Pre-resolution to start resolving songs in background when user hovers them
    setupHoverPreResolution('results-list', () => currentPlaylist);
    setupHoverPreResolution('history-list', () => historyPlaylist);
    setupHoverPreResolution('account-list', () => accountPlaylist);
}

// Switch between Search results, History, and Account tabs
function switchTab(tab) {
    tabResults.classList.remove('active');
    tabHistory.classList.remove('active');
    tabAccount.classList.remove('active');
    tabLyrics.classList.remove('active');
    resultsContent.classList.remove('active');
    historyContent.classList.remove('active');
    accountContent.classList.remove('active');
    lyricsContent.classList.remove('active');

    if (tab === 'results') {
        tabResults.classList.add('active');
        resultsContent.classList.add('active');
    } else if (tab === 'history') {
        tabHistory.classList.add('active');
        historyContent.classList.add('active');
    } else if (tab === 'account') {
        tabAccount.classList.add('active');
        accountContent.classList.add('active');
        loadUserPlaylistsList();
    } else if (tab === 'lyrics') {
        tabLyrics.classList.add('active');
        lyricsContent.classList.add('active');
    }
}

// Resize Canvas
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

// Save query to recent searches
function saveRecentSearch(query) {
    if (!query || query.startsWith('http://') || query.startsWith('https://')) return;
    recentSearches = recentSearches.filter(q => q.toLowerCase() !== query.toLowerCase());
    recentSearches.unshift(query);
    recentSearches = recentSearches.slice(0, 5); // keep last 5
    localStorage.setItem('vibetube_recent_searches', JSON.stringify(recentSearches));
}

// Hide Suggestions dropdown
function hideSuggestions() {
    searchSuggestions.style.display = 'none';
    activeSuggestionIndex = -1;
}

// Render Suggestions (recent searches or autocomplete suggestions)
function renderSuggestions(items, isRecent = false) {
    searchSuggestions.innerHTML = '';
    if (items.length === 0) {
        searchSuggestions.style.display = 'none';
        return;
    }

    searchSuggestions.style.display = 'flex';
    activeSuggestionIndex = -1;

    // Add Header
    const header = document.createElement('div');
    header.className = 'suggestion-header';
    header.textContent = isRecent ? 'Нещодавні пошуки' : 'Рекомендовані запити';
    searchSuggestions.appendChild(header);

    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.dataset.index = index;
        
        // Add icon
        const icon = document.createElement('i');
        icon.className = isRecent ? 'fa-solid fa-clock-rotate-left' : 'fa-solid fa-magnifying-glass';
        div.appendChild(icon);

        // Add text
        const textSpan = document.createElement('span');
        textSpan.textContent = item;
        div.appendChild(textSpan);

        // Click handler (mousedown to fire before input blur)
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            searchInput.value = item;
            performSearch();
        });

        searchSuggestions.appendChild(div);
    });
}

// Fetch Autocomplete Suggestions from Backend API
let suggestionsTimeout = null;
function fetchSearchSuggestions(query) {
    if (suggestionsTimeout) clearTimeout(suggestionsTimeout);
    
    if (!query) {
        renderSuggestions(recentSearches, true);
        return;
    }

    suggestionsTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const suggestions = await response.json();
                renderSuggestions(suggestions.slice(0, 7), false);
            }
        } catch (err) {
            console.error("Failed fetching suggestions:", err);
        }
    }, 150);
}

// Setup search suggestions event listeners
function setupSearchSuggestions() {
    // Input keypress / events
    searchInput.addEventListener('input', () => {
        const val = searchInput.value.trim();
        searchClearBtn.style.display = val ? 'inline-block' : 'none';
        fetchSearchSuggestions(val);
    });

    searchInput.addEventListener('focus', () => {
        const val = searchInput.value.trim();
        searchClearBtn.style.display = val ? 'inline-block' : 'none';
        if (val) {
            fetchSearchSuggestions(val);
        } else {
            renderSuggestions(recentSearches, true);
        }
    });

    searchInput.addEventListener('blur', () => {
        // Delay to allow item selection mousedown handler to run first
        setTimeout(hideSuggestions, 180);
    });

    // Keyboard navigation inside dropdown
    searchInput.addEventListener('keydown', (e) => {
        const items = searchSuggestions.querySelectorAll('.suggestion-item');
        if (searchSuggestions.style.display === 'none' || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
            highlightSuggestion(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
            highlightSuggestion(items);
        } else if (e.key === 'Escape') {
            hideSuggestions();
        } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
            e.preventDefault();
            const selectedText = items[activeSuggestionIndex].querySelector('span').textContent;
            searchInput.value = selectedText;
            performSearch();
        }
    });

    // Highlight helper
    function highlightSuggestion(items) {
        items.forEach((item, index) => {
            if (index === activeSuggestionIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Clear Search Input Button
    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        hideSuggestions();
        searchInput.focus();
    });

    // Quick Search Tags buttons
    const tagBtns = document.querySelectorAll('.search-tag-btn');
    tagBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tag = e.currentTarget.dataset.tag;
            searchInput.value = tag;
            searchClearBtn.style.display = 'inline-block';
            performSearch();
        });
    });
}

// Perform YouTube Search
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    saveRecentSearch(query);
    hideSuggestions();

    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>...';

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Search server error");
        
        const results = await response.json();
        currentPlaylist = results;
        
        renderResultsList();
        switchTab('results');
        preResolveTopTracks(currentPlaylist, 2);
    } catch (err) {
        console.error("Search failed:", err);
        alert("Помилка під час пошуку. Переконайтеся, що сервер запущений.");
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Пошук';
    }
}

// Render Results List
function renderResultsList() {
    resultsList.innerHTML = '';
    
    if (currentPlaylist.length === 0) {
        resultsEmpty.style.display = 'flex';
        return;
    }
    
    resultsEmpty.style.display = 'none';
    
    currentPlaylist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'track-item';
        item.style.animationDelay = `${index * 0.02}s`;
        if (index === currentIndex && currentPlaylist === activePlaylistReference()) {
            item.classList.add('playing');
        }
        
        // Enable drag & drop for manual queue sorting
        item.draggable = true;
        item.dataset.index = index;
        
        item.innerHTML = `
            <div class="track-item-thumb" style="background-image: url('${track.thumbnail}')">
                <div class="track-item-thumb-play">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            <div class="track-item-details">
                <div class="track-item-title">${escapeHTML(track.title)}</div>
                <div class="track-item-channel">${escapeHTML(track.channel)}</div>
            </div>
            <div class="track-item-duration">${track.duration}</div>
        `;
        
        // Drag events
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = resultsList.querySelector('.dragging');
            if (draggingItem && draggingItem !== item) {
                const rect = item.getBoundingClientRect();
                const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                resultsList.insertBefore(draggingItem, next ? item.nextSibling : item);
            }
        });
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const items = Array.from(resultsList.querySelectorAll('.track-item'));
            const toIndex = items.indexOf(item);
            
            if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0) {
                // Reorder currentPlaylist
                const [moved] = currentPlaylist.splice(fromIndex, 1);
                currentPlaylist.splice(toIndex, 0, moved);
                
                // If the currently playing track moved, update currentIndex
                if (currentIndex === fromIndex) {
                    currentIndex = toIndex;
                } else if (currentIndex > fromIndex && currentIndex <= toIndex) {
                    currentIndex--;
                } else if (currentIndex < fromIndex && currentIndex >= toIndex) {
                    currentIndex++;
                }
                
                // Save state to local storage to remember queue order
                localStorage.setItem('vibetube_last_playlist', JSON.stringify(currentPlaylist));
                localStorage.setItem('vibetube_last_index', currentIndex);
                
                // Re-render
                renderResultsList();
                updatePlaylistItemsUI();
            }
        });
        
        item.addEventListener('click', () => {
            playTrack(track, index, currentPlaylist);
        });
        
        resultsList.appendChild(item);
    });
}

// Render History List
function renderHistoryList() {
    historyList.innerHTML = '';
    
    if (historyPlaylist.length === 0) {
        historyEmpty.style.display = 'flex';
        return;
    }
    
    historyEmpty.style.display = 'none';
    
    historyPlaylist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'track-item';
        item.style.animationDelay = `${index * 0.02}s`;
        
        item.innerHTML = `
            <div class="track-item-thumb" style="background-image: url('${track.thumbnail}')">
                <div class="track-item-thumb-play">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            <div class="track-item-details">
                <div class="track-item-title">${escapeHTML(track.title)}</div>
                <div class="track-item-channel">${escapeHTML(track.channel)}</div>
            </div>
            <div class="track-item-duration">${track.duration}</div>
        `;
        
        item.addEventListener('click', () => playTrack(track, index, historyPlaylist));
        historyList.appendChild(item);
    });
}

// User Playlist integration (YouTube Account)
let accountPlaylist = [];
async function loadUserPlaylist(type) {
    let title = "Мій плейлист";
    if (type === 'liked') title = "Улюблене";
    else if (type === 'later') title = "Черга (Watch Later)";
    else if (type === 'history') title = "Історія переглядів";
    else if (type === 'mix') title = "Мій мікс (YouTube Mix)";
    
    // Toggle view visibility
    playlistNavHeader.style.display = 'flex';
    activePlaylistName.textContent = title;
    playlistsSelectionView.style.display = 'none';
    accountList.style.display = 'block';
    
    accountEmpty.style.display = 'none';
    accountList.innerHTML = `
        <div class="spinner-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: var(--text-muted);">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--neon-cyan);"></i>
            <p style="margin-top: 10px; text-align: center;">Завантаження з вашого YouTube-акаунта в браузері...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/user_playlist?type=${type}`);
        if (!response.ok) throw new Error("Server error loading user playlist");
        const results = await response.json();
        
        accountPlaylist = results;
        renderAccountList(type);
        preResolveTopTracks(accountPlaylist, 2);
    } catch (err) {
        console.error("Failed to load user playlist:", err);
        accountList.innerHTML = '';
        accountEmpty.style.display = 'flex';
        accountEmpty.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.8;"></i>
            <p>Не вдалося завантажити треки. Переконайтеся, що ви авторизовані в YouTube у вашому браузері (Firefox, Chrome, Brave тощо) на цьому комп'ютері.</p>
        `;
    }
}

async function loadCustomPlaylist() {
    const url = customPlaylistInput.value.trim();
    if (!url) return;
    
    loadCustomPlaylistBtn.disabled = true;
    loadCustomPlaylistBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    
    // Toggle view visibility
    playlistNavHeader.style.display = 'flex';
    activePlaylistName.textContent = "Користувацький плейлист/мікс";
    playlistsSelectionView.style.display = 'none';
    accountList.style.display = 'block';
    
    accountEmpty.style.display = 'none';
    accountList.innerHTML = `
        <div class="spinner-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: var(--text-muted);">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--neon-cyan);"></i>
            <p style="margin-top: 15px; text-align: center;">Аналіз посилання та завантаження треків з YouTube...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/user_playlist?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Server error loading custom playlist");
        const results = await response.json();
        
        accountPlaylist = results;
        renderAccountList('custom');
        customPlaylistInput.value = '';
        preResolveTopTracks(accountPlaylist, 2);
    } catch (err) {
        console.error("Failed to load custom playlist:", err);
        accountList.innerHTML = '';
        accountEmpty.style.display = 'flex';
        accountEmpty.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.8;"></i>
            <p>Не вдалося завантажити треки за цим посиланням. Переконайтеся, що посилання правильне, публічне або доступне у вашому браузері.</p>
        `;
    } finally {
        loadCustomPlaylistBtn.disabled = false;
        loadCustomPlaylistBtn.innerHTML = 'Завантажити';
    }
}

// Fetch lists of custom user playlists
async function loadUserPlaylistsList() {
    // Only load once per application startup to avoid constant slow network requests
    if (userPlaylistsLoaded) return;
    
    // Explicitly hide account-empty on startup to make sure it doesn't leak
    if (accountEmpty) accountEmpty.style.display = 'none';
    
    try {
        const response = await fetch('/api/user_playlists_list');
        if (!response.ok) throw new Error("Failed to load playlists list");
        const results = await response.json();
        
        userPlaylists = results;
        userPlaylistsLoaded = true;
        renderUserPlaylistsGrid(userPlaylists);
    } catch (err) {
        console.error("Failed to load user playlists list:", err);
        playlistsGrid.innerHTML = `
            <p style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                Не вдалося отримати ваші плейлисти. Переконайтеся, що ви авторизовані в YouTube у вашому браузері (Firefox, Chrome, Brave тощо).
            </p>
        `;
    }
}

function renderUserPlaylistsGrid(playlists) {
    playlistsGrid.innerHTML = '';
    
    // Filter out "Watch later" since we have a dedicated button for it
    const filteredPlaylists = playlists.filter(p => p.id !== 'WL');
    
    if (filteredPlaylists.length === 0) {
        playlistsGrid.innerHTML = `
            <p style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                У вашому YouTube акаунті не знайдено створених плейлистів.
            </p>
        `;
        return;
    }
    
    filteredPlaylists.forEach((playlist, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-card-item';
        item.style.animationDelay = `${index * 0.03}s`;
        
        const thumbUrl = playlist.thumbnail;
        const imgStyle = thumbUrl ? `background-image: url('${thumbUrl}')` : '';
        const imgContent = thumbUrl ? '' : '<i class="fa-solid fa-music" style="color: var(--neon-cyan); font-size: 1.2rem; opacity: 0.8;"></i>';
        const countText = playlist.playlist_count !== null ? `${playlist.playlist_count} треків` : '0 треків';
        
        item.innerHTML = `
            <div class="playlist-card-thumb" style="${imgStyle}">
                ${imgContent}
                <div class="playlist-play-hover">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            <div class="playlist-card-info">
                <div class="playlist-card-title" title="${escapeHTML(playlist.title)}">${escapeHTML(playlist.title)}</div>
                <div class="playlist-card-meta">Плейлист • ${countText}</div>
            </div>
            <i class="fa-solid fa-chevron-right play-arrow-icon" style="font-size: 0.9rem; color: var(--text-muted); margin-right: 0.5rem; transition: var(--transition);"></i>
        `;
        
        item.addEventListener('click', () => {
            const playlistUrl = playlist.url || ('https://www.youtube.com/playlist?list=' + playlist.id);
            loadUserPlaylistTracks(playlist.title, playlistUrl);
        });
        
        playlistsGrid.appendChild(item);
    });
}

async function loadUserPlaylistTracks(title, url) {
    playlistNavHeader.style.display = 'flex';
    activePlaylistName.textContent = title;
    playlistsSelectionView.style.display = 'none';
    accountList.style.display = 'block';
    
    accountEmpty.style.display = 'none';
    accountList.innerHTML = `
        <div class="spinner-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: var(--text-muted);">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--neon-cyan);"></i>
            <p style="margin-top: 15px; text-align: center;">Завантаження треків з "${title}"...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/user_playlist?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Server error loading playlist tracks");
        const results = await response.json();
        
        accountPlaylist = results;
        renderAccountList('custom');
        preResolveTopTracks(accountPlaylist, 2);
    } catch (err) {
        console.error("Failed to load playlist tracks:", err);
        accountList.innerHTML = '';
        accountEmpty.style.display = 'flex';
        accountEmpty.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.8;"></i>
            <p>Не вдалося завантажити треки з плейлиста.</p>
        `;
    }
}

function renderAccountList(type) {
    accountList.innerHTML = '';
    
    if (accountPlaylist.length === 0) {
        accountEmpty.style.display = 'flex';
        accountEmpty.innerHTML = `
            <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <p>Цей розділ вашого акаунта порожній або закритий для доступу.</p>
        `;
        return;
    }
    
    accountEmpty.style.display = 'none';
    
    accountPlaylist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'track-item';
        item.style.animationDelay = `${index * 0.02}s`;
        if (index === currentIndex && accountPlaylist === activePlaylistReference()) {
            item.classList.add('playing');
        }
        
        item.innerHTML = `
            <div class="track-item-thumb" style="background-image: url('${track.thumbnail}')">
                <div class="track-item-thumb-play">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            <div class="track-item-details">
                <div class="track-item-title">${escapeHTML(track.title)}</div>
                <div class="track-item-channel">${escapeHTML(track.channel)}</div>
            </div>
            <div class="track-item-duration">${track.duration}</div>
        `;
        
        item.addEventListener('click', () => playTrack(track, index, accountPlaylist));
        accountList.appendChild(item);
    });
}

// Get reference to which playlist is currently being played from
let activePlaylist = [];
function activePlaylistReference() {
    return activePlaylist;
}

// Play YouTube Track
async function playTrack(track, index, playlist) {
    // Initialize Web Audio API on first play
    initAudio();

    activePlaylist = playlist;
    currentIndex = index;
    
    // Save last played track info
    try {
        localStorage.setItem('vibetube_last_track', JSON.stringify(track));
        localStorage.setItem('vibetube_last_playlist', JSON.stringify(playlist));
        localStorage.setItem('vibetube_last_index', index.toString());
    } catch (e) {
        console.error("Failed to save play state to localStorage:", e);
    }
    
    const songRadioBtn = document.getElementById('song-radio-btn');
    if (songRadioBtn) songRadioBtn.style.display = 'inline-block';
    
    // Update active visual cues
    updatePlaylistItemsUI();
    
    // Set UI track info
    trackTitle.textContent = track.title;
    trackChannel.textContent = track.channel;

    // Fullscreen track info
    const fsTitle = document.getElementById('fullscreen-title');
    const fsArtist = document.getElementById('fullscreen-artist');
    const fsArtwork = document.getElementById('fullscreen-artwork');
    const fsTotalTime = document.getElementById('fs-total-time');
    if (fsTitle) fsTitle.textContent = track.title;
    if (fsArtist) fsArtist.textContent = track.channel;
    if (fsArtwork) fsArtwork.style.backgroundImage = `url('${track.thumbnail}')`;
    if (fsTotalTime) fsTotalTime.textContent = track.duration;
    
    // Scrolling marquee animation for long titles
    setupMarquee();

    // Set artwork & extract dominant color for dynamic theme!
    trackArtwork.style.backgroundImage = `url('${track.thumbnail}')`;
    if (track.thumbnail) {
        extractDominantColor(track.thumbnail);
    }
    
    // Check if liked and update Like button state
    const isLiked = likedTracks.some(t => t.id === track.id);
    if (isLiked) {
        likeBtn.classList.add('liked');
        likeBtn.querySelector('i').className = 'fa-solid fa-heart';
        likeBtn.title = "Вилучити з улюблених";
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('i').className = 'fa-regular fa-heart';
        likeBtn.title = "Додати до улюблених";
    }
    
    // Reset scrubber
    progressFill.style.width = '0%';
    progressHandle.style.left = '0%';
    currentTimeLabel.textContent = '0:00';
    totalTimeLabel.textContent = track.duration;

    // Load URL in audio tag
    audio.src = `/api/stream?id=${encodeURIComponent(track.id)}`;
    
    // Re-apply speed and pitch preservation settings
    const currentRate = parseFloat(speedSlider.value);
    audio.playbackRate = currentRate;
    audio.preservesPitch = preservePitchCheckbox.checked;
    
    try {
        await audio.play();
        addToHistory(track);
        updateSystemMediaControls(track);
        // Load lyrics in the background
        fetchLyrics(track.channel, track.title);
        // Pre-resolve the next track in the playlist
        preResolveNextTrack(index, playlist);
    } catch (err) {
        console.error("Playback error:", err);
    }
}

// Pre-resolve next track in the playlist
function preResolveNextTrack(index, playlist) {
    if (!playlist || playlist.length <= 1) return;
    let nextIndex;
    if (isShuffle) {
        do {
            nextIndex = Math.floor(Math.random() * playlist.length);
        } while (nextIndex === index && playlist.length > 1);
    } else {
        nextIndex = index + 1;
        if (nextIndex >= playlist.length) {
            nextIndex = 0;
        }
    }
    const nextTrack = playlist[nextIndex];
    if (nextTrack && nextTrack.id) {
        fetch(`/api/pre_resolve?id=${encodeURIComponent(nextTrack.id)}`).catch(err => console.error("Pre-resolve next error:", err));
    }
}

// Pre-resolve top N tracks of a playlist to make initial plays instant
function preResolveTopTracks(playlist, count = 2) {
    if (!playlist || playlist.length === 0) return;
    for (let i = 0; i < Math.min(playlist.length, count); i++) {
        const track = playlist[i];
        if (track && track.id) {
            fetch(`/api/pre_resolve?id=${encodeURIComponent(track.id)}`).catch(err => console.error("Pre-resolve top error:", err));
        }
    }
}

// Hover-based pre-resolution with debouncing to avoid unnecessary server load
let hoverPreResolveTimeout = null;
let currentlyHoveredItem = null;
function setupHoverPreResolution(containerId, getPlaylist) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('mouseover', (e) => {
        const item = e.target.closest('.track-item');
        if (!item || item === currentlyHoveredItem) return;

        currentlyHoveredItem = item;

        // Find track index
        const items = Array.from(container.querySelectorAll('.track-item'));
        const index = items.indexOf(item);
        if (index === -1) return;

        const playlist = getPlaylist();
        const track = playlist[index];
        if (!track || !track.id) return;

        if (hoverPreResolveTimeout) clearTimeout(hoverPreResolveTimeout);
        hoverPreResolveTimeout = setTimeout(() => {
            fetch(`/api/pre_resolve?id=${encodeURIComponent(track.id)}`)
                .catch(err => console.error("Hover pre-resolve failed:", err));
        }, 150);
    });

    container.addEventListener('mouseout', (e) => {
        const item = e.target.closest('.track-item');
        const related = e.relatedTarget ? e.relatedTarget.closest('.track-item') : null;
        if (item && item !== related) {
            currentlyHoveredItem = null;
            if (hoverPreResolveTimeout) {
                clearTimeout(hoverPreResolveTimeout);
            }
        }
    });
}

// Update Active/Playing Item classes in result lists
function updatePlaylistItemsUI() {
    const listItems = resultsList.querySelectorAll('.track-item');
    listItems.forEach((item, i) => {
        if (activePlaylist === currentPlaylist && i === currentIndex) {
            item.classList.add('playing');
        } else {
            item.classList.remove('playing');
        }
    });

    const historyItems = historyList.querySelectorAll('.track-item');
    historyItems.forEach((item, i) => {
        if (activePlaylist === historyPlaylist && i === currentIndex) {
            item.classList.add('playing');
        } else {
            item.classList.remove('playing');
        }
    });

    const accountItems = accountList.querySelectorAll('.track-item');
    accountItems.forEach((item, i) => {
        if (activePlaylist === accountPlaylist && i === currentIndex) {
            item.classList.add('playing');
        } else {
            item.classList.remove('playing');
        }
    });
}

// Handle long titles scrolling marquee animation
function setupMarquee() {
    const containerWidth = trackTitle.parentElement.offsetWidth;
    const textWidth = trackTitle.offsetWidth;
    
    // Reset any existing animation
    trackTitle.style.animation = 'none';
    trackTitle.style.transform = 'translateX(0)';
    
    if (textWidth > containerWidth) {
        trackTitle.style.paddingLeft = '50px';
        const scrollDistance = textWidth + 100;
        const duration = scrollDistance / 25; // 25px per second
        
        // Dynamic styling injection for marquee
        let styleSheet = document.getElementById('marquee-keyframes');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'marquee-keyframes';
            document.head.appendChild(styleSheet);
        }
        
        styleSheet.innerHTML = `
            @keyframes marqueeScroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-${scrollDistance}px); }
            }
        `;
        
        trackTitle.style.animation = `marqueeScroll ${duration}s linear infinite`;
    } else {
        trackTitle.style.paddingLeft = '0';
    }
}

// Toggle Playback State
function togglePlayback() {
    if (!audio.src) return;
    
    initAudio(); // safe re-trigger
    
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(err => console.error("Playback failed:", err));
    }
}

// Play Previous Track in Playlist
function playPrevious() {
    if (activePlaylist.length === 0 || currentIndex === -1) return;
    
    let newIndex;
    if (isShuffle && activePlaylist.length > 1) {
        do {
            newIndex = Math.floor(Math.random() * activePlaylist.length);
        } while (newIndex === currentIndex);
    } else {
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
            newIndex = activePlaylist.length - 1;
        }
    }
    
    playTrack(activePlaylist[newIndex], newIndex, activePlaylist);
}

// Play Next Track in Playlist
function playNext() {
    if (activePlaylist.length === 0 || currentIndex === -1) return;
    
    let newIndex;
    if (isShuffle && activePlaylist.length > 1) {
        do {
            newIndex = Math.floor(Math.random() * activePlaylist.length);
        } while (newIndex === currentIndex);
    } else {
        newIndex = currentIndex + 1;
        if (newIndex >= activePlaylist.length) {
            if (repeatMode === 'all') {
                newIndex = 0;
            } else {
                audio.pause();
                audio.currentTime = 0;
                isPlaying = false;
                playIcon.className = 'fa-solid fa-play';
                trackArtwork.classList.remove('playing');
                fetch('/api/mpris_update?status=Paused').catch(err => console.error(err));
                return;
            }
        }
    }
    
    playTrack(activePlaylist[newIndex], newIndex, activePlaylist);
}

// Handle automatic track end
function handleTrackEnded() {
    if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => console.error(err));
    } else {
        playNext();
    }
}

// Seek Track playback position
function seekAudio(e) {
    if (!audio.src || !audio.duration) return;
    
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    
    audio.currentTime = percentage * audio.duration;
}

// Update Scrubber Progress
function updateProgress() {
    if (!audio.duration) return;
    
    const current = audio.currentTime;
    
    // Save playback position periodically (every 1 second)
    const currentRounded = Math.floor(current);
    if (window._lastSavedTime !== currentRounded) {
        window._lastSavedTime = currentRounded;
        localStorage.setItem('vibetube_last_time', current.toString());
    }
    
    const duration = audio.duration;
    const percentage = (current / duration) * 100;
    
    progressFill.style.width = `${percentage}%`;
    progressHandle.style.left = `${percentage}%`;
    
    // Send progress to main process (Windows taskbar progress)
    if (window.electronAPI && window.electronAPI.updateProgress) {
        window.electronAPI.updateProgress(percentage);
    }
    
    currentTimeLabel.textContent = formatTime(current);

    // Fullscreen timeline sync
    const fsCurrentTime = document.getElementById('fs-current-time');
    const fsProgressFill = document.getElementById('fs-progress-fill');
    if (fsCurrentTime) fsCurrentTime.textContent = formatTime(current);
    if (fsProgressFill) fsProgressFill.style.width = `${percentage}%`;

    // Synced lyrics highlight & scroll
    if (syncedLyrics.length > 0) {
        let activeIdx = -1;
        for (let i = 0; i < syncedLyrics.length; i++) {
            if (current >= syncedLyrics[i].time) {
                activeIdx = i;
            } else {
                break;
            }
        }

        if (activeIdx !== currentLyricsIndex) {
            const prevActive = document.querySelector('.lyrics-line.active');
            if (prevActive) prevActive.classList.remove('active');

            currentLyricsIndex = activeIdx;
            if (activeIdx !== -1) {
                const activeLine = document.getElementById(`lyrics-line-${activeIdx}`);
                if (activeLine) {
                    activeLine.classList.add('active');
                    activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }
}

// Update Total Duration Label
function updateDuration() {
    if (audio.duration) {
        totalTimeLabel.textContent = formatTime(audio.duration);
    }
}

// Change volume visual indicators
function updateVolumeUI(val) {
    volumeText.textContent = `${Math.round(val * 100)}%`;
    
    if (val === 0) {
        volumeIcon.className = 'fa-solid fa-volume-xmark';
    } else if (val < 0.4) {
        volumeIcon.className = 'fa-solid fa-volume-low';
    } else {
        volumeIcon.className = 'fa-solid fa-volume-high';
    }
}

// Web Audio API Setup
function initAudio() {
    if (audioCtx) return;
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create element source
    source = audioCtx.createMediaElementSource(audio);
    
    // Equalizer Frequencies: 60Hz, 150Hz, 400Hz, 1kHz, 3kHz, 8kHz, 15kHz
    const frequencies = [60, 150, 400, 1000, 3000, 8000, 15000];
    
    let lastNode = source;
    
    frequencies.forEach((freq, i) => {
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        
        // Retrieve slider starting value
        const sliderVal = parseFloat(eqSliders[i].value);
        filter.gain.value = sliderVal;
        
        filters.push(filter);
        
        lastNode.connect(filter);
        lastNode = filter;
    });
    
    // Create Bass Boost filter (peaking filter at 55Hz for deep physical vibration)
    bassBoostFilter = audioCtx.createBiquadFilter();
    bassBoostFilter.type = 'peaking';
    bassBoostFilter.frequency.value = 55; // Sweet spot for bass punch
    bassBoostFilter.Q.value = 1.5;        // Focused Q factor
    bassBoostFilter.gain.value = bassBoostActive ? bassBoostGain : 0;
    lastNode.connect(bassBoostFilter);
    lastNode = bassBoostFilter;
    
    // Create Delay Reverb Nodes
    reverbDelay = audioCtx.createDelay(1.0);
    reverbDelay.delayTime.value = 0.35; // 350ms echo delay
    
    reverbFeedback = audioCtx.createGain();
    reverbFeedback.gain.value = 0.45; // feedback level
    
    reverbWetGain = audioCtx.createGain();
    reverbWetGain.gain.value = reverbActive ? reverbLevel * 0.75 : 0;
    
    reverbDryGain = audioCtx.createGain();
    reverbDryGain.gain.value = 1.0;
    
    // Connect feedback loop
    reverbDelay.connect(reverbFeedback);
    reverbFeedback.connect(reverbDelay);
    
    // Setup Analyser
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    // Connect dry path
    lastNode.connect(reverbDryGain);
    reverbDryGain.connect(analyser);
    
    // Connect wet path
    lastNode.connect(reverbDelay);
    reverbDelay.connect(reverbWetGain);
    reverbWetGain.connect(analyser);
    
    // Create Limiter to prevent clipping and digital distortion
    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-1.0, audioCtx.currentTime); // Clamp at -1dB
    limiter.knee.setValueAtTime(8.0, audioCtx.currentTime);        // Soft knee
    limiter.ratio.setValueAtTime(20.0, audioCtx.currentTime);       // High ratio = limiter
    limiter.attack.setValueAtTime(0.003, audioCtx.currentTime);    // Fast attack (3ms)
    limiter.release.setValueAtTime(0.08, audioCtx.currentTime);    // Fast release (80ms)

    analyser.connect(limiter);
    limiter.connect(audioCtx.destination);
    
    // Start canvas visualizer loop
    startVisualizer();
}

// Apply Equalizer Preset
function applyPreset(name) {
    const gains = PRESETS[name];
    if (!gains) return;
    
    gains.forEach((gain, i) => {
        eqSliders[i].value = gain;
        const sign = gain > 0 ? '+' : '';
        eqValues[i].textContent = `${sign}${gain.toFixed(1)}dB`;
        
        if (filters[i]) {
            filters[i].gain.setValueAtTime(gain, audioCtx.currentTime);
        }
    });
    
    saveEQSettings();
}

// Toggle visualizer style mode
const VISUALIZER_MODES = ['bars', 'wave', 'spikes', 'spectrum', 'decibels', 'battery', 'particle', 'retro'];
function toggleVisualizerMode() {
    const idx = VISUALIZER_MODES.indexOf(visualizerMode);
    visualizerMode = VISUALIZER_MODES[(idx + 1) % VISUALIZER_MODES.length];

    updateVisualizerView();
}

function updateVisualizerView() {
    const video = document.getElementById('visualizer-video');
    if (video) {
        video.style.display = 'none';
        video.pause();
    }

    if (visualizerMode === 'bars') {
        visualizerModeBtn.innerHTML = '<i class="fa-solid fa-chart-simple"></i> Режим: Смуги & Хвиля';
    } else if (visualizerMode === 'wave') {
        visualizerModeBtn.innerHTML = '<i class="fa-solid fa-wave-square"></i> Режим: Неонові Хвилі';
    } else if (visualizerMode === 'spikes') {
        visualizerModeBtn.innerHTML = '<i class="fa-solid fa-circle-nodes"></i> Режим: 3D Промені';
    } else if (visualizerMode === 'spectrum') {
        visualizerModeBtn.innerHTML = '<i class="fa-solid fa-arrows-left-right-to-line"></i> Режим: WMP Спектр';
    } else if (visualizerMode === 'decibels') {
        visualizerModeBtn.innerHTML = '<i class="fa-solid fa-chart-area"></i> Режим: Децибели';
    } else if (visualizerMode === 'battery') {
        visualizerModeBtn.innerHTML = '<i class="fa-solid fa-arrows-spin"></i> Режим: Battery';
    } else if (visualizerMode === 'particle') {
        visualizerModeBtn.innerHTML = '<i class="fa-solid fa-snowflake"></i> Режим: Particle';
    } else if (visualizerMode === 'retro') {
        visualizerModeBtn.innerHTML = '<i class="fa-solid fa-compact-disc"></i> Режим: Ретро Pioneer';
    }
}

// Helper for plasma colors
function getRgbStringValues(colorStr) {
    const clean = colorStr.trim();
    if (clean.startsWith('rgb')) {
        const matches = clean.match(/\d+/g);
        if (matches && matches.length >= 3) {
            return `${matches[0]}, ${matches[1]}, ${matches[2]}`;
        }
    }
    let hex = clean.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16) || 139;
    const g = parseInt(hex.substring(2, 4), 16) || 92;
    const b = parseInt(hex.substring(4, 6), 16) || 246;
    return `${r}, ${g}, ${b}`;
}

// Helper for WMP Battery colors (center pink/white -> green -> cyan -> purple)
function getBatteryColor(t, opacity) {
    let r, g, b;
    if (t < 0.2) {
        // White/pinkish to bright pink/magenta
        const ratio = t / 0.2;
        r = 255;
        g = Math.round(255 - ratio * 155);
        b = Math.round(255 - ratio * 55);
    } else if (t < 0.45) {
        // Pink/magenta to green
        const ratio = (t - 0.2) / 0.25;
        r = Math.round(255 - ratio * 205);
        g = Math.round(100 + ratio * 120);
        b = Math.round(200 - ratio * 100);
    } else if (t < 0.7) {
        // Green to cyan/blue
        const ratio = (t - 0.45) / 0.25;
        r = Math.round(50 - ratio * 50);
        g = Math.round(220 - ratio * 20);
        b = Math.round(100 + ratio * 155);
    } else {
        // Cyan/blue to deep purple/magenta
        const ratio = (t - 0.7) / 0.3;
        r = Math.round(ratio * 120);
        g = Math.round(200 - ratio * 200);
        b = Math.round(255 - ratio * 75);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Run real-time Canvas Visualizer animation
function startVisualizer() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const peakHeights = [];
    const peakHoldTimes = [];
    const batteryRings = [];
    let frameCount = 0;
    let batteryOffset = 0;
    
    function draw() {
        animationId = requestAnimationFrame(draw);
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Get theme colors dynamically
        const docStyles = getComputedStyle(document.documentElement);
        const primaryColor = docStyles.getPropertyValue('--primary-glow').trim() || '#1db954';
        const secondaryColor = docStyles.getPropertyValue('--secondary-glow').trim() || '#1ed760';
        
        // Draw trailing background (Spotify dark gray-black tint)
        canvasCtx.fillStyle = 'rgba(12, 12, 14, 0.25)';
        canvasCtx.fillRect(0, 0, width, height);

        // Fetch frequency data to compute bass pulse
        const bassArray = new Uint8Array(4);
        if (analyser) {
            analyser.getByteFrequencyData(bassArray);
        }
        
        let bassSum = 0;
        for (let i = 0; i < 4; i++) {
            bassSum += bassArray[i] || 0;
        }
        let avgBass = bassSum / 4;
        let bassPercent = avgBass / 255; // 0.0 to 1.0

        // Dynamic box shadow pulse on the visualizer container
        const container = document.querySelector('.visualizer-container');
        if (container) {
            const shadowIntensity = bassPercent * 30;
            container.style.boxShadow = `0 0 ${shadowIntensity}px rgba(29, 185, 84, ${bassPercent * 0.45})`;
            
            // Subtle dynamic scaling of the artwork card!
            const artwork = document.getElementById('track-artwork');
            if (artwork && isPlaying) {
                artwork.style.transform = `scale(${1 + bassPercent * 0.04})`;
                artwork.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.6), 0 0 ${10 + bassPercent * 30}px rgba(29, 185, 84, ${0.1 + bassPercent * 0.35})`;
            } else if (artwork) {
                artwork.style.transform = '';
                artwork.style.boxShadow = '';
            }
            
            // Pulse the background glow
            const artworkPulse = document.getElementById('artwork-pulse');
            if (artworkPulse) {
                artworkPulse.style.opacity = isPlaying ? bassPercent * 0.8 : 0;
                artworkPulse.style.transform = isPlaying ? `scale(${1 + bassPercent * 0.15})` : '';
            }
        }

        if (visualizerMode === 'bars') {
            analyser.getByteFrequencyData(dataArray);
            
            const barCount = Math.min(bufferLength - 40, 32); // Classic WMP bar limit
            const barWidth = (width / barCount);
            
            // Draw WMP-style vertical bars (Green -> Yellow -> Red)
            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i];
                const percent = value / 255;
                const barHeight = percent * height * 0.72;
                const x = i * barWidth;
                
                const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
                gradient.addColorStop(0, '#00ff00');   // green
                gradient.addColorStop(0.65, '#ffff00'); // yellow
                gradient.addColorStop(1, '#ff0000');    // red
                
                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x + 3, height - barHeight, barWidth - 6, barHeight);
                
                // Peak gravity
                if (peakHeights[i] === undefined || barHeight > peakHeights[i]) {
                    peakHeights[i] = barHeight;
                    peakHoldTimes[i] = 16;
                } else {
                    if (peakHoldTimes[i] > 0) {
                        peakHoldTimes[i]--;
                    } else {
                        peakHeights[i] -= 1.8;
                        if (peakHeights[i] < 0) peakHeights[i] = 0;
                    }
                }
                
                // Draw WMP red peak dot
                if (peakHeights[i] > 0) {
                    canvasCtx.fillStyle = '#ff3333';
                    canvasCtx.fillRect(x + 3, height - peakHeights[i] - 4, barWidth - 6, 2);
                }
            }
            
            // Overlapping classic WMP yellow oscilloscope wave
            analyser.getByteTimeDomainData(dataArray);
            canvasCtx.beginPath();
            canvasCtx.lineWidth = 1.6;
            canvasCtx.strokeStyle = '#ffff00'; // bright yellow
            
            const sliceWidth = width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * height / 2;
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasCtx.stroke();
            
        } else if (visualizerMode === 'wave') {
            // Neon wave ribbons
            analyser.getByteTimeDomainData(dataArray);
            
            for (let w = 0; w < 3; w++) {
                canvasCtx.beginPath();
                canvasCtx.lineWidth = 4.5 - w * 1.5;
                canvasCtx.strokeStyle = w === 0 ? primaryColor : (w === 1 ? secondaryColor : '#ffffff');
                canvasCtx.shadowBlur = w === 0 ? 16 : 6;
                canvasCtx.shadowColor = canvasCtx.strokeStyle;
                
                const time = Date.now() * 0.003;
                const phaseOffset = w * Math.PI / 1.5;
                
                for (let x = 0; x < width; x += 6) {
                    const idx = Math.floor((x / width) * bufferLength * 0.45);
                    const amp = (dataArray[idx] - 128) * 1.6;
                    const sin = Math.sin(x * 0.012 - time + phaseOffset);
                    const y = (height / 2) + sin * (35 + amp);
                    
                    if (x === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }
                }
                canvasCtx.stroke();
            }
            canvasCtx.shadowBlur = 0; // reset
            
        } else if (visualizerMode === 'spikes') {
            // Circular 3D radiating spikes (Plenoptic)
            analyser.getByteFrequencyData(dataArray);
            
            const centerX = width / 2;
            const centerY = height / 2;
            const baseRadius = Math.min(width, height) * 0.25;
            
            // Draw WMP Plenoptic central dark vinyl ring with cyan border
            canvasCtx.beginPath();
            canvasCtx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
            canvasCtx.fillStyle = '#05060b';
            canvasCtx.fill();
            canvasCtx.strokeStyle = '#00ffff';
            canvasCtx.lineWidth = 2.5;
            canvasCtx.stroke();
            
            const spikeCount = 64;
            const rotation = Date.now() * 0.0005;
            
            for (let i = 0; i < spikeCount; i++) {
                const angle = (i / spikeCount) * Math.PI * 2 + rotation;
                const freqIdx = Math.floor((i / spikeCount) * bufferLength * 0.35);
                const val = dataArray[freqIdx];
                const percent = val / 255;
                const spikeLen = percent * baseRadius * 0.82;
                
                const startX = centerX + Math.cos(angle) * baseRadius;
                const startY = centerY + Math.sin(angle) * baseRadius;
                const endX = centerX + Math.cos(angle) * (baseRadius + spikeLen);
                const endY = centerY + Math.sin(angle) * (baseRadius + spikeLen);
                
                // Cyan/blue glowing spikes
                canvasCtx.strokeStyle = `rgba(0, 255, 255, ${0.45 + percent * 0.55})`;
                canvasCtx.lineWidth = 2.5;
                canvasCtx.beginPath();
                canvasCtx.moveTo(startX, startY);
                canvasCtx.lineTo(endX, endY);
                canvasCtx.stroke();
                
                // Outer glowing tip particles
                if (spikeLen > 5) {
                    canvasCtx.fillStyle = '#ffffff';
                    canvasCtx.beginPath();
                    canvasCtx.arc(endX, endY, 2, 0, Math.PI * 2);
                    canvasCtx.fill();
                }
            }
            
        } else if (visualizerMode === 'spectrum') {
            analyser.getByteFrequencyData(dataArray);
            const barCount = Math.min(bufferLength - 40, 48);
            const barWidth = (width / barCount);
            const centerY = height / 2;
            
            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i];
                const percent = value / 255;
                const barHeight = percent * height * 0.4;
                const x = i * barWidth;
                
                // Classic WMP neon green/cyan glow spectrum
                canvasCtx.fillStyle = `hsla(${120 + i * 2}, 100%, 50%, 0.85)`;
                
                // Draw mirrored bars from center line
                canvasCtx.fillRect(x + 2, centerY - barHeight, barWidth - 4, barHeight);
                canvasCtx.fillRect(x + 2, centerY, barWidth - 4, barHeight);
                
                // Mirror Peak gravity
                if (peakHeights[i] === undefined || barHeight > peakHeights[i]) {
                    peakHeights[i] = barHeight;
                    peakHoldTimes[i] = 16;
                } else {
                    if (peakHoldTimes[i] > 0) {
                        peakHoldTimes[i]--;
                    } else {
                        peakHeights[i] -= 1.5;
                        if (peakHeights[i] < 0) peakHeights[i] = 0;
                    }
                }
                
                if (peakHeights[i] > 0) {
                    canvasCtx.fillStyle = '#00ffff';
                    canvasCtx.fillRect(x + 2, centerY - peakHeights[i] - 2, barWidth - 4, 2);
                    canvasCtx.fillRect(x + 2, centerY + peakHeights[i], barWidth - 4, 2);
                }
            }
        } else if (visualizerMode === 'decibels') {
            analyser.getByteFrequencyData(dataArray);
            
            const points = [];
            const step = Math.ceil(bufferLength / 30);
            
            for (let i = 0; i < bufferLength; i += step) {
                const percent = dataArray[i] / 255;
                const x = (i / bufferLength) * width;
                const y = height - (percent * height * 0.8);
                points.push({ x, y });
            }
            
            // Draw smooth bezier-like decibel curve
            canvasCtx.strokeStyle = '#06b6d4';
            canvasCtx.lineWidth = 3.5;
            canvasCtx.shadowBlur = 10;
            canvasCtx.shadowColor = '#06b6d4';
            
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, height);
            
            for (let i = 0; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i+1].x) / 2;
                const yc = (points[i].y + points[i+1].y) / 2;
                canvasCtx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            
            canvasCtx.lineTo(width, height);
            
            // Fill area with beautiful gradient
            const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
            canvasCtx.fillStyle = gradient;
            canvasCtx.fill();
            canvasCtx.stroke();
            canvasCtx.shadowBlur = 0;
            
        } else if (visualizerMode === 'battery') {
            analyser.getByteFrequencyData(dataArray);
            
            let sumBass = 0;
            let sumMid = 0;
            let sumTreble = 0;
            
            for (let i = 0; i < 10; i++) sumBass += dataArray[i];
            for (let i = 10; i < 30; i++) sumMid += dataArray[i];
            for (let i = 30; i < 60; i++) sumTreble += dataArray[i];
            
            const bass = sumBass / 10 / 255;
            const mid = sumMid / 20 / 255;
            const treble = sumTreble / 30 / 255;
            
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Update battery rings offset
            batteryOffset += 0.5 + bass * 2;
            
            // Draw concentric pulsing rings
            const maxR = Math.min(width, height) * 0.45;
            const ringCount = 5;
            
            for (let r = 1; r <= ringCount; r++) {
                const radius = ((r / ringCount) * maxR + batteryOffset) % maxR;
                const t = radius / maxR;
                
                canvasCtx.beginPath();
                canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                
                // Pulse size & color based on bass/mid/treble
                canvasCtx.strokeStyle = getBatteryColor(t, (1 - t) * (0.3 + bass * 0.7));
                canvasCtx.lineWidth = 1.5 + treble * 6;
                canvasCtx.shadowBlur = 4 + mid * 12;
                canvasCtx.shadowColor = canvasCtx.strokeStyle;
                canvasCtx.stroke();
            }
            canvasCtx.shadowBlur = 0;
            
            // Central core pulsing circle
            canvasCtx.beginPath();
            canvasCtx.arc(centerX, centerY, 15 + bass * 25, 0, Math.PI * 2);
            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            canvasCtx.fill();
            
        } else if (visualizerMode === 'particle') {
            analyser.getByteFrequencyData(dataArray);
            
            let sumBass = 0;
            for (let i = 0; i < 8; i++) sumBass += dataArray[i];
            const bass = sumBass / 8 / 255;
            
            // Initialize particles if not exists
            if (batteryRings.length === 0) {
                for (let i = 0; i < 80; i++) {
                    batteryRings.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        size: Math.random() * 2.5 + 0.5,
                        color: `hsla(${Math.random() * 360}, 100%, 70%, 0.8)`
                    });
                }
            }
            
            // Update and draw particles
            const centerX = width / 2;
            const centerY = height / 2;
            
            for (const p of batteryRings) {
                const speedMult = 1.0 + bass * 6.0;
                p.x += p.vx * speedMult;
                p.y += p.vy * speedMult;
                
                if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
                    p.x = centerX + (Math.random() - 0.5) * 40;
                    p.y = centerY + (Math.random() - 0.5) * 40;
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 1.5 + 0.5;
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                }
                
                canvasCtx.beginPath();
                canvasCtx.arc(p.x, p.y, p.size * (1.0 + bass * 1.2), 0, Math.PI * 2);
                canvasCtx.fillStyle = p.color;
                canvasCtx.fill();
            }
        } else if (visualizerMode === 'retro') {
            // Retro Pioneer VFD Car Stereo Spectrum Analyzer
            analyser.getByteFrequencyData(dataArray);
            
            // Draw retro black-blue vacuum VFD display backdrop
            canvasCtx.fillStyle = '#060912';
            canvasCtx.fillRect(0, 0, width, height);
            
            // Draw glowing horizontal VFD decibel marking grids
            canvasCtx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
            canvasCtx.lineWidth = 1;
            const dbLevels = [0.15, 0.35, 0.55, 0.75, 0.9];
            dbLevels.forEach(lvl => {
                const y = height * (1 - lvl);
                canvasCtx.beginPath();
                canvasCtx.moveTo(0, y);
                canvasCtx.lineTo(width, y);
                canvasCtx.stroke();
            });
            
            const channelHeight = (height - 35) / 2;
            const bands = 14; // 14-band display per channel
            const barWidth = (width / bands);
            const segments = 10; // 10 discrete segments per column
            
            for (let ch = 0; ch < 2; ch++) {
                const yOffset = ch * (channelHeight + 15) + 8;
                
                // Draw VFD retro font L / R labels
                canvasCtx.font = '800 9px "Orbitron", sans-serif';
                canvasCtx.fillStyle = ch === 0 ? '#ff9f00' : '#00e5ff';
                canvasCtx.fillText(ch === 0 ? 'CH L' : 'CH R', 8, yOffset + 12);
                
                for (let b = 0; b < bands; b++) {
                    // Get frequency data index (skewed for stereo difference!)
                    const freqIdx = Math.floor((b / bands) * bufferLength * 0.3) + (ch * 5);
                    const val = dataArray[freqIdx] || 0;
                    const percent = val / 255;
                    
                    const x = b * barWidth + 45; // Shift for labels
                    const usableWidth = barWidth - 8;
                    const activeSegments = Math.round(percent * segments);
                    
                    const peakKey = `retro_peak_${ch}_${b}`;
                    if (peakHeights[peakKey] === undefined || percent > peakHeights[peakKey]) {
                        peakHeights[peakKey] = percent;
                        peakHoldTimes[peakKey] = 25; // hold peak segment
                    } else {
                        if (peakHoldTimes[peakKey] > 0) {
                            peakHoldTimes[peakKey]--;
                        } else {
                            peakHeights[peakKey] -= 0.018; // slow drop
                            if (peakHeights[peakKey] < 0) peakHeights[peakKey] = 0;
                        }
                    }
                    
                    // Draw vertical segment blocks
                    for (let s = 0; s < segments; s++) {
                        const segY = yOffset + channelHeight - (s / segments) * channelHeight;
                        const segH = (channelHeight / segments) - 2;
                        
                        let color;
                        if (s < 5) {
                            color = 'rgba(0, 245, 212, '; // Bottom VFD Teal
                        } else if (s < 8) {
                            color = 'rgba(0, 229, 255, '; // Mid pure VFD Cyan
                        } else {
                            color = 'rgba(255, 75, 75, ';  // Top red warning band
                        }
                        
                        const isActive = s < activeSegments;
                        canvasCtx.fillStyle = color + (isActive ? '0.85)' : '0.04)');
                        
                        if (isActive) {
                            canvasCtx.shadowBlur = 8;
                            canvasCtx.shadowColor = canvasCtx.fillStyle;
                        } else {
                            canvasCtx.shadowBlur = 0;
                        }
                        canvasCtx.fillRect(x, segY, usableWidth - 4, segH);
                    }
                    canvasCtx.shadowBlur = 0;
                    
                    // Draw falling amber Peak Indicators
                    const peakPercent = peakHeights[peakKey];
                    if (peakPercent > 0.05) {
                        const peakSegIdx = Math.min(segments - 1, Math.floor(peakPercent * segments));
                        const peakY = yOffset + channelHeight - (peakSegIdx / segments) * channelHeight;
                        const peakH = (channelHeight / segments) - 2;
                        
                        canvasCtx.fillStyle = '#ff9f00'; // Amber peak hold
                        canvasCtx.shadowBlur = 10;
                        canvasCtx.shadowColor = '#ff9f00';
                        canvasCtx.fillRect(x, peakY, usableWidth - 4, peakH);
                        canvasCtx.shadowBlur = 0;
                    }
                }
            }
            
            // Faint retro stereo car audio markings at the bottom
            canvasCtx.font = '700 8px "Orbitron", sans-serif';
            canvasCtx.fillStyle = 'rgba(0, 229, 255, 0.35)';
            canvasCtx.fillText('PIONEER DECK D-721', 45, height - 3);
            canvasCtx.fillText('OEL MULTI-SPECTRUM ANALYZER', width - 180, height - 3);
        }
    }
    
    draw();
}

// Local Storage Helper: Save EQ values
function saveEQSettings() {
    const eq = [];
    eqSliders.forEach(slider => {
        eq.push(parseFloat(slider.value));
    });
    localStorage.setItem('vibetube_eq_gains', JSON.stringify(eq));
    
    // Save active preset button if applicable
    const activeBtn = document.querySelector('.preset-btn.active');
    if (activeBtn) {
        localStorage.setItem('vibetube_eq_preset', activeBtn.dataset.preset);
    } else {
        localStorage.removeItem('vibetube_eq_preset');
    }
}

// Local Storage Helper: Load EQ values
function loadEQSettings() {
    const savedEQ = localStorage.getItem('vibetube_eq_gains');
    const savedPreset = localStorage.getItem('vibetube_eq_preset');
    
    if (savedPreset) {
        applyPreset(savedPreset);
        presetBtns.forEach(b => {
            if (b.dataset.preset === savedPreset) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    } else if (savedEQ) {
        try {
            const eq = JSON.parse(savedEQ);
            eq.forEach((gain, i) => {
                eqSliders[i].value = gain;
                const sign = gain > 0 ? '+' : '';
                eqValues[i].textContent = `${sign}${gain.toFixed(1)}dB`;
            });
            // remove active from presets since loaded slider-by-slider
            presetBtns.forEach(b => b.classList.remove('active'));
        } catch (e) {
            console.error("Failed loading EQ from local storage", e);
        }
    }
}

// Local Storage Helper: Save history list
function addToHistory(track) {
    // Check if already in history, remove duplication
    historyPlaylist = historyPlaylist.filter(t => t.id !== track.id);
    
    // Add to top of list
    historyPlaylist.unshift(track);
    
    // Keep top 30 tracks
    if (historyPlaylist.length > 30) {
        historyPlaylist.pop();
    }
    
    localStorage.setItem('vibetube_history_tracks', JSON.stringify(historyPlaylist));
    renderHistoryList();
}

// Local Storage Helper: Load history list
function loadHistory() {
    const savedHistory = localStorage.getItem('vibetube_history_tracks');
    if (savedHistory) {
        try {
            historyPlaylist = JSON.parse(savedHistory);
            renderHistoryList();
            preResolveTopTracks(historyPlaylist, 1);
        } catch (e) {
            console.error("Failed loading history from local storage", e);
        }
    }
}

// Format Seconds into M:SS string
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Escape HTML utility to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// MPRIS Integration Functions
function mprisUpdateTrack(track) {
    if (!track) return;
    const title = encodeURIComponent(track.title);
    const artist = encodeURIComponent(track.channel);
    const duration = encodeURIComponent(track.duration);
    const artUrl = encodeURIComponent(track.thumbnail);
    const id = encodeURIComponent(track.id);
    
    fetch(`/api/mpris_update?status=Playing&title=${title}&artist=${artist}&duration=${duration}&art_url=${artUrl}&id=${id}`)
        .catch(err => console.error("Failed to update MPRIS metadata:", err));
}

async function pollMprisCommands() {
    while (true) {
        try {
            const response = await fetch('/api/mpris_pending');
            if (response.ok) {
                const data = await response.json();
                if (data && data.command) {
                    handleMprisCommand(data.command);
                }
            }
        } catch (err) {
            // Wait a bit before retrying on network error
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
        }
    }
}

function handleMprisCommand(cmd) {
    console.log("Received MPRIS command:", cmd);
    if (cmd === 'play') {
        if (audio.src && !isPlaying) {
            audio.play().catch(e => console.error(e));
        }
    } else if (cmd === 'pause') {
        if (audio.src && isPlaying) {
            audio.pause();
        }
    } else if (cmd === 'playpause') {
        togglePlayback();
    } else if (cmd === 'next') {
        playNext();
    } else if (cmd === 'prev') {
        playPrevious();
    } else if (cmd === 'stop') {
        if (audio.src) {
            audio.pause();
            audio.currentTime = 0;
        }
    } else if (cmd.startsWith('volume:')) {
        const val = parseFloat(cmd.split(':')[1]);
        if (!isNaN(val)) {
            const clamped = Math.max(0, Math.min(1, val));
            audio.volume = clamped;
            volumeSlider.value = clamped;
            updateVolumeUI(clamped);
        }
    } else if (cmd === 'quit') {
        window.close();
    }
}

async function fetchLyrics(artist, title) {
    const lyricsText = document.getElementById('lyrics-text');
    lyricsText.innerHTML = `
        <div class="spinner-container">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <p>Шукаємо текст пісні...</p>
        </div>
    `;

    syncedLyrics = [];
    currentLyricsIndex = -1;

    try {
        const response = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
        if (!response.ok) throw new Error("Lyrics fetch failed");
        
        const data = await response.json();
        
        if (data.syncedLyrics) {
            parseLrc(data.syncedLyrics);
        }
        
        if (syncedLyrics.length > 0) {
            const linesHtml = syncedLyrics.map((line, idx) => `
                <div class="lyrics-line" id="lyrics-line-${idx}" data-time="${line.time}">${escapeHTML(line.text)}</div>
            `).join('');
            lyricsText.innerHTML = linesHtml;
        } else if (data.lyrics && data.lyrics !== "Текст пісні не знайдено.") {
            const lines = data.lyrics.split('\n');
            const linesHtml = lines.map(line => `<div class="lyrics-line">${escapeHTML(line)}</div>`).join('');
            lyricsText.innerHTML = linesHtml;
        } else {
            lyricsText.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-microphone-lines-slash"></i>
                    <p>Текст для цієї пісні не знайдено.</p>
                </div>
            `;
        }
    } catch (err) {
        console.error("Lyrics error:", err);
        lyricsText.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation text-red"></i>
                <p>Не вдалося завантажити текст пісні.</p>
            </div>
        `;
    }
}

// Synced LRC parser
function parseLrc(lrcText) {
    syncedLyrics = [];
    if (!lrcText) return;

    const lines = lrcText.split('\n');
    const timeReg = /\[(\d+):(\d+(?:\.\d+)?)\]/;

    for (let line of lines) {
        const match = timeReg.exec(line);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseFloat(match[2]);
            const time = minutes * 60 + seconds;
            const text = line.replace(timeReg, '').trim();
            if (text) {
                syncedLyrics.push({ time, text });
            }
        }
    }
    syncedLyrics.sort((a, b) => a.time - b.time);
}

// Dynamic Color Extraction
function extractDominantColor(imgUrl) {
    if (themeMode !== 'auto') return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 10;
            canvas.height = 10;
            ctx.drawImage(img, 0, 0, 10, 10);
            
            const imgData = ctx.getImageData(0, 0, 10, 10).data;
            let r = 0, g = 0, b = 0, count = 0;
            
            for (let i = 0; i < imgData.length; i += 4) {
                const red = imgData[i];
                const green = imgData[i+1];
                const blue = imgData[i+2];
                const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
                
                // Keep only colorful/saturated mid-tone pixels
                if (brightness > 30 && brightness < 220) {
                    r += red;
                    g += green;
                    b += blue;
                    count++;
                }
            }
            
            if (count > 0) {
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
            } else {
                r = imgData[0];
                g = imgData[1];
                b = imgData[2];
            }
            
            updateAppGlowTheme(r, g, b);
        } catch (e) {
            console.error("Color extraction failed:", e);
        }
    };
    img.src = imgUrl;
}

function updateAppGlowTheme(r, g, b) {
    // Generate complementary secondary color
    const cr = 255 - r;
    const cg = 255 - g;
    const cb = 255 - b;
    
    // Get custom glow intensity multiplier (defaults to 100%)
    const glowMult = parseFloat(localStorage.getItem('vibetube_theme_glow') || '100') / 100;
    
    document.documentElement.style.setProperty('--primary-glow', `rgb(${r}, ${g}, ${b})`);
    document.documentElement.style.setProperty('--primary-glow-rgba', `rgba(${r}, ${g}, ${b}, ${0.45 * glowMult})`);
    document.documentElement.style.setProperty('--neon-purple', `rgb(${r}, ${g}, ${b})`);

    document.documentElement.style.setProperty('--secondary-glow', `rgb(${cr}, ${cg}, ${cb})`);
    document.documentElement.style.setProperty('--secondary-glow-rgba', `rgba(${cr}, ${cg}, ${cb}, ${0.45 * glowMult})`);
    document.documentElement.style.setProperty('--neon-cyan', `rgb(${cr}, ${cg}, ${cb})`);
}

function loadLikedTracks() {
    const saved = localStorage.getItem('vibetube_liked_tracks');
    if (saved) {
        try {
            likedTracks = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to load liked tracks:", e);
        }
    }
}

// Sync with YouTube History
async function syncYoutubeHistory() {
    const historyEmpty = document.getElementById('history-empty');
    historyEmpty.style.display = 'none';
    
    // Clear list and show loader
    historyList.innerHTML = `
        <div class="spinner-container">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <p style="margin-top: 10px;">Завантаження історії з YouTube...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/user_playlist?type=history`);
        if (!response.ok) throw new Error("Server error loading history");
        
        const results = await response.json();
        historyPlaylist = results;
        renderHistoryList();
        preResolveTopTracks(historyPlaylist, 2);
    } catch (err) {
        console.error("Failed to load YouTube history:", err);
        historyList.innerHTML = '';
        historyEmpty.style.display = 'flex';
        historyEmpty.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.8;"></i>
            <p>Не вдалося завантажити історію. Переконайтеся, що ви авторизовані в YouTube у вашому браузері (Firefox, Chrome, Brave тощо) на цьому комп'ютері.</p>
        `;
    }
}

// Start radio based on the currently playing song
async function startSongRadio() {
    if (currentIndex === -1 || !activePlaylist[currentIndex]) return;
    const currentTrack = activePlaylist[currentIndex];
    
    let videoId = currentTrack.id;
    if (videoId.startsWith('http')) {
        const urlParams = new URLSearchParams(new URL(videoId).search);
        if (urlParams.has('v')) {
            videoId = urlParams.get('v');
        } else {
            alert("Радіо підтримується лише для треків з YouTube.");
            return;
        }
    }
    const radioPlaylistUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;
    
    // Switch to search/results tab to show loading state
    switchTab('results');
    resultsEmpty.style.display = 'none';
    resultsList.innerHTML = `
        <div class="spinner-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: var(--text-muted);">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--neon-cyan);"></i>
            <p style="margin-top: 15px; text-align: center; font-size: 0.95rem;">Створюємо радіостанцію на основі треку "${escapeHTML(currentTrack.title)}"...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/user_playlist?url=${encodeURIComponent(radioPlaylistUrl)}`);
        if (!response.ok) throw new Error("Failed to load radio playlist");
        const results = await response.json();
        
        if (results.length === 0) {
            resultsList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-circle-xmark text-red" style="font-size: 2rem;"></i>
                    <p>Не вдалося створити радіостанцію для цього треку. Спробуйте інший.</p>
                </div>
            `;
            return;
        }
        
        currentPlaylist = results;
        renderResultsList();
        
        // Auto-play the first track of the radio playlist
        playTrack(currentPlaylist[0], 0, currentPlaylist);
    } catch (err) {
        console.error("Failed to start song radio:", err);
        resultsList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 2rem;"></i>
                <p>Помилка створення радіостанції: ${err.message}</p>
            </div>
        `;
    }
}

// Restore last player state from localStorage (track, playlist, position, lyrics)
function restoreLastState() {
    try {
        const lastTrackStr = localStorage.getItem('vibetube_last_track');
        const lastPlaylistStr = localStorage.getItem('vibetube_last_playlist');
        const lastIndexStr = localStorage.getItem('vibetube_last_index');
        const lastTimeStr = localStorage.getItem('vibetube_last_time');
        
        if (lastTrackStr && lastPlaylistStr && lastIndexStr) {
            const track = JSON.parse(lastTrackStr);
            const playlist = JSON.parse(lastPlaylistStr);
            const index = parseInt(lastIndexStr);
            const time = lastTimeStr ? parseFloat(lastTimeStr) : 0;
            
            // Set variables
            activePlaylist = playlist;
            currentIndex = index;
            currentPlaylist = playlist;
            
            // Set UI details
            trackTitle.textContent = track.title;
            trackChannel.textContent = track.channel;
            trackArtwork.style.backgroundImage = `url('${track.thumbnail}')`;
            if (track.thumbnail) {
                extractDominantColor(track.thumbnail);
            }
            
            // Show radio button
            const songRadioBtn = document.getElementById('song-radio-btn');
            if (songRadioBtn) songRadioBtn.style.display = 'inline-block';
            
            // Set audio source but do NOT auto-play
            audio.src = `/api/stream?id=${encodeURIComponent(track.id)}`;
            
            // Re-apply speed and pitch preservation settings
            const currentRate = parseFloat(speedSlider.value);
            audio.playbackRate = currentRate;
            audio.preservesPitch = preservePitchCheckbox.checked;
            
            // Wait for audio metadata to load before seeking
            audio.addEventListener('loadedmetadata', function onMetadata() {
                audio.currentTime = time;
                
                // Update scrubber UI
                const percentage = (time / audio.duration) * 100;
                progressFill.style.width = `${percentage}%`;
                progressHandle.style.left = `${percentage}%`;
                currentTimeLabel.textContent = formatTime(time);
                totalTimeLabel.textContent = formatTime(audio.duration);
                
                audio.removeEventListener('loadedmetadata', onMetadata);
            });
            
            // Pre-load lyrics in the background
            fetchLyrics(track.channel, track.title);
            
            // Render the restored playlist in the main view
            renderResultsList();
            updatePlaylistItemsUI();
        }
    } catch (e) {
        console.error("Failed to restore last player state:", e);
    }
}

// Initialize HTML5 Media Session action handlers (Windows/macOS controls compatibility)
function initMediaSessionHandlers() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            if (audio.src && !isPlaying) {
                audio.play().catch(e => console.error(e));
            }
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            if (audio.src && isPlaying) {
                audio.pause();
            }
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            playPrevious();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            playNext();
        });
        
        // Support seeking in Media Session
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.fastSeek && 'fastSeek' in audio) {
                audio.fastSeek(details.seekTime);
            } else {
                audio.currentTime = details.seekTime;
            }
        });
    }
}

function updateDiscordPresence() {
    if (window.electronAPI && typeof window.electronAPI.updateTrackMetadata === 'function') {
        const track = currentIndex !== -1 ? activePlaylist[currentIndex] : null;
        if (track) {
            window.electronAPI.updateTrackMetadata({
                title: track.title,
                artist: track.channel,
                isPlaying: isPlaying,
                duration: audio.duration,
                currentTime: audio.currentTime
            });
        }
    }
}

// Update system media controls across platforms (MPRIS on Linux + Media Session on Windows/macOS)
function updateSystemMediaControls(track) {
    if (!track) return;
    
    // 1. Update MPRIS (for Linux DBus)
    mprisUpdateTrack(track);
    
    // 2. Update HTML5 Media Session (for Windows SMTC & macOS Now Playing)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.channel,
            album: 'VibeTube',
            artwork: [
                { src: track.thumbnail, sizes: '96x96',   type: 'image/jpeg' },
                { src: track.thumbnail, sizes: '128x128', type: 'image/jpeg' },
                { src: track.thumbnail, sizes: '192x192', type: 'image/jpeg' },
                { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
                { src: track.thumbnail, sizes: '384x384', type: 'image/jpeg' },
                { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
        
        // Set playback state
        navigator.mediaSession.playbackState = 'playing';
    }

    // 3. Show native OS desktop notification
    showTrackNotification(track);

    // 4. Update Discord Rich Presence status
    updateDiscordPresence();
}

// Track change desktop notification handler to prevent overlapping notification spam
let currentNotification = null;
function showTrackNotification(track) {
    if (!track || !window.Notification) return;
    
    if (Notification.permission === 'granted') {
        if (currentNotification) {
            currentNotification.close();
        }
        
        currentNotification = new Notification("VibeTube — Зараз грає", {
            body: `${track.title}\n${track.channel}`,
            icon: track.thumbnail || '',
            silent: true
        });
    }
}

// Convert Hex to RGB object
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex.substring(0, 1).repeat(2), 16);
        g = parseInt(hex.substring(1, 2).repeat(2), 16);
        b = parseInt(hex.substring(2, 3).repeat(2), 16);
    } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    return { r, g, b };
}

// Apply Hex Color to CSS variables
function applyThemeColor(hex) {
    const rgb = hexToRgb(hex);
    if (rgb) {
        updateAppGlowTheme(rgb.r, rgb.g, rgb.b);
    }
}

// Fetch and Apply OS System Accent Color
async function applySystemAccentColor() {
    if (window.electronAPI && window.electronAPI.getSystemAccentColor) {
        try {
            const hex = await window.electronAPI.getSystemAccentColor();
            if (hex) {
                // Electron might return system color with/without # or alpha in ARGB (like aabbccff)
                // Let's sanitize to standard hex
                let cleanHex = hex.trim().replace('#', '');
                if (cleanHex.length === 8) {
                    // ARGB/RGBA format - take the RGB portion
                    cleanHex = cleanHex.substring(0, 6);
                }
                const finalHex = `#${cleanHex}`;
                applyThemeColor(finalHex);
            } else {
                // Fallback if system color is empty/null (e.g. Linux)
                applyThemeColor(lastManualColor);
            }
        } catch (e) {
            console.error("Failed to apply system accent color:", e);
            applyThemeColor(lastManualColor);
        }
    } else {
        applyThemeColor(lastManualColor);
    }
}

// Initialize Customization Settings
function initThemeSettings() {
    // 1. Load settings from localStorage
    themeMode = localStorage.getItem('vibetube_theme_mode') || 'auto';
    lastManualColor = localStorage.getItem('vibetube_theme_color') || '#1db954';
    const savedBlur = localStorage.getItem('vibetube_theme_blur') || '20';
    const savedGlow = localStorage.getItem('vibetube_theme_glow') || '100';

    // 2. Set UI fields to match loaded state
    if (themeBlurSlider) {
        themeBlurSlider.value = savedBlur;
        themeBlurVal.textContent = `${savedBlur}px`;
        document.documentElement.style.setProperty('--card-blur', `${savedBlur}px`);
    }
    if (themeGlowSlider) {
        themeGlowSlider.value = savedGlow;
        themeGlowVal.textContent = `${savedGlow}%`;
        document.documentElement.style.setProperty('--glow-multiplier', parseFloat(savedGlow) / 100);
    }

    // Select correct radio button
    if (themeMode === 'auto') {
        themeModeAuto.checked = true;
        themeManualControls.style.display = 'none';
        // Auto-extract color from current playing song if active
        if (currentIndex !== -1 && activePlaylist[currentIndex]) {
            extractDominantColor(activePlaylist[currentIndex].thumbnail);
        } else {
            applyThemeColor('#1db954');
        }
    } else if (themeMode === 'system') {
        themeModeSystem.checked = true;
        themeManualControls.style.display = 'none';
        applySystemAccentColor();
    } else {
        themeModeManual.checked = true;
        themeManualControls.style.display = 'block';
        applyThemeColor(lastManualColor);
        themeCustomPicker.value = lastManualColor;
        
        // Highlight active preset
        document.querySelectorAll('.theme-preset-btn').forEach(btn => {
            if (btn.dataset.color === lastManualColor) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 3. Bind Event Listeners
    // Modal toggle
    if (themeSettingsBtn) {
        themeSettingsBtn.addEventListener('click', () => {
            themeModalOverlay.classList.add('active');
        });
    }
    if (themeModalCloseBtn) {
        themeModalCloseBtn.addEventListener('click', () => {
            themeModalOverlay.classList.remove('active');
        });
    }
    if (themeModalOverlay) {
        themeModalOverlay.addEventListener('click', (e) => {
            if (e.target === themeModalOverlay) {
                themeModalOverlay.classList.remove('active');
            }
        });
    }

    // Radio changes
    const handleModeChange = (mode) => {
        themeMode = mode;
        localStorage.setItem('vibetube_theme_mode', mode);
        
        if (mode === 'auto') {
            themeManualControls.style.display = 'none';
            if (currentIndex !== -1 && activePlaylist[currentIndex]) {
                extractDominantColor(activePlaylist[currentIndex].thumbnail);
            } else {
                applyThemeColor('#1db954');
            }
        } else if (mode === 'system') {
            themeManualControls.style.display = 'none';
            applySystemAccentColor();
        } else {
            themeManualControls.style.display = 'block';
            applyThemeColor(lastManualColor);
            themeCustomPicker.value = lastManualColor;
        }
    };

    if (themeModeAuto) themeModeAuto.addEventListener('change', () => handleModeChange('auto'));
    if (themeModeSystem) themeModeSystem.addEventListener('change', () => handleModeChange('system'));
    if (themeModeManual) themeModeManual.addEventListener('change', () => handleModeChange('manual'));

    // Preset button clicks
    document.querySelectorAll('.theme-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.dataset.color;
            lastManualColor = color;
            themeCustomPicker.value = color;
            localStorage.setItem('vibetube_theme_color', color);
            applyThemeColor(color);
        });
    });

    // Custom color picker changes
    if (themeCustomPicker) {
        themeCustomPicker.addEventListener('input', (e) => {
            document.querySelectorAll('.theme-preset-btn').forEach(b => b.classList.remove('active'));
            const color = e.target.value;
            lastManualColor = color;
            localStorage.setItem('vibetube_theme_color', color);
            applyThemeColor(color);
        });
    }

    // Blur slider events
    if (themeBlurSlider) {
        themeBlurSlider.addEventListener('input', () => {
            const val = themeBlurSlider.value;
            themeBlurVal.textContent = `${val}px`;
            document.documentElement.style.setProperty('--card-blur', `${val}px`);
            localStorage.setItem('vibetube_theme_blur', val);
        });
    }

    // Glow slider events
    if (themeGlowSlider) {
        themeGlowSlider.addEventListener('input', () => {
            const val = themeGlowSlider.value;
            themeGlowVal.textContent = `${val}%`;
            document.documentElement.style.setProperty('--glow-multiplier', parseFloat(val) / 100);
            localStorage.setItem('vibetube_theme_glow', val);
            
            if (themeMode === 'auto' && currentIndex !== -1 && activePlaylist[currentIndex]) {
                const savedMode = themeMode;
                themeMode = 'auto'; 
                extractDominantColor(activePlaylist[currentIndex].thumbnail);
                themeMode = savedMode;
            } else if (themeMode === 'system') {
                applySystemAccentColor();
            } else {
                applyThemeColor(lastManualColor);
            }
        });
    }
}
