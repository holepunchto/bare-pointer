const AnimationFrameProvider = require('bare-animation-frame')
const AppKitApplication = require('bare-app-kit/application')
const AppKitEvent = require('bare-app-kit/event')
const FoundationProcessInfo = require('bare-foundation/process-info')

const { TYPE, MASK } = AppKitEvent

// A run loop mode of its own, so that nothing else runs while the event queue
// is read.
const MODE = 'to.holepunch.bare.pointer'

module.exports = class DarwinPointer {
  constructor() {
    this._window = null
    this._point = null
    this._press = 0
  }

  size(view) {
    const { width, height } = view.bounds

    return [width, height]
  }

  covered(view) {
    const window = view.window

    if (window.keyWindow || !window.canBecomeKeyWindow || !AppKitApplication.active) {
      return false
    }

    window.makeKeyAndOrderFront()

    return true
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
    this._press++

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

    this._press++

    AppKitApplication.postEvent(this._event(TYPE.LEFT_MOUSE_UP, window, point), true)
    AppKitApplication.postEvent(this._event(TYPE.LEFT_MOUSE_DOWN, window, point), true)
  }

  pending(view) {
    const window = view.window

    if (window === null) return false

    const event = AppKitApplication.nextEventMatchingMask(
      MASK.LEFT_MOUSE_DOWN | MASK.LEFT_MOUSE_UP,
      null,
      MODE,
      false
    )

    return event !== null && event.windowNumber === window.windowNumber
  }

  destroy() {}

  _send(type, view, x, y) {
    this._window = view.window
    this._point = view.convertPointToView(x, y, null)

    this._window.sendEvent(this._event(type, this._window, this._point))
  }

  _event(type, window, point) {
    return AppKitEvent.mouseEvent(
      type,
      point.x,
      point.y,
      0,
      FoundationProcessInfo.processInfo.systemUptime,
      window.windowNumber,
      this._press
    )
  }
}
