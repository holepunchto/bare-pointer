# bare-pointer

Simulated pointer input for testing Bare apps. It presses, moves and releases a pointer over a view of the platform toolkit, so that what is under it sees the same events a user would cause.

```
npm i bare-pointer
```

## Usage

```js
const Pointer = require('bare-pointer')

const pointer = new Pointer()

await pointer.tap(button)

await pointer.down(view, 10, 10)
await pointer.move(view, 50, 10)
await pointer.up()

pointer.destroy()
```

## Platforms

| Platform | Views          | Input                                                  |
| -------- | -------------- | ------------------------------------------------------ |
| macOS    | `bare-app-kit` | Mouse events sent to the window of the view            |
| iOS      | `bare-ui-kit`  | Touches synthesized through `bare-ui-kit-touch`        |
| Linux    | `bare-gtk`     | XTest through `bare-x11-xtest`, which needs GDK on X11 |
| Android  | `bare-ndk`     | Motion events dispatched to the root of the view       |
| Windows  | `bare-win-ui`  | `SendInput()` through `bare-user32`                    |

On Linux and Windows the input goes through the system, so the window of the view has to be the one on top at the point. On macOS, a control tracks the mouse until it is released, so press one with `tap()` rather than `down()`.

## License

Apache-2.0
