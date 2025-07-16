<script lang="ts">
  import Board from '$lib/components/Board.svelte';
  import { resetGame, toggleBoardOrientation } from '$lib/store.svelte';
  import MoveHistory from '$lib/components/MoveHistory.svelte';
</script>

<svelte:head>
  <title>Chess Trainer</title>
</svelte:head>

<main class="flex flex-col items-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
  <h1 class="text-gray-800 mb-6 sm:mb-8 text-3xl sm:text-4xl font-bold tracking-tight drop-shadow">Chess Trainer</h1>
  <div class="flex flex-col lg:flex-row w-full max-w-6xl justify-center items-stretch gap-6 md:gap-8">
    <div class="flex flex-row w-full justify-center items-start gap-4">
      <!-- Controls column -->
      <div class="w-48 flex-shrink-0">
        <div class="bg-white/80 rounded-xl shadow-lg p-4 flex flex-col gap-4 items-center border border-gray-200">
          <button
            type="button"
            class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors w-full font-semibold shadow"
            onclick={toggleBoardOrientation}
          >
            Flip Board
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition-colors w-full font-semibold shadow"
            onclick={resetGame}
          >
            New Game
          </button>
        </div>
      </div>
      <!-- Board column -->
      <div class="flex-1 flex justify-center">
        <div class="relative w-full max-w-[98vw] md:w-fit mx-auto flex justify-center">
          <Board boardSize={500} />
        </div>
      </div>
      <!-- Move history column -->
      <div class="w-48 flex-shrink-0">
        <div class="bg-white/80 rounded-xl shadow-lg border border-gray-200 p-4 h-full flex flex-col">
          <MoveHistory />
        </div>
      </div>
    </div>
  </div>
</main>
