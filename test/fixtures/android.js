const { afterAnimationFrame } = require('bare-animation-frame')
const { Activity, FrameGroup, Toggle } = require('bare-ndk')

// The activity has one content view, so the tests share a root and swap what
// is inside it.
let content = null

// Android lays views out in pixels, which a dispatched point is rounded to.
exports.tolerance = 1

exports.mount = async function mount(t) {
  if (content === null) {
    content = new FrameGroup()

    Activity.contentView(content)
  }

  const root = new FrameGroup()

  content.addView(root)
  content.setFrame(root, 0, 0, 400, 300)

  t.teardown(() => content.removeView(root))

  await afterAnimationFrame()

  return root
}

exports.box = async function box(root, x, y, width, height) {
  const box = new FrameGroup()
  const events = []

  box.on('down', (x, y) => events.push(['down', x, y]))
  box.on('move', (x, y) => events.push(['move', x, y]))
  box.on('up', (x, y) => events.push(['up', x, y]))

  root.addView(box)
  root.setFrame(box, x, y, width, height)

  await afterAnimationFrame()

  return { view: box, events }
}

exports.toggle = async function toggle(root) {
  const toggle = new Toggle()
  const changes = []

  toggle.on('checked', () => changes.push(toggle.checked))

  const { width, height } = toggle.naturalSize

  root.addView(toggle)
  root.setFrame(toggle, 0, 0, width, height)

  await afterAnimationFrame()

  return { view: toggle, changes }
}
