// import { home }     from './pages/home'
// import { login }    from './pages/login'
import { registerView,
         registerInit }     from './pages/register'

type Route = { view: string; init?: () => void }

const routes: Record<string, Route> = {
  '#/register': { view: registerView, init: registerInit },
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