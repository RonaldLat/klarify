<!--
  @component
  Audio Player with Chapter Navigation - FINAL WORKING VERSION
  Location: src/lib/components/AudioPlayer.svelte
-->
<script>
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

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
  let showVolumeSlider = $state(false);
  let audioElement;
  let progressBar;
  let chapterListContainer;
  let isDragging = $state(false);
  let dragTime = $state(0);
  let wasPlaying = false;
 
  // Get current chapter
  let currentChapter = $derived(chapters[currentChapterIndex] || null);
 
  // Format time (seconds to HH:MM:SS or MM:SS)
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
   
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
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
      audioElement.currentTime = 0;
    } else if (currentChapterIndex > 0) {
      playChapter(currentChapterIndex - 1);
    }
  }
 
  // Progress bar drag
  function handleProgressMouseDown(e) {
    e.preventDefault();
    isDragging = true;
    wasPlaying = isPlaying;
   
    if (isPlaying) {
      audioElement.pause();
    }
   
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    dragTime = percent * duration;
   
    window.addEventListener('mousemove', handleProgressMouseMove);
    window.addEventListener('mouseup', handleProgressMouseUp);
  }
 
  function handleProgressMouseMove(e) {
    if (isDragging && progressBar) {
      e.preventDefault();
      const rect = progressBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      dragTime = percent * duration;
    }
  }
 
  function handleProgressMouseUp(e) {
    if (isDragging) {
      e.preventDefault();
     
      if (audioElement) {
        audioElement.currentTime = dragTime;
      }
     
      if (wasPlaying) {
        audioElement.play();
      }
     
      isDragging = false;
      dragTime = 0;
     
      window.removeEventListener('mousemove', handleProgressMouseMove);
      window.removeEventListener('mouseup', handleProgressMouseUp);
    }
  }
 
  // Change volume
  function handleVolumeChange(e) {
    volume = parseFloat(e.target.value);
    if (audioElement) {
      audioElement.volume = volume;
    }
  }
 
  // Toggle mute
  function toggleMute() {
    if (volume > 0) {
      audioElement.volume = 0;
      volume = 0;
    } else {
      audioElement.volume = 1;
      volume = 1;
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
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
    }
  }
 
  // FIXED: Close chapter list when clicking outside (excludes toggle button)
  function handleClickOutside(e) {
    const toggleButton = e.target.closest('button[title="Chapter list"]');
    if (
      showChapterList && 
      chapterListContainer && 
      !chapterListContainer.contains(e.target) &&
      !toggleButton
    ) {
      showChapterList = false;
    }
  }
 
  let progressPercent = $derived.by(() => {
    const time = isDragging ? dragTime : currentTime;
    return duration ? (time / duration) * 100 : 0;
  });
  let displayTime = $derived(isDragging ? dragTime : currentTime);
</script>

<svelte:window
  onkeydown={handleKeyPress}
  onclick={handleClickOutside}
/>

<!-- MAIN CONTAINER: Top corners rounded only -->
<div
  class="audio-player"
  style="
    background-color: var(--color-card);
    border: 1px solid var(--color-border);
    border-top-left-radius: var(--radius-lg);
    border-top-right-radius: var(--radius-lg);
    overflow: visible;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  "
>
  <!-- Header with Album Art -->
  <div class="player-header" style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--color-border);">
    <div class="cover-art" style="width: 80px; height: 80px; background-color: var(--color-muted); border-radius: var(--radius-md); flex-shrink: 0; overflow: hidden;">
      {#if coverImage}
        <img src="{publicUrl}{coverImage}" alt={productTitle} style="width:  100%; height: 100%; object-fit: cover;" />
      {:else}
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
          <svg style="width: 2rem; height: 2rem; color: var(--color-muted-foreground);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      {/if}
    </div>
   
    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
      <h3 style="font-weight: 600; color: var(--color-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0 0 0.25rem 0;">{productTitle}</h3>
      <p style="font-size: 0.875rem; color: var(--color-muted-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0;">{productAuthor}</p>
      {#if currentChapter}
        <p style="font-size: 0.75rem; color: var(--color-muted-foreground); margin: 0.25rem 0 0 0;">{currentChapter.title}</p>
      {/if}
    </div>
   
    <!-- Chapter List Toggle -->
    <button
      onclick={() => showChapterList = !showChapterList}
      style="padding: 0.5rem 0.75rem; border-radius: var(--radius-md); background: transparent; border: none; cursor: pointer; transition: background-color 0.2s; color: var(--color-foreground);"
      onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
      onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      title="Chapter list"
    >
      <svg style="width: 1.25rem; height: 1.25rem; transition: transform 0.3s ease;" class:rotate={showChapterList} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>
 
  <!-- Progress Bar -->
  <div style="padding: 1rem 1rem 0;">
    <div
      bind:this={progressBar}
      onmousedown={handleProgressMouseDown}
      style="width: 100%; height: 0.5rem; background-color: var(--color-secondary); border-radius: 9999px; cursor: pointer; overflow: hidden; position: relative;"
      class="progress-container"
      role="slider"
      tabindex="0"
      aria-label="Seek"
      aria-valuemin="0"
      aria-valuemax={duration}
      aria-valuenow={currentTime}
    >
      <div
        class="progress-bar"
        style="height: 100%; background-color: var(--color-primary); transition: none; width: {progressPercent}%; pointer-events: none; will-change: width;"
      ></div>
      <div
        class="progress-thumb"
        style="position: absolute; top: 50%; left: {progressPercent}%; transform: translate(-50%, -50%); width: 0.75rem; height: 0.75rem; background-color: var(--color-primary); border-radius: 50%; opacity: 0; transition: opacity 0.2s; pointer-events: none; will-change: left;"
      ></div>
    </div>
   
    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-muted-foreground); margin-top: 0.25rem;">
      <span>{formatTime(displayTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
  </div>
 
  <!-- Controls -->
  <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem;">
    <!-- Previous -->
    <button
      onclick={previousChapter}
      disabled={currentChapterIndex === 0 && currentTime <= 3}
      style="padding: 0.5rem; border-radius: 9999px; background: transparent; border: none; cursor: pointer; transition: background-color 0.2s; color: var(--color-foreground);"
      onmouseenter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
      onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      class="control-btn"
      title="Previous chapter"
    >
      <svg style="width: 1.5rem; height: 1.5rem;" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
      </svg>
    </button>
   
    <!-- Skip Back 10s -->
    <button
      onclick={() => skip(-10)}
      style="padding: 0.5rem; border-radius: 9999px; background: transparent; border: none; cursor: pointer; transition: background-color 0.2s; color: var(--color-foreground);"
      onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
      onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      class="control-btn"
      title="Rewind 10s"
    >
      <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
      </svg>
    </button>
   
    <!-- Play/Pause -->
    <button
      onclick={togglePlay}
      disabled={!currentChapter}
      style="width: 3.5rem; height: 3.5rem; background-color: var(--color-primary); border-radius: 9999px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; border: none; cursor: pointer; color: var(--color-primary-foreground);"
      onmouseenter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
      onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
      class="play-btn"
      title={isPlaying ? 'Pause' : 'Play'}
    >
      {#if isPlaying}
        <svg style="width: 1.5rem; height: 1.5rem;" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      {:else}
        <svg style="width: 1.5rem; height: 1.5rem; margin-left: 0.25rem;" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
      {/if}
    </button>
   
    <!-- Skip Forward 10s -->
    <button
      onclick={() => skip(10)}
      style="padding: 0.5rem; border-radius: 9999px; background: transparent; border: none; cursor: pointer; transition: background-color 0.2s; color: var(--color-foreground);"
      onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
      onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      class="control-btn"
      title="Forward 10s"
    >
      <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
      </svg>
    </button>
   
    <!-- Next -->
    <button
      onclick={nextChapter}
      disabled={currentChapterIndex === chapters.length - 1}
      style="padding: 0.5rem; border-radius: 9999px; background: transparent; border: none; cursor: pointer; transition: background-color 0.2s; color: var(--color-foreground);"
      onmouseenter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
      onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      class="control-btn"
      title="Next chapter"
    >
      <svg style="width: 1.5rem; height: 1.5rem;" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
      </svg>
    </button>
  </div>
 
  <!-- Additional Controls -->
  <!-- Additional Controls -->
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 1rem 1rem; font-size: 0.875rem; gap: 0.5rem; flex-wrap: wrap;">
    <!-- Volume -->
    <div style="display: flex; align-items: center; gap: 0.5rem; position: relative;">
      <button
        onclick={toggleMute}
        onmouseenter={() => showVolumeSlider = true}
        style="background: transparent; border: none; cursor: pointer; padding: 0.25rem; color: var(--color-muted-foreground);"
        title={volume === 0 ? 'Unmute' : 'Mute'}
      >
        {#if volume === 0}
          <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        {:else if volume < 0.5}
          <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.828 11.828a4 4 0 000-5.656 1 1 0 00-1.414 1.414 2 2 0 010 2.828 1 1 0 101.414 1.414z" clip-rule="evenodd" />
          </svg>
        {:else}
          <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
          </svg>
        {/if}
      </button>
      {#if showVolumeSlider}
        <div
          onmouseleave={() => showVolumeSlider = false}
          style="position: absolute; left: 100%; bottom: 0; margin-left: 0.5rem; padding: 0.5rem; background-color: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10;"
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            oninput={handleVolumeChange}
            style="width: 80px;"
            class="volume-slider"
          />
        </div>
      {/if}
    </div>
   
    <!-- Playback Speed -->
    <div style="display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap;">
      <span style="color: var(--color-muted-foreground); font-size: 0.75rem; white-space: nowrap;">Speed:</span>
      {#each [0.5, 0.75, 1, 1.25, 1.5, 2] as speed}
        <button
          onclick={() => changeSpeed(speed)}
          style="padding: 0.25rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 500; transition: all 0.2s; border: none; cursor: pointer; background-color: {playbackRate === speed ? 'var(--color-primary)' : 'transparent'}; color: {playbackRate === speed ? 'var(--color-primary-foreground)' : 'var(--color-foreground)'};"
          onmouseenter={(e) => {
            if (playbackRate !== speed) {
              e.currentTarget.style.backgroundColor = 'var(--color-accent)';
            }
          }}
          onmouseleave={(e) => {
            if (playbackRate !== speed) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {speed}x
        </button>
      {/each}
    </div>
  </div>
 
  <!-- Chapter List: Smooth slide + bottom rounded corners -->
  {#if showChapterList}
    <div
      bind:this={chapterListContainer}
      transition:slide={{ duration: 300, easing: cubicOut }}
      style="
        border-top: 1px solid var(--color-border);
        background-color: var(--color-card);
        border-bottom-left-radius: var(--radius-lg);
        border-bottom-right-radius: var(--radius-lg);
      "
    >
      <div style="padding: 0.5rem; max-height: 16rem; overflow-y: auto;">
        <h4 style="font-size: 0.875rem; font-weight: 600; color: var(--color-foreground); padding: 0.5rem; margin: 0;">
          Chapters ({chapters.length})
        </h4>
        {#each chapters as chapter, index}
          <button
            onclick={() => playChapter(index)}
            style="width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: var(--radius-md); transition: background-color 0.2s; text-align: left; border: none; cursor: pointer; background-color: {currentChapterIndex === index ? 'var(--color-accent)' : 'transparent'};"
            onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
            onmouseleave={(e) => {
              if (currentChapterIndex !== index) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style="flex-shrink: 0; width: 2rem; text-align: center;">
              {#if currentChapterIndex === index && isPlaying}
                <svg style="width: 1rem; height: 1rem; color: var(--color-primary); margin: 0 auto; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                </svg>
              {:else}
                <span style="font-size: 0.875rem; color: var(--color-muted-foreground);">{chapter.number}</span>
              {/if}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.875rem; font-weight: 500; color: var(--color-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{chapter.title}</div>
              <div style="font-size: 0.75rem; color: var(--color-muted-foreground);">{formatSize(chapter.size)}</div>
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
  /* Custom range slider styles */
  input[type="range"].volume-slider {
    appearance: none;
    background-color: var(--color-secondary);
    border-radius: 9999px;
    height: 0.25rem;
    cursor: pointer;
  }
 
  input[type="range"].volume-slider::-webkit-slider-thumb {
    appearance: none;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
    background-color: var(--color-primary);
    cursor: pointer;
  }
 
  input[type="range"].volume-slider::-moz-range-thumb {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
    background-color: var(--color-primary);
    cursor: pointer;
    border: 0;
  }
 
  /* Progress bar hover effect */
  .progress-container:hover .progress-thumb {
    opacity: 1;
  }
 
  .progress-container:hover .progress-bar {
    background-color: var(--color-primary);
    filter: brightness(0.9);
  }
 
  /* Button disabled state */
  .control-btn:disabled,
  .play-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
 
  .control-btn:disabled:hover {
    background-color: transparent !important;
  }
 
  /* Rotate icon animation */
  svg.rotate {
    transform: rotate(90deg);
  }
 
  /* Pulse animation */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
 
  /* Smooth scrollbar for chapter list */
  div[style*="max-height: 16rem"]::-webkit-scrollbar {
    width: 0.5rem;
  }
 
  div[style*="max-height: 16rem"]::-webkit-scrollbar-track {
    background: var(--color-muted);
    border-radius: var(--radius-sm);
  }
 
  div[style*="max-height: 16rem"]::-webkit-scrollbar-thumb {
    background: var(--color-muted-foreground);
    border-radius: var(--radius-sm);
  }
 
  div[style*="max-height: 16rem"]::-webkit-scrollbar-thumb:hover {
    background: var(--color-foreground);
  }
</style>
