import { homeView }    from './pages/home'
import { registerView, registerInit }  from './pages/register'
import { profileView, profileInit }    from './pages/profile'
import { loginView, loginInit }    from './pages/login'

type Route = { view: string; init?: () => void }

const routes: Record<string, Route> = {
  '#/': { view: homeView },
  '#/register': { view: registerView, init: registerInit },
  '#/profile': { view: profileView, init: profileInit },
  '#/login': { view: loginView, init: loginInit },
}

function mountRoute() {
  const outlet = document.getElementById('outlet')!
  const route  = routes[location.hash] ?? { view: '<h1>404</h1>' }

  outlet.innerHTML = route.view
  route.init?.()
}

export function initRouter() {
  window.addEventListener('hashchange', mountRoute)
  mountRoute()
}