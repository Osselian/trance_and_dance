import { startVsComputer, start1v1  } from '../../../pong/src/game/gameLogic.js';

export const homeView = `
<section class="relative w-full h-[calc(100vh-3.6rem)] overflow-hidden">
  <img src="/img/home.png" alt="Главная картинка" class="absolute inset-0 w-full h-full object-cover" />
  <div class="relative z-10 flex flex-col items-center justify-center h-full bg-black/40 pt-16">
    <h1 class="text-white text-5xl font-bold mb-8">Добро пожаловать в PONG!</h1>
    <div class="flex space-x-6">
      <button id="vs-computer" class="bg-blue-500 hover:bg-blue-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
        Игра с компьютером
      </button>
      <button id="one-vs-one" class="bg-green-500 hover:bg-green-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
        Игра 1 на 1
      </button>
      <button id="tournament" class="bg-purple-500 hover:bg-purple-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
        Турнир
      </button>
    </div>
  </div>
</section>
`;

export function initHome() {
  console.log('✅ initHome запущен');
  const btnVsCPU = document.getElementById('vs-computer');
console.log('vs-computer element:', btnVsCPU);
  const btn1v1 = document.getElementById('one-vs-one');
  const btnTournament = document.getElementById('tournament');

  if (btnVsCPU) btnVsCPU.addEventListener('click', startVsComputer);
  if (btn1v1) btn1v1.addEventListener('click', start1v1);
  // if (btnTournament) btnTournament.addEventListener('click', startTournament);
}