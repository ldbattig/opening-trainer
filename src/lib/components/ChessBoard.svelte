<svelte:options runes={true} />
<script lang="ts">
  import ChessPiece from '$lib/components/ChessPiece.svelte';
  import type { Square, Position } from '$lib/types';
  import { createInitialGameState, getPieceAt, getPiecesByColor, setPieceAt } from '$lib/utils/boardUtils';
  import { getLegalMoves, isKingInCheck } from '$lib/utils/moveLogic';
  
  let { boardSize = 400 } = $props();
  
  // $state for reactivity
  let gameState = $state(createInitialGameState());
  
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
        gameState.legalMoves = getLegalMoves(clickedPiece, gameState.board);
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
          gameState.legalMoves = getLegalMoves(clickedPiece, gameState.board);
        } else {
          // Deselect if invalid
          gameState.selectedPiece = null;
          gameState.legalMoves = [];
        }
      }
    }
  }

  // Move execution logic
  function makeMove(from: Position, to: Position) {
    const board = gameState.board;
    const movingPiece = getPieceAt(board, from);
    if (!movingPiece) return;
    // Capture if needed
    const captured = getPieceAt(board, to);
    setPieceAt(board, to, { ...movingPiece, position: to, hasMoved: true });
    setPieceAt(board, from, null);
    // Update move history
    gameState.moveHistory = [
      ...gameState.moveHistory,
      {
        from,
        to,
        piece: movingPiece,
        capturedPiece: captured || undefined,
        notation: `${movingPiece.type[0].toUpperCase()}${from}-${to}`
      }
    ];
    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    // Update gameStatus (check, checkmate, stalemate)
    const opponent = gameState.currentPlayer;
    const opponentKingInCheck = isKingInCheck(gameState.board, opponent);
    const opponentPieces = getPiecesByColor(gameState.board, opponent);
    let hasLegalMove = false;
    for (const piece of opponentPieces) {
      if (getLegalMoves(piece, gameState.board).length > 0) {
        hasLegalMove = true;
        break;
      }
    }
    if (opponentKingInCheck && !hasLegalMove) {
      gameState.gameStatus = 'checkmate';
    } else if (!opponentKingInCheck && !hasLegalMove) {
      gameState.gameStatus = 'stalemate';
    } else if (opponentKingInCheck) {
      gameState.gameStatus = 'check';
    } else {
      gameState.gameStatus = 'playing';
    }
  }

  // Reset game
  function resetGame() {
    gameState = createInitialGameState();
  }

  // Expose resetGame to parent
  export { resetGame };
</script>

<div
  class="grid grid-cols-8 grid-rows-8 border-2 border-neutral-800 relative"
  style="width: {boardSize}px; height: {boardSize}px;"
>
  {#each squares as square}
    <button
      type="button"
      class="relative flex items-center justify-center transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 {square.isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'} hover:opacity-80 cursor-pointer"
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