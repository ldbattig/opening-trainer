<svelte:options runes={true} />
<script lang="ts">
  import Piece from '$lib/components/Piece.svelte';
  import type { Square as SquareType, Position, ChessPiece, PieceColor } from '$lib/types';

  const {
    square,
    isSelected,
    isLegalMove,
    isLastMove,
    piece,
    boardOrientation,
    currentPlayer,
    dragging,
    draggedPieceOrigin,
    onSquareClick,
    onPointerDown
  } = $props<{
    square: SquareType;
    isSelected: boolean;
    isLegalMove: boolean;
    isLastMove: boolean;
    piece: ChessPiece | null;
    boardOrientation: PieceColor;
    currentPlayer: PieceColor;
    dragging: boolean;
    draggedPieceOrigin: Position | null;
    onSquareClick: (position: Position) => void;
    onPointerDown: (e: PointerEvent, position: Position) => void;
  }>();

  // For coordinate display
  const showFile = (boardOrientation === 'white' && square.row === 7) || (boardOrientation === 'black' && square.row === 0);
  const showRank = (boardOrientation === 'white' && square.col === 0) || (boardOrientation === 'black' && square.col === 7);
</script>

<button
  type="button"
  class="relative flex items-center justify-center transition-opacity duration-200 {isSelected ? 'bg-blue-200': ''} {square.isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'} { isLastMove ? 'bg-yellow-100 ring-inset' : '' } hover:opacity-80 cursor-pointer border-0 p-0 m-0 w-full h-full"
  data-position={square.position}
  data-file={square.file}
  data-rank={square.rank}
  tabindex="0"
  onclick={() => onSquareClick(square.position)}
  onpointerdown={(e: PointerEvent) => onPointerDown(e, square.position)}
>
  <!-- Legal move indicator (dot) -->
  {#if isLegalMove && (!piece || piece.color !== currentPlayer)}
    <span class="absolute w-4 h-4 bg-blue-500 bg-opacity-60 rounded-full z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></span>
  {/if}
  <!-- Coordinates for edge squares, orientation aware -->
  {#if showFile}
    <span class="absolute bottom-1 right-1 text-xs font-bold text-neutral-800 select-none">
      {square.file}
    </span>
  {/if}
  {#if showRank}
    <span class="absolute top-1 left-1 text-xs font-bold text-neutral-800 select-none">
      {square.rank}
    </span>
  {/if}
  <!-- Chess piece -->
  {#if piece && !(dragging && draggedPieceOrigin === square.position)}
    <Piece 
      piece={piece}
      isSelected={isSelected}
      isLegalMove={isLegalMove}
      dragging={!!(dragging && draggedPieceOrigin === square.position)}
    />
  {/if}
</button> 