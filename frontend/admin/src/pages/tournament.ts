import { AuthAPI } from '../api/auth';
import { BASE } from '../api/auth'; 

export const tournamentView = `
<section class="p-6">
  <!-- === Блок создания / информации о турнире === -->
  <div id="create-or-info" class="mb-6">
    <!-- если параметра ?id нет — показываем форму создания -->
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
    <!-- после создания показываем имя и id -->
    <div id="info-block" class="hidden">
      <h1 class="text-3xl font-bold mb-2">
        Tournament: <span id="tournament-name-display"></span>
      </h1>
      <p>ID турнира: <span id="tournament-id-display"></span></p>
    </div>
  </div>

  <!-- Список матчей -->
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
    <tbody id="matches-list" class="divide-y divide-gray-700">
      <!-- Rows dynamically added here -->
    </tbody>
  </table>

  <!-- Кнопка присоединиться -->
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
  // 1. Получаем профиль сразу, чтобы знать userId
  const user = await AuthAPI.getProfile();
  const userId = user.id;

  const token = localStorage.getItem('token')!;
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

  const params = new URLSearchParams(window.location.search);
  const tourId  = params.get('id');

  // Функция рендера турнира
  async function renderTournament(id: string) {
    const res = await fetch(`${BASE}/tournament/${id}`, { headers });
    const tour = await res.json();

    nameDisplay.textContent = tour.name || tour.id;
    idDisplay.textContent   = tour.id.toString();

    tbody.innerHTML = '';
    tour.matches.forEach((m: any) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-4 py-2">${m.num}</td>
        <td class="px-4 py-2">${m.p1 || '—'}</td>
        <td class="px-4 py-2">${m.p2 || '—'}</td>
        <td class="px-4 py-2">${m.status}</td>
        <td class="px-4 py-2">${m.result || ''}</td>
      `;
      tbody.appendChild(tr);
    });

    // здесь используем userId
    const participantsCount = tour.participants.length;
    const isAlreadyIn = tour.participants.some((u: any) => u.id === userId);

    if (participantsCount < tour.requiredPlayers && !isAlreadyIn) {
      joinBtn.classList.remove('hidden');
    } else {
      joinBtn.classList.add('hidden');
    }
  }

  if (tourId) {
    createBlock.classList.add('hidden');
    infoBlock.classList.remove('hidden');
    await renderTournament(tourId);
  } else {
    createBlock.classList.remove('hidden');
    infoBlock.classList.add('hidden');
  }

  createBtn.addEventListener('click', async () => {
    const size = parseInt(selectSize.value, 10);
    const rawName = (document.getElementById('tournament-name') as HTMLInputElement)
                    .value
                    .trim();
    const name = rawName || user.username;
    const startDate = new Date().toISOString();
    const endDate   = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const payload = { requiredPlayers: size, name, startDate, endDate };
    const res = await fetch(`${BASE}/tournament`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      return alert('Ошибка: ' + err.message);
    }
    const tour = await res.json();
    window.location.search = '?id=' + tour.id;
  });

  joinBtn.addEventListener('click', async () => {
    const res = await fetch(`${BASE}/tournament/${tourId}/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const err = await res.json();
      return alert('Не удалось присоединиться: ' + err.message);
    }
    await renderTournament(tourId!);
  });
}
