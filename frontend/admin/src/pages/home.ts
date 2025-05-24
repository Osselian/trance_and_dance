 export const homeView = `
 <section class="relative w-full h-[calc(100vh-3.6rem)] overflow-hidden">
   <img src="/img/home.png" alt="Главная картинка" class="absolute inset-0 w-full h-full object-cover" />
   <div class="relative z-10 flex flex-col items-center justify-center h-full bg-black/40 pt-16">
     <h1 class="text-white text-5xl font-bold mb-8">Добро пожаловать в PONG!</h1>
     <div class="flex space-x-6">
       <button id="vs-computer"   class="bg-blue-500   hover:bg-blue-600   text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         Игра с компьютером
       </button>
       <button id="one-vs-one"     class="bg-green-500  hover:bg-green-600  text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         Игра 1 на 1
       </button>
        <button id="search-quick"     class="bg-yellow-500 hover:bg-yellow-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
          Быстрая игра
        </button>
       <button id="tournament"     class="bg-purple-500 hover:bg-purple-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         Турнир
       </button>
     </div>
   </div>
 </section>
 `;

// export function initHome() {
//   const btnVsCPU = document.getElementById('vs-computer');
//   const btn1v1  = document.getElementById('one-vs-one');
//   const btnT    = document.getElementById('tournament');

//   btnVsCPU?.addEventListener('click', () => location.hash = '#/play/cpu');
//   btn1v1?.addEventListener('click', () => location.hash = '#/play/1v1');
//   btnT?.addEventListener('click',   () => location.hash = '#/play/tournament');
// }

export function initHome() {
  const btnVsCPU     = document.getElementById('vs-computer');
  const btn1v1       = document.getElementById('one-vs-one');
  const btnSearch = document.getElementById('search-quick') as HTMLButtonElement | null;;
  const btnT         = document.getElementById('tournament');

  btnVsCPU?.addEventListener('click', () => location.hash = '#/play/cpu');
  btn1v1?.addEventListener('click', () => location.hash = '#/play/1v1');
  btnT?.addEventListener('click',   () => location.hash = '#/play/tournament');

   btnSearch?.addEventListener('click', async () => {
     btnSearch.disabled    = true;
     btnSearch.textContent = 'Поиск игры…';

     try {
       // 1) старт поиска
       let res = await fetch('/api/quickgame/search', { method: 'POST' });
       if (!res.ok) throw new Error(`Ошибка ${res.status}`);

       // 2) ждем matchId
       let matchId: string | null = null;
       while (!matchId) {
         await new Promise(r => setTimeout(r, 1000));
         res = await fetch('/api/quickgame/status');
         if (!res.ok) throw new Error(`Статус не получен: ${res.status}`);
         const json = await res.json() as {
           status: 'pending' | 'found' | 'not_found';
           position?: number;
           matchId?: string;
         };

         if (json.status === 'not_found') {
           alert('Не удалось найти противника.');
           throw new Error('Match not found');
         }

         if (json.status === 'found' && json.matchId) {
            // переходим на маршрут, который запустит WS и сам вызовет startQuickGame
           location.hash = `#/play/quick/${json.matchId}`;
           return;
         }

         // pending
         btnSearch.textContent = `Поиск… (в очереди: ${json.position})`;
       }
     } catch (err) {
       console.error(err);
       // восстанавливаем кнопку
       btnSearch.disabled    = false;
       btnSearch.textContent = 'Найти быструю игру';
     }
   });
}
