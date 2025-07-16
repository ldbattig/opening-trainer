import type { GameState, BoardState, ChessPiece, Position, PieceType, PieceColor, Square } from '../types';

export type BoardOrientation = 'white' | 'black';

export function generateBoardSquares(orientation: BoardOrientation = 'white'): Square[] {
  const squares: Square[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const displayRow = orientation === 'white' ? row : 7 - row;
      const displayCol = orientation === 'white' ? col : 7 - col;
      const isLight = (displayRow + displayCol) % 2 === 0;
      const file = String.fromCharCode(97 + displayCol); // a-h
      const rank = 8 - displayRow; // 8-1
      const position = `${file}${rank}`;
      squares.push({
        id: row * 8 + col,
        row: displayRow,
        col: displayCol,
        isLight,
        position,
        file,
        rank
      });
    }
  }
  return squares;
}

// Initialize empty board
function createEmptyBoard(): BoardState {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

// Create a chess piece
function createPiece(type: PieceType, color: PieceColor, position: Position): ChessPiece {
  return {
    type,
    color,
    position,
    hasMoved: false
  };
}

// Get initial board setup
export function getInitialBoard(): BoardState {
  const board = createEmptyBoard();
  
  // Set up pawns
  for (let col = 0; col < 8; col++) {
    const file = String.fromCharCode(97 + col);
    board[6][col] = createPiece('pawn', 'white', `${file}2`);
    board[1][col] = createPiece('pawn', 'black', `${file}7`);
  }
  
  // Set up other pieces
  const backRankPieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    const file = String.fromCharCode(97 + col);
    board[7][col] = createPiece(backRankPieces[col], 'white', `${file}1`);
    board[0][col] = createPiece(backRankPieces[col], 'black', `${file}8`);
  }
  
  return board;
}

// Convert position to board coordinates
export function positionToCoordinates(position: Position): [number, number] {
  const file = position.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = 8 - parseInt(position[1]); // 1=7, 2=6, etc.
  return [rank, file];
}

// Convert board coordinates to position
export function coordinatesToPosition(row: number, col: number): Position {
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}

// Get piece at position
export function getPieceAt(board: BoardState, position: Position): ChessPiece | undefined {
  const [row, col] = positionToCoordinates(position);
  const piece = board[row][col];
  return piece === null ? undefined : piece;
}

// Set piece at position
export function setPieceAt(board: BoardState, position: Position, piece: ChessPiece | null): void {
  const [row, col] = positionToCoordinates(position);
  board[row][col] = piece;
}

// Create initial game state
export function createInitialGameState(): GameState {
  return {
    board: getInitialBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    gameStatus: 'playing',
    selectedPiece: null,
    legalMoves: []
  };
}

// Get all pieces of a specific color
export function getPiecesByColor(board: BoardState, color: PieceColor): ChessPiece[] {
  const pieces: ChessPiece[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        pieces.push(piece);
      }
    }
  }
  
  return pieces;
}

// Get king position for a specific color
export function getKingPosition(board: BoardState, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return piece.position;
      }
    }
  }
  return null;
}