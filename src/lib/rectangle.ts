import { Sides } from "../game-2/index.js"
import Vector from "./vector2"

export class Rectangle {
  position: Vector
  size: Vector

  constructor(position: Vector, size: Vector) {
    this.position = position
    this.size = size
  }

  get cx() {
    return this.position.x + this.size.x * 0.5
  }
  get cy() {
    return this.position.y + this.size.y * 0.5
  }

  intersects({ position, size }: Rectangle) {
    if (this.position.x >= position.x + size.x) {
      return false
    } else if (this.position.x + this.size.x <= position.x) {
      return false
    } else if (this.position.y >= position.y + size.y) {
      return false
    } else if (this.position.y + this.size.y <= position.y) {
      return false
    } else {
      return true
    }
  }

  collidesWith(rect: Rectangle) {
    var dx = rect.cx - this.cx // x difference between centers
    var dy = rect.cy - this.cy // y difference between centers
    var aw = (rect.size.x + this.size.x) * 0.5 // average width
    var ah = (rect.size.y + this.size.y) * 0.5 // average height

    /* If either distance is greater than the average dimension there is no collision. */
    if (Math.abs(dx) > aw || Math.abs(dy) > ah) return Sides.NONE

    /* To determine which region of this rectangle the rect's center
    point is in, we have to account for the scale of the this rectangle.
    To do that, we divide dx and dy by it's width and height respectively. */
    if (Math.abs(dx / this.size.x) > Math.abs(dy / this.size.y)) {
      // left
      if (dx < 0) {
        // rect.position.x = this.position.x - rect.size.x
        return Sides.RIGHT
      }
      // right
      else {
        // rect.position.x = this.position.x + this.size.x
        return Sides.LEFT
      }
    } else {
      // top
      if (dy < 0) {
        // rect.position.y = this.position.y - rect.size.y
        return Sides.BOTTOM
      }
      // bottom
      else {
        // rect.position.y = this.position.y + this.size.y
        return Sides.TOP
      }
    }
  }
}

// export function AABBCollision(rect1: Rectangle, rect2: Rectangle) {
//   if (
//     rect1.position.x < rect2.position.x + rect2.size.x &&
//     rect1.position.x + rect1.size.x > rect2.position.x &&
//     rect1.position.y < rect2.position.y + rect2.size.y &&
//     rect1.size.y + rect1.position.y > rect2.position.y
//   ) {
//     return true
//   } else {
//     return false
//   }
// }
