<script lang="ts">
  import { practiceStore, setPracticeConfiguration, startPracticeSession, resetPracticeSession } from '$lib/store/practiceStore.svelte';
  import { LoaderCircle, Play, RotateCcw } from '@lucide/svelte';

  async function handleStartPractice() {
    await startPracticeSession();
  }

  function handleResetPractice() {
    if (practiceStore.session.isActive) {
      if (confirm('Are you sure? You\'ll lose progress on your current practice session.')) {
        resetPracticeSession();
      }
    } else {
      resetPracticeSession();
    }
  }

  function updateDepth(value: number) {
    setPracticeConfiguration({ depth: value });
  }

  function updateVariationCount(value: number) {
    setPracticeConfiguration({ variationCount: value });
  }
</script>

<div class="bg-white/80 rounded-xl shadow-lg p-4 border border-gray-200">
  <h3 class="text-md font-semibold text-gray-700 mb-3">Practice Settings</h3>

  <!-- Compact sliders -->
  <div class="space-y-2 mb-4">
    <!-- Practice Depth -->
    <div class="flex items-center">
      <label for="depth" class="text-xs font-medium text-gray-600 whitespace-nowrap">
        Depth: {practiceStore.session.configuration.depth}
      </label>
      <input
        id="depth"
        type="range"
        min="5"
        max="20"
        value={practiceStore.session.configuration.depth}
        oninput={(e) => updateDepth(parseInt(e.currentTarget.value))}
        class="h-2 flex-1 mx-1 min-w-0 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <span class="text-xs text-gray-400 whitespace-nowrap">5-20</span>
    </div>

    <!-- Variation Count -->
    <div class="flex items-center">
      <label for="variations" class="text-xs font-medium text-gray-600 whitespace-nowrap">
        Variations: {practiceStore.session.configuration.variationCount}
      </label>
      <input
        id="variations"
        type="range"
        min="1"
        max="5"
        value={practiceStore.session.configuration.variationCount}
        oninput={(e) => updateVariationCount(parseInt(e.currentTarget.value))}
        class="h-2 flex-1 mx-1 min-w-0 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <span class="text-xs text-gray-400 whitespace-nowrap">1-5</span>
    </div>
  </div>

  <!-- Selected Opening Display -->
  {#if practiceStore.session.selectedOpening}
    <div class="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
      <div class="text-xs font-medium text-blue-800">Selected Opening:</div>
      <div class="text-sm text-blue-700">
        {practiceStore.session.selectedOpening.displayName}
      </div>
    </div>
  {:else}
    <div class="mb-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
      <div class="text-xs text-yellow-800">Select an opening from below</div>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex gap-2">
    <button
      type="button"
      onclick={handleStartPractice}
      disabled={!practiceStore.session.selectedOpening || practiceStore.session.loading}
      class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
    >
      {#if practiceStore.session.loading}
        <LoaderCircle size="16" class="animate-spin" />
        Loading...
      {:else}
        <Play size="16" />
        {practiceStore.session.isActive ? 'Restart' : 'Start'} Practice
      {/if}
    </button>

    {#if practiceStore.session.isActive}
      <button
        type="button"
        onclick={handleResetPractice}
        class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        title="Reset Practice"
      >
        <RotateCcw size="16" />
      </button>
    {/if}
  </div>

  <!-- Error Display -->
  {#if practiceStore.session.error}
    <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
      <div class="text-xs text-red-800">{practiceStore.session.error}</div>
    </div>
  {/if}

  <!-- Success Message Display -->
  {#if practiceStore.session.successMessage}
    <div class="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
      <div class="text-xs text-green-800">{practiceStore.session.successMessage}</div>
    </div>
  {/if}

  <!-- Practice Status -->
  {#if practiceStore.session.isActive}
    <div class="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
      <div class="text-xs font-medium text-green-800">Practice Active</div>
      <div class="text-xs text-green-700">
        {practiceStore.session.variations.length} variation{practiceStore.session.variations.length !== 1 ? 's' : ''} loaded
      </div>
      <div class="text-xs text-green-600">
        {practiceStore.session.userTurn ? 'Your turn' : 'Opponent playing...'}
      </div>
    </div>
  {/if}
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }
  .slider::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }
</style>
