<svelte:options runes={true} />
<script lang="ts">
  import type { OpeningTreeNode, LichessOpeningMove } from '$lib/types';
  import { ChevronRight, ChevronDown, LoaderCircle, Target } from '@lucide/svelte';
  import { selectOpeningForPractice } from '$lib/store/practiceStore.svelte';
  import Self from './OpeningTreeNodeView.svelte';

  let { node, depth, loadingNode, onToggle, movePath } = $props<{
    node: OpeningTreeNode,
    depth: number,
    loadingNode: OpeningTreeNode | null,
    movePath: LichessOpeningMove[],
    onToggle?: (node: OpeningTreeNode, depth: number, movePath: { from: string; to: string }[]) => void
  }>();

  function handleToggle() {
    const allMoves = [...movePath, ...node.moves];
    const coordinateMovePath = allMoves.map((move: LichessOpeningMove) => ({
      from: move.uci.slice(0, 2),
      to: move.uci.slice(2, 4)
    }));
    onToggle?.(node, depth, coordinateMovePath);
  }

  function handleSelect() {
    const completeMovePath = [...movePath, ...node.moves];
    selectOpeningForPractice(node, completeMovePath);
  }
</script>

<div class="flex items-center group hover:bg-gray-50 rounded px-1 py-0.5"
     style="margin-left: {depth * 1 + 'rem'}">
  {#if node.children}
    <button class="w-4 h-4 mr-1 flex items-center justify-center"
            onclick={handleToggle}
            aria-label={node.expanded ? 'Collapse' : 'Expand'}>
      {#if loadingNode === node}
        <span class="animate-spin text-gray-500">
          <LoaderCircle size="14"/>
        </span>
      {:else if node.expanded}
        <ChevronDown size="14" />
      {:else}
        <ChevronRight size="14" />
      {/if}
    </button>
  {:else}
    <div class="w-4 h-4 mr-1"></div>
  {/if}

  <div class="flex-1 flex items-center justify-between">
    <div class="flex items-center">
      <span class={node.selected ? 'font-semibold text-blue-700' : ''}>{node.moves[0]?.san}</span>
      {#if node.name}
        <span class="text-gray-500 ml-2">({node.name})</span>
      {/if}
    </div>

    <button
      class="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-blue-100 transition-all text-blue-600 hover:text-blue-800"
      onclick={handleSelect}
      title="Select for practice"
      class:opacity-100={node.selected}
      class:bg-blue-100={node.selected}>
      <Target size="12" />
    </button>
  </div>
</div>

{#if node.expanded}
  <!-- Children displayed in a column below, each indented by its own depth -->
  <div class="flex flex-col">
    {#each node.children || [] as child (child.moves[0].uci)}
      <Self
        node={child}
        depth={depth + 1}
        movePath={[...movePath, ...node.moves]}
        {loadingNode}
        onToggle={onToggle}
      />
    {/each}
  </div>
{/if}
