<svelte:options runes={true} />
<script lang="ts">
  import type { OpeningTreeNode } from '$lib/types';
  import { ChevronRight, ChevronDown, LoaderCircle } from '@lucide/svelte';
  import Self from './OpeningTreeNodeView.svelte';

  let { node, depth, loadingNode, onToggle } = $props<{
    node: OpeningTreeNode,
    depth: number,
    loadingNode: OpeningTreeNode | null,
    onToggle?: (node: OpeningTreeNode, depth: number) => void
  }>();

  function handleToggle() {
    onToggle?.(node, depth);
  }
</script>

<div class="test">

<div class="flex items-center" style="margin-left: {depth * 1 + 'rem'}">
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
  {/if}

  <span>{node.moves[0]?.san}</span>
  {#if node.eco}
    <span class="text-gray-500 ml-2">({node.eco})</span>
  {/if}
</div>

{#if node.expanded}
  <div>
    {#each node.children || [] as child (child.moves[0].uci)}
      <Self
        node={child}
        depth={depth + 1}
        {loadingNode}
        onToggle={onToggle}
      />
    {/each}
  </div>
{/if}
</div>
