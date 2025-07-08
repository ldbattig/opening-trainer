<svelte:options runes={true} />
<script lang="ts">
  import ChessPiece from './ChessPiece.svelte';
  import type { Square, Position, ChessPiece as Piece, BoardState, PieceColor } from './types';
  import { createInitialGameState, getPieceAt, setPieceAt, positionToCoordinates, coordinatesToPosition, getKingPosition, getPiecesByColor } from './chessGame';
  
  // Chess board component
  let { boardSize = 400 } = $props(); // Default board size in pixels
  
  // Svelte 5: use $state for reactivity
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

  // Helper: check if a given color's king is in check
  function isKingInCheck(board: BoardState, color: PieceColor): boolean {
    const kingPos = getKingPosition(board, color);
    if (!kingPos) return false;
    const opponentColor = color === 'white' ? 'black' : 'white';
    const opponentPieces = getPiecesByColor(board, opponentColor);
    for (const piece of opponentPieces) {
      const moves = getLegalMovesBasic(piece, board, true); // true: skip check filter
      if (moves.includes(kingPos)) return true;
    }
    return false;
  }

  // Helper: get legal moves for a piece (basic validation, no check filter)
  function getLegalMovesBasic(piece: Piece, board = gameState.board, skipCheckFilter = false): Position[] {
    const moves: Position[] = [];
    const [row, col] = positionToCoordinates(piece.position);
    const directions = {
      pawn: piece.color === 'white' ? -1 : 1,
      knight: [
        [2, 1], [1, 2], [-1, 2], [-2, 1],
        [-2, -1], [-1, -2], [1, -2], [2, -1]
      ],
      bishop: [
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ],
      rook: [
        [1, 0], [-1, 0], [0, 1], [0, -1]
      ],
      queen: [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ],
      king: [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ]
    };

    function isOnBoard(r: number, c: number) {
      return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    function addMoveIfValid(r: number, c: number) {
      if (!isOnBoard(r, c)) return;
      const target = board[r][c];
      if (!target || target.color !== piece.color) {
        moves.push(coordinatesToPosition(r, c));
      }
    }

    switch (piece.type) {
      case 'pawn': {
        const dir = directions.pawn;
        // Forward move
        if (isOnBoard(row + dir, col) && !board[row + dir][col]) {
          moves.push(coordinatesToPosition(row + dir, col));
          // Double move from starting position
          const startRow = piece.color === 'white' ? 6 : 1;
          if (row === startRow && !board[row + dir * 2][col]) {
            moves.push(coordinatesToPosition(row + dir * 2, col));
          }
        }
        // Captures
        for (const dc of [-1, 1]) {
          const r = row + dir, c = col + dc;
          if (isOnBoard(r, c) && board[r][c] && board[r][c]?.color !== piece.color) {
            moves.push(coordinatesToPosition(r, c));
          }
        }
        break;
      }
      case 'knight': {
        for (const [dr, dc] of directions.knight) {
          addMoveIfValid(row + dr, col + dc);
        }
        break;
      }
      case 'bishop': {
        for (const [dr, dc] of directions.bishop) {
          for (let i = 1; i < 8; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (!isOnBoard(r, c)) break;
            const target = board[r][c];
            if (!target) {
              moves.push(coordinatesToPosition(r, c));
            } else {
              if (target.color !== piece.color) moves.push(coordinatesToPosition(r, c));
              break;
            }
          }
        }
        break;
      }
      case 'rook': {
        for (const [dr, dc] of directions.rook) {
          for (let i = 1; i < 8; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (!isOnBoard(r, c)) break;
            const target = board[r][c];
            if (!target) {
              moves.push(coordinatesToPosition(r, c));
            } else {
              if (target.color !== piece.color) moves.push(coordinatesToPosition(r, c));
              break;
            }
          }
        }
        break;
      }
      case 'queen': {
        for (const [dr, dc] of directions.queen) {
          for (let i = 1; i < 8; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (!isOnBoard(r, c)) break;
            const target = board[r][c];
            if (!target) {
              moves.push(coordinatesToPosition(r, c));
            } else {
              if (target.color !== piece.color) moves.push(coordinatesToPosition(r, c));
              break;
            }
          }
        }
        break;
      }
      case 'king': {
        for (const [dr, dc] of directions.king) {
          addMoveIfValid(row + dr, col + dc);
        }
        // TODO: Castling (Phase 4)
        break;
      }
    }
    // TODO: Filter out moves that would leave king in check (Phase 3)
    return moves;
  }

  // Updated getLegalMoves: filter out moves that leave king in check
  function getLegalMoves(piece: Piece, board = gameState.board): Position[] {
    const basicMoves = getLegalMovesBasic(piece, board);
    const legalMoves: Position[] = [];
    for (const move of basicMoves) {
      // Simulate move
      const [fromRow, fromCol] = positionToCoordinates(piece.position);
      const [toRow, toCol] = positionToCoordinates(move);
      const tempBoard = board.map(row => row.slice());
      tempBoard[toRow][toCol] = { ...piece, position: move, hasMoved: true };
      tempBoard[fromRow][fromCol] = null;
      if (!isKingInCheck(tempBoard, piece.color)) {
        legalMoves.push(move);
      }
    }
    return legalMoves;
  }

  // Handle square click: select or move
  function handleSquareClick(position: Position) {
    const selected = gameState.selectedPiece;
    const clickedPiece = getPieceAt(gameState.board, position);
    if (!selected) {
      // Select a piece if it belongs to the current player
      if (clickedPiece && clickedPiece.color === gameState.currentPlayer) {
        gameState.selectedPiece = position;
        gameState.legalMoves = getLegalMoves(clickedPiece);
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
          gameState.legalMoves = getLegalMoves(clickedPiece);
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