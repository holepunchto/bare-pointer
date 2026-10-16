/**
 * A view of the platform toolkit: an `NSView`, `UIView`, `GtkWidget`, `android.view.View` or
 * `UIElement`, as wrapped by its Bare binding.
 */
type View = unknown

/** One simulated pointer, which is a mouse on desktop platforms and a finger on mobile ones. */
declare class Pointer {
  constructor()

  /** Whether the pointer is down. */
  readonly pressed: boolean

  /**
   * Press at `x`, `y` in the coordinates of `view`, which default to its middle. Resolves once the
   * press has been delivered and a frame has passed.
   */
  down(view: View, x?: number, y?: number): Promise<void>

  /** Move the pressed pointer to `x`, `y` in the coordinates of `view`. */
  move(view: View, x?: number, y?: number): Promise<void>

  /** Release the pointer where it is. */
  up(): Promise<void>

  /** Press and release at `x`, `y` in the coordinates of `view`. */
  tap(view: View, x?: number, y?: number): Promise<void>

  /** Release the pointer if it is down, and close any connection to the display server. */
  destroy(): void
}

export = Pointer
