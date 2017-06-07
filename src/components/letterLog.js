import Events from 'core/Events'

function letterLog (dom) {
  const $ = dom
  const $p = document.createElement('p')
  let freespace = true

  $.appendChild($p)
  const api = { $ }

  Events.on('keyboard.on', e => {
    $p.textContent += e
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && freespace) {
      $p.textContent += ' '
      freespace = false
    }
  })

  document.addEventListener('keyup', (e) => {
    freespace = true
  })

  return api
}

export default letterLog
