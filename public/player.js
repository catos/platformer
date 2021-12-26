export default class Player {
    constructor(x, y) {
        this.speed = 200;
        this.x = x;
        this.y = y;
    }
    update(deltaTime) {
        this.x += (this.speed * deltaTime);
        this.y -= (this.speed * deltaTime);
    }
    draw(context) {
        context.fillStyle = "#aaccee";
        context.fillRect(this.x, this.y, 100, 100);
    }
}
