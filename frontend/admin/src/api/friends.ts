import { BASE } from './auth'
// import type { User } from './types'   // Опишем типы в общем месте, если нужно

export interface User {
  id: number
  username: string
  avatarUrl: string
  email?: string
}

interface Friend {
  id: number
  username: string
  avatarUrl: string
  isOnline: boolean
}

interface IncomingRequest {
  requester: User
  // … другие поля, если нужны
}

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const resp = await fetch(BASE + '/auth' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok) throw new Error((await resp.json()).message)
  return resp.json()
}

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(url: string): Promise<T> {
  const r = await fetch(BASE + url, {
    headers: { ...authHeaders() },
    credentials: 'include',
  })
  if (!r.ok) throw new Error((await r.json()).message)
  return r.json()
}

async function put<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(BASE + url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error((await r.json()).message)
  return r.json()
}

// // Подобные функции post/get/put можно перекопировать из auth.ts
// async function get<T>(path: string): Promise<T> {
//   const resp = await fetch(BASE + path, {
//     credentials: 'include',
//     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//   })
//   if (!resp.ok) throw new Error((await resp.json()).message)
//   return resp.json()
// }

// async function post<T>(path: string, body?: unknown): Promise<T> {
//   const resp = await fetch(BASE + path, {
//     method: 'POST',
//     credentials: 'include',
//     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
//     body: body != null ? JSON.stringify(body) : undefined
//   })
//   if (!resp.ok) throw new Error((await resp.json()).message)
//   return resp.json()
// }

// async function put<T>(path: string, body: unknown): Promise<T> {
//   const resp = await fetch(BASE + path, {
//     method: 'PUT',
//     credentials: 'include',
//     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
//     body: JSON.stringify(body)
//   })
//   if (!resp.ok) throw new Error((await resp.json()).message)
//   return resp.json()
// }

export const FriendsAPI = {
  // получить всех пользователей
  getAllUsers: (): Promise<User[]> =>
    get('/users'),

  // получить текущих друзей (бэкенд понимает, по токену)
  getFriends: (): Promise<Friend[]> =>
    get('/friends'),

  // получить входящие запросы
  getIncomingRequests: (): Promise<IncomingRequest[]> =>
    get('/friends/requests'),

  // отправить запрос (тут бэкенд тоже смотрит по токену, так что достаточно receiverId)
  sendFriendRequest: (receiverId: number): Promise<void> =>
    post('/friends', { receiverId }),

  // принять запрос
  acceptFriendRequest: (requesterId: number): Promise<void> =>
    put(`/friends/requests/${requesterId}`, {})
}