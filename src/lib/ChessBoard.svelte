<svelte:options runes={true} />
<script lang="ts">
  import ChessPiece from './ChessPiece.svelte';
  import type { GameState, Square, Position } from './types';
  import { createInitialGameState, getPieceAt } from './chessGame';
  
  // Chess board component
  let { boardSize = 400 } = $props(); // Default board size in pixels
  
  // Game state
  let gameState: GameState = createInitialGameState();
  
  // Generate 8x8 grid positions
  const squares = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const isLight = (row + col) % 2 === 0;
    const file = String.fromCharCode(97 + col); // a-h
    const rank = 8 - row; // 8-1
    const position = `${file}${rank}`;
    
    return {
      id: i,
      row,
      col,
      isLight,
      position,
      file,
      rank
    };
  });
  
  // Get piece for a square
  function getPieceForSquare(square: Square) {
    return getPieceAt(gameState.board, square.position);
  }
  
  // Handle square click
  function handleSquareClick(position: Position) {
    console.log('Square clicked:', position);
    // TODO: Implement move logic
  }
</script>

<div
  class="grid grid-cols-8 grid-rows-8 border-2 border-neutral-800 relative"
  style="width: {boardSize}px; height: {boardSize}px;"
>
  {#each squares as square}
    <button
      type="button"
      class="relative flex items-center justify-center transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 {square.isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'} hover:opacity-80 cursor-pointer"
      data-position={square.position}
      data-file={square.file}
      data-rank={square.rank}
      onclick={() => handleSquareClick(square.position)}
      tabindex="0"
      style="border:none;padding:0;margin:0;width:100%;height:100%;"
    >
      <!-- Coordinates for edge squares -->
      {#if square.row === 7}
        <span class="absolute bottom-1 right-1 text-xs font-bold text-neutral-800 select-none">
          {square.file}
        </span>
      {/if}
      {#if square.col === 0}
        <span class="absolute top-1 left-1 text-xs font-bold text-neutral-800 select-none">
          {square.rank}
        </span>
      {/if}
      
      <!-- Chess piece -->
      {#if getPieceForSquare(square)}
        <ChessPiece 
          piece={getPieceForSquare(square)!}
          isSelected={gameState.selectedPiece === square.position}
          isLegalMove={gameState.legalMoves.includes(square.position)}
        />
      {/if}
    </button>
  {/each}
</div> 