import { Game } from './Game';
import { GameMode } from '../utils/types';

function renderGameScreen() {
  const root = document.getElementById('outlet');    // ← тот же элемент, что и у роутера
    if (!root) throw new Error('Контейнер #outlet не найден!');
      root.innerHTML = `
     <div class="relative w-full h-full bg-black">
       <!-- Блок счёта, который ищет Score.ts -->
       <div id="scoreDisplay"
            class="absolute top-4 left-4 text-white text-2xl">
         0 - 0
       </div>
       <canvas id="gameCanvas" class="block mx-auto border border-white"></canvas>
       <div id="gameMessage"
            class="absolute inset-0 flex items-center justify-center text-white text-2xl">
       </div>
     </div>
   `;
}

export function startVsComputer() {
  renderGameScreen();
  const game = new Game(GameMode.VS_COMPUTER);
  game.start();
}

export function start1v1() {
  renderGameScreen();
  const game = new Game(GameMode.VS_PLAYER);
  game.start();
}

// export function startTournament() {
//   renderGameScreen();
//   const game = new Game(GameMode.TOURNAMENT);
//   game.start();
// }