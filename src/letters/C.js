import Letter from 'components/Letter'
import drawing from './C.drawing.js'

export default class C extends Letter {
  constructor () {
    super({
      frequency: 'E4',
      drawing: drawing
    })
  }
}
