import type { Position, PracticeStore, PracticeVariation, PracticeConfiguration, LichessOpeningMove, SelectedOpening, OpeningTreeNode, PieceType } from "../types";
import { gameState, resetGame, makeMove } from "$lib/gameStore.svelte";
import { openingStore, clearOpeningSelection } from "$lib/store/openingStore.svelte";
import { queueOpeningDataRequest } from "$lib/utils/lichessApiUtils";

// Practice session state
export const practiceStore: PracticeStore = $state({
  session: {
    isActive: false,
    configuration: {
      depth: 7,
      variationCount: 3,
    },
    selectedOpening: null,
    variations: [],
    currentVariationIndex: 0,
    userTurn: true,
    loading: false,
    error: null,
  },
});

/**
 * Generate a random ID for practice variations
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Reset practice session to initial state
 */
export function resetPracticeSession() {
  practiceStore.session.isActive = false;
  practiceStore.session.variations = [];
  practiceStore.session.currentVariationIndex = 0;
  practiceStore.session.userTurn = true;
  practiceStore.session.loading = false;
  practiceStore.session.error = null;
  resetGame();
}

/**
 * Set practice configuration
 */
export function setPracticeConfiguration(config: Partial<PracticeConfiguration>) {
  Object.assign(practiceStore.session.configuration, config);
}

/**
 * Select an opening for practice
 */
export function selectOpeningForPractice(opening: OpeningTreeNode, movePath: LichessOpeningMove[]) {
  // Clear previous selection
  clearOpeningSelection(openingStore.openingTree);
  
  if (opening) {
    opening.selected = true;
    
    // Build the complete move sequence up to this node
    const moveSequence = movePath; // This is passed from the UI and represents the path
    
    const selectedOpening: SelectedOpening = {
      name: opening.name || opening.moves[0]?.san || 'Unknown Opening',
      eco: opening.eco || '',
      moves: moveSequence,
      displayName: `${moveSequence.map(m => m.san).join(' ')} - ${opening.name || opening.moves[0]?.san}`,
    };
    
    practiceStore.session.selectedOpening = selectedOpening;
    openingStore.selectedOpening = opening;
  } else {
    practiceStore.session.selectedOpening = null;
    openingStore.selectedOpening = null;
  }
}

/**
 * Clear the opening selection
 */
export function clearOpeningPracticeSelection() {
  clearOpeningSelection(openingStore.openingTree);
  practiceStore.session.selectedOpening = null;
  openingStore.selectedOpening = null;
}

/**
 * Load random variations for practice session
 */
export async function loadPracticeVariations(selectedOpening: SelectedOpening, depth: number, count: number): Promise<PracticeVariation[]> {
  const variations: PracticeVariation[] = [];
  
  try {
    for (let i = 0; i < count; i++) {
      const variation = await generateRandomVariation(selectedOpening, depth);
      if (variation) {
        variations.push({
          id: generateId(),
          moves: variation,
          currentMoveIndex: 0,
          completed: false,
        });
      }
      
      // Small delay between variations to respect API rate limits
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  } catch (error) {
    console.error('Error loading practice variations:', error);
    throw error;
  }
  
  return variations;
}

/**
 * Generate a random variation starting from the selected opening sequence
 */
async function generateRandomVariation(selectedOpening: SelectedOpening, depth: number): Promise<LichessOpeningMove[] | null> {
  const moves: LichessOpeningMove[] = [...selectedOpening.moves]; // Start with the base sequence
  let currentMoves: { from: string; to: string }[] = moves.map(m => ({
    from: m.uci.slice(0, 2),
    to: m.uci.slice(2, 4)
  }));
  
  // Continue generating moves up to depth
  for (let i = moves.length; i < depth; i++) {
    try {
      const response = await queueOpeningDataRequest(currentMoves, 10);
      if (!response || response.moves.length === 0) {
        break; // No more moves available
      }
      
      // Randomly select a move from available options
      const randomMove = response.moves[Math.floor(Math.random() * response.moves.length)];
      moves.push(randomMove);
      currentMoves.push({
        from: randomMove.uci.slice(0, 2),
        to: randomMove.uci.slice(2, 4)
      });
      
      // Small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.error('Error fetching moves for variation:', error);
      break;
    }
  }
  
  return moves;
}

/**
 * Start a practice session
 */
export async function startPracticeSession() {
  if (!practiceStore.session.selectedOpening) {
    practiceStore.session.error = 'Please select an opening first';
    return;
  }
  
  practiceStore.session.loading = true;
  practiceStore.session.error = null;
  
  try {
    const variations = await loadPracticeVariations(
      practiceStore.session.selectedOpening,
      practiceStore.session.configuration.depth,
      practiceStore.session.configuration.variationCount
    );
    
    if (variations.length === 0) {
      practiceStore.session.error = 'Could not load any variations for this opening';
      practiceStore.session.loading = false;
      return;
    }
    
    practiceStore.session.variations = variations;
    practiceStore.session.currentVariationIndex = 0;
    practiceStore.session.isActive = true;
    practiceStore.session.userTurn = true;
    
    // Reset the game board
    resetGame();
    
    // If user is playing black, make the first move automatically
    if (gameState.boardOrientation === 'black') {
      playOpponentMove();
    }
    
  } catch (error) {
    practiceStore.session.error = error instanceof Error ? error.message : 'Failed to start practice session';
  } finally {
    practiceStore.session.loading = false;
  }
}

/**
 * Play the opponent's move from the current variation
 */
export function playOpponentMove() {
  const session = practiceStore.session;
  if (!session.isActive || session.variations.length === 0) return;
  
  const currentVariation = session.variations[session.currentVariationIndex];
  if (!currentVariation || currentVariation.completed) return;
  
  const nextMoveIndex = Math.floor(gameState.moveHistory.length);
  if (nextMoveIndex >= currentVariation.moves.length) {
    currentVariation.completed = true;
    return;
  }
  
  const move = currentVariation.moves[nextMoveIndex];
  const from = move.uci.slice(0, 2) as Position;
  const to = move.uci.slice(2, 4) as Position;
  
  // Convert to board positions
  const fromPos = from;
  const toPos = to;
  
  makeMove(fromPos, toPos);
  session.userTurn = true;
}

/**
 * Validate user move against current variations
 */
export function validatePracticeMove(from: Position, to: Position): boolean {
  const session = practiceStore.session;
  if (!session.isActive || session.variations.length === 0) return false;
  
  const userMoveUci = from + to;
  const nextMoveIndex = Math.floor(gameState.moveHistory.length);
  
  // Check if this move matches any of the active variations
  for (const variation of session.variations) {
    if (variation.completed) continue;
    
    if (nextMoveIndex < variation.moves.length) {
      const expectedMove = variation.moves[nextMoveIndex];
      if (expectedMove.uci === userMoveUci || expectedMove.uci.startsWith(userMoveUci)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Handle practice move - called when user makes a move during practice
 */
export function handlePracticeMove(from: Position, to: Position, promotionPiece?: PieceType): boolean {
  if (!practiceStore.session.isActive) return false;
  
  if (validatePracticeMove(from, to)) {
    makeMove(from, to, promotionPiece);
    practiceStore.session.userTurn = false;
    
    // After a short delay, play opponent's response
    setTimeout(() => {
      playOpponentMove();
    }, 500);
    
    return true;
  } else {
    // Invalid move - show error
    practiceStore.session.error = "That move isn't in this opening—try again.";
    setTimeout(() => {
      practiceStore.session.error = null;
    }, 3000);
    return false;
  }
} 