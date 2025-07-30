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
    successMessage: null,
    consecutiveWrongMoves: 0,
    hintFromSquare: null,
    hintToSquare: null,
  },
});

/**
 * Generate a random ID for practice variations
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Helper function to set messages with automatic clearing
 */
function setMessage(type: 'error' | 'success', message: string, duration: number = 3000) {
  if (type === 'error') {
    practiceStore.session.error = message;
    practiceStore.session.successMessage = null;
    setTimeout(() => practiceStore.session.error = null, duration);
  } else {
    practiceStore.session.successMessage = message;
    practiceStore.session.error = null;
    setTimeout(() => practiceStore.session.successMessage = null, duration);
  }
}

/**
 * Clear hints and reset wrong move counter
 */
function clearHintsAndResetCounter() {
  practiceStore.session.consecutiveWrongMoves = 0;
  practiceStore.session.hintFromSquare = null;
  practiceStore.session.hintToSquare = null;
}

/**
 * Reset session state and game
 */
function resetSessionState() {
  resetGame();
  clearHintsAndResetCounter();
  practiceStore.session.userTurn = true;
}

/**
 * Reset practice session to initial state
 */
export function resetPracticeSession() {
  practiceStore.session.isActive = false;
  practiceStore.session.variations = [];
  practiceStore.session.currentVariationIndex = 0;
  practiceStore.session.loading = false;
  practiceStore.session.error = null;
  practiceStore.session.successMessage = null;
  resetSessionState();
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
 * Load strategic variations for practice session based on move popularity
 */
export async function loadPracticeVariations(selectedOpening: SelectedOpening, depth: number, count: number): Promise<PracticeVariation[]> {
  const variations: PracticeVariation[] = [];
  
  try {
    for (let i = 0; i < count; i++) {
      const variation = await generateStrategicVariation(selectedOpening, depth, i);
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
 * Generate a strategic variation starting from the selected opening sequence
 * @param selectedOpening The base opening sequence
 * @param depth Target depth for the variation
 * @param variationIndex Which variation this is (0=first, 1=second, etc.)
 */
async function generateStrategicVariation(selectedOpening: SelectedOpening, depth: number, variationIndex: number): Promise<LichessOpeningMove[] | null> {
  const moves: LichessOpeningMove[] = [...selectedOpening.moves]; // Start with the base sequence
  let currentMoves: { from: string; to: string }[] = moves.map(m => ({
    from: m.uci.slice(0, 2),
    to: m.uci.slice(2, 4)
  }));
  
  let hasDiverged = false; // Track if this variation has already diverged from the main line
  let targetIndex = variationIndex; // The move index we're trying to use for divergence
  
  // Continue generating moves up to depth
  for (let i = moves.length; i < depth; i++) {
    try {
      const response = await queueOpeningDataRequest(currentMoves, 10);
      if (!response || response.moves.length === 0) {
        break; // No more moves available
      }
      
      let selectedMove: LichessOpeningMove;
      
      // Variation 0 always uses the most popular move
      if (variationIndex === 0) {
        selectedMove = response.moves[0];
      }
      // Other variations try to diverge at the first opportunity
      else if (!hasDiverged) {
        // Try to use the move at our target index
        if (response.moves.length > targetIndex) {
          selectedMove = response.moves[targetIndex];
          hasDiverged = true;
        } else {
          // Not enough moves available to diverge at this position
          // Use the highest available index (going "one level deeper")
          const maxAvailableIndex = response.moves.length - 1;
          if (maxAvailableIndex > 0) {
            selectedMove = response.moves[maxAvailableIndex];
            // Reduce target index for next opportunity to maintain some divergence
            targetIndex = Math.max(1, targetIndex - 1);
          } else {
            // Only one move available, use it
            selectedMove = response.moves[0];
          }
        }
      }
      // After diverging, always use the most popular move
      else {
        selectedMove = response.moves[0];
      }
      
      moves.push(selectedMove);
      currentMoves.push({
        from: selectedMove.uci.slice(0, 2),
        to: selectedMove.uci.slice(2, 4)
      });
      
      // Small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
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
    setMessage('error', 'Please select an opening first');
    return;
  }
  
  practiceStore.session.loading = true;
  practiceStore.session.error = null;
  practiceStore.session.successMessage = null;
  
  try {
    const variations = await loadPracticeVariations(
      practiceStore.session.selectedOpening,
      practiceStore.session.configuration.depth,
      practiceStore.session.configuration.variationCount
    );
    
    if (variations.length === 0) {
      setMessage('error', 'Could not load any variations for this opening');
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
    setMessage('error', error instanceof Error ? error.message : 'Failed to start practice session');
  } finally {
    practiceStore.session.loading = false;
  }
}

/**
 * Find the next available (non-completed) variation after the current index
 */
function findNextAvailableVariation(variations: PracticeVariation[], currentIndex: number): number {
  // Check variations after current index
  for (let i = currentIndex + 1; i < variations.length; i++) {
    if (!variations[i].completed) {
      return i;
    }
  }
  
  // Check variations before current index (cycle back)
  for (let i = 0; i < currentIndex; i++) {
    if (!variations[i].completed) {
      return i;
    }
  }
  
  return -1; // All variations completed
}

/**
 * Switch to next available variation or handle completion
 */
function switchToNextVariationOrComplete(): boolean {
  const session = practiceStore.session;
  const nextAvailableIndex = findNextAvailableVariation(session.variations, session.currentVariationIndex);
  
  if (nextAvailableIndex === -1) {
    // All variations completed
    handleAllVariationsCompleted();
    return false;
  }
  
  // Switch to the next available variation
  session.currentVariationIndex = nextAvailableIndex;
  resetSessionState();
  return true;
}

/**
 * Handle when all variations are completed
 */
function handleAllVariationsCompleted() {
  practiceStore.session.isActive = false;
  setMessage('success', "Practice session completed! All variations done!", 5000);
}

/**
 * Play the opponent's move from the current variation
 */
export function playOpponentMove() {
  const session = practiceStore.session;
  
  if (!session.isActive || session.variations.length === 0) {
    return;
  }
  
  // Find the current active variation
  let currentVariation = session.variations[session.currentVariationIndex];
  
  // If current variation is completed, try to find the next available one
  if (!currentVariation || currentVariation.completed) {
    switchToNextVariationOrComplete();
    return;
  }
  
  const nextMoveIndex = Math.floor(gameState.moveHistory.length);
  if (nextMoveIndex >= currentVariation.moves.length) {
    currentVariation.completed = true;
    switchToNextVariationOrComplete();
    return;
  }
  
  const move = currentVariation.moves[nextMoveIndex];
  const from = move.uci.slice(0, 2) as Position;
  const to = move.uci.slice(2, 4) as Position;
  
  makeMove(from, to);
  clearHintsAndResetCounter();
  session.userTurn = true;
}

/**
 * Validate user move against the current active variation
 */
export function validatePracticeMove(from: Position, to: Position): boolean {
  const session = practiceStore.session;
  
  if (!session.isActive || session.variations.length === 0) {
    return false;
  }
  
  const currentVariation = session.variations[session.currentVariationIndex];
  
  if (!currentVariation || currentVariation.completed) {
    return false;
  }
  
  const userMoveUci = from + to;
  const nextMoveIndex = Math.floor(gameState.moveHistory.length);
  
  // Check if this move matches the expected move in the current variation
  if (nextMoveIndex < currentVariation.moves.length) {
    const expectedMove = currentVariation.moves[nextMoveIndex];
    const isValid = expectedMove.uci === userMoveUci || expectedMove.uci.startsWith(userMoveUci);
    
    return isValid;
  }
  
  return false;
}

/**
 * Handle wrong move with progressive hints
 */
function handleWrongMove(expectedMove: LichessOpeningMove) {
  const session = practiceStore.session;
  session.consecutiveWrongMoves++;
  session.successMessage = null;
  
  const hintLevels = [
    {
      message: "That move isn't in this opening-try again.",
      fromSquare: null,
      toSquare: null
    },
    {
      message: "That move isn't in this opening-the highlighted piece should move.",
      fromSquare: expectedMove.uci.slice(0, 2) as Position,
      toSquare: null
    },
    {
      message: "That move isn't in this opening-move the highlighted piece to the highlighted square.",
      fromSquare: expectedMove.uci.slice(0, 2) as Position,
      toSquare: expectedMove.uci.slice(2, 4) as Position
    }
  ];
  
  const hintIndex = Math.min(session.consecutiveWrongMoves - 1, hintLevels.length - 1);
  const hint = hintLevels[hintIndex];
  
  session.hintFromSquare = hint.fromSquare;
  session.hintToSquare = hint.toSquare;
  setMessage('error', hint.message);
}

/**
 * Handle practice move - called when user makes a move during practice
 */
export function handlePracticeMove(from: Position, to: Position, promotionPiece?: PieceType): boolean {
  if (!practiceStore.session.isActive) {
    return false;
  }
  
  const session = practiceStore.session;
  const currentVariation = session.variations[session.currentVariationIndex];
  const nextMoveIndex = Math.floor(gameState.moveHistory.length);
  
  // Check if we've reached the end of the current variation
  if (nextMoveIndex >= currentVariation.moves.length) {
    // Mark current variation as completed
    currentVariation.completed = true;
    
    // Show success message
    const completedVariations = session.variations.filter(v => v.completed).length;
    const totalVariations = session.variations.length;
    
    setMessage('success', `Variation ${session.currentVariationIndex + 1} completed! (${completedVariations}/${totalVariations} done)`);
    
    // Disable user input temporarily
    session.userTurn = false;
    
    // After a few seconds, reset the board and return to practice selection
    setTimeout(() => {
      // Clear the success message
      session.successMessage = null;
      
      // Check if all variations are completed
      if (completedVariations >= totalVariations) {
        handleAllVariationsCompleted();
      } else {
        resetSessionState();
      }
    }, 3000); // Wait 3 seconds
    
    makeMove(from, to, promotionPiece);
    return false; // Don't process the move since variation is complete
  }
  
  if (validatePracticeMove(from, to)) {
    // Correct move - clear hints and reset counter
    clearHintsAndResetCounter();
    
    makeMove(from, to, promotionPiece);
    practiceStore.session.userTurn = false;
    
    // After a short delay, play opponent's response
    setTimeout(() => {
      playOpponentMove();
    }, 500);
    
    return true;
  } else {
    // Invalid move - increment counter and provide progressive feedback
    const expectedMove = currentVariation.moves[nextMoveIndex];
    handleWrongMove(expectedMove);
    return false;
  }
} 