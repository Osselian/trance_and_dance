import { Game } from './game/Game';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
}); 