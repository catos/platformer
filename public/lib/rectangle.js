export class Rectangle {
    constructor(position, size) {
        this.position = position;
        this.size = size;
    }
    intersects({ position, size }) {
        if (this.position.x >= position.x + size.x) {
            return false;
        }
        else if (this.position.x + this.size.x <= position.x) {
            return false;
        }
        else if (this.position.y >= position.y + size.y) {
            return false;
        }
        else if (this.position.y + this.size.y <= position.y) {
            return false;
        }
        else {
            return true;
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
