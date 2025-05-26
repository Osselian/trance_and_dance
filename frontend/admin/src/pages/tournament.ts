import { AuthAPI } from '../api/auth';
import { BASE }    from '../api/auth';

export const tournamentView = `
<section class="p-6">
  <div id="create-or-info" class="mb-6">
    <div id="create-block" class="space-y-2">
      <input id="tournament-name"
             type="text"
             class="w-full p-2 bg-gray-700 rounded text-white"
             placeholder="Название турнира (опционально)" />
      <select id="required-players" class="p-2 bg-gray-700 rounded text-white">
        <option value="4">4 игрока</option>
        <option value="8" selected>8 игроков</option>
        <option value="16">16 игроков</option>
      </select>
      <button id="create-tournament-btn"
              class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded">
        Создать турнир
      </button>
    </div>
    <div id="info-block" class="hidden">
      <h1 class="text-3xl font-bold mb-2">
        Tournament: <span id="tournament-name-display"></span>
      </h1>
      <p>ID турнира: <span id="tournament-id-display"></span></p>
    </div>
  </div>

  <table class="min-w-full bg-gray-800 text-white rounded-lg overflow-hidden">
    <thead class="bg-gray-700">
      <tr>
        <th class="px-4 py-2">№</th>
        <th class="px-4 py-2">Игрок 1</th>
        <th class="px-4 py-2">Игрок 2</th>
        <th class="px-4 py-2">Статус</th>
        <th class="px-4 py-2">Результат</th>
      </tr>
    </thead>
    <tbody id="matches-list" class="divide-y divide-gray-700"></tbody>
  </table>

  <div class="mt-4">
    <button id="join-tournament-btn"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded hidden">
      Присоединиться к турниру
    </button>
  </div>
</section>
`;

interface Match {
  num: number;
  p1: string;
  p2: string;
  status: string;
  result?: string;
}

export async function initTournament(): Promise<void> {
  // 1) Контекст
  const user    = await AuthAPI.getProfile();
  const userId  = user.id;
  const token   = localStorage.getItem('token')!;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const createBlock = document.getElementById('create-block')!;
  const infoBlock   = document.getElementById('info-block')!;
  const nameDisplay = document.getElementById('tournament-name-display')!;
  const idDisplay   = document.getElementById('tournament-id-display')!;
  const createBtn   = document.getElementById('create-tournament-btn') as HTMLButtonElement;
  const selectSize  = document.getElementById('required-players') as HTMLSelectElement;
  const joinBtn     = document.getElementById('join-tournament-btn') as HTMLButtonElement;
  const tbody       = document.getElementById('matches-list')!;

  // 2) Функция отрисовки турнира
  async function renderTournament(id: string) {
    // 2.1) Загружаем турнир
    const tourRes = await fetch(`${BASE}/tournament/${id}`, { headers });
    if (!tourRes.ok) {
      console.error('Tour fetch failed:', tourRes.status, await tourRes.text());
      return;
    }
    const tour = await tourRes.json();
    console.log('GOT TOUR object:', tour);

    // 2.2) Загружаем участников
    let participants: any[] = [];
    try {
      const partsRes = await fetch(
        `${BASE}/tournamentParticipant/${id}/participants`,
        { headers }
      );
      if (!partsRes.ok) throw new Error(`HTTP ${partsRes.status}`);
      participants = await partsRes.json();
      console.log('GOT PARTICIPANTS:', participants);
    } catch (err) {
      console.error('Error loading participants:', err);
    }

    // 2.3) Отрисовываем заголовок и ID
    nameDisplay.textContent = tour.name || '';
    idDisplay.textContent   = String(tour.id);

    // 2.4) Отрисовываем таблицу матчей
    tbody.innerHTML = '';
    for (const m of tour.matches || []) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-4 py-2">${m.num}</td>
        <td class="px-4 py-2">${m.p1 || '—'}</td>
        <td class="px-4 py-2">${m.p2 || '—'}</td>
        <td class="px-4 py-2">${m.status}</td>
        <td class="px-4 py-2">${m.result || ''}</td>
      `;
      tbody.appendChild(tr);
    }

    // 2.5) Показываем или скрываем кнопку «Присоединиться»
    const count = participants.length;
    const isIn  = participants.some(p => p.id === userId);
    if (count < tour.requiredPlayers && !isIn) {
      joinBtn.classList.remove('hidden');
    } else {
      joinBtn.classList.add('hidden');
    }
  }

  // 3) Читаем tourId из hash
  const [, qs] = window.location.hash.split('?');
  let tourId  = new URLSearchParams(qs).get('id');

  // 4) Начальное состояние UI
  if (!tourId) {
    const listRes = await fetch(`${BASE}/tournament`, { headers });
    if (listRes.ok) {
      const allTours: any[] = await listRes.json();
      // Выбираем первый в статусе REGISTRATION и где есть место
      const open = allTours.find(t =>
        t.status === 'REGISTRATION' &&
        t.participants.length < t.requiredPlayers
      );
      if (open) {
        tourId = String(open.id);
      }
    }
  }

  // 4) В зависимости от tourId либо создаём, либо показываем
  if (tourId) {
    // Если нашли существующий турнир или зашли по ?id=…
    createBlock.classList.add('hidden');
    infoBlock.classList.remove('hidden');
    await renderTournament(tourId);
  } else {
    // Ни одного турнира нет — показываем форму создания
    createBlock.classList.remove('hidden');
    infoBlock.classList.add('hidden');
  }

  // 5) Обработчик «Создать турнир»
  createBtn.addEventListener('click', async () => {
    const size      = parseInt(selectSize.value, 10);
    const rawName   = (document.getElementById('tournament-name') as HTMLInputElement).value.trim();
    const name      = rawName || user.username;
    const startDate = new Date().toISOString();
    const endDate   = new Date(Date.now() + 60*60*1000).toISOString();

    const res = await fetch(`${BASE}/tournament`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requiredPlayers: size, name, startDate, endDate })
    });
    if (!res.ok) {
      const err = await res.json();
      return alert('Ошибка: ' + err.message);
    }
    const tour = await res.json();
    console.log('Created tournament, id =', tour.id);

    // Сразу переключаем UI и перерисовываем
    createBlock.classList.add('hidden');
    infoBlock.classList.remove('hidden');
    window.location.hash = `#/tournament?id=${tour.id}`;
    await renderTournament(String(tour.id));
  });

  // 6) Обработчик «Присоединиться»
  joinBtn.addEventListener('click', async () => {
    if (!tourId) return;
    const res = await fetch(`${BASE}/tournament/${tourId}/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const err = await res.json();
      return alert('Не удалось присоединиться: ' + err.message);
    }
    await renderTournament(tourId);
  });
}
