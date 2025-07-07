<svelte:options runes={true} />
<script lang="ts">
  let { piece, isSelected = false, isLegalMove = false } = $props();

  // Map piece type and color to SVG asset path
  const svgPath = `/chess-pieces/${piece.color}-${piece.type}.svg`;
</script>

<div
  class="chess-piece flex items-center justify-center w-full h-full font-bold cursor-pointer select-none transition-all duration-200 ease-in group
    {isSelected ? 'bg-yellow-200 bg-opacity-60 rounded' : ''}
    {isLegalMove ? 'bg-green-300 bg-opacity-40 rounded-full w-3/5 h-3/5' : ''}"
  data-piece-type={piece.type}
  data-piece-color={piece.color}
  data-position={piece.position}
>
  <img
    src={svgPath}
    alt={`${piece.color} ${piece.type}`}
    class="w-10 h-10 md:w-12 md:h-12 drop-shadow group-hover:scale-110 transition-transform duration-200"
    draggable="false"
  />
</div>