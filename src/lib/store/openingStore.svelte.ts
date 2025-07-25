import type { OpeningStore, OpeningTreeNode, LichessOpeningMove } from "$lib/types";
import { queueOpeningDataRequest } from "$lib/utils/lichessApiUtils";

// Opening browser state
export const openingStore: OpeningStore = $state({
  openingTree: [],
  selectedOpening: null,
  cache: {},
  rateLimited: false,
});

/**
 * Initialize the opening tree with top-level openings
 */
export async function initializeOpeningTree() {
  try {
    const data = await queueOpeningDataRequest([], 50);
    if (!data) {
      openingStore.rateLimited = true;
      setTimeout(() => { openingStore.rateLimited = false; }, 60000);
      return;
    }
    openingStore.openingTree = data.moves.map(m => ({
      name: m.opening?.name || m.san,
      eco: m.opening?.eco || '',
      moves: [m],
      children: [],
      expanded: false,
    }));
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      openingStore.rateLimited = true;
      setTimeout(() => { openingStore.rateLimited = false; }, 60000);
    }
    console.error('Error initializing opening tree:', error);
  }
}

/**
 * Load children for an opening tree node
 */
async function loadChildren(node: OpeningTreeNode, movePath: { from: string; to: string }[]) {
  try {
    const data = await queueOpeningDataRequest(movePath, 10);
    if (!data) {
      openingStore.rateLimited = true;
      setTimeout(() => { openingStore.rateLimited = false; }, 60000);
      return;
    }
    node.children = data.moves.map(m => ({
      name: m.opening?.name || m.san,
      eco: m.opening?.eco || '',
      moves: [m],
      children: [],
      expanded: false,
    }));
    node.expanded = true;
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      openingStore.rateLimited = true;
      setTimeout(() => { openingStore.rateLimited = false; }, 60000);
    }
    console.error('Error loading children:', error);
  }
}

/**
 * Collapse a node in the opening tree
 */
function collapse(node: OpeningTreeNode) {
  node.expanded = false;
  node.children = [];
}

/**
 * Toggle expansion of an opening tree node
 */
export async function toggleNode(node: OpeningTreeNode, movePath: { from: string; to: string }[]) {
  if (node.expanded) {
    collapse(node);
  } else {
    await loadChildren(node, movePath);
  }
}

/**
 * Recursively clear opening selection in the tree
 */
export function clearOpeningSelection(nodes: OpeningTreeNode[]) {
  for (const node of nodes) {
    node.selected = false;
    if (node.children) {
      clearOpeningSelection(node.children);
    }
  }
}

/**
 * Build the complete move sequence from root to the selected node
 */
export function buildMoveSequence(targetNode: OpeningTreeNode): LichessOpeningMove[] | null {
  // Search through the opening tree to find the path to the target node
  function findPath(nodes: OpeningTreeNode[], path: LichessOpeningMove[]): LichessOpeningMove[] | null {
    for (const node of nodes) {
      const newPath = [...path, ...node.moves];
      
      if (node === targetNode) {
        return newPath;
      }
      
      if (node.children && node.children.length > 0) {
        const result = findPath(node.children, newPath);
        if (result) return result;
      }
    }
    return null;
  }
  
  return findPath(openingStore.openingTree, []);
} 