export type Rectangle = {
  x: number
  y: number
  w: number
  h: number
}

export function AABBCollision(rect1: Rectangle, rect2: Rectangle) {
  if (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y
  ) {
    return true
  } else {
    return false
  }
}