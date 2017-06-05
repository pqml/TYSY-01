import { checkIntersection } from 'line-intersect'

const lineWidth = 0
const MAX_CALLS = 20

function jupikGlyph () {
  let source = {
    attack: { size: { height: 0, width: 0 }, paths: [] },
    sustain: { size: { height: 0, width: 0 }, paths: [] },
    release: { size: { height: 0, width: 0 }, paths: [] }
  }
  let unscaleGlyph = deepCopy(source)
  let glyph, scale, attackSize, releaseSize

  setScale(1)
  setAttackSize(160)
  setReleaseSize(500)

  const api = {
    importGlyph,
    setScale,
    setAttackSize,
    setReleaseSize,
    getSource,
    getData,
    getUnscaleData,
    getScale,
    rebuild,
    getSlice
  }

  return api

  function getSource () { return source }
  function getData () { return glyph }
  function getUnscaleData () { return unscaleGlyph }
  function getScale () { return scale }

  function importGlyph (data) {
    source = data
    rebuild()
    return api
  }

  function setScale (newScale) {
    scale = newScale
    scaleGlyph()
    return api
  }

  function scaleGlyph (_scale) {
    if (!_scale) _scale = scale
    glyph = deepCopy(unscaleGlyph)
    for (let k in glyph) {
      const step = glyph[k]
      step.size.width *= _scale
      step.size.height *= _scale
      step.paths.forEach(path => path.forEach(point => {
        point[0] *= _scale
        point[1] *= _scale
      }))
    }
    return api
  }

  function rebuild () {
    unscaleGlyph = deepCopy(source)
    resizeAttack()
    resizeRelease()
    scaleGlyph()
    return api
  }

  function resizeAttack () {
    stretchPaths(unscaleGlyph.attack.paths, source.attack.size.width, attackSize)
    unscaleGlyph.attack.size.width = getWidth(unscaleGlyph.attack.paths)
    scaleGlyph()
    return api
  }

  function resizeRelease () {
    stretchPaths(unscaleGlyph.release.paths, source.release.size.width, releaseSize)
    unscaleGlyph.release.size.width = getWidth(unscaleGlyph.release.paths)
    scaleGlyph()
    return api
  }

  function stretchPaths (paths, realSize, stretchedSize) {
    const offset = stretchedSize - realSize
    const mult = stretchedSize / realSize
    paths.forEach(path => path.forEach(point => {
      if (offset > -lineWidth) {
        if (point[2] === 0) return
        point[0] += offset
      } else {
        // if (point[0] > stretchedSize) point[0] = stretchedSize
        point[0] *= mult
      }
    }))
  }

  function setAttackSize (size) {
    attackSize = size
    rebuild()
    return api
  }

  function setReleaseSize (size) {
    releaseSize = size
    rebuild()
    return api
  }

  function getSlice (step, x, direction, calls = 0) {
    // console.log(step, x)
    const segment = glyph[step]
    x = Math.min(Math.max(x | 0, 0), segment.size.width)
    const pA1 = [x, 0]
    const pA2 = [x, segment.size.height]
    const coords = []

    // get intersections
    segment.paths.forEach(path => {
      for (let i = 0; i < path.length; i++) {
        const pB1 = path[i]
        const pB2 = (i + 1 < path.length) ? path[i + 1] : path[0]
        const result = checkIntersection(
          pA1[0], pA1[1], pA2[0], pA2[1],
          pB1[0], pB1[1], pB2[0], pB2[1]
        )
        if (result.type === 'none' || result.type === 'parallel') continue
        if (result.type === 'colinear') {
          addY(pB1[1], coords)
          addY(pB2[1], coords)
        } else if (result.type === 'intersecting') {
          addY(result.point.y, coords)
        }
      }
    })

    if (coords.length & 1) {
      if (calls > MAX_CALLS) return false
      calls++
      if (!direction) direction = x + 0.01 >= glyph[step].size.width ? -1 : 1
      const xOffset = x + 0.01 * direction
      if (xOffset < 0) return false
      return getSlice(step, xOffset, direction, calls)
    } else {
      return coords
    }
  }
}

function addY (newY, coords) {
  for (let i = 0; i < coords.length; i++) {
    const y = coords[i]
    // console.log('compare', newPoint[1], point[1])
    if (+newY.toFixed(5) === +y.toFixed(5)) return
    if (newY < y) {
      coords.splice(i, 0, newY)
      return
    }
  }
  coords.push(newY)
}

function getWidth (paths) {
  let width = 0
  paths.forEach(path => path.forEach(point => {
    if (point[0] > width) width = point[0]
  }))
  return width
}

function deepCopy (obj) {
  return JSON.parse(JSON.stringify(obj))
}

export default jupikGlyph
