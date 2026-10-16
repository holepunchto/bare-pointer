const NDKMotionEvent = require('bare-ndk/motion-event')
const SystemClock = require('bare-ndk/system-clock')

const { ACTION } = NDKMotionEvent

module.exports = class AndroidPointer {
  constructor() {
    this._root = null
    this._downTime = 0
    this._x = 0
    this._y = 0
  }

  size(view) {
    return [view.width, view.height]
  }

  down(view, x, y) {
    this._downTime = SystemClock.uptimeMillis()
    this._dispatch(ACTION.DOWN, view, x, y)
  }

  move(view, x, y) {
    this._dispatch(ACTION.MOVE, view, x, y)
  }

  up() {
    this._send(ACTION.UP)
  }

  destroy() {}

  // The root is not always at the origin of the window, so the view is placed
  // by its offset from the root.
  _dispatch(action, view, x, y) {
    const root = view.rootView
    const here = view.locationInWindow
    const there = root.locationInWindow

    this._root = root
    this._x = here.x - there.x + x
    this._y = here.y - there.y + y

    this._send(action)
  }

  _send(action) {
    const event = NDKMotionEvent.obtain(
      this._downTime,
      SystemClock.uptimeMillis(),
      action,
      this._x,
      this._y
    )

    try {
      this._root.dispatchTouchEvent(event)
    } finally {
      event.recycle()
    }
  }
}
