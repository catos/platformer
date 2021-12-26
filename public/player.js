// https://github.com/grebaldi/nopun-ecs/blob/master/examples/ultimate-space-rock-eliminator-9000/src/entity/Player/Player.ts
export default class Player {
    constructor(x, y) {
        this.width = 16;
        this.height = 24;
        this.speed = 200;
        this.x = x;
        this.y = y;
    }
    update(deltaTime) {
        // this.x += (this.speed * deltaTime)
        // this.y -= (this.speed * deltaTime)
    }
    draw(context) {
        context.fillStyle = "#ff0000";
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}
