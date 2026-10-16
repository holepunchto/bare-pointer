const { test } = require('bare-tap')
const AnimationFrameProvider = require('bare-animation-frame')
const fixture = require('#fixture')
const Pointer = require('..')

function near(t, actual, expected, message) {
  const close =
    actual.length === expected.length &&
    actual.every(
      ([name, x, y], i) =>
        name === expected[i][0] &&
        Math.abs(x - expected[i][1]) <= fixture.tolerance &&
        Math.abs(y - expected[i][2]) <= fixture.tolerance
    )

  if (close) t.pass(message)
  else t.deepStrictEqual(actual, expected, message)
}

function frame(view) {
  return new AnimationFrameProvider(view).afterAnimationFrame()
}

async function setup(t) {
  const root = await fixture.mount(t)
  const pointer = new Pointer()

  t.teardown(() => pointer.destroy())

  return { root, pointer }
}

test('taps the middle of a view', async (t) => {
  const { root, pointer } = await setup(t)
  const { view, events } = await fixture.box(root, 40, 30, 100, 80)

  await pointer.tap(view)

  near(t, events, [
    ['down', 50, 40],
    ['up', 50, 40]
  ])
})

test('presses a point within a view', async (t) => {
  const { root, pointer } = await setup(t)
  const { view, events } = await fixture.box(root, 40, 30, 100, 80)

  await pointer.down(view, 10, 20)

  t.ok(pointer.pressed, 'pressed')

  await pointer.up()

  t.notOk(pointer.pressed, 'released')

  near(t, events, [
    ['down', 10, 20],
    ['up', 10, 20]
  ])
})

test('drags within a view', async (t) => {
  const { root, pointer } = await setup(t)
  const { view, events } = await fixture.box(root, 40, 30, 100, 80)

  await pointer.down(view, 10, 10)
  await pointer.move(view, 30, 40)
  await pointer.up()

  const moves = events.filter(([name]) => name === 'move')

  t.ok(moves.length > 0, 'moved')
  near(t, moves.slice(-1), [['move', 30, 40]], 'to the point')
  near(t, events.slice(-1), [['up', 30, 40]], 'released there')
})

test('presses the topmost view', async (t) => {
  const { root, pointer } = await setup(t)
  const below = await fixture.box(root, 40, 30, 100, 80)
  const above = await fixture.box(root, 40, 30, 100, 80)

  await pointer.tap(above.view)

  t.equal(above.events.length, 2, 'the view on top')
  t.equal(below.events.length, 0, 'not the one below')
})

test('toggles a switch', async (t) => {
  const { root, pointer } = await setup(t)
  const { view, changes, x, y } = await fixture.toggle(root)

  await pointer.tap(view, x, y)

  // GTK only switches once its animation has finished.
  for (let i = 0; i < 30 && changes.length === 0; i++) await frame(view)

  t.deepStrictEqual(changes, [true])
})

test('is down only once at a time', async (t) => {
  const { root, pointer } = await setup(t)
  const { view } = await fixture.box(root, 40, 30, 100, 80)

  await t.rejects(() => pointer.up(), /Pointer is not down/, 'cannot release first')
  await t.rejects(() => pointer.move(view), /Pointer is not down/, 'cannot move first')

  await pointer.down(view)

  await t.rejects(() => pointer.down(view), /Pointer is already down/, 'cannot press twice')
  await t.rejects(() => pointer.tap(view), /Pointer is already down/, 'cannot tap while down')

  await pointer.up()
})
