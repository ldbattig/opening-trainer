<svelte:options runes={true} />
<script lang="ts">
  import ChessPiece from '$lib/components/ChessPiece.svelte';
  import MoveHistory from '$lib/components/MoveHistory.svelte';
  import type { Square, Position } from '$lib/types';
  import { generateBoardSquares, getPieceAt } from '$lib/utils/boardUtils';
  import { getLegalMoves } from '$lib/utils/moveLogic';
  import { gameState, makeMove } from '$lib/store.svelte';
  
  let { boardSize = 400 } = $props();
  
  // Generate 8x8 grid positions
  const squares = generateBoardSquares();

  // Drag-and-drop state
  let draggingPiece: Position | null = null;
  let dragOverSquare = $state<Position | null>(null);

  // Promotion modal state
  const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];
  
  // Helper: get piece for a square
  function getPieceForSquare(square: Square) {
    return getPieceAt(gameState.board, square.position);
  }

  // Handle square click: select or move
  function handleSquareClick(position: Position) {
    const selected = gameState.selectedPiece;
    const clickedPiece = getPieceAt(gameState.board, position);
    if (!selected) {
      // Select a piece if it belongs to the current player
      if (clickedPiece && clickedPiece.color === gameState.currentPlayer) {
        gameState.selectedPiece = position;
        gameState.legalMoves = getLegalMoves(clickedPiece, gameState.board, gameState.enPassantTarget ?? undefined);
      }
    } else {
      // If clicking the same piece, deselect
      if (selected === position) {
        gameState.selectedPiece = null;
        gameState.legalMoves = [];
        return;
      }
      // If clicking a legal move, move the piece
      if (gameState.legalMoves.includes(position)) {
        makeMove(selected, position);
        gameState.selectedPiece = null;
        gameState.legalMoves = [];
      } else {
        // If clicking another own piece, select it
        if (clickedPiece && clickedPiece.color === gameState.currentPlayer) {
          gameState.selectedPiece = position;
          gameState.legalMoves = getLegalMoves(clickedPiece, gameState.board, gameState.enPassantTarget ?? undefined);
        } else {
          // Deselect if invalid
          gameState.selectedPiece = null;
          gameState.legalMoves = [];
        }
      }
    }
  }

  function handleDragStart(position: Position) {
    const piece = getPieceAt(gameState.board, position);
    if (piece && piece.color === gameState.currentPlayer) {
      draggingPiece = position;
      gameState.selectedPiece = position;
      gameState.legalMoves = getLegalMoves(piece, gameState.board, gameState.enPassantTarget ?? undefined);
    }
  }

  function handleDragOver(event: DragEvent, position: Position) {
    event.preventDefault();
    if (draggingPiece && gameState.legalMoves.includes(position)) {
      dragOverSquare = position;
    }
  }

  function handleDragLeave(position: Position) {
    if (dragOverSquare === position) {
      dragOverSquare = null;
    }
  }

  function handleDrop(position: Position) {
    if (draggingPiece && gameState.legalMoves.includes(position)) {
      makeMove(draggingPiece, position);
      draggingPiece = null;
      dragOverSquare = null;
      gameState.selectedPiece = null;
      gameState.legalMoves = [];
    }
  }

  function handleDragEnd() {
    draggingPiece = null;
    dragOverSquare = null;
    gameState.selectedPiece = null;
    gameState.legalMoves = [];
  }

  function handlePromotionSelect(piece: string) {
    if (gameState.pendingPromotion) {
      makeMove(gameState.pendingPromotion.from, gameState.pendingPromotion.to, piece);
    }
  }
</script>

<div class="flex flex-col md:flex-row gap-4">
  <div
    class="grid grid-cols-8 grid-rows-8 border-2 border-neutral-800 relative"
    style="width: {boardSize}px; height: {boardSize}px;"
  >
    {#each squares as square}
      <button
        type="button"
        class="relative flex items-center justify-center transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 {square.isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'} hover:opacity-80 cursor-pointer {dragOverSquare === square.position ? 'ring-2 ring-blue-500 z-20' : ''}"
        data-position={square.position}
        data-file={square.file}
        data-rank={square.rank}
        onclick={() => handleSquareClick(square.position)}
        tabindex="0"
        style="border:none;padding:0;margin:0;width:100%;height:100%;"
        ondragover={(e) => handleDragOver(e, square.position)}
        ondragleave={() => handleDragLeave(square.position)}
        ondrop={() => handleDrop(square.position)}
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
            draggable={getPieceForSquare(square) && getPieceForSquare(square)!.color === gameState.currentPlayer}
            ondragstart={() => handleDragStart(square.position)}
            ondragend={handleDragEnd}
          />
        {/if}
      </button>
    {/each}
    <!-- Promotion Modal -->
    {#if gameState.pendingPromotion}
      <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center w-72 max-w-full">
          <h2 class="text-lg font-bold mb-4 text-center">Choose Promotion Piece</h2>
          <div class="grid grid-cols-2 gap-4 w-full">
            {#each promotionPieces as piece}
              <button
                class="flex flex-col items-center justify-center p-3 border border-neutral-300 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onclick={() => handlePromotionSelect(piece)}
                tabindex="0"
              >
                <img src={`/chess-pieces/${gameState.pendingPromotion.color}-${piece}.svg`} alt={piece} class="w-10 h-10 mb-1" />
                <span class="capitalize text-sm font-medium">{piece}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
  <div class="w-48">
    <MoveHistory />
  </div>
</div> 