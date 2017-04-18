import map from 'utils/map'

function compress (paths, scale) {
  return paths.map(path => {
    return path.map(v => {
      return { x: v.x * scale, y: v.y }
    })
  })
}

function scale (drawing, scale) {
  const out = {}
  for (let k in drawing) {
    if (!out[k]) out[k] = []
    drawing[k].forEach(path => {
      out[k].push(path.map(v => {
        return {
          x: v.x * scale,
          y: v.y.map(v => v !== null ? v * scale : v)
        }
      }))
    })
  }
  return out
}

function getDistance (paths) {
  let max = 0
  paths.forEach(path => {
    const lastPoint = path[path.length - 1]
    if (lastPoint.x > max) max = lastPoint.x
  })
  return max
}

function getFirstPoints (paths) {
  let points = []
  paths.forEach(path => points.push(path[0].y))
  return points
}

function interpolate (paths, currentX) {
  let points = []
  paths.forEach(path => {
    const prevPoint = getPrev(path, currentX)
    const nextPoint = getNext(path, currentX) || prevPoint
    const y = []
    if (prevPoint) {
      for (let i = 0; i < prevPoint.y.length; i++) {
        if (prevPoint.x === nextPoint.x) y.push(nextPoint.y[i])
        else if (prevPoint.y[i] === null || nextPoint.y[i] === null) y.push(prevPoint.y[i])
        else y.push(map(currentX, prevPoint.x, nextPoint.x, prevPoint.y[i], nextPoint.y[i]))
      }
    } else {
      // console.log('no prevpoint')
    }
    points.push(y)
  })
  return points
}

function getPrev (path, x) {
  if (path.length === 1) return path[0]
  let prev = false
  for (let i = 0; i < path.length; i++) {
    const points = path[i]
    if (points.x <= x) prev = points
    // if (points.x >= x && prev) {
    //   return prev
    // }
  }
  return prev
}

function getNext (path, x) {
  for (let i = 0; i < path.length; i++) {
    const points = path[i]
    if (points.x >= x) return points
  }
  return false
}

export { compress, scale, getDistance, getFirstPoints, interpolate }
