import { homeView, initHome }    from './pages/home'
import { notFoundView }    from './pages/notFound'
import { registerView, registerInit }  from './pages/register'
import { profileView, profileInit }    from './pages/profile'
import { loginView, loginInit }    from './pages/login'
import { startVsComputer, start1v1 } from '../../pong/src/game/gameLogic.js'
import { friendsView, initFriends  }    from './pages/friends'

type Route = { view: string; init?: () => void }

const routes: Record<string, Route> = {
  '#/': { view: homeView, init: initHome},
  '#/register': { view: registerView, init: registerInit },
  '#/profile': { view: profileView, init: profileInit },
  '#/login': { view: loginView, init: loginInit },
  '#/play/cpu':         { view: '', init: startVsComputer },
  '#/play/1v1':        { view: '', init: start1v1 },
  // '#/play/tournament': { view: '', init: startTournament },
  '#/friends': { view: friendsView, init: initFriends },
}

function mountRoute() {
  const outlet = document.getElementById('outlet')!
  const route  = routes[location.hash] ?? { view: notFoundView }

  outlet.innerHTML = route.view
  route.init?.()
}

export function initRouter() {
  window.addEventListener('hashchange', mountRoute)
  mountRoute()
}