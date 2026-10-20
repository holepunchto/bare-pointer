const AnimationFrameProvider = require('bare-animation-frame')
const { FrameFixed, Switch, Window } = require('bare-gtk')
const GestureDrag = require('bare-gtk/gesture-drag')

// A window cannot be closed, so the tests share one and swap its child.
let window = null
let frames = null

// GTK reports event coordinates as single precision floats.
exports.tolerance = 0.001

exports.mount = async function mount(t) {
  if (window === null) {
    window = new Window()
    window.defaultSize = [400, 300]
    window.visible = true

    frames = new AnimationFrameProvider(window)
  }

  const root = new FrameFixed()

  window.child = root

  t.teardown(() => {
    window.child = null
  })

  await frames.afterAnimationFrame()

  return root
}

exports.popup = async function popup(t) {
  const window = new Window()
  const root = new FrameFixed()

  window.defaultSize = [400, 300]
  window.child = root
  window.visible = true

  const hide = () => {
    window.visible = false
  }

  t.teardown(hide)

  await new AnimationFrameProvider(window).afterAnimationFrame()

  return { root, hide }
}

function place(root, child, frame) {
  child.insertBefore(root)

  root.layoutManager.getLayoutChild(child).frame = frame
}

// A drag reports where it started, and how far it has come since.
exports.box = async function box(root, x, y, width, height, onup) {
  const box = new FrameFixed()
  const drag = new GestureDrag()
  const events = []

  let startX = 0
  let startY = 0

  drag.on('dragBegin', (x, y) => {
    startX = x
    startY = y

    events.push(['down', x, y])
  })

  drag.on('dragUpdate', (dx, dy) => events.push(['move', startX + dx, startY + dy]))
  drag.on('dragEnd', (dx, dy) => {
    events.push(['up', startX + dx, startY + dy])

    if (onup) onup()
  })

  box.addController(drag)

  place(root, box, [x, y, width, height])

  await frames.afterAnimationFrame()

  return { view: box, events }
}

exports.toggle = async function toggle(root) {
  const toggle = new Switch()
  const changes = []

  toggle.on('active', () => changes.push(toggle.active))

  const [, width] = toggle.measure(0, -1)
  const [, height] = toggle.measure(1, -1)

  place(root, toggle, [0, 0, width, height])

  await frames.afterAnimationFrame()

  return { view: toggle, changes }
}
