<script lang="ts">
  import Board from '$lib/components/Board.svelte';
  import { goToNextMove, goToPreviousMove, resetGame, toggleBoardOrientation } from '$lib/store.svelte';
  import MoveHistory from '$lib/components/MoveHistory.svelte';
  import { onMount } from 'svelte';

  // Heading text
  const heading = 'Chess Trainer';

  // Generate a random color in hex format
  function getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Store the color for each letter
  let letterColors: string[] = Array(heading.length).fill('');

  function handleMouseEnter(idx: number) {
    letterColors[idx] = getRandomColor();
  }
  function handleMouseLeave(idx: number) {
    letterColors[idx] = '';
  }

  // Responsive board size logic
  let boardSize = 400;

  function calculateBoardSize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // breakpoints (you can tweak these to match your Tailwind config)
    const isMobile = vw < 640;
    const isTablet = vw >= 640 && vw < 1024;

    // “floor” sizes at each breakpoint
    const minSize = isMobile
      ? 240
      : isTablet
      ? 320
      : 360;

    // subtract space taken by padding / headers / side panels
    const horizontalPadding = isMobile
      ? 32        // 16px each side
      : isTablet
      ? 220       // ~ controls + gutters
      : 320;      // larger side‑panel area
    const verticalPadding = isMobile
      ? 180       // header + buttons area
      : 120;      // header only

    // available drawing area
    const maxWidth  = vw - horizontalPadding;
    const maxHeight = vh - verticalPadding;

    // pick the largest square that fits, but not below minSize
    boardSize = Math.max(minSize, Math.min(maxWidth, maxHeight)) - 50;
  }

  // initialize…
  onMount(calculateBoardSize);

  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      goToPreviousMove();
    } else if (event.key === 'ArrowRight') {
      goToNextMove();
    }
  }
</script>

<!-- listen reactively for window resizes -->
<svelte:window on:resize={calculateBoardSize} on:keydown={handleKeydown} />

<svelte:head>
  <title>Chess Trainer</title>
</svelte:head>

<main class="flex flex-col items-center p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
  <h1 class="text-gray-800 mb-6 sm:mb-8 text-3xl sm:text-4xl font-bold tracking-tight drop-shadow select-none">
    {#each heading.split('') as letter, idx}
      <span
        class="inline-block transition-colors duration-200 cursor-default"
        role="presentation"
        onmouseenter={() => handleMouseEnter(idx)}
        onmouseleave={() => handleMouseLeave(idx)}
        style={letterColors[idx] ? `color: ${letterColors[idx]}` : ''}
        >{letter === ' ' ? '\u00A0' : letter}</span>
    {/each}
  </h1>
  <div class="flex flex-col lg:flex-row w-full max-w-6xl justify-center items-stretch gap-6 md:gap-8">
    <div class="flex flex-col-reverse lg:flex-row w-full justify-center items-stretch gap-4">
      <!-- Controls column -->
      <div class="w-full lg:w-48 flex-shrink-0 mb-4 lg:mb-0">
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
      <div class="flex-1 flex justify-center items-center">
        <div class="relative w-full max-w-[98vw] md:w-fit mx-auto flex justify-center">
          <Board {boardSize} />
        </div>
      </div>
      <!-- Move history column -->
      <div class="w-full lg:w-48 flex-shrink-0 mt-4 lg:mt-0">
        <div class="bg-white/80 rounded-xl shadow-lg border border-gray-200 p-4 h-full flex flex-col">
          <MoveHistory />
        </div>
      </div>
    </div>
  </div>
</main>
