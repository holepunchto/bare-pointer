const { Display } = require('bare-x11')
const xtest = require('bare-x11-xtest')

module.exports = class LinuxPointer {
  constructor() {
    this._display = Display.open()
  }

  size(view) {
    return [view.width, view.height]
  }

  covered(view, x, y) {
    const point = this._point(view, x, y)
    const root = this._display.defaultRootWindow
    const window = this._toplevel(view.native.surface.xid)

    const { child } = this._display.translateCoordinates(root, root, point.x, point.y)

    if (child === window) return false

    this._display.raiseWindow(window)
    this._display.sync()

    return true
  }

  watch(view, onhidden) {
    const window = view.native

    if (window === null || !window.visible) {
      onhidden()

      return () => {}
    }

    window.on('hide', onhidden)

    return () => window.off('hide', onhidden)
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

  // A window manager can put the window in a frame of its own, which is what is
  // stacked among the other windows.
  _toplevel(window) {
    const root = this._display.defaultRootWindow

    while (true) {
      const { parent } = this._display.queryTree(window)

      if (parent === root) return window

      window = parent
    }
  }

  _move(view, x, y) {
    const point = this._point(view, x, y)

    xtest.fakeMotionEvent(this._display, xtest.CURRENT_SCREEN, point.x, point.y)
  }

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
