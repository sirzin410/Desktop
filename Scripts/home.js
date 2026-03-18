// ==========================================
// Supabase Configuration
// ==========================================
const SUPABASE_URL = 'https://zsdwfkrgvusyfddtytzw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZHdma3JndnVzeWZkZHR5dHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDY3OTcsImV4cCI6MjA4OTQyMjc5N30.YlIIrIvC9Eiv1IAKoi1LIBpPvVXVHbU7sPPNkWRUDuw';
const STORAGE_BUCKET = 'songs';
const IS_PUBLIC_BUCKET = true;

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// Global Variables
// ==========================================
let currentSongIndex = 0;
let songs = [];
let isPlaying = false;
let isLoading = false;

// DOM Elements
const audio = document.getElementById('main-audio');
const playPauseBtn = document.querySelector('.play-pause i');
const playPauseContainer = document.querySelector('.play-pause');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const songNameEl = document.getElementById('song_name');
const artistEl = document.getElementById('artist');
const currentTimeEl = document.querySelector('.timer .current');
const durationEl = document.querySelector('.timer .duration');
const progressBar = document.querySelector('.progress-bar');
const progressArea = document.querySelector('.progress-area');
const songImg = document.getElementById('song-img');

// ==========================================
// Initialization
// ==========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

function initialize() {
  applyAmbientGlow();
  fetchSongs();
  setupEventListeners();
}

function setupEventListeners() {
  playPauseContainer.addEventListener('click', handlePlayPause);
  
  nextBtn.addEventListener('click', () => {
    if (isLoading) return;
    playNext();
  });
  
  prevBtn.addEventListener('click', () => {
    if (isLoading) return;
    playPrevious();
  });
  
  progressArea.addEventListener('click', seek);
  
  audio.addEventListener('timeupdate', updateTime);
  audio.addEventListener('loadedmetadata', updateDuration);
  audio.addEventListener('ended', playNext);
  audio.addEventListener('error', handleAudioError);
  audio.addEventListener('canplaythrough', () => {
    isLoading = false;
  });
  
  setupModalListeners();
}

// ==========================================
// Song Loading & Playback
// ==========================================
async function fetchSongs() {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching songs:', error);
      return;
    }

    songs = data || [];
    console.log('Fetched songs:', songs);
    displayMusicList();
    
    if (songs.length > 0) {
      loadSong(currentSongIndex, false);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayMusicList() {
  const musicItems = document.getElementById('music-items');
  if (!musicItems) return;
  
  musicItems.innerHTML = '';

  songs.forEach((song, index) => {
    const songItem = document.createElement('div');
    songItem.classList.add('music-item');
    if (index === currentSongIndex) {
      songItem.classList.add('active');
    }

    songItem.innerHTML = `
      <div class="music-item-content">
        <div class="music-item-text">
          <h4>${song.song_name || 'Unknown'}</h4>
          <p>${song.artist || 'Unknown Artist'}</p>
        </div>
      </div>
    `;

    songItem.addEventListener('click', () => {
      if (isLoading) return;
      currentSongIndex = index;
      loadSong(index, true);
      displayMusicList();
    });

    musicItems.appendChild(songItem);
  });
}

function getAudioStorageKey(song) {
  if (song.audio_path && song.audio_path.startsWith('http')) {
    return song.audio_path;
  }
  if (song.audio_path && song.audio_path !== 'pending' && song.audio_path !== 'null') {
    return song.audio_path;
  }
  return `song_${song.id}.mp3`;
}

async function loadSong(index, autoPlay = false) {
  if (songs.length === 0) return;
  
  const song = songs[index];
  if (!song) return;

  songNameEl.textContent = song.song_name || 'Unknown';
  artistEl.textContent = song.artist || 'Unknown Artist';

  if (song.song_image) {
    songImg.src = song.song_image;
    songImg.crossOrigin = 'anonymous';
  }

  const audioKey = getAudioStorageKey(song);
  console.log('Loading audio from:', audioKey);
  await loadAudioSource(audioKey, autoPlay);
}

async function loadAudioSource(songPath, autoPlay = false) {
  try {
    isLoading = true;
    
    audio.pause();
    audio.currentTime = 0;
    
    if (songPath && songPath.startsWith('http')) {
      audio.src = songPath;
    } else {
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(songPath);
      
      if (data && data.publicUrl) {
        console.log('Loading from URL:', data.publicUrl);
        audio.src = data.publicUrl;
      } else {
        throw new Error('Could not get public URL');
      }
    }

    if (autoPlay) {
      audio.load();
      
      const playWhenReady = () => {
        safePlay();
        audio.removeEventListener('canplay', playWhenReady);
      };
      
      audio.addEventListener('canplay', playWhenReady);
      
      setTimeout(() => {
        audio.removeEventListener('canplay', playWhenReady);
        if (isLoading) safePlay();
      }, 1000);
    }
    
    isLoading = false;
  } catch (error) {
    console.error('Error loading audio:', error);
    isLoading = false;
  }
}

async function safePlay() {
  try {
    if (audio.paused) {
      await audio.play();
      isPlaying = true;
      playPauseBtn.textContent = 'pause';
    }
  } catch (error) {
    console.error('Playback failed:', error.name, error.message);
    isPlaying = false;
    playPauseBtn.textContent = 'play_arrow';
    
    if (error.name === 'NotSupportedError') {
      alert('This audio file cannot be played. It may not exist or is in an unsupported format.');
    } else if (error.name === 'AbortError') {
      console.log('Play aborted (rapid click)');
    }
  }
}

function handlePlayPause() {
  if (isLoading) return;
  
  if (audio.paused) {
    safePlay();
  } else {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = 'play_arrow';
  }
}

function playNext() {
  if (songs.length === 0) return;
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadSong(currentSongIndex, true);
  displayMusicList();
}

function playPrevious() {
  if (songs.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(currentSongIndex, true);
  displayMusicList();
}

function handleAudioError(e) {
  console.error('Audio error details:');
  console.error('  Error code:', audio.error ? audio.error.code : 'unknown');
  console.error('  Error message:', audio.error ? audio.error.message : 'unknown');
  console.error('  Source:', audio.src);
  console.error('  Network state:', audio.networkState, '(3 = NETWORK_NO_SOURCE)');
  console.error('  Ready state:', audio.readyState);
  
  isPlaying = false;
  playPauseBtn.textContent = 'play_arrow';
  isLoading = false;
  
  if (audio.networkState === 3) {
    console.error('File not found in storage. Check if file exists in Supabase bucket.');
  }
}

// ==========================================
// Progress & Time
// ==========================================
function updateTime() {
  const minutes = Math.floor(audio.currentTime / 60);
  const seconds = Math.floor(audio.currentTime % 60);
  currentTimeEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  if (audio.duration) {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = progressPercent + '%';
  }
}

function updateDuration() {
  if (isNaN(audio.duration)) return;
  const minutes = Math.floor(audio.duration / 60);
  const seconds = Math.floor(audio.duration % 60);
  durationEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function seek(e) {
  const rect = progressArea.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.currentTime = percent * audio.duration;
}

// ==========================================
// Visual Effects
// ==========================================
function applyAmbientGlow() {
  const glow = document.getElementById('ambient-glow');
  if (!glow || !songImg) return;
  
  songImg.addEventListener('load', function() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = songImg.naturalWidth || 300;
      canvas.height = songImg.naturalHeight || 300;
      ctx.drawImage(songImg, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let r = 0, g = 0, b = 0;
      let pixelCount = 0;
      
      for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        pixelCount++;
      }
      
      r = Math.round(r / pixelCount);
      g = Math.round(g / pixelCount);
      b = Math.round(b / pixelCount);
      
      const glowColor = `rgb(${r}, ${g}, ${b})`;
      glow.style.background = glowColor;
      glow.style.width = (songImg.offsetWidth + 40) + 'px';
      glow.style.height = (songImg.offsetHeight + 40) + 'px';
      glow.style.left = 'calc(50% - ' + (songImg.offsetWidth / 2 + 20) + 'px)';
      glow.style.top = '50%';
      glow.style.transform = 'translateY(-50%)';
    } catch (error) {
      console.warn('Could not extract image colors:', error);
      glow.style.background = 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)';
    }
  });
  
  if (songImg.complete) {
    songImg.dispatchEvent(new Event('load'));
  }
}

// ==========================================
// Modal & Upload
// ==========================================
function setupModalListeners() {
  const addBtn = document.querySelector('.add-btn');
  const modal = document.getElementById('add-music-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-btn');
  const addMusicForm = document.getElementById('add-music-form');

  if (addBtn) addBtn.addEventListener('click', () => modal.classList.add('active'));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (addMusicForm) {
    addMusicForm.addEventListener('submit', handleUpload);
  }
}

function closeModal() {
  const modal = document.getElementById('add-music-modal');
  const addMusicForm = document.getElementById('add-music-form');
  if (modal) modal.classList.remove('active');
  if (addMusicForm) addMusicForm.reset();
  
  const progress = document.getElementById('upload-progress');
  if (progress) progress.style.display = 'none';
}

// ==========================================
// Upload Handler - COMPLETELY REWRITTEN
// ==========================================
async function handleUpload(e) {
  e.preventDefault();
  
  const songName = document.getElementById('song-name-input').value.trim();
  const artistName = document.getElementById('artist-name-input').value.trim();
  const songImageUrl = document.getElementById('song-image-input').value.trim();
  const songImageFile = document.getElementById('song-image-file').files[0];
  const songFile = document.getElementById('song-file-input').files[0];
  
  if (!songName || !artistName || !songFile) {
    alert('Please fill in all required fields (Song Name, Artist, and Audio File).');
    return;
  }
  
  const progressBar = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');
  
  if (progressBar) progressBar.style.display = 'block';
  if (progressText) progressText.textContent = 'Starting upload...';

  try {
    // Step 1: Upload image if provided
    let finalImageUrl = songImageUrl;
    if (songImageFile) {
      if (progressText) progressText.textContent = 'Uploading image...';
      
      const imageFileName = sanitizeFileName(`${Date.now()}_${songImageFile.name}`);
      const { data: imgData, error: imageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(imageFileName, songImageFile);

      if (imageError) {
        console.error('Image upload error:', imageError);
        throw new Error('Failed to upload image: ' + imageError.message);
      }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(imageFileName);
      finalImageUrl = urlData.publicUrl;
      console.log('✓ Image uploaded:', finalImageUrl);
    }

    if (progressFill) progressFill.style.width = '25%';
    if (progressText) progressText.textContent = 'Uploading audio...';

    // Step 2: Upload audio file FIRST with a temporary unique name
    const fileExtension = songFile.name.split('.').pop();
    const tempAudioName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    
    const { data: audioData, error: audioError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(tempAudioName, songFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (audioError) {
      console.error('Audio upload error:', audioError);
      throw new Error('Failed to upload audio: ' + audioError.message);
    }

    console.log('✓ Audio uploaded as:', tempAudioName);

    if (progressFill) progressFill.style.width = '50%';
    if (progressText) progressText.textContent = 'Creating database record...';

    // Step 3: Get the public URL for the audio
    const { data: audioUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(tempAudioName);
    
    const audioUrl = audioUrlData.publicUrl;
    console.log('✓ Audio URL:', audioUrl);

    // Step 4: Create database record WITH the audio URL already set
    const { data: inserted, error: insertError } = await supabase
      .from('songs')
      .insert([{
        song_name: songName,
        artist: artistName,
        song_image: finalImageUrl || 'https://via.placeholder.com/300?text=No+Image',
        audio_path: audioUrl  // Save the FULL URL immediately!
      }])
      .select('id');

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Clean up uploaded files
      await supabase.storage.from(STORAGE_BUCKET).remove([tempAudioName]);
      if (songImageFile) {
        const imgName = finalImageUrl.split('/').pop();
        await supabase.storage.from(STORAGE_BUCKET).remove([imgName]);
      }
      throw new Error('Failed to save to database: ' + insertError.message);
    }

    const songId = inserted[0].id;
    console.log('✓ Database record created with ID:', songId);

    if (progressFill) progressFill.style.width = '75%';
    if (progressText) progressText.textContent = 'Renaming audio file...';

    // Step 5: Rename audio file to match song ID
    const finalAudioName = `song_${songId}.${fileExtension}`;
    const { error: renameError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .move(tempAudioName, finalAudioName);

    if (renameError) {
      console.error('Rename error:', renameError);
      // Not critical - file works with temp name too
      console.log('Keeping temp filename:', tempAudioName);
    } else {
      console.log('✓ Audio renamed to:', finalAudioName);
      
      // Update URL with final name
      const { data: finalUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(finalAudioName);
      
      const finalAudioUrl = finalUrlData.publicUrl;
      
      // Update the record with final URL
      const { error: updateError } = await supabase
        .from('songs')
        .update({ audio_path: finalAudioUrl })
        .eq('id', songId);

      if (updateError) {
        console.error('Final URL update error:', updateError);
      } else {
        console.log('✓ Database updated with final URL:', finalAudioUrl);
      }
    }

    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = 'Complete!';

    setTimeout(() => {
      closeModal();
      fetchSongs();
      alert('Music uploaded successfully!');
    }, 500);

  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed: ' + error.message);
    if (progressBar) progressBar.style.display = 'none';
  }
}

function sanitizeFileName(name) {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-.]+/g, '')
    .slice(0, 180);
}