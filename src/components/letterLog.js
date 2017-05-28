import Events from 'core/Events'

function letterLog (dom) {
  const $ = dom
  const $p = document.createElement('p')
  $.appendChild($p)
  const api = { $ }

  Events.on('keyboard.on', e => {
    $p.textContent += e
  })

  return api
}

export default letterLog
