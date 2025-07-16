<script lang="ts">
  import ChessBoard from '$lib/components/ChessBoard.svelte';
  import { resetGame, toggleBoardOrientation } from '$lib/store.svelte';
  import MoveHistory from '$lib/components/MoveHistory.svelte';
</script>

<svelte:head>
  <title>Chess Trainer</title>
</svelte:head>

<main class="flex flex-col items-center p-8 min-h-screen bg-gray-100">
  <h1 class="text-gray-800 mb-8 text-4xl font-bold">Chess Trainer</h1>
  <div class="flex flex-row w-full justify-center items-start gap-8">
    <div class="flex flex-col gap-4 w-48">
      <button
        type="button"
        class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900 transition-colors w-full"
        onclick={toggleBoardOrientation}
      >
        Flip Board
      </button>
      <button
        type="button"
        class="px-4 py-2 bg-blue-600 text-white rounded w-full"
        onclick={resetGame}
      >
        New Game
      </button>
    </div>
    <div class="flex flex-col md:flex-row gap-4 items-start">
      <div class="relative w-fit mx-auto">
        <ChessBoard boardSize={500} />
      </div>
      <div class="w-48 mt-4 md:mt-0">
        <MoveHistory />
      </div>
    </div>
  </div>
</main>
