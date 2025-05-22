import { ChatAPI } from '../api/chat';
import type { Message } from '../api/chat';
import { FriendsAPI } from '../api/friends';

// Создаёт окно чата с поддержкой WebSocket
export async function ChatPage(): Promise<HTMLElement> {
  // Получаем текущего пользователя (id берём из первого диалога, пока нет отдельного API)
  const currentUser = await ChatAPI.getConversations()
    .then(convs => ({ id: convs[0]?.userId || 0 }));

  let selectedUserId: number | null = null;
  let isBlocked = false;

  // Инициализация WebSocket
  const socket = new WebSocket(`ws://localhost:3000/ws/chat`);
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join', userId: currentUser.id }));
  };
  socket.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.type === 'message' && data.from === selectedUserId) {
      appendMessage(data as Message);
    }
    if (data.type === 'tournament-notification' && data.userId === currentUser.id) {
      alert(`Следующий матч турнира: ${data.details}`);
    }
  };

  // Построение DOM
  const container = document.createElement('div');
  container.className = 'flex h-full';

  const aside = document.createElement('aside');
  aside.className = 'w-1/4 border-r overflow-y-auto';
  container.append(aside);
  const convList = document.createElement('ul');
  aside.append(convList);

  const main = document.createElement('main');
  main.className = 'flex-1 flex flex-col';
  container.append(main);

  // Хедер чата
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b';
  main.append(header);

  const userInfo = document.createElement('div');
  userInfo.className = 'flex items-center space-x-2';
  header.append(userInfo);

  const avatar = document.createElement('img');
  avatar.className = 'w-10 h-10 rounded-full';
  userInfo.append(avatar);

  const userName = document.createElement('span');
  userName.className = 'font-semibold';
  userInfo.append(userName);

  const actions = document.createElement('div');
  actions.className = 'space-x-2';
  header.append(actions);

  const blockBtn = document.createElement('button');
  actions.append(blockBtn);

  const pongBtn = document.createElement('button');
  pongBtn.textContent = 'Пригласить в Pong';
  actions.append(pongBtn);

  const tourBtn = document.createElement('button');
  tourBtn.textContent = 'Пригласить в Турнир';
  actions.append(tourBtn);

  const profileLink = document.createElement('button');
  profileLink.textContent = 'Профиль';
  actions.append(profileLink);

  // Окно сообщений
  const chatWindow = document.createElement('div');
  chatWindow.className = 'flex-1 p-4 overflow-y-auto';
  main.append(chatWindow);

  // Поле ввода
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'p-4 border-t flex space-x-2';
  main.append(inputWrapper);

  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.placeholder = 'Напишите сообщение...';
  messageInput.className = 'flex-1 p-2 border rounded';
  inputWrapper.append(messageInput);

  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Отправить';
  inputWrapper.append(sendBtn);

  // --- функции логики ---

  function appendMessage(m: Message) {
    const msgEl = document.createElement('div');
    msgEl.className = m.senderId === currentUser.id ? 'text-right' : 'text-left';
    msgEl.textContent = m.content;
    chatWindow.append(msgEl);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  async function loadConversations() {
    convList.innerHTML = '';
    const convs = await ChatAPI.getConversations();
    const friends = await FriendsAPI.getFriends();

    // Объединяем диалоги и друзей
    const map = new Map<number, any>();
    for (const c of convs) {
      map.set(c.userId, c);
    }
    for (const f of friends) {
      if (!map.has(f.id)) {
        map.set(f.id, { userId: f.id, user: f, lastMessage: '', lastAt: null, unreadCount: 0 });
      }
    }

    const all = Array.from(map.values()).sort((a, b) => {
      if (!a.lastAt && !b.lastAt) return 0;
      if (!a.lastAt) return 1;
      if (!b.lastAt) return -1;
      return b.lastAt.getTime() - a.lastAt.getTime();
    });

    for (const item of all) {
      const li = document.createElement('li');
      li.className = 'p-2 hover:bg-gray-100 cursor-pointer flex justify-between';
      li.textContent = item.user.username;
      const badge = document.createElement('span');
      badge.className = 'text-sm text-red-500';
      if (item.unreadCount > 0) badge.textContent = String(item.unreadCount);
      li.append(badge);
      li.onclick = () => selectConversation(item.userId);
      convList.append(li);
    }
  }

  async function selectConversation(userId: number) {
    selectedUserId = userId;
    const convs = await ChatAPI.getConversations();
    const user = convs.find(c => c.userId === userId)?.user;
    if (user) {
      avatar.src = user.avatarUrl;
      userName.textContent = user.username;
    }
    await checkBlockStatus();
    chatWindow.innerHTML = '';
    const msgs = await ChatAPI.getConversation(userId);
    msgs.forEach(appendMessage);
  }

  async function doSend() {
    if (!selectedUserId) return;
    const content = messageInput.value.trim();
    if (!content) return;
    const msg = await ChatAPI.sendMessage(selectedUserId, content);
    appendMessage(msg);
    messageInput.value = '';
    await loadConversations();
  }

  async function toggleBlock() {
    if (!selectedUserId) return;
    if (isBlocked) await ChatAPI.unblockUser(selectedUserId);
    else await ChatAPI.blockUser(selectedUserId);
    isBlocked = !isBlocked;
    blockBtn.textContent = isBlocked ? 'Разблокировать' : 'Заблокировать';
    chatWindow.innerHTML = '';
  }

  async function checkBlockStatus() {
    const list = await ChatAPI.listBlocked();
    isBlocked = list.includes(selectedUserId!);
    blockBtn.textContent = isBlocked ? 'Разблокировать' : 'Заблокировать';
  }

  function invitePong() {
    if (!selectedUserId) return;
    socket.send(JSON.stringify({ type: 'pong-invite', to: selectedUserId }));
  }

  function inviteTournament() {
    if (!selectedUserId) return;
    socket.send(JSON.stringify({ type: 'tournament-invite', to: selectedUserId }));
  }

  // --- привязка событий ---
  sendBtn.onclick = doSend;
  messageInput.addEventListener('keyup', e => e.key === 'Enter' && doSend());
  blockBtn.onclick = toggleBlock;
  pongBtn.onclick = invitePong;
  tourBtn.onclick = inviteTournament;
  profileLink.onclick = () => selectedUserId && (window.location.hash = `#/profile/${selectedUserId}`);

  // Инициализация
  await loadConversations();

  return container;
}

