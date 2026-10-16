const { Display } = require('bare-x11')
const xtest = require('bare-x11-xtest')

module.exports = class LinuxPointer {
  constructor() {
    this._display = Display.open()
  }

  size(view) {
    return [view.width, view.height]
  }

  down(view, x, y) {
    this._move(view, x, y)

    xtest.fakeButtonEvent(this._display, 1, true)

    this._display.sync()
  }

  move(view, x, y) {
    this._move(view, x, y)

    this._display.sync()
  }

  up() {
    xtest.fakeButtonEvent(this._display, 1, false)

    this._display.sync()
  }

  destroy() {
    this._display.close()
  }

  _move(view, x, y) {
    const point = this._point(view, x, y)

    xtest.fakeMotionEvent(this._display, xtest.CURRENT_SCREEN, point.x, point.y)
  }

  // A point in the widget becomes one in its native, then in the surface of
  // that, which is drawn in device pixels on an X11 window that the server can
  // place on the root.
  _point(view, x, y) {
    const native = view.native
    const surface = native.surface
    const xid = surface === null ? null : surface.xid

    if (xid === null) throw new Error('Simulated input needs GDK to run on X11')

    const [left, top] = view.computePoint(native, x, y)
    const [dx, dy] = native.surfaceTransform
    const scale = surface.scaleFactor

    return this._display.translateCoordinates(
      xid,
      this._display.defaultRootWindow,
      Math.round((left + dx) * scale),
      Math.round((top + dy) * scale)
    )
  }
}
