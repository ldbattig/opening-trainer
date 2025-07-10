import type { Move, ChessPiece, BoardState, PieceType } from '$lib/types';
import { getPiecesByColor } from './boardUtils';
import { getLegalMoves } from './moveLogic';

/**
 * Generate algebraic notation for a chess move
 */
export function generateAlgebraicNotation(
  move: Move, 
  board: BoardState, 
): string {
  const { from, to, piece, capturedPiece, isCastling, isEnPassant, isPromotion, promotionPiece } = move;
  
  // Castling
  if (piece.type === 'king' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2) {
    return to[0] === 'g' ? 'O-O' : 'O-O-O';
  }
  
  // Piece letter (empty for pawn)
  const pieceLetter = piece.type === 'pawn' ? '' :
    piece.type === 'knight' ? 'N' :
    piece.type[0].toUpperCase();
  
  // Capture
  const isCapture = !!capturedPiece;
  
  // Pawn move
  if (piece.type === 'pawn') {
    if (isCapture) {
      // exd5 or exd6 e.p.
      let notation = from[0] + 'x' + to;
      if (isEnPassant) notation += ' e.p.';
      if (isPromotion && promotionPiece) notation += promotionPiece[0].toUpperCase();
      return notation;
    } else {
      let notation = to;
      if (isPromotion && promotionPiece) notation += promotionPiece[0].toUpperCase();
      return notation;
    }
  }
  
  // Disambiguation for pieces (if needed)
  let disambiguation = '';
  if (piece.type !== "pawn" as PieceType) {
    // Find all pieces of same type and color that could move to 'to'
    const candidates = getPiecesByColor(board, piece.color).filter((p) =>
      p.type === piece.type && p.position !== from && getLegalMoves(p, board).includes(to)
    );
    
    if (candidates.length > 0) {
      // If any candidate is on a different file, use file; else use rank
      const sameFile = candidates.some(p => p.position[0] === from[0]);
      const sameRank = candidates.some(p => p.position[1] === from[1]);
      
      if (!sameFile) disambiguation = from[0];
      else if (!sameRank) disambiguation = from[1];
      else disambiguation = from;
    }
  }
  
  // Main notation
  let notation = pieceLetter + disambiguation;
  if (isCapture) notation += 'x';
  notation += to;
  
  // Promotion (shouldn't happen for non-pawns, but just in case)
  if (isPromotion && promotionPiece) notation += promotionPiece[0].toUpperCase();
  
  return notation;
}

/**
 * Create a move object with all necessary properties
 */
export function createMove(
  from: string,
  to: string,
  piece: ChessPiece,
  capturedPiece: ChessPiece | null | undefined,
  board: BoardState,
): Move {
  // Detect special moves
  const isCastling = piece.type === 'king' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;
  const isEnPassant = piece.type === 'pawn' && !capturedPiece && from[0] !== to[0];
  const isPromotion = piece.type === 'pawn' && (to[1] === '8' || to[1] === '1');
  const promotionPiece: PieceType | undefined = isPromotion ? 'queen' : undefined;

  const move: Move = {
    from,
    to,
    piece: { ...piece },
    capturedPiece: capturedPiece || undefined,
    notation: '', // Will be set below
    isCheck: false,
    isCheckmate: false,
    isCastling,
    isEnPassant,
    isPromotion,
    promotionPiece
  };

  // Generate algebraic notation
  move.notation = generateAlgebraicNotation(move, board);
  
  return move;
}

/**
 * Update move with game status information
 */
export function updateMoveWithGameStatus(
  move: Move,
  isCheck: boolean,
  isCheckmate: boolean,
  isStalemate: boolean
): Move {
  return {
    ...move,
    isCheck,
    isCheckmate,
    notation: move.notation + (isCheckmate ? ' #' : isCheck ? ' +' : '')
  };
} 