const Win32Interop = require('bare-win-ui/win32-interop')
const user32 = require('bare-user32')

const {
  GA_ROOT,
  SM_XVIRTUALSCREEN,
  SM_YVIRTUALSCREEN,
  SM_CXVIRTUALSCREEN,
  SM_CYVIRTUALSCREEN,
  INPUT_MOUSE,
  MOUSEEVENTF_MOVE,
  MOUSEEVENTF_LEFTDOWN,
  MOUSEEVENTF_LEFTUP,
  MOUSEEVENTF_ABSOLUTE,
  MOUSEEVENTF_VIRTUALDESK
} = user32.constants

module.exports = class Win32Pointer {
  constructor() {
    this._point = null
  }

  size(view) {
    return [view.actualWidth, view.actualHeight]
  }

  covered(view, x, y) {
    const { window, screen } = locate(view, x, y)
    const top = user32.windowFromPoint(screen.x, screen.y)

    if (top !== null && user32.getAncestor(top, GA_ROOT) === window) return false

    user32.setForegroundWindow(window)

    return true
  }

  hover(view, x, y) {
    this._point = normalize(locate(view, x, y).screen)
    this._send(0)
  }

  down() {
    this._send(MOUSEEVENTF_LEFTDOWN)
  }

  move(view, x, y) {
    this._point = normalize(locate(view, x, y).screen)
    this._send(0)
  }

  up() {
    this._send(MOUSEEVENTF_LEFTUP)
  }

  destroy() {}

  _send(flags) {
    const sent = user32.sendInput([
      {
        type: INPUT_MOUSE,
        mi: {
          ...this._point,
          flags: flags | MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK
        }
      }
    ])

    if (sent === 0) throw new Error('Input was blocked')
  }
}

function locate(view, x, y) {
  const root = view.xamlRoot
  const scale = root.rasterizationScale
  const point = view.transformToVisual(null).transformPoint(x, y)
  const window = Win32Interop.getWindowFromWindowId(root.contentIslandEnvironment.appWindowId)

  const screen = user32.clientToScreen(
    window,
    Math.round(point.x * scale),
    Math.round(point.y * scale)
  )

  return { window, screen }
}

function normalize(screen) {
  const left = user32.getSystemMetrics(SM_XVIRTUALSCREEN)
  const top = user32.getSystemMetrics(SM_YVIRTUALSCREEN)
  const width = user32.getSystemMetrics(SM_CXVIRTUALSCREEN)
  const height = user32.getSystemMetrics(SM_CYVIRTUALSCREEN)

  return {
    dx: Math.round(((screen.x - left + 0.5) * 65536) / width),
    dy: Math.round(((screen.y - top + 0.5) * 65536) / height)
  }
}
