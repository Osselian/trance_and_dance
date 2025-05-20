import { FriendsAPI } from '../api/friends';
import { AuthAPI } from '../api/auth';
import type { User, Friend, IncomingRequest } from '../api/friends';

export const friendsView = `
<section class="p-6 space-y-8">
  <h1 class="text-3xl font-bold">Мои друзья</h1>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div>
      <h2 class="text-xl font-semibold mb-2">Все пользователи</h2>
      <ul id="all-users-list" class="space-y-2"></ul>
    </div>
    <div>
      <h2 class="text-xl font-semibold mb-2">Мои друзья</h2>
      <ul id="my-friends-list" class="space-y-2"></ul>
    </div>
    <div>
      <h2 class="text-xl font-semibold mb-2">Входящие запросы</h2>
      <ul id="incoming-requests-list" class="space-y-2"></ul>
    </div>
  </div>
</section>
`;

export async function initFriends(): Promise<void> {
  const allUsersUL     = document.getElementById('all-users-list')! as HTMLUListElement;
  const myFriendsUL    = document.getElementById('my-friends-list')! as HTMLUListElement;
  const incomingUL     = document.getElementById('incoming-requests-list')! as HTMLUListElement;

  // Загрузка
  allUsersUL.innerHTML  = '<li>Загрузка…</li>';
  myFriendsUL.innerHTML = '<li>Загрузка…</li>';
  incomingUL.innerHTML  = '<li>Загрузка…</li>';

  try {
    // 1) Получаем свой профиль и данные
    const me = await AuthAPI.getProfile();
    const [users, friends, incoming] = await Promise.all([
      FriendsAPI.getAllUsers(),
      FriendsAPI.getFriends(),
      FriendsAPI.getIncomingRequests(),
    ]);

    const selfId = me.id;
    const friendIds = new Set(friends.map(f => f.id));
    const incomingIds = new Set(incoming.map(r => r.requester.id));

    // 2) «Мои друзья»
    myFriendsUL.innerHTML = '';
    if (friends.length === 0) {
      myFriendsUL.innerHTML = '<li>У вас пока нет друзей</li>';
    } else {
      friends.forEach((f: Friend) => {
        const li = document.createElement('li');
        li.textContent = f.username;
        li.className = 'p-2 bg-gray-800 rounded text-white';
        myFriendsUL.appendChild(li);
      });
    }

    // 3) «Входящие запросы»
    incomingUL.innerHTML = '';
    if (incoming.length === 0) {
      incomingUL.innerHTML = '<li>Нет новых запросов</li>';
    } else {
      incoming.forEach((req: IncomingRequest) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between p-2 bg-gray-800 rounded';
        li.innerHTML = `<span class="text-white">${req.requester.username}</span>`;
        const btn = document.createElement('button');
        btn.textContent = 'Принять';
        btn.className = 'px-2 py-1 bg-green-500 text-white rounded';
        btn.onclick = async () => {
          btn.disabled = true;
          try {
            await FriendsAPI.acceptFriendRequest(req.requester.id);
            await initFriends();
          } catch (e) {
            console.error(e);
            btn.textContent = 'Ошибка';
          }
        };
        li.appendChild(btn);
        incomingUL.appendChild(li);
      });
    }

    // 4) «Все пользователи»
    allUsersUL.innerHTML = '';
    if (users.length === 0) {
      allUsersUL.innerHTML = '<li>Никого не найдено</li>';
    } else {
      users.forEach((u: User) => {
        // не показываем себя или уже в друзьях или отправивших вам заявку
        if (u.id === selfId) return;
        if (friendIds.has(u.id)) return;
        if (incomingIds.has(u.id)) return;

        const li = document.createElement('li');
        li.className = 'flex justify-between p-2 bg-gray-800 rounded';

        const name = document.createElement('span');
        name.textContent = u.username;
        name.className = 'text-white';

        const btn = document.createElement('button');
        btn.textContent = 'Добавить';
        btn.className = 'px-2 py-1 bg-blue-500 text-white rounded';
        btn.onclick = async () => {
          btn.disabled = true;
          btn.textContent = 'Запрос отправлен';
          try {
            await FriendsAPI.sendFriendRequest(u.id);
          } catch (e: any) {
            console.warn(e.message);
          }
        };

        li.append(name, btn);
        allUsersUL.appendChild(li);
      });
    }

  } catch (e) {
    console.error('Ошибка инициализации:', e);
    allUsersUL.innerHTML  = '<li class="text-red-500">Ошибка</li>';
    myFriendsUL.innerHTML = '<li class="text-red-500">Ошибка</li>';
    incomingUL.innerHTML  = '<li class="text-red-500">Ошибка</li>';
  }
}