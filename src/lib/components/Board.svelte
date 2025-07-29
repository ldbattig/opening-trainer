<svelte:options runes={true} />
<script lang="ts">
  import Piece from '$lib/components/Piece.svelte';
  import Square from '$lib/components/Square.svelte';
  import type { Position, ChessPiece, PieceType } from '$lib/types';
  import { generateBoardSquares, getPieceAt } from '$lib/utils/boardUtils';
  import { getLegalMoves } from '$lib/utils/moveLogic';
  import { gameState, makeMove } from '$lib/gameStore.svelte';
  import { practiceStore, handlePracticeMove } from '$lib/store/practiceStore.svelte';
  import PromotionModal from '$lib/components/PromotionModal.svelte';
  
  let { boardSize = 400 } = $props();
  let boardRef: HTMLElement | null = $state(null);

  // Drag-and-drop state (pointer events based)
  let dragging = $state(false);
  let draggedPiece: { piece: ChessPiece; origin: Position } | null = $state(null);
  let pointerX = $state(0);
  let pointerY = $state(0);
  let pointerDownPosition: { x: number; y: number } | null = $state(null);
  const DRAG_THRESHOLD = 5; // px

  function squares() {
    return generateBoardSquares(gameState.boardOrientation);
  }
  
  // Helper: get piece for a square
  function getPieceForSquare(square: any) {
    return getPieceAt(gameState.board, square.position);
  }

  // Check if moves are allowed (either not in practice or it's user's turn)
  function canMakeMove(): boolean {
    if (!practiceStore.session.isActive) {
      return true; // Regular game, moves allowed
    }
    return practiceStore.session.userTurn; // Practice mode, only if it's user's turn
  }

  // Execute a move (practice-aware)
  function executeMove(from: Position, to: Position, promotionPiece?: PieceType) {
    if (!canMakeMove()) return;
    
    if (practiceStore.session.isActive) {
      // Use practice move validation
      handlePracticeMove(from, to, promotionPiece);
    } else {
      // Regular move
      makeMove(from, to, promotionPiece);
    }
  }

  // Handle square click: select or move
  function handleSquareClick(position: Position) {
    if (!canMakeMove()) return; // Don't allow selection during opponent's turn in practice
    
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
        executeMove(selected, position);
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
    if (!canMakeMove()) return; // Don't allow drag during opponent's turn in practice
    
    const piece = getPieceAt(gameState.board, position);
    if (piece && piece.color === gameState.currentPlayer) {
      pointerDownPosition = { x: e.clientX, y: e.clientY };
      dragging = false;
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
    if (!draggedPiece || !pointerDownPosition) return;
    const dx = e.clientX - pointerDownPosition.x;
    const dy = e.clientY - pointerDownPosition.y;
    if (!dragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      dragging = true;
    }
    if (dragging) {
      pointerX = e.clientX;
      pointerY = e.clientY;
    }
  }

  // Handler user putting down a piece
  function handlePointerUp(e: PointerEvent) {
    if (!draggedPiece || !boardRef || !pointerDownPosition) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const dx = e.clientX - pointerDownPosition.x;
    const dy = e.clientY - pointerDownPosition.y;
    if (!dragging && Math.sqrt(dx * dx + dy * dy) <= DRAG_THRESHOLD) {
      // Treat as click
      handleSquareClick(draggedPiece.origin);
    } else if (dragging) {
      // Drag-and-drop logic
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
          executeMove(draggedPiece.origin, pos);
        }
      }
    }
    dragging = false;
    draggedPiece = null;
    pointerDownPosition = null;
    gameState.selectedPiece = null;
    gameState.legalMoves = [];
  }

  function handlePromotionSelect(piece: PieceType) {
    if (gameState.pendingPromotion) {
      executeMove(gameState.pendingPromotion.from, gameState.pendingPromotion.to, piece);
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
      class="grid grid-cols-8 grid-rows-8 shadow-2xl relative select-none touch-none w-full h-full min-w-0 min-h-0 max-w-full max-h-full aspect-square"
      style="width: {boardSize}px; height: {boardSize}px; max-width: 98vw; max-height: 98vw;"
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
    >
      {#each squares() as square}
        <Square
          square={square}
          isSelected={!!(gameState.selectedPiece == square.position)}
          isLegalMove={!!gameState.legalMoves && gameState.legalMoves.includes(square.position)}
          isLastMove={!!isLastMove(square.position)}
          isHintFrom={practiceStore.session.hintFromSquare === square.position}
          isHintTo={practiceStore.session.hintToSquare === square.position}
          piece={getPieceForSquare(square) ?? null}
          boardOrientation={gameState.boardOrientation}
          currentPlayer={gameState.currentPlayer}
          dragging={!!dragging}
          draggedPieceOrigin={draggedPiece?.origin ?? null}
          onSquareClick={handleSquareClick}
          onPointerDown={handlePointerDown}
        />
      {/each}
      {#if dragging && draggedPiece && boardRef}
        <div
          class="absolute left-0 top-0 z-50 pointer-events-none flex items-center justify-center"
          style="transform:translate({pointerX - boardRef.getBoundingClientRect().left}px, {pointerY - boardRef.getBoundingClientRect().top}px) translate(-50%,-50%); width:{boardSize/8}px; height:{boardSize/8}px;"
        >
          <Piece 
            piece={draggedPiece.piece}
            isSelected={true}
            isLegalMove={false}
            dragging={true}
          />
        </div>
      {/if}
      <!-- Promotion Modal -->
      {#if gameState.pendingPromotion}
        <PromotionModal
          color={gameState.pendingPromotion.color}
          onSelect={handlePromotionSelect}
        />
      {/if}
    </div>
  </div>
</div> 