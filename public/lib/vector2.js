export default class Vector {
    constructor(x, y) {
        this.distance = (b) => {
            return Math.hypot(b.x - this.x, b.y - this.y);
        };
        this.x = x;
        this.y = y;
    }
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        return this.scale(1 / this.magnitude());
    }
    add(b) {
        return new Vector(this.x + b.x, this.y + b.y);
    }
    subtract(b) {
        return new Vector(this.x - b.x, this.y - b.y);
    }
    scale(kx, ky = kx) {
        return new Vector(this.x * kx, this.y * ky);
    }
    dot(b) {
        return this.x * b.x + this.y * b.y;
    }
    equalTo(b) {
        return this.x === b.x && this.y === b.y;
    }
}
Vector.ZERO = new Vector(0, 0);
