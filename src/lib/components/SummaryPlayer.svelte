<!--
  @component
  Summary Audio Player Wrapper
  Location: src/lib/components/SummaryPlayer.svelte
  
  This wraps your existing AudioPlayer for summaries
  Summaries = single file (no chapters), so we create a virtual "chapter"
-->
<script>
  import AudioPlayer from './AudioPlayer.svelte';
  import { Zap } from '@lucide/svelte';

  let {
    summaryUrl = "",
    productTitle = "",
    productAuthor = "",
    coverImage = "",
    publicUrl = "",
    duration = 0,
    keyTakeaways = 0
  } = $props();

  // Create a single "chapter" for the summary
  // This makes it compatible with your existing AudioPlayer
  const chapters = $derived([{
    number: 1,
    title: `${productTitle} - Summary`,
    filename: `${productTitle}.mp3`,
    url: summaryUrl,
    size: 0, // We don't have size info from R2 signed URL
  }]);

  // Format duration
  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  }
</script>

<!-- Summary Info Banner -->
<div class="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-4 mb-4">
  <div class="flex items-center gap-3">
    <div class="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Zap class="w-6 h-6 text-white" />
    </div>
    <div class="flex-1">
      <h3 class="font-semibold text-foreground mb-1">
        Audio Summary
      </h3>
      <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {#if duration}
          <span>⏱️ {formatDuration(duration)}</span>
        {/if}
        {#if keyTakeaways}
          <span>📌 {keyTakeaways} key insights</span>
        {/if}
        <span>🎧 Single audio file</span>
      </div>
    </div>
  </div>
</div>

<!-- Reuse Existing Audio Player -->
<AudioPlayer 
  {chapters}
  {productTitle}
  {productAuthor}
  {coverImage}
  {publicUrl}
/>

<style>
  /* Inherit all styles from parent */
</style>
