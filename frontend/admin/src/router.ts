import { homeView, initHome }        from './pages/home'
import { notFoundView }              from './pages/notFound'
import { registerView, registerInit }from './pages/register'
import { profileView, profileInit }  from './pages/profile'
import { loginView, loginInit }      from './pages/login'
import { startVsComputer, start1v1, startQuickGame } from '../../pong/src/game/gameLogic.js'
import { friendsView, initFriends }  from './pages/friends'
import { ChatPage }                  from './pages/chat'

type Route = {
  view?: string
  init?: () => void | Promise<void>
}

const routes: Record<string, Route> = {
  '#/':        { view: homeView,   init: initHome },
  '#/register':{ view: registerView, init: registerInit },
  '#/profile': { view: profileView,  init: profileInit },
  '#/login':   { view: loginView,    init: loginInit },
  '#/play/cpu':{ view: '',           init: startVsComputer },
  '#/play/1v1':{ view: '',           init: start1v1 },
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

  if (location.hash.startsWith('#/play/quick/')) {
    // динамический маршрут для Быстрой игры
    const matchId = location.hash.split('/')[3]
    route = {
      view: '', 
      init: () => {
        const ws = new WebSocket(`ws://${location.host}/ws/quickgame`)
        ws.addEventListener('open', () => {
          ws.send(JSON.stringify({ action: 'joinRoom', matchId }))
        })
        ws.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data)
          if (msg.type === 'start') {
            // startQuickGame(ws, msg.settings)
                startQuickGame()
          }
        })
      }
    }
  } else {
    // статические маршруты
    route = routes[location.hash] ?? { view: notFoundView }
  }

  // рендерим view
  if (route.view) outlet.innerHTML = route.view
  else outlet.innerHTML = ''

  // вызываем init
  if (route.init) await route.init()
}

export function initRouter() {
  window.addEventListener('hashchange', mountRoute)
  mountRoute()
}