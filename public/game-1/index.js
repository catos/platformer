import { Entity, Scene, System } from "../ecs/index.js";
import { Rectangle } from "../lib/rectangle.js";
import throwIfNull from "../lib/throw-if-null.js";
import Vector from "../lib/vector2.js";
/** Canvas */
const canvas = throwIfNull(document.body.querySelector("#canvas1"), "Canvas could not be found");
canvas.width = document.body.scrollWidth;
canvas.height = document.body.clientHeight;
const context = throwIfNull(canvas.getContext("2d"), "Canvas context is missing!");
/** Types and enums */
export var Sides;
(function (Sides) {
    Sides[Sides["NONE"] = 0] = "NONE";
    Sides[Sides["TOP"] = 1] = "TOP";
    Sides[Sides["BOTTOM"] = 2] = "BOTTOM";
    Sides[Sides["LEFT"] = 3] = "LEFT";
    Sides[Sides["RIGHT"] = 4] = "RIGHT";
})(Sides || (Sides = {}));
/** Components */
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Velocity {
    constructor(velocity = Vector.ZERO) {
        this.speed = 200;
        this.velocity = velocity;
    }
}
class Input {
    constructor() {
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
    }
}
class BoxCollider {
    constructor(size) {
        this.size = size;
        this.collision = Sides.NONE;
    }
}
class Shape {
    constructor(width, height, color = "gray") {
        this.width = width;
        this.height = height;
        this.color = color;
    }
}
/** Systems */
class Renderer extends System {
    update(dt) {
        this.scene.entities
            // TODO: simplify filter ? p.hasAll([Position, Shape])
            .filter((p) => p.hasAll(new Set([Position, Shape])))
            .forEach((entity) => {
            const position = entity.get(Position);
            const shape = entity.get(Shape);
            context.fillStyle = shape.color;
            context.fillRect(position.x, position.y, shape.width, shape.height);
            if (entity.has(BoxCollider)) {
                const collider = entity.get(BoxCollider);
                if (collider.collision) {
                    context.strokeStyle = "#0000ff";
                    context.lineWidth = 2;
                    context.strokeRect(position.x, position.y, collider.size.x, collider.size.y);
                }
            }
        });
    }
}
class InputSystem extends System {
    constructor(scene) {
        super(scene);
        this.keysPressed = new Set();
        document.addEventListener("keydown", (e) => {
            this.keysPressed.add(e.key);
        });
        document.addEventListener("keyup", (e) => {
            this.keysPressed.delete(e.key);
        });
    }
    // TODO: move logic outside update (it is laggy?), run in event-handler ?
    update() {
        this.scene.entities
            .filter((p) => p.hasAll(new Set([Position, Input])))
            .forEach((entity) => {
            const input = entity.get(Input);
            if (this.keysPressed.has("a")) {
                input.left = true;
            }
            else if (this.keysPressed.has("d")) {
                input.right = true;
            }
            else if (this.keysPressed.has("w")) {
                input.up = true;
            }
            else if (this.keysPressed.has("s")) {
                input.down = true;
            }
            else {
                input.left = false;
                input.right = false;
                input.up = false;
                input.down = false;
            }
        });
    }
}
class MovementSystem extends System {
    update(dt) {
        const entities = this.scene.entities.filter((p) => p.hasAll(new Set([Position, Velocity])));
        entities.forEach((entity) => {
            const position = entity.get(Position);
            const { speed, velocity } = entity.get(Velocity);
            if (entity.has(Input)) {
                const input = entity.get(Input);
                if (input.left) {
                    velocity.x = -1;
                }
                else if (input.right) {
                    velocity.x = 1;
                }
                else if (input.up) {
                    // velocity.y = -1
                }
                else {
                    velocity.x = 0;
                    velocity.y += (this.scene.gravity * dt);
                }
            }
            const newPosition = new Vector(Math.floor(position.x + velocity.x * speed * dt), Math.floor(position.y + velocity.y * speed * dt));
            if (entity.has(BoxCollider)) {
                // Check collision
                const others = this.scene.entities.filter((p) => p !== entity && p.hasAll(new Set([Position, BoxCollider])));
                const ep = entity.get(Position);
                const ec = entity.get(BoxCollider);
                ec.collision = Sides.NONE;
                const rect1 = new Rectangle(new Vector(ep.x, ep.y), ec.size);
                others.forEach((other) => {
                    const op = other.get(Position);
                    const oc = other.get(BoxCollider);
                    const rect2 = new Rectangle(new Vector(op.x, op.y), oc.size);
                    if (rect1.intersects(rect2)) {
                        newPosition.x = position.x;
                        newPosition.y = position.y;
                    }
                });
                // const { collision } = entity.get(BoxCollider)
                // if (collision !== Sides.NONE) {
                //   velocity.x = 0
                //   velocity.y = 0
                // }
            }
            position.x = newPosition.x;
            position.y = newPosition.y;
        });
    }
}
class CollisionSystem extends System {
    checkCollision(entity) {
        const others = this.scene.entities.filter((p) => p !== entity && p.hasAll(new Set([Position, BoxCollider])));
        const ep = entity.get(Position);
        const ec = entity.get(BoxCollider);
        ec.collision = Sides.NONE;
        const rect1 = new Rectangle(new Vector(ep.x, ep.y), ec.size);
        others.forEach((other) => {
            const op = other.get(Position);
            const oc = other.get(BoxCollider);
            const rect2 = new Rectangle(new Vector(op.x, op.y), oc.size);
            if (rect1.intersects(rect2)) {
                if (entity.has(Velocity)) {
                    const { velocity } = entity.get(Velocity);
                    if (velocity.x > 0) {
                        ec.collision = Sides.RIGHT;
                    }
                    else if (velocity.x < 0) {
                        ec.collision = Sides.LEFT;
                    }
                    else if (velocity.y > 0) {
                        ec.collision = Sides.BOTTOM;
                    }
                    else if (velocity.y < 0) {
                        ec.collision = Sides.TOP;
                    }
                }
                else {
                    // TODO: not sure what to do here
                    ec.collision = Sides.RIGHT;
                }
            }
        });
    }
    update() {
        const entities = this.scene.entities.filter((p) => p.hasAll(new Set([BoxCollider, Position])));
        entities.forEach((entity) => this.checkCollision(entity));
    }
}
class DebugInfo extends System {
    constructor() {
        super(...arguments);
        this.debug = new Map();
    }
    update(dt) {
        scene.entities.forEach((entity, index) => {
            const position = entity.get(Position);
            this.debug.set(`#${entity.id} position`, `x=${position.x}, y=${position.y}`);
            const boxCollider = entity.get(BoxCollider);
            this.debug.set(`#${entity.id} collision`, boxCollider.collision.toString());
            if (entity.has(Velocity)) {
                const { velocity } = entity.get(Velocity);
                this.debug.set(`#${entity.id} velocity`, `x=${velocity.x}, y=${velocity.y}`);
            }
        });
        let lineHeight = 18;
        context.fillStyle = "#33333366";
        context.fillRect(0, 0, canvas.width, this.debug.size * lineHeight + 10);
        context.fillStyle = "#000000";
        context.font = "14px monospace";
        let index = 1;
        this.debug.forEach((value, key) => {
            context.fillText(`${key}: ${value}`, 10, lineHeight * index);
            index++;
        });
    }
}
/** Init scene */
const scene = new Scene();
const player = new Entity(1);
const width = 32;
const height = 32;
const size = new Vector(width, height);
player.add(new Position(Math.round(canvas.width / 2), Math.round(canvas.height / 2)));
player.add(new Velocity());
player.add(new Shape(width, height, "red"));
player.add(new Input());
player.add(new BoxCollider(size));
scene.addEntity(player);
function createThing(id, x, y) {
    const thing = new Entity(id);
    const width = 64;
    const height = 64;
    const size = new Vector(width, height);
    thing.add(new Position(x, y));
    thing.add(new Shape(width, height));
    thing.add(new BoxCollider(size));
    // if (id === 5) {
    //   thing.add(new Velocity(new Vector(-1, 0)))
    // }
    return thing;
}
const center = new Vector(Math.round(canvas.width / 2), Math.round(canvas.height / 2));
scene.addEntity(createThing(2, center.x - 128, center.y));
scene.addEntity(createThing(3, center.x - 160, center.y - 32));
scene.addEntity(createThing(4, center.x + 128, center.y));
scene.addEntity(createThing(5, center.x, center.y + 128));
scene.addSystem(new InputSystem(scene));
scene.addSystem(new MovementSystem(scene));
scene.addSystem(new Renderer(scene));
// scene.addSystem(new CollisionSystem(scene))
scene.addSystem(new DebugInfo(scene));
/** Tests */
// ...
/** Game loop */
let lastTime = 0;
function loop(time) {
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;
    context.clearRect(0, 0, canvas.width, canvas.height);
    scene.update(deltaTime);
    requestAnimationFrame(loop);
}
loop(0);
