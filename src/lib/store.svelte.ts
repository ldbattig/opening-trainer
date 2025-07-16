import type { Position } from "./types";
import { coordinatesToPosition, createInitialGameState, getInitialBoard, getPieceAt, getPiecesByColor, positionToCoordinates, setPieceAt } from "./utils/boardUtils";
import { createMove, updateMoveWithGameStatus } from "./utils/moveHistoryUtils";
import { getLegalMoves, isKingInCheck } from "./utils/moveLogic";

export const gameState = $state({
  ...createInitialGameState(),
  enPassantTarget: null as Position | null,
  pendingPromotion: null as { from: Position; to: Position; color: string } | null,
  boardOrientation: 'white' as 'white' | 'black',
});

export function resetGame() {
  gameState.board = getInitialBoard();
  gameState.currentPlayer = 'white';
  gameState.moveHistory = [];
  gameState.gameStatus = 'playing';
  gameState.selectedPiece = null;
  gameState.legalMoves = [];
}

export function toggleBoardOrientation() {
  gameState.boardOrientation = gameState.boardOrientation === 'white' ? 'black' : 'white';
}

export function makeMove(from: Position, to: Position, promotionPiece?: string) {
  const board = gameState.board;
  const movingPiece = getPieceAt(board, from);
  if (!movingPiece) return;
  
  // Capture if needed
  const captured = getPieceAt(board, to);
  
  // Check for promotion
  const isPromotion = movingPiece.type === 'pawn' && (to[1] === '8' || to[1] === '1');
  if (isPromotion && !promotionPiece) {
    // Trigger promotion UI
    gameState.pendingPromotion = { from, to, color: movingPiece.color };
    return;
  }

  // Create move object using utility function
  const move = createMove(from, to, movingPiece, captured || null, board);
  if (isPromotion && promotionPiece) {
    move.isPromotion = true;
    move.promotionPiece = promotionPiece as any;
  }

  // Track en passant target
  gameState.enPassantTarget = null;
  if (movingPiece.type === 'pawn' && Math.abs(positionToCoordinates(from)[0] - positionToCoordinates(to)[0]) === 2) {
    // Set en passant target square
    const dir = movingPiece.color === 'white' ? -1 : 1;
    const [fromRow, fromCol] = positionToCoordinates(from);
    gameState.enPassantTarget = coordinatesToPosition(fromRow + dir, fromCol);
  }
  
  // Execute the move on the board
  setPieceAt(
    board,
    to,
    move.isPromotion
      ? { ...movingPiece, type: move.promotionPiece!, position: to, hasMoved: true }
      : { ...movingPiece, position: to, hasMoved: true }
  );
  setPieceAt(board, from, null);

  // Handle castling: move rook as well
  if (move.isCastling) {
    const [fromRow, fromCol] = positionToCoordinates(from);
    const [toRow, toCol] = positionToCoordinates(to);
    if (toCol === 6) { // King-side
      const rookFrom = coordinatesToPosition(fromRow, 7);
      const rookTo = coordinatesToPosition(fromRow, 5);
      const rook = getPieceAt(board, rookFrom);
      if (rook) {
        setPieceAt(board, rookTo, { ...rook, position: rookTo, hasMoved: true });
        setPieceAt(board, rookFrom, null);
      }
    } else if (toCol === 2) { // Queen-side
      const rookFrom = coordinatesToPosition(fromRow, 0);
      const rookTo = coordinatesToPosition(fromRow, 3);
      const rook = getPieceAt(board, rookFrom);
      if (rook) {
        setPieceAt(board, rookTo, { ...rook, position: rookTo, hasMoved: true });
        setPieceAt(board, rookFrom, null);
      }
    }
  }
  
  // Remove captured pawn for en passant
  if (move.isEnPassant) {
    const dir = movingPiece.color === 'white' ? 1 : -1;
    const capRow = positionToCoordinates(to)[0] + dir;
    const capCol = positionToCoordinates(to)[1];
    setPieceAt(board, coordinatesToPosition(capRow, capCol), null);
  }
  
  // Switch player before checking for check/checkmate
  gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  
  // Check/checkmate/stalemate
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
  
  // Update game status and move
  let isCheck = false;
  let isCheckmate = false;
  let isStalemate = false;
  
  if (opponentKingInCheck && !hasLegalMove) {
    gameState.gameStatus = 'checkmate';
    isCheckmate = true;
  } else if (!opponentKingInCheck && !hasLegalMove) {
    gameState.gameStatus = 'stalemate';
    isStalemate = true;
  } else if (opponentKingInCheck) {
    gameState.gameStatus = 'check';
    isCheck = true;
  } else {
    gameState.gameStatus = 'playing';
  }
  
  // Update move with game status
  const updatedMove = updateMoveWithGameStatus(move, isCheck, isCheckmate, isStalemate);
  
  // Add to move history
  gameState.moveHistory = [
    ...gameState.moveHistory,
    updatedMove
  ];
  gameState.pendingPromotion = null;
}