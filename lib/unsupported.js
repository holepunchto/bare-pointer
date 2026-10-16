module.exports = class UnsupportedPointer {
  constructor() {
    throw new Error('Simulated input is not supported on this platform')
  }
}
