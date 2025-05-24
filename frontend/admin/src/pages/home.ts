 export const homeView = `
 <section class="relative w-full h-[calc(100vh-3.6rem)] overflow-hidden">
   <img src="/img/home.png" alt="Главная картинка" class="absolute inset-0 w-full h-full object-cover" />
   <div class="relative z-10 flex flex-col items-center justify-center h-full bg-black/40 pt-16">
     <h1 class="-mt-32 text-white text-5xl font-bold mb-8">Welcome to PONG!</h1>
     <div id="game-buttons" class="flex space-x-6 hidden">
       <button id="vs-computer"   class="bg-blue-500   hover:bg-blue-600   text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         User VS AI
       </button>
       <button id="one-vs-one"     class="bg-green-500  hover:bg-green-600  text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         One VS one
       </button>
        <button id="search-quick"     class="bg-yellow-500 hover:bg-yellow-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
          Search quick
        </button>
       <button id="tournament"     class="bg-purple-500 hover:bg-purple-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         Tournament
       </button>
     </div>
   </div>
 </section>
 `;

export function initHome() {
  const isAuth = Boolean(localStorage.getItem('token'))
  const btns = document.getElementById('game-buttons')!
  btns.classList.toggle('hidden', !isAuth)
  const btnVsCPU     = document.getElementById('vs-computer');
  const btn1v1       = document.getElementById('one-vs-one');
  const btnSearch = document.getElementById('search-quick') as HTMLButtonElement | null;;
  const btnT         = document.getElementById('tournament');

  btnVsCPU?.addEventListener('click', () => location.hash = '#/play/cpu');
  btn1v1?.addEventListener('click', () => location.hash = '#/play/1v1');
  btnT?.addEventListener('click',   () => location.hash = '#/play/tournament');

   btnSearch?.addEventListener('click', async () => {
     btnSearch.disabled    = true;
     btnSearch.textContent = 'Search for a game';

     try {
       // 1) старт поиска
       let res = await fetch('/matchmaking/join', { method: 'POST' });
       if (!res.ok) throw new Error(`Error ${res.status}`);

       // 2) ждем matchId
       let matchId: string | null = null;
       while (!matchId) {
         await new Promise(r => setTimeout(r, 1000));
         res = await fetch('/matchmaking/checkPending');
         if (!res.ok) throw new Error(`Status not received: ${res.status}`);
         const json = await res.json() as {
           status: 'pending' | 'found' | 'not_found';
           position?: number;
           matchId?: string;
         };

         if (json.status === 'not_found') {
           alert('Unable to find enemy.');
           throw new Error('Match not found');
         }

         if (json.status === 'found' && json.matchId) {
            // переходим на маршрут, который запустит WS и сам вызовет startQuickGame
           location.hash = `#/play/quick/${json.matchId}`;
           return;
         }

         // pending
         btnSearch.textContent = `Search… (in queue: ${json.position})`;
       }
     } catch (err) {
       console.error(err);
       // восстанавливаем кнопку
       btnSearch.disabled    = false;
       btnSearch.textContent = 'Find a quick game';
     }
   });
}
