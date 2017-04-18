import Letter from 'components/Letter'
import drawing from './A.drawing.js'

export default class A extends Letter {
  constructor () {
    super({
      frequency: 'C4',
      drawing: drawing
    })
  }
}
