<svelte:options runes={true} />
<script lang="ts">
  import { onMount } from 'svelte';
  import { openingStore, initializeOpeningTree, toggleNode } from '$lib/store/openingStore.svelte';
  import type { OpeningTreeNode } from '$lib/types';
  import OpeningTreeNodeView from './OpeningTreeNodeView.svelte';

  let loadingNode: OpeningTreeNode | null = $state(null);

  onMount(() => {
    initializeOpeningTree();
  });

  async function handleToggle(node: OpeningTreeNode, depth: number, movePath: { from: string; to: string }[]) {
    loadingNode = node;
    await toggleNode(node, movePath);
    loadingNode = null;
  }
</script>

<div class="bg-white/80 rounded-xl shadow-lg border border-gray-200 p-4 h-full flex flex-col gap-2 flex-1 min-h-0 min-h-[200px]">
  <h2 class="text-lg font-bold text-gray-700 mb-2">Openings</h2>
  {#if openingStore.rateLimited}
    <div class="text-red-600 text-sm font-semibold mb-2">
      Lichess API rate limit reached. Please wait 1 minute.
    </div>
  {/if}

  {#if openingStore.openingTree.length === 0}
    <div class="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Loading openings...
    </div>
  {:else}
    <div class="flex-1 min-h-0 overflow-y-auto text-xs text-gray-700">
      {#each openingStore.openingTree as node (node.moves[0].uci)}
        <OpeningTreeNodeView
          {node}
          depth={0}
          movePath={[]}
          {loadingNode}
          onToggle={handleToggle}
        />
      {/each}
    </div>
  {/if}
</div>
