import { coordinatesToPosition, getKingPosition, getPiecesByColor, positionToCoordinates } from "./boardUtils";
import type { BoardState, ChessPiece, PieceColor, Position } from "../types";

// Helper: get legal moves for a piece (basic validation, no check filter)
export function getLegalMovesBasic(piece: ChessPiece, board: BoardState, skipCheckFilter = false, enPassantTarget?: Position): Position[] {
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
      // Promotion
      const lastRank = piece.color === 'white' ? 0 : 7;
      if (row + dir === lastRank) {
        // Only allow forward move and captures that promote
        if (isOnBoard(row + dir, col) && !board[row + dir][col]) {
          moves.push(coordinatesToPosition(row + dir, col));
        }
        for (const dc of [-1, 1]) {
          const r = row + dir, c = col + dc;
          if (isOnBoard(r, c) && board[r][c] && board[r][c]?.color !== piece.color) {
            moves.push(coordinatesToPosition(r, c));
          }
        }
        // En passant promotion is not standard, so skip
      }
      // En passant
      if (enPassantTarget) {
        for (const dc of [-1, 1]) {
          const c = col + dc;
          if (isOnBoard(row, c)) {
            if (enPassantTarget === coordinatesToPosition(row + dir, c)) {
              moves.push(coordinatesToPosition(row + dir, c));
            }
          }
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
      // Castling logic
      if (!skipCheckFilter && !piece.hasMoved) {
        // King-side castling
        const homeRow = piece.color === 'white' ? 7 : 0;
        const kingCol = 4;
        const rookKingSideCol = 7;
        const rookQueenSideCol = 0;
        // King-side
        const kingSideSquares = [5, 6];
        const rookKingSide = board[homeRow][rookKingSideCol];
        if (
          rookKingSide &&
          rookKingSide.type === 'rook' &&
          !rookKingSide.hasMoved &&
          !board[homeRow][5] &&
          !board[homeRow][6] &&
          !isKingInCheck(board, piece.color)
        ) {
          // Check squares king passes through are not attacked
          let safe = true;
          for (const col of kingSideSquares) {
            const tempBoard = board.map(row => row.slice());
            tempBoard[homeRow][col] = { ...piece, position: coordinatesToPosition(homeRow, col), hasMoved: true };
            tempBoard[homeRow][kingCol] = null;
            if (isKingInCheck(tempBoard, piece.color)) {
              safe = false;
              break;
            }
          }
          if (safe) {
            moves.push(coordinatesToPosition(homeRow, 6)); // g1/g8
          }
        }
        // Queen-side
        const queenSideSquares = [1, 2, 3];
        const rookQueenSide = board[homeRow][rookQueenSideCol];
        if (
          rookQueenSide &&
          rookQueenSide.type === 'rook' &&
          !rookQueenSide.hasMoved &&
          !board[homeRow][1] &&
          !board[homeRow][2] &&
          !board[homeRow][3] &&
          !isKingInCheck(board, piece.color)
        ) {
          // Check squares king passes through are not attacked
          let safe = true;
          for (const col of [2, 3]) {
            const tempBoard = board.map(row => row.slice());
            tempBoard[homeRow][col] = { ...piece, position: coordinatesToPosition(homeRow, col), hasMoved: true };
            tempBoard[homeRow][kingCol] = null;
            if (isKingInCheck(tempBoard, piece.color)) {
              safe = false;
              break;
            }
          }
          if (safe) {
            moves.push(coordinatesToPosition(homeRow, 2)); // c1/c8
          }
        }
      }
      break;
    }
  }
  return moves;
}

// Helper: filter out moves that leave king in check
export function getLegalMoves(piece: ChessPiece, board: BoardState, enPassantTarget?: Position): Position[] {
  const basicMoves = getLegalMovesBasic(piece, board, false, enPassantTarget);
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

// Helper: check if a given color's king is in check
export function isKingInCheck(board: BoardState, color: PieceColor): boolean {
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