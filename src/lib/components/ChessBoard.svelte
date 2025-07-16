<svelte:options runes={true} />
<script lang="ts">
  import ChessPiece from '$lib/components/ChessPiece.svelte';
  import type { Square, Position } from '$lib/types';
  import { generateBoardSquares, getPieceAt } from '$lib/utils/boardUtils';
  import { getLegalMoves } from '$lib/utils/moveLogic';
  import { gameState, makeMove } from '$lib/store.svelte';
  
  let { boardSize = 400 } = $props();
  let boardRef: HTMLElement | null = $state(null);

  function squares() {
    return generateBoardSquares(gameState.boardOrientation);
  }

  // Drag-and-drop state (pointer events based)
  let dragging = $state(false);
  let draggedPiece: { piece: any; origin: Position } | null = $state(null);
  let pointerX = $state(0);
  let pointerY = $state(0);

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

  // Handle user picking up a piece
  function handlePointerDown(e: PointerEvent, position: Position) {
    const piece = getPieceAt(gameState.board, position);
    if (piece && piece.color === gameState.currentPlayer) {
      dragging = true;
      draggedPiece = { piece, origin: position };
      pointerX = e.clientX;
      pointerY = e.clientY;
      gameState.selectedPiece = position;
      gameState.legalMoves = getLegalMoves(piece, gameState.board, gameState.enPassantTarget ?? undefined);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  }

  // Handle user moving piece
  function handlePointerMove(e: PointerEvent) {
    if (!dragging || !draggedPiece) return;
    pointerX = e.clientX;
    pointerY = e.clientY;
  }

  // Handler user putting down a piece
  function handlePointerUp(e: PointerEvent) {
    if (!dragging || !draggedPiece || !boardRef) return;
    dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    // Find the square under the pointer
    const boardRect = boardRef.getBoundingClientRect();
    const relX = pointerX - boardRect.left;
    const relY = pointerY - boardRect.top;
    const squareSize = boardRect.width / 8;
    let col = Math.floor(relX / squareSize);
    let row = Math.floor(relY / squareSize);
    if (col >= 0 && col < 8 && row >= 0 && row < 8) {
      const files = 'abcdefgh';
      const ranks = '12345678';
      let pos: Position;
      if (gameState.boardOrientation === 'white') {
        pos = `${files[col]}${ranks[7 - row]}`;
      } else {
        // Flip col and row for black orientation
        pos = `${files[7 - col]}${ranks[row]}`;
      }
      if (gameState.legalMoves.includes(pos)) {
        makeMove(draggedPiece.origin, pos);
      }
    }
    draggedPiece = null;
    gameState.selectedPiece = null;
    gameState.legalMoves = [];
  }

  function handlePromotionSelect(piece: string) {
    if (gameState.pendingPromotion) {
      makeMove(gameState.pendingPromotion.from, gameState.pendingPromotion.to, piece);
    }
  }

  function isLastMove(pos: Position) {
    return gameState.lastMove
      && (gameState.lastMove.from === pos || gameState.lastMove.to === pos);
  }
</script>

<div class="flex flex-col md:flex-row gap-4">
  <div class="flex flex-col items-center">
    <div
      bind:this={boardRef}
      class="grid grid-cols-8 grid-rows-8 border-2 border-neutral-800 relative select-none touch-none"
      style="width: {boardSize}px; height: {boardSize}px;"
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
    >
      {#each squares() as square}
        <button
          type="button"
          class="relative flex items-center justify-center transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 {square.isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'} { isLastMove(square.position) ? 'bg-yellow-100 ring-inset' : '' } hover:opacity-80 cursor-pointer border-0 p-0 m-0 w-full h-full"
          data-position={square.position}
          data-file={square.file}
          data-rank={square.rank}
          onclick={() => handleSquareClick(square.position)}
          tabindex="0"
          onpointerdown={(e: PointerEvent) => handlePointerDown(e, square.position)}
        >
          <!-- Legal move indicator (dot) -->
          {#if gameState.legalMoves.includes(square.position) && (!getPieceForSquare(square) || getPieceForSquare(square)?.color !== gameState.currentPlayer)}
            <span class="absolute w-4 h-4 bg-blue-500 bg-opacity-60 rounded-full z-20" style="left: 50%; top: 50%; transform: translate(-50%, -50%);"></span>
          {/if}
          <!-- Coordinates for edge squares, orientation aware -->
          {#if (gameState.boardOrientation === 'white' && square.row === 7) || (gameState.boardOrientation === 'black' && square.row === 0)}
            <span class="absolute bottom-1 right-1 text-xs font-bold text-neutral-800 select-none">
              {square.file}
            </span>
          {/if}
          {#if (gameState.boardOrientation === 'white' && square.col === 0) || (gameState.boardOrientation === 'black' && square.col === 7)}
            <span class="absolute top-1 left-1 text-xs font-bold text-neutral-800 select-none">
              {square.rank}
            </span>
          {/if}
          <!-- Chess piece -->
          {#if getPieceForSquare(square) && !(dragging && draggedPiece && draggedPiece.origin === square.position)}
            <ChessPiece 
              piece={getPieceForSquare(square)!}
              isSelected={gameState.selectedPiece === square.position}
              isLegalMove={gameState.legalMoves.includes(square.position)}
              dragging={!!(dragging && draggedPiece && draggedPiece.origin === square.position)}
            />
          {/if}
        </button>
      {/each}
      {#if dragging && draggedPiece && boardRef}
        <div
          class="absolute left-0 top-0 z-50 pointer-events-none flex items-center justify-center"
          style="transform:translate({pointerX - boardRef.getBoundingClientRect().left}px, {pointerY - boardRef.getBoundingClientRect().top}px) translate(-50%,-50%); width:{boardSize/8}px; height:{boardSize/8}px;"
        >
          <ChessPiece 
            piece={draggedPiece.piece}
            isSelected={true}
            isLegalMove={false}
            dragging={true}
          />
        </div>
      {/if}
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
  </div>
</div> 