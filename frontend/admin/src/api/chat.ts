import { BASE } from './auth'

async function get<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('token');
  const resp = await fetch(BASE + endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!resp.ok) throw new Error((await resp.json()).message);
  return resp.json();
}

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('token');
  const resp = await fetch(BASE + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) throw new Error((await resp.json()).message);
  return resp.json();
}

async function del<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('token');
  const resp = await fetch(BASE + endpoint, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!resp.ok) throw new Error((await resp.json()).message);
  return resp.json();
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export const ChatAPI = {
  // получить список диалогов (userId, user: {…})
  getConversations:        (): Promise<{ userId: number; user: any }[]> =>
                             get('/chat'),

  // получить историю переписки с userId
  getConversation:         (id: number): Promise<Message[]> =>
                             get(`/chat/${id}/conversation`),

  // получить непрочитанные сообщения от userId
  getUnread:               (id: number): Promise<Message[]> =>
                             get(`/chat/${id}/unread`),

  // отправить текст
  sendMessage:             (id: number, content: string): Promise<Message> =>
                             post(`/chat/${id}/message`, { content }),

  // блокировать/разблокировать
  listBlocked:             (): Promise<number[]> =>
                             get('/block'),
  blockUser:               (id: number): Promise<void> =>
                             post(`/block/${id}`),
  unblockUser:             (id: number): Promise<void> =>
                             del(`/block/${id}`),
}