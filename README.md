# Chess Opening Trainer

A chess opening trainer built with Svelte 5 designed to help practice chess openings through interactive practice sessions. Developed using the Lichess masters opening API.

## Features

### 🎯 **Opening Practice**
- Practice specific opening lines with configurable depth (number of moves)
- Interactive practice mode where the app plays the opponent's moves
- Real-time move validation with immediate feedback

### ♟️ **Full Chess Interface**
- Complete chess board with drag-and-drop piece movement
- Support for all chess rules including castling, en passant, and pawn promotion
- Check and checkmate detection
- Flip board orientation to practice from both perspectives
- Move history with algebraic notation

### 📊 **Lichess Integration**
- Fetches master-level opening data from Lichess API
- Multiple variations for each opening line

## Requirements

- **Node.js 22** or higher
- npm, pnpm, or yarn package manager

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd opening-trainer
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

To automatically open the app in your browser:
```bash
npm run dev -- --open
```

## How to Use

1. **Browse Openings**: Use the Opening Browser panel to search for and select chess openings
2. **Configure Practice**: Set your preferred practice depth and number of variations
3. **Start Practice**: Click "Start Practice" to begin training on your selected opening
4. **Make Moves**: Play the opening moves on the chess board
5. **Get Feedback**: The app will validate your moves and play the opponent's responses
6. **Review**: Use the move history panel to review your games

### Keyboard Shortcuts
- `←` / `→` Arrow keys: Navigate through move history
- Click and drag pieces or click to select and move
