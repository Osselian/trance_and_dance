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

export interface User {
  id: number;
  username: string;
  avatarUrl: string;
}

export interface Friend {
  id: number;
  username: string;
  avatarUrl: string;
}

export interface IncomingRequest {
  requester: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
}

export const FriendsAPI = {
  getAllUsers:        (): Promise<User[]>   => get('/user'),
  getFriends:         (): Promise<Friend[]> => get('/user/friends'),
  getIncomingRequests:(/* пусто */): Promise<IncomingRequest[]> =>
                        get('/user/friend-requests'),
  sendFriendRequest:  (id: number): Promise<void> =>
                        post('/user/friend-request', { receiverId: id }),
  acceptFriendRequest:(id: number): Promise<void> =>
                        post('/user/friend-accept',   { requesterId: id }),
};