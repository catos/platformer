export default class Vector {
  static ZERO = new Vector(0, 0)

  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize() {
    return this.scale(1 / this.magnitude())
  }

  add(b: Vector) {
    return new Vector(this.x + b.x, this.y + b.y)
  }

  subtract(b: Vector) {
    return new Vector(this.x - b.x, this.y - b.y)
  }

  scale(kx: number, ky = kx) {
    return new Vector(this.x * kx, this.y * ky)
  }

  dot(b: Vector) {
    return this.x * b.x + this.y * b.y
  }

  equalTo(b: Vector) {
    return this.x === b.x && this.y === b.y
  }

  distance = (b: Vector) => {
    return Math.hypot(b.x - this.x, b.y - this.y)
  }
}