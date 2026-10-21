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

    const point = this._point(view, x, y)

    await this._reach(view, point)

    this._backend.down(view, ...point)
    this._view = view

    await this._frame(view)
  }

  async move(view, x, y) {
    if (this._view === null) throw new Error('Pointer is not down')

    this._backend.move(view, ...this._point(view, x, y))

    await this._frame(view)
  }

  async up() {
    if (this._view === null) throw new Error('Pointer is not down')

    const view = this._view

    this._backend.up()
    this._view = null

    await this._frame(view)
  }

  async tap(view, x, y) {
    if (this._view !== null) throw new Error('Pointer is already down')

    const point = this._point(view, x, y)

    await this._reach(view, point)

    if (this._backend.tap) {
      this._backend.tap(view, ...point)

      // A tap can be posted to an event queue rather than delivered at once.
      if (this._backend.pending !== undefined) {
        for (let frames = 0; this._backend.pending(view); frames++) {
          if (frames === 60) throw new Error('The tap was not delivered')

          await this._frame(view)
        }
      }
    } else {
      this._backend.down(view, ...point)

      // UIKit controls only see a press that lasts past a frame.
      await this._frame(view)

      this._backend.up()
    }

    await this._frame(view)
  }

  destroy() {
    if (this._view !== null) this._backend.up()

    this._view = null
    this._backend.destroy()
  }

  async _reach(view, point) {
    if (this._backend.covered !== undefined) {
      for (let frames = 0; this._backend.covered(view, ...point); frames++) {
        if (frames === 60) throw new Error('The view is covered at the point')

        await this._frame(view)
      }
    }

    if (this._backend.hover !== undefined) {
      this._backend.hover(view, ...point)

      await this._frame(view)
    }
  }

  _frame(view) {
    const provider = new AnimationFrameProvider(view)

    if (this._backend.watch === undefined) return provider.afterAnimationFrame()

    return new Promise((resolve) => {
      let ended = false
      let unwatch = null

      const request = provider.afterAnimationFrame(done)

      unwatch = this._backend.watch(view, done)

      if (ended) unwatch()

      function done() {
        if (ended) return

        ended = true

        request.cancel()

        if (unwatch !== null) unwatch()

        resolve()
      }
    })
  }

  _point(view, x, y) {
    if (x !== undefined && y !== undefined) return [x, y]

    const [width, height] = this._backend.size(view)

    return [x === undefined ? width / 2 : x, y === undefined ? height / 2 : y]
  }
}
