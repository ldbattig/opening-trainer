import type { Position } from "./types";
import type { BoardState, Move, PieceType, PieceColor, OpeningStore, LichessOpeningResponse, OpeningTreeNode } from "./types";
import { coordinatesToPosition, createInitialGameState, getInitialBoard, getPieceAt, getPiecesByColor, positionToCoordinates, setPieceAt, moveListToCoordinateNotation } from "./utils/boardUtils";
import { fetchJson } from "./utils/httpUtils";
import { createMove, updateMoveWithGameStatus } from "./utils/moveHistoryUtils";
import { getLegalMoves, isKingInCheck } from "./utils/moveLogic";

// Store variables

// state related to board, pieces, and game
export const gameState = $state({
  ...createInitialGameState(),
  enPassantTarget: null as Position | null,
  pendingPromotion: null as { from: Position; to: Position; color: PieceColor } | null,
  boardOrientation: 'white' as 'white' | 'black',
  lastMove: null as { from: Position; to: Position } | null,
  highlightedSquares: [] as Position[],
});

// current index in the move list
export const navigationState = $state({
  currentMoveIndex: 0 // 0 = initial position, 1 = after first move, etc.
});

// state for the opening browser and lichess api
export const openingStore: OpeningStore = $state({
  openingTree: [],
  selectedOpening: null,
  cache: {},
  rateLimited: false,
});

/**
 * Fetch opening data from Lichess API and cache it
 * @param moveList - array of {from, to} moves
 * @param moves - number of variations to return
 * @returns LichessOpeningResponse
 */
export async function fetchOpeningData(moveList: { from: string; to: string }[], moves: number = 10): Promise<LichessOpeningResponse> {
  const coordMoves = moveListToCoordinateNotation(moveList);
  const playParam = coordMoves.join(',');
  const cacheKey = `${playParam}|${moves}`;
  if (openingStore.cache[cacheKey]) {
    return openingStore.cache[cacheKey];
  }
  const url = `https://explorer.lichess.ovh/masters?play=${playParam}&moves=${moves}&topGames=0`;
  const data = await fetchJson<LichessOpeningResponse>(url);
  openingStore.cache[cacheKey] = data;
  return data;
}

/**
 * Fetch opening data with 429 error handling (rate limiting)
 * @param moveList - array of {from, to} moves
 * @param moves - number of variations to return
 * @returns LichessOpeningResponse
 */
export async function fetchOpeningDataWith429(moveList: { from: string; to: string }[], moves: number = 10): Promise<LichessOpeningResponse | null> {
  try {
    return await fetchOpeningData(moveList, moves);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('429')) {
      // Set a UI flag or store variable for rate limit
      openingStore.rateLimited = true;
      // Optionally, set a timeout to clear the flag after 1 minute
      setTimeout(() => { openingStore.rateLimited = false; }, 60000);
      return null;
    }
    throw e;
  }
}

export async function initializeOpeningTree() {
  const data = await fetchOpeningDataWith429([], 50);
  if (!data) return;
  openingStore.openingTree = data.moves.map(m => ({
    name: m.opening?.name || m.san,
    eco:  m.opening?.eco  || '',
    moves:[m],
    children: [],
    expanded: false,
  }));
}

async function loadChildren(node: OpeningTreeNode, parentMoves: { from:string; to:string }[]) {
  const data = await fetchOpeningDataWith429(parentMoves, 10);
  if (!data) return;
  node.children = data.moves.map(m => ({
    name: m.opening?.name || m.san,
    eco:  m.opening?.eco  || '',
    moves:[m],
    children: [],
    expanded: false,
  }));
  node.expanded = true;
}

function collapse(node: OpeningTreeNode) {
  node.expanded = false;
  node.children = [];
}

function getPathMoves(node: OpeningTreeNode, depth: number) {
  // walk down the tree to collect the first `depth+1` moves
  let path: {from:string;to:string}[] = [];
  let currList = openingStore.openingTree;
  for (let i = 0; i <= depth; i++) {
    const nd = currList.find(n => n === node || n.children?.includes(node));
    if (!nd) break;
    const uci = nd.moves[0]?.uci || '';
    path.push({ from: uci.slice(0,2), to: uci.slice(2,4) });
    currList = nd.children!;
  }
  return path;
}

export async function toggleNode(node: OpeningTreeNode, depth: number) {
  if (node.expanded) {
    collapse(node);
  } else {
    const parentMoves = getPathMoves(node, depth);
    await loadChildren(node, parentMoves);
  }
}

// Store functions
export function resetGame() {
  gameState.board = getInitialBoard();
  gameState.currentPlayer = 'white';
  gameState.moveHistory = [];
  gameState.gameStatus = 'playing';
  gameState.selectedPiece = null;
  gameState.legalMoves = [];
  gameState.enPassantTarget = null;
  gameState.pendingPromotion = null;
  gameState.lastMove = null;
  gameState.highlightedSquares = [];
}

export function toggleBoardOrientation() {
  gameState.boardOrientation = gameState.boardOrientation === 'white' ? 'black' : 'white';
}

export function makeMove(from: Position, to: Position, promotionPiece?: PieceType) {
  const board = gameState.board;
  const movingPiece = getPieceAt(board, from);
  if (!movingPiece) return;
  
  // If not at end of history, trim future moves
  if (navigationState.currentMoveIndex < gameState.moveHistory.length) {
    gameState.moveHistory = gameState.moveHistory.slice(0, navigationState.currentMoveIndex);
  }

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
    move.promotionPiece = promotionPiece;
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
  // After move, update navigation index to end
  navigationState.currentMoveIndex = gameState.moveHistory.length;
  gameState.pendingPromotion = null;
  // Set last move and highlighted squares
  gameState.lastMove = { from, to };
  gameState.highlightedSquares = [from, to];
}

function cloneBoard(board: BoardState): BoardState {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
}

// Set board to a specific move index (0 = initial position)
export function goToMove(index: number) {
  // Clamp index
  const clamped = Math.max(0, Math.min(index, gameState.moveHistory.length));
  navigationState.currentMoveIndex = clamped;
  // Reset to initial state
  const initial = createInitialGameState();
  gameState.board = cloneBoard(initial.board);
  gameState.currentPlayer = initial.currentPlayer;
  gameState.gameStatus = initial.gameStatus;
  gameState.selectedPiece = null;
  gameState.legalMoves = [];
  gameState.enPassantTarget = null;
  gameState.pendingPromotion = null;
  gameState.lastMove = null;
  gameState.highlightedSquares = [];
  // Replay moves up to clamped index
  for (let i = 0; i < clamped; i++) {
    const move = gameState.moveHistory[i];
    // Use makeMove logic, but without pushing to moveHistory again
    // We'll need a helper for this, so let's extract the move application logic
    applyMoveToBoard(gameState, move);
  }
}

// Go to previous move
export function goToPreviousMove() {
  goToMove(navigationState.currentMoveIndex - 1);
}

// Go to next move
export function goToNextMove() {
  goToMove(navigationState.currentMoveIndex + 1);
}

// Go to a specific move
export function goToMoveIndex(index: number) {
  goToMove(index);
}

// Helper to apply a move to the board (without updating moveHistory)
function applyMoveToBoard(state: typeof gameState, move: Move) {
  const board = state.board;
  const movingPiece = getPieceAt(board, move.from);
  if (!movingPiece) return;
  // Promotion
  const isPromotion = move.isPromotion && move.promotionPiece;
  setPieceAt(
    board,
    move.to,
    isPromotion
      ? { ...movingPiece, type: move.promotionPiece!, position: move.to, hasMoved: true }
      : { ...movingPiece, position: move.to, hasMoved: true }
  );
  setPieceAt(board, move.from, null);
  // Castling
  if (move.isCastling) {
    const [fromRow, fromCol] = positionToCoordinates(move.from);
    const [toRow, toCol] = positionToCoordinates(move.to);
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
  // En passant
  if (move.isEnPassant) {
    const dir = movingPiece.color === 'white' ? 1 : -1;
    const capRow = positionToCoordinates(move.to)[0] + dir;
    const capCol = positionToCoordinates(move.to)[1];
    setPieceAt(board, coordinatesToPosition(capRow, capCol), null);
  }
  // Update last move and highlighted squares
  state.lastMove = { from: move.from, to: move.to };
  state.highlightedSquares = [move.from, move.to];
  // Switch player
  state.currentPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
}