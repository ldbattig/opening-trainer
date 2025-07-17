<svelte:options runes={true} />
<script lang="ts">
  let { piece, isSelected = false, isLegalMove = false, dragging = false } = $props();

  // Derive SVG path for the piece
  let svgPath = $derived(() => `/chess-pieces/${piece.color}-${piece.type}.svg`);

  // Compute classes for selection and dragging highlights only
  let pieceClass = $derived(() => [
    'chess-piece flex items-center justify-center w-full h-full font-bold select-none transition-all duration-200 ease-in group',
    isSelected ? 'bg-yellow-200 bg-opacity-60 rounded' : '',
    dragging ? 'cursor-grabbing z-50' : 'cursor-grab'
  ].join(' '));
</script>

<div
  class={pieceClass}
  data-piece-type={piece.type}
  data-piece-color={piece.color}
  data-position={piece.position}
  role="button"
  tabindex="0"
  aria-label={`${piece.color} ${piece.type} at ${piece.position}`}
>
  <img
    src={svgPath()}
    alt={`${piece.color} ${piece.type}`}
    class="w-full h-full drop-shadow group-hover:scale-110 transition-transform duration-200"
    draggable={false}
  />
</div>