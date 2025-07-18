<svelte:options runes={true} />
<script lang="ts">
  import type { PieceType } from '$lib/types';

  let { color, onSelect } = $props();

  const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
</script>

<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
  <div class="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center w-72 max-w-full border-2 border-blue-300">
    <h2 class="text-lg font-bold mb-4 text-center text-blue-700">Choose Promotion Piece</h2>
    <div class="grid grid-cols-2 gap-4 w-full">
      {#each promotionPieces as piece}
        <button
          class="flex flex-col items-center justify-center p-3 border border-neutral-200 rounded-xl hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          onclick={() => onSelect(piece)}
          tabindex="0"
        >
          <img src={`/chess-pieces/${color}-${piece}.svg`} alt={piece} class="w-10 h-10 mb-1" />
          <span class="capitalize text-sm font-medium text-blue-700">{piece}</span>
        </button>
      {/each}
    </div>
  </div>
</div> 