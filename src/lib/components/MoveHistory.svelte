<svelte:options runes={true} />
<script lang="ts">
  import { gameState, navigationState, goToPreviousMove, goToNextMove, goToMoveIndex } from '$lib/gameStore.svelte';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
</script>

<div class="w-full h-full max-h-64 overflow-y-auto bg-white/90 border border-gray-200 rounded-xl shadow-inner p-2">
  <div class="flex items-center justify-between mb-2 gap-2">
    <button
      class="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold disabled:opacity-50"
      onclick={goToPreviousMove}
      disabled={navigationState.currentMoveIndex === 0}
      aria-label="Previous move"
    >
      <ChevronLeft size="14" />
    </button>
    <span class="text-xs text-gray-500">Move {navigationState.currentMoveIndex} / {gameState.moveHistory.length}</span>
    <button
      class="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold disabled:opacity-50"
      onclick={goToNextMove}
      disabled={navigationState.currentMoveIndex === gameState.moveHistory.length}
      aria-label="Next move"
    >
      <ChevronRight size="14" />
    </button>
  </div>
  {#if gameState.moveHistory.length === 0}
    <div class="flex flex-col items-center justify-center h-24 text-gray-400 text-sm select-none">
      <span>No moves yet</span>
      <span class="text-xs p-2">Your moves will appear here</span>
    </div>
  {:else}
    <ol class="list-decimal pl-4 space-y-1">
      {#each Array(Math.ceil(gameState.moveHistory.length / 2)) as _, index}
        <li class="flex items-center gap-2 rounded-lg transition-colors duration-150 hover:bg-blue-50 cursor-pointer">
          <span class="text-xs text-gray-500">{index + 1}.</span>
          <button
            class="text-sm px-1 rounded cursor-pointer {navigationState.currentMoveIndex === index * 2 + 1 ? 'bg-blue-200 font-bold' : ''}"
            onclick={() => goToMoveIndex(index * 2 + 1)}
            tabindex="0"
            aria-current={navigationState.currentMoveIndex === index * 2 + 1 ? 'step' : undefined}
          >{gameState.moveHistory[index * 2]?.notation}</button>
          {#if gameState.moveHistory[index * 2 + 1]}
            <button
              class="text-sm px-1 rounded cursor-pointer {navigationState.currentMoveIndex === index * 2 + 2 ? 'bg-blue-200 font-bold' : ''}"
              onclick={() => goToMoveIndex(index * 2 + 2)}
              tabindex="0"
              aria-current={navigationState.currentMoveIndex === index * 2 + 2 ? 'step' : undefined}
            >{gameState.moveHistory[index * 2 + 1].notation}</button>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
</div>
