const { afterAnimationFrame } = require('bare-animation-frame')
const { Scene, Switch, View, ViewController, Window } = require('bare-ui-kit')

let controller = null

exports.tolerance = 0

exports.mount = async function mount(t) {
  if (controller === null) {
    const window = new Window({ scene: Scene.connected[0] })

    controller = new ViewController()

    window.rootViewController = controller
    window.makeKeyAndVisible()
  }

  const root = new View({ width: 400, height: 300 })

  controller.view.addSubview(root)

  t.teardown(() => root.removeFromSuperview())

  await afterAnimationFrame()

  return root
}

exports.box = async function box(root, x, y, width, height) {
  const box = new View({ x, y, width, height })
  const events = []

  box.on('touchesBegan', ({ x, y }) => events.push(['down', x, y]))
  box.on('touchesMoved', ({ x, y }) => events.push(['move', x, y]))
  box.on('touchesEnded', ({ x, y }) => events.push(['up', x, y]))

  root.addSubview(box)

  await afterAnimationFrame()

  return { view: box, events }
}

exports.toggle = async function toggle(root) {
  const toggle = new Switch()
  const changes = []

  toggle.sizeToFit()
  toggle.on('valueChanged', () => changes.push(toggle.isOn))

  root.addSubview(toggle)

  await afterAnimationFrame()

  return { view: toggle, changes }
}
