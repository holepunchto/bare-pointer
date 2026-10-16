const AnimationFrameProvider = require('bare-animation-frame')
const Backend = require('#backend')

module.exports = class Pointer {
  constructor() {
    this._backend = new Backend()
    this._view = null
  }

  get pressed() {
    return this._view !== null
  }

  async down(view, x, y) {
    if (this._view !== null) throw new Error('Pointer is already down')

    this._backend.down(view, ...this._point(view, x, y))
    this._view = view

    await frame(view)
  }

  async move(view, x, y) {
    if (this._view === null) throw new Error('Pointer is not down')

    this._backend.move(view, ...this._point(view, x, y))

    await frame(view)
  }

  async up() {
    if (this._view === null) throw new Error('Pointer is not down')

    const view = this._view

    this._backend.up()
    this._view = null

    await frame(view)
  }

  async tap(view, x, y) {
    if (this._view !== null) throw new Error('Pointer is already down')

    const point = this._point(view, x, y)

    if (this._backend.tap) {
      this._backend.tap(view, ...point)
    } else {
      this._backend.down(view, ...point)

      // UIKit controls only see a press that lasts past a frame.
      await frame(view)

      this._backend.up()
    }

    await frame(view)
  }

  destroy() {
    if (this._view !== null) this._backend.up()

    this._view = null
    this._backend.destroy()
  }

  _point(view, x, y) {
    if (x !== undefined && y !== undefined) return [x, y]

    const [width, height] = this._backend.size(view)

    return [x === undefined ? width / 2 : x, y === undefined ? height / 2 : y]
  }
}

function frame(view) {
  return new AnimationFrameProvider(view).afterAnimationFrame()
}
