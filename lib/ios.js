const UIKitTouch = require('bare-ui-kit-touch')

module.exports = class IOSPointer {
  constructor() {
    this._touch = null
  }

  size(view) {
    const { width, height } = view.bounds

    return [width, height]
  }

  down(view, x, y) {
    const point = view.convertPointToView(x, y, null)

    this._touch = UIKitTouch.begin(view.window, point.x, point.y)
  }

  move(view, x, y) {
    const point = view.convertPointToView(x, y, null)

    this._touch.move(point.x, point.y)
  }

  up() {
    this._touch.end()
    this._touch = null
  }

  destroy() {}
}
