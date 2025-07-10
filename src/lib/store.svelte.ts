import type { Position } from "./types";
import { coordinatesToPosition, createInitialGameState, getInitialBoard, getPieceAt, getPiecesByColor, positionToCoordinates, setPieceAt } from "./utils/boardUtils";
import { createMove, updateMoveWithGameStatus } from "./utils/moveHistoryUtils";
import { getLegalMoves, isKingInCheck } from "./utils/moveLogic";

export const gameState = $state(createInitialGameState());

export function resetGame() {
  gameState.board = getInitialBoard()
  gameState.moveHistory = [];
  gameState.gameStatus = 'playing';
  gameState.selectedPiece = null;
  gameState.legalMoves = [];
}

export function makeMove(from: Position, to: Position) {
  const board = gameState.board;
  const movingPiece = getPieceAt(board, from);
  if (!movingPiece) return;
  
  // Capture if needed
  const captured = getPieceAt(board, to);
  
  // Create move object using utility function
  const move = createMove(from, to, movingPiece, captured || null, board);
  
  // Execute the move on the board
  setPieceAt(
    board,
    to,
    move.isPromotion
      ? { ...movingPiece, type: move.promotionPiece!, position: to, hasMoved: true }
      : { ...movingPiece, position: to, hasMoved: true }
  );
  setPieceAt(board, from, null);
  
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
}