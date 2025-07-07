// Chess piece types
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

// Chess position (e.g., 'e4', 'a1')
export type Position = string;

// Chess piece interface
export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  position: Position;
  hasMoved: boolean;
}

// Board state - 2D array representing the chess board
export type BoardState = (ChessPiece | null)[][];

// Game state interface
export interface GameState {
  board: BoardState;
  currentPlayer: PieceColor;
  moveHistory: Move[];
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  selectedPiece: Position | null;
  legalMoves: Position[];
}

// Move interface
export interface Move {
  from: Position;
  to: Position;
  piece: ChessPiece;
  capturedPiece?: ChessPiece;
  notation: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isCastling?: boolean;
  isEnPassant?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
}

// Square interface for board rendering
export interface Square {
  id: number;
  row: number;
  col: number;
  isLight: boolean;
  position: Position;
  file: string;
  rank: number;
  piece?: ChessPiece;
} 