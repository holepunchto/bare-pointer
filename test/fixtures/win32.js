const { afterAnimationFrame } = require('bare-animation-frame')
const { Canvas, SolidColorBrush, ToggleSwitch, Window } = require('bare-win-ui')

let window = null

// Input lands on whole physical pixels, which a DIP is not always a whole
// number of.
exports.tolerance = 1

exports.mount = async function mount(t) {
  if (window === null) {
    window = new Window()
    window.resizeClient(400, 300)
    window.activate()
  }

  const root = new Canvas()

  window.content = root

  t.teardown(() => {
    window.content = null
  })

  await afterAnimationFrame()

  return root
}

// A window can be closed but not hidden.
exports.popup = async function popup(t) {
  const window = new Window()
  const root = new Canvas()

  window.resizeClient(400, 300)
  window.content = root
  window.activate()

  let closed = false

  const hide = () => {
    if (closed) return

    closed = true
    window.close()
  }

  t.teardown(hide)

  await afterAnimationFrame()

  return { root, hide }
}

// A panel without a background is not hit tested.
exports.box = async function box(root, x, y, width, height, onup) {
  const box = new Canvas()
  const events = []

  box.background = new SolidColorBrush({ color: { a: 255, r: 200, g: 200, b: 200 } })
  box.width = width
  box.height = height

  box.on('pointerPressed', ({ x, y }) => events.push(['down', x, y]))
  box.on('pointerMoved', ({ x, y, isInContact }) => {
    if (isInContact) events.push(['move', x, y])
  })
  box.on('pointerReleased', ({ x, y }) => {
    events.push(['up', x, y])

    if (onup) onup()
  })

  Canvas.setLeft(box, x)
  Canvas.setTop(box, y)

  root.children.append(box)

  await afterAnimationFrame()

  return { view: box, events }
}

exports.toggle = async function toggle(root) {
  const toggle = new ToggleSwitch()
  const changes = []

  toggle.on('toggled', () => changes.push(toggle.isOn))

  root.children.append(toggle)

  await afterAnimationFrame()

  // Only the switch at the left takes a tap, and the label beside it does not.
  return { view: toggle, changes, x: 20, y: toggle.actualHeight / 2 }
}
