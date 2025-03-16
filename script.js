const audio = document.getElementById("audio");
const lyricsContainer = document.getElementById("lyrics");
let lyrics = [];
let currentLineIndex = -1;
let currentWordIndex = -1;
let isPlaying = false;

document.getElementById("mp3File").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const objectURL = URL.createObjectURL(file);
        audio.src = objectURL;
    }
});

document.getElementById("lrcFile").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            parseLRC(e.target.result);
        };
        reader.readAsText(file);
    }
});

// Add at the top with other variables
const settings = {
    theme: localStorage.getItem('theme') || 'dark',
    censorWords: localStorage.getItem('censorWords') === 'true' || false
};

const badWords = ['fuck', 'shit', 'ass', 'bitch', 'nigga', 'nigger', 'dick', 'piss', 'pussy']; // Add more as needed

function censorWord(word) {
    return word.charAt(0) + '*'.repeat(word.length - 1);
}

function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
}

// Modify the parseLRC function to handle censoring
function parseLRC(data) {
    lyrics = [];
    const lines = data.split("\n");
    
    for (const line of lines) {
        const timestampMatches = line.match(/\[\d+:\d+\.\d+\]/g);
        if (!timestampMatches) continue;
        
        let content = line.replace(/\[\d+:\d+\.\d+\]/g, '').trim();
        let censoredContent = content;
        
        if (settings.censorWords) {
            badWords.forEach(word => {
                const regex = new RegExp(word, 'gi');
                censoredContent = censoredContent.replace(regex, censorWord);
            });
        }
        
        const timeMatch = timestampMatches[0].match(/\[(\d+):(\d+\.\d+)\]/);
        if (timeMatch) {
            const minutes = parseInt(timeMatch[1]);
            const seconds = parseFloat(timeMatch[2]);
            const time = minutes * 60 + seconds;
            
            lyrics.push({
                text: content,
                censoredText: censoredContent,
                time: time
            });
        }
    }
    
    lyrics.sort((a, b) => a.time - b.time);
    updateLyricsDisplay();
}

function updateLyricsDisplay() {
    lyricsContainer.innerHTML = '';
    
    lyrics.forEach((line, lineIndex) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'lyric-line';
        lineDiv.id = `line-${lineIndex}`;
        lineDiv.textContent = settings.censorWords ? line.censoredText : line.text;
        lyricsContainer.appendChild(lineDiv);
    });

    lyricsContainer.style.justifyContent = lyrics.length <= 3 ? 'center' : 'flex-start';
}

// Remove the individual event listeners for settings
// and wrap them in a function

function initializeSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const themeSelect = document.getElementById('themeSelect');
    const censorToggle = document.getElementById('censorToggle');

    if (settingsBtn && settingsPanel && themeSelect && censorToggle) {
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('show');
        });

        themeSelect.addEventListener('change', (e) => {
            settings.theme = e.target.value;
            applyTheme(settings.theme);
        });

        censorToggle.addEventListener('change', (e) => {
            settings.censorWords = e.target.checked;
            localStorage.setItem('censorWords', settings.censorWords);
            updateLyricsDisplay(); // Just update display instead of reparsing
        });

        // Initialize values
        themeSelect.value = settings.theme;
        censorToggle.checked = settings.censorWords;
        applyTheme(settings.theme);
    }
}

// Replace the window load event with DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeSettings);

function updateLyrics() {
    const currentTime = audio.currentTime;
    
    let newLineIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
        if (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time) {
            if (currentTime >= lyrics[i].time) {
                newLineIndex = i;
                break;
            }
        }
    }
    
    if (newLineIndex !== currentLineIndex) {
        document.querySelectorAll('.lyric-line').forEach(line => {
            line.classList.remove('active-line');
        });
        
        if (newLineIndex >= 0) {
            const currentLineElement = document.getElementById(`line-${newLineIndex}`);
            if (currentLineElement) {
                currentLineElement.classList.add('active-line');
                currentLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        currentLineIndex = newLineIndex;
    }
}

audio.addEventListener("timeupdate", updateLyrics);

// Add these new variables
const progressBar = document.querySelector('.progress');
const progressFilled = document.querySelector('.progress-filled');
const currentTime = document.querySelector('.time.current');
const totalTime = document.querySelector('.time.total');
const volumeControl = document.getElementById('volume');
const playIcon = document.querySelector('.play-icon');
const pauseIcon = document.querySelector('.pause-icon');

// Add these new functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateProgress() {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFilled.style.width = `${percent}%`;
    currentTime.textContent = formatTime(audio.currentTime);
    totalTime.textContent = formatTime(audio.duration);
}

// Add these event listeners
progressBar.addEventListener('click', (e) => {
    const progressTime = (e.offsetX / progressBar.offsetWidth) * audio.duration;
    audio.currentTime = progressTime;
});

volumeControl.addEventListener('input', (e) => {
    audio.volume = e.target.value;
});

// Modify the play/pause button handler
document.getElementById("playPauseBtn").addEventListener("click", function() {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        this.classList.remove('playing');
        this.classList.add('paused');
    } else {
        audio.play();
        isPlaying = true;
        this.classList.add('playing');
        this.classList.remove('paused');
    }
});

// Add file button handlers
document.getElementById("mp3Btn").addEventListener("click", () => {
    document.getElementById("mp3File").click();
});

document.getElementById("lrcBtn").addEventListener("click", () => {
    document.getElementById("lrcFile").click();
});

// Add timeupdate listener for progress
audio.addEventListener("timeupdate", () => {
    updateProgress();
    updateLyrics();
});

// Add loadedmetadata listener
audio.addEventListener("loadedmetadata", () => {
    totalTime.textContent = formatTime(audio.duration);
});