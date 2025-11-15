<!--
  @component
  Audio Player with Chapter Navigation
  Location: src/lib/components/AudioPlayer.svelte
-->
<script>
  let {
    chapters = [],
    productTitle = "",
    productAuthor = "",
    coverImage = "",
    publicUrl = ""
  } = $props();
 
  let currentChapterIndex = $state(0);
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let volume = $state(1);
  let playbackRate = $state(1);
  let showChapterList = $state(false);
  let audioElement;
 
  // Get current chapter
  let currentChapter = $derived(chapters[currentChapterIndex] || null);
 
  // Format time (seconds to MM:SS)
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
 
  // Format file size
  function formatSize(bytes) {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }
 
  // Play/Pause toggle
  function togglePlay() {
    if (!audioElement) return;
   
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  }
 
  // Play specific chapter
  function playChapter(index) {
    currentChapterIndex = index;
    showChapterList = false;
   
    // Wait for audio element to load new source
    setTimeout(() => {
      audioElement?.play();
    }, 100);
  }
 
  // Next chapter
  function nextChapter() {
    if (currentChapterIndex < chapters.length - 1) {
      playChapter(currentChapterIndex + 1);
    }
  }
 
  // Previous chapter
  function previousChapter() {
    if (currentTime > 3) {
      // If more than 3 seconds played, restart current chapter
      audioElement.currentTime = 0;
    } else if (currentChapterIndex > 0) {
      playChapter(currentChapterIndex - 1);
    }
  }
 
  // Seek
  function handleSeek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioElement.currentTime = percent * duration;
  }
 
  // Change volume
  function handleVolumeChange(e) {
    volume = parseFloat(e.target.value);
    if (audioElement) {
      audioElement.volume = volume;
    }
  }
 
  // Change playback speed
  function changeSpeed(speed) {
    playbackRate = speed;
    if (audioElement) {
      audioElement.playbackRate = speed;
    }
  }
 
  // Skip forward/backward
  function skip(seconds) {
    if (audioElement) {
      audioElement.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  }
 
  // Audio event handlers
  function handleTimeUpdate() {
    currentTime = audioElement.currentTime;
  }
 
  function handleDurationChange() {
    duration = audioElement.duration;
  }
 
  function handlePlay() {
    isPlaying = true;
  }
 
  function handlePause() {
    isPlaying = false;
  }
 
  function handleEnded() {
    // Auto-play next chapter
    if (currentChapterIndex < chapters.length - 1) {
      playChapter(currentChapterIndex + 1);
    } else {
      isPlaying = false;
    }
  }
 
  // Keyboard shortcuts
  function handleKeyPress(e) {
    if (e.target.tagName === 'INPUT') return;
   
    switch(e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        skip(10);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skip(-10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        volume = Math.min(1, volume + 0.1);
        if (audioElement) audioElement.volume = volume;
        break;
      case 'ArrowDown':
        e.preventDefault();
        volume = Math.max(0, volume - 0.1);
        if (audioElement) audioElement.volume = volume;
        break;
    }
  }
</script>
<svelte:window onkeydown={handleKeyPress} />
<div class="audio-player bg-card border border-border rounded-lg overflow-hidden">
  <!-- Header with Album Art -->
  <div class="flex gap-4 p-4 border-b border-border">
    <div class="w-20 h-20 bg-muted rounded flex-shrink-0 overflow-hidden">
      {#if coverImage}
        <img src="{publicUrl}{coverImage}" alt={productTitle} class="w-full h-full object-cover" />
      {:else}
        <div class="w-full h-full flex items-center justify-center">
          <svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      {/if}
    </div>
   
    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-foreground truncate">{productTitle}</h3>
      <p class="text-sm text-muted-foreground truncate">{productAuthor}</p>
      {#if currentChapter}
        <p class="text-xs text-muted-foreground mt-1">{currentChapter.title}</p>
      {/if}
    </div>
   
    <!-- Chapter List Toggle -->
    <button
      onclick={() => showChapterList = !showChapterList}
      class="px-3 py-2 rounded hover:bg-accent transition-colors"
      title="Chapter list"
    >
      <svg class="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>
 
  <!-- Progress Bar -->
  <div class="px-4 pt-4">
    <button
      onclick={handleSeek}
      class="w-full h-2 bg-secondary rounded-full cursor-pointer overflow-hidden group"
    >
      <div
        class="h-full bg-primary transition-all group-hover:bg-primary/80"
        style="width: {duration ? (currentTime / duration) * 100 : 0}%"
      ></div>
    </button>
   
    <div class="flex justify-between text-xs text-muted-foreground mt-1">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
  </div>
 
  <!-- Controls -->
  <div class="flex items-center justify-center gap-4 p-4">
    <!-- Previous -->
    <button
      onclick={previousChapter}
      disabled={currentChapterIndex === 0 && currentTime <= 3}
      class="p-2 rounded-full hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Previous chapter"
    >
      <svg class="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
      </svg>
    </button>
   
    <!-- Skip Back 10s -->
    <button
      onclick={() => skip(-10)}
      class="p-2 rounded-full hover:bg-accent transition-colors"
      title="Rewind 10s"
    >
      <svg class="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
      </svg>
      <span class="sr-only">-10s</span>
    </button>
   
    <!-- Play/Pause -->
    <button
      onclick={togglePlay}
      disabled={!currentChapter}
      class="w-14 h-14 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={isPlaying ? 'Pause' : 'Play'}
    >
      {#if isPlaying}
        <svg class="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      {:else}
        <svg class="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
      {/if}
    </button>
   
    <!-- Skip Forward 10s -->
    <button
      onclick={() => skip(10)}
      class="p-2 rounded-full hover:bg-accent transition-colors"
      title="Forward 10s"
    >
      <svg class="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
      </svg>
      <span class="sr-only">+10s</span>
    </button>
   
    <!-- Next -->
    <button
      onclick={nextChapter}
      disabled={currentChapterIndex === chapters.length - 1}
      class="p-2 rounded-full hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Next chapter"
    >
      <svg class="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
      </svg>
    </button>
  </div>
 
  <!-- Additional Controls -->
  <div class="flex items-center justify-between px-4 pb-4 text-sm">
    <!-- Volume -->
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
      </svg>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        oninput={handleVolumeChange}
        class="w-20 volume-slider"
      />
    </div>
   
    <!-- Playback Speed -->
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground text-xs">Speed:</span>
      {#each [0.5, 0.75, 1, 1.25, 1.5, 2] as speed}
        <button
          onclick={() => changeSpeed(speed)}
          class="px-2 py-1 rounded text-xs font-medium transition-colors
            {playbackRate === speed ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}"
        >
          {speed}x
        </button>
      {/each}
    </div>
  </div>
 
  <!-- Chapter List -->
  {#if showChapterList}
    <div class="border-t border-border max-h-64 overflow-y-auto">
      <div class="p-2">
        <h4 class="text-sm font-semibold text-foreground px-2 py-2">Chapters ({chapters.length})</h4>
        {#each chapters as chapter, index}
          <button
            onclick={() => playChapter(index)}
            class="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-accent transition-colors text-left
              {currentChapterIndex === index ? 'bg-accent' : ''}"
          >
            <div class="flex-shrink-0 w-8 text-center">
              {#if currentChapterIndex === index && isPlaying}
                <svg class="w-4 h-4 text-primary mx-auto animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                </svg>
              {:else}
                <span class="text-sm text-muted-foreground">{chapter.number}</span>
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-foreground truncate">{chapter.title}</div>
              <div class="text-xs text-muted-foreground">{formatSize(chapter.size)}</div>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
 
  <!-- Hidden Audio Element -->
  {#if currentChapter}
    <!-- svelte-ignore a11y_media_has_caption -->
    <audio
      bind:this={audioElement}
      src={currentChapter.url}
      ontimeupdate={handleTimeUpdate}
      ondurationchange={handleDurationChange}
      onplay={handlePlay}
      onpause={handlePause}
      onended={handleEnded}
      preload="metadata"
    ></audio>
  {/if}
</div>

<style>
  /* Custom range slider — using raw CSS (Tailwind @apply doesn't work here) */
  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    background: var(--tw-bg-opacity, hsl(var(--secondary)));
    height: 4px;
    border-radius: 9999px;
    cursor: pointer;
    outline: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
  }

  .volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
    border: none;
  }
</style>
