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
    this._tap = null
    this._monitor = null
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
    this._tap = {
      window: view.window,
      point: view.convertPointToView(x, y, null),
      missed: false,
      dropping: false
    }

    if (this._monitor === null) {
      this._monitor = AppKitEvent.addLocalMonitorForEventsMatchingMask(
        MASK.LEFT_MOUSE_DOWN | MASK.LEFT_MOUSE_UP,
        this._onevent.bind(this)
      )
    }

    this._post()
  }

  pending(view) {
    const window = view.window

    if (window === null || this._tap === null) return this._unmonitor()

    const event = AppKitApplication.nextEventMatchingMask(
      MASK.LEFT_MOUSE_DOWN | MASK.LEFT_MOUSE_UP,
      null,
      MODE,
      false
    )

    if (event !== null && event.windowNumber === window.windowNumber) return true

    if (this._tap.missed) {
      this._post()

      return true
    }

    return this._unmonitor()
  }

  destroy() {
    this._unmonitor()
  }

  _post() {
    const { window, point } = this._tap

    this._tap.missed = false
    this._press++

    AppKitApplication.postEvent(this._event(TYPE.LEFT_MOUSE_UP, window, point), true)
    AppKitApplication.postEvent(this._event(TYPE.LEFT_MOUSE_DOWN, window, point), true)
  }

  _unmonitor() {
    if (this._monitor !== null) AppKitEvent.removeMonitor(this._monitor)

    this._monitor = null
    this._tap = null

    return false
  }

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

  _onevent(event) {
    const tap = this._tap

    if (tap === null || event.windowNumber !== tap.window.windowNumber) return event

    if (event.type === TYPE.LEFT_MOUSE_UP) {
      if (!tap.dropping) return event

      tap.dropping = false

      return null
    }

    const { x, y } = event.locationInWindow

    if (Math.abs(x - tap.point.x) < 1 && Math.abs(y - tap.point.y) < 1) return event

    tap.missed = true
    tap.dropping = true

    return null
  }
}
