import { homeView, initHome }        from './pages/home'
import { notFoundView }              from './pages/notFound'
import { registerView, registerInit }from './pages/register'
import { profileView, profileInit }  from './pages/profile'
import { loginView, loginInit }      from './pages/login'
import { startVsComputer, start1v1}  from '../../pong/src/game/gameLogic.js'
import { startQuickGame }            from '../../pong/src/game_online/gameLogic.js'
import { friendsView, initFriends }  from './pages/friends'
import { ChatPage }                  from './pages/chat'
import { tournamentView, initTournament } from './pages/tournament';

export const router = {
  navigate(to: string) {
    window.location.hash = to.startsWith('#') ? to : `#${to}`
  }
}

type Route = {
  view?: string
  init?: () => void | Promise<void>
}

const routes: Record<string, Route> = {
  '':      { view: homeView, init: initHome },
  '#/':        { view: homeView,   init: initHome },
  '#/register':{ view: registerView, init: registerInit },
  '#/profile': { view: profileView,  init: profileInit },
  '#/login':   { view: loginView,    init: loginInit },
  '#/play/cpu':{ view: '',           init: startVsComputer },
  '#/play/1v1':{ view: '',           init: start1v1 },
  '#/tournament': { view: tournamentView, init: initTournament },
  '#/friends': { view: friendsView, init: initFriends },
  '#/chat':    { 
    init: async () => {
      const outlet = document.getElementById('outlet')!
      outlet.innerHTML = ''
      const chatEl = await ChatPage()
      outlet.appendChild(chatEl)
    }
  },
}

async function mountRoute() {
  const outlet = document.getElementById('outlet')!
  let route: Route

  if (location.hash.startsWith('#/profile/')) {
    const id = Number(location.hash.split('/')[2])
    route = {
      view: profileView,
      init: () => profileInit(id)
    }
  }
  else if (location.hash.startsWith('#/play/quick/')) {
    const matchId = location.hash.split('/')[3]
    route = {
      view: '',
      init: () => {
        // 2) рендерим экран игры (из startQuickGame будет вызван renderGameScreen)
        // сразу открываем WS-соединение на ваш бекенд
        const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
        const ws = new WebSocket(
          `${wsProtocol}://${location.host}/matchmaking/ws`
        )

        // 3) после установки соединения сообщаем серверу, в какую комнату
        ws.addEventListener('open', () => {
          ws.send(JSON.stringify({
            action: 'joinRoom',
            matchId
          }))
        })

        // 4) ждём сообщения от сервера и при type==='connection' и status === 'connected' запускаем игру
        ws.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data)
          if (msg.type === 'connection' && msg.data.status === 'connected') {
            // Теперь внутри renderGameScreen + Game-класса
            // появится канвас, передадим socket и настройки в логику
            startQuickGame(ws, msg)
          }
        })

        // на ошибку/закрытие WS можно повесить логику clean-up
        ws.addEventListener('error', () => {
          alert('WebSocket error for quick game')
        })
        ws.addEventListener('close', () => {
          console.warn('Quick game socket closed prematurely')
        })
      }
    }
  }
  else {
    route = routes[location.hash] ?? { view: notFoundView }
  }


  if (route.view) outlet.innerHTML = route.view
  else outlet.innerHTML = ''


  if (route.init) await route.init()
}

export function initRouter() {
  window.addEventListener('hashchange', mountRoute)
  mountRoute()
}