import { AuthAPI } from '../api/auth';

export const tournamentView = `
<section class="p-6">
  <h1 class="text-3xl font-bold mb-4">Tournament: <span id="tournament-name-display"></span></h1>
  <div class="mb-4">
    <label for="tournament-name" class="block text-white mb-2">Name:</label>
    <div class="flex space-x-2">
      <input id="tournament-name" type="text" 
             class="flex-1 p-2 bg-gray-700 rounded text-white" 
             placeholder="Введите название или оставьте пустым" />
      <button id="tournament-name-btn" 
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
        Применить
      </button>
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
    <tbody id="matches-list" class="divide-y divide-gray-700">
      <!-- Rows динамически добавляются здесь -->
    </tbody>
  </table>
</section>
`;

interface Match {
  num: number;
  p1: string;
  p2: string;
  status: string;
  result?: string;
}

export function initTournament(): void {
  // Получаем элементы управления
  const profilePromise = AuthAPI.getProfile();
  const nameInput = document.getElementById('tournament-name') as HTMLInputElement;
  const nameBtn   = document.getElementById('tournament-name-btn') as HTMLButtonElement;
  const nameDisplay = document.getElementById('tournament-name-display') as HTMLElement;

  // Устанавливаем имя турнира из профиля пользователя по умолчанию
  profilePromise.then(user => {
    nameDisplay.textContent = user.username;
  });

  // Обработчик для установки собственного названия турнира
  nameBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    nameDisplay.textContent = val || localStorage.getItem('username') || 'Участник';
  });

  // Заглушечные данные матчей
  const matches: Match[] = [
    { num: 1, p1: 'Alice', p2: 'Bob',    status: 'Ожидает',     result: '—' },
    { num: 2, p1: 'Carol', p2: 'Dave',   status: 'Завершён',    result: '11 – 7' },
    { num: 3, p1: 'Eve',   p2: 'Frank',  status: 'В процессе',  result: '' },
    { num: 4, p1: 'Grace', p2: 'Heidi',  status: 'Ожидает',     result: '—' }
  ];

  const tbody = document.getElementById('matches-list')!;
  // Очищаем и добавляем строки
  tbody.innerHTML = '';
  matches.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-2">${m.num}</td>
      <td class="px-4 py-2">${m.p1}</td>
      <td class="px-4 py-2">${m.p2}</td>
      <td class="px-4 py-2">${m.status}</td>
      <td class="px-4 py-2">${m.result || ''}</td>
    `;
    tbody.appendChild(tr);
  });
}
