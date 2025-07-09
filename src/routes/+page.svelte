<script lang="ts">
  import ChessBoard from '$lib/components/ChessBoard.svelte';

  let chessBoardRef = $state<any>(null);
</script>

<svelte:head>
  <title>Chess Trainer</title>
</svelte:head>

<main class="flex flex-col items-center p-8 min-h-screen bg-gray-100">
  <h1 class="text-gray-800 mb-8 text-4xl font-bold">Chess Trainer</h1>
  <div class="relative w-fit mx-auto">
    <ChessBoard bind:this={chessBoardRef} boardSize={500} />
    <button
      type="button"
      class="absolute top-1/2 right-0 translate-x-full -translate-y-1/2 ml-4 px-4 py-2 bg-blue-600 text-white rounded"
      onclick={() => chessBoardRef?.resetGame()}
    >
      New Game
    </button>
  </div>
</main>
