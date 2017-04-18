import Letter from 'components/Letter'
import drawing from './B.drawing.js'

export default class B extends Letter {
  constructor () {
    super({
      frequency: 'D4',
      drawing: drawing
    })
  }
}
