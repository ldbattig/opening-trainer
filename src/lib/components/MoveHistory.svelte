<svelte:options runes={true} />
<script lang="ts">
  import { gameState } from '$lib/store.svelte';
</script>

<div class="w-full h-full max-h-64 overflow-y-auto bg-white/90 border border-gray-200 rounded-xl shadow-inner p-2">
  {#if gameState.moveHistory.length === 0}
    <div class="flex flex-col items-center justify-center h-24 text-gray-400 text-sm select-none">
      <span>No moves yet</span>
      <span class="text-xs p-2">Your moves will appear here</span>
    </div>
  {:else}
    <ol class="list-decimal pl-4 space-y-1">
      {#each Array(Math.ceil(gameState.moveHistory.length / 2)) as _, index}
        <li class="flex items-center gap-2 rounded-lg transition-colors duration-150 hover:bg-blue-50 cursor-pointer {index * 2 === gameState.moveHistory.length - 1 || index * 2 + 1 === gameState.moveHistory.length - 1 ? 'bg-blue-100 font-bold' : ''}">
          <span class="text-xs text-gray-500">{index + 1}.</span>
          <span class="text-sm">{gameState.moveHistory[index * 2]?.notation}</span>
          {#if gameState.moveHistory[index * 2 + 1]}
            <span class="text-sm">{gameState.moveHistory[index * 2 + 1].notation}</span>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
</div>
