import { homeView, initHome }        from './pages/home'
import { notFoundView }              from './pages/notFound'
import { registerView, registerInit }from './pages/register'
import { profileView, profileInit }  from './pages/profile'
import { loginView, loginInit }      from './pages/login'
import { startVsComputer, start1v1, startQuickGame } from '../../pong/src/game/gameLogic.js'
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
      init: () => { /* …quick game init… */ }
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