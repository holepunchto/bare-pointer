const AnimationFrameProvider = require('bare-animation-frame')
const AppKitApplication = require('bare-app-kit/application')
const AppKitEvent = require('bare-app-kit/event')

const { TYPE } = AppKitEvent

module.exports = class DarwinPointer {
  constructor() {
    this._window = null
    this._point = null
  }

  size(view) {
    const { width, height } = view.bounds

    return [width, height]
  }

  watch(view, onhidden) {
    let request = null

    check()

    function check() {
      const window = view.window

      if (window === null || !window.visible) onhidden()
      else request = AnimationFrameProvider.requestAnimationFrame(check)
    }

    return () => {
      if (request !== null) request.cancel()
    }
  }

  down(view, x, y) {
    this._send(TYPE.LEFT_MOUSE_DOWN, view, x, y)
  }

  move(view, x, y) {
    this._send(TYPE.LEFT_MOUSE_DRAGGED, view, x, y)
  }

  up() {
    this._window.sendEvent(this._event(TYPE.LEFT_MOUSE_UP, this._window, this._point))
  }

  tap(view, x, y) {
    const window = view.window
    const point = view.convertPointToView(x, y, null)

    AppKitApplication.postEvent(this._event(TYPE.LEFT_MOUSE_DOWN, window, point))
    AppKitApplication.postEvent(this._event(TYPE.LEFT_MOUSE_UP, window, point))
  }

  destroy() {}

  _send(type, view, x, y) {
    this._window = view.window
    this._point = view.convertPointToView(x, y, null)

    this._window.sendEvent(this._event(type, this._window, this._point))
  }

  _event(type, window, point) {
    return AppKitEvent.mouseEvent(type, point.x, point.y, 0, 0, window.windowNumber)
  }
}
