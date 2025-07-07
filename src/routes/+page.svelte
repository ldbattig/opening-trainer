<script lang="ts">
  import ChessBoard from '$lib/ChessBoard.svelte';
</script>

<svelte:head>
  <title>Chess Trainer</title>
</svelte:head>

<main class="flex flex-col items-center p-8 min-h-screen bg-gray-100">
  <h1 class="text-gray-800 mb-8 text-4xl font-bold">Chess Trainer</h1>
  <div class="game-container flex justify-center items-center">
    <ChessBoard boardSize={500} />
  </div>
</main>
