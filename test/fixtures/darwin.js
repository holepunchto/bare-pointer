const { afterAnimationFrame } = require('bare-animation-frame')
const { Control, Switch, View, Window } = require('bare-app-kit')

// Flipped, so that frames and points are from the top left as on the other
// platforms.
function view(frame) {
  const view = new View(frame)

  view.flipped = true

  return view
}

let window = null

exports.tolerance = 0

exports.mount = async function mount(t) {
  if (window === null) {
    window = new Window({ width: 400, height: 300 })
    window.makeKeyAndOrderFront()
  }

  const root = view({ width: 400, height: 300 })

  window.contentView = root

  t.teardown(() => {
    window.contentView = view({ width: 400, height: 300 })
  })

  await afterAnimationFrame()

  return root
}

exports.box = async function box(root, x, y, width, height) {
  const box = view({ x, y, width, height })
  const events = []

  box.on('mouseDown', ({ x, y }) => events.push(['down', x, y]))
  box.on('mouseDragged', ({ x, y }) => events.push(['move', x, y]))
  box.on('mouseUp', ({ x, y }) => events.push(['up', x, y]))

  root.addSubview(box)

  await afterAnimationFrame()

  return { view: box, events }
}

exports.toggle = async function toggle(root) {
  const toggle = new Switch()
  const changes = []

  toggle.sizeToFit()
  toggle.on('change', () => changes.push(toggle.state === Control.STATE_VALUE.ON))

  root.addSubview(toggle)

  await afterAnimationFrame()

  return { view: toggle, changes }
}
