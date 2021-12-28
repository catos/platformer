import { Entity, Scene, System } from "./ecs/ecs2.js";
import { AABBCollision } from "./lib/aabbcollision.js";
import throwIfNull from "./lib/throw-if-null.js";
/** Canvas */
const canvas = throwIfNull(document.body.querySelector("#canvas1"), "Canvas could not be found");
canvas.width = 800;
canvas.height = 600;
const context = throwIfNull(canvas.getContext("2d"), "Canvas context is missing!");
/** Components */
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Velocity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 100;
    }
}
class Movable {
}
class Collider {
    constructor(width, height, isColliding = false) {
        this.width = width;
        this.height = height;
        this.isColliding = isColliding;
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
class MovementSystem extends System {
    update(dt) {
        this.scene.entities
            .filter((p) => p.hasAll(new Set([Velocity])))
            .forEach((entity) => {
            const position = entity.get(Position);
            const velocity = entity.get(Velocity);
            position.x += velocity.x * velocity.speed * dt;
            position.y += velocity.y * velocity.speed * dt;
        });
    }
}
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
            if (entity.has(Collider)) {
                const collider = entity.get(Collider);
                if (collider.isColliding) {
                    context.strokeStyle = "#0000ff";
                    context.lineWidth = 2;
                    context.strokeRect(position.x, position.y, collider.width, collider.height);
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
            .filter((p) => p.hasAll(new Set([Position, Movable])))
            .forEach((entity) => {
            const velocity = entity.get(Velocity);
            if (velocity) {
                if (this.keysPressed.has("a")) {
                    velocity.x = -1;
                }
                else if (this.keysPressed.has("d")) {
                    velocity.x = 1;
                }
                else {
                    velocity.x = 0;
                }
                if (this.keysPressed.has("w")) {
                    velocity.y = -1;
                }
                else if (this.keysPressed.has("s")) {
                    velocity.y = 1;
                }
                else {
                    velocity.y = 0;
                }
            }
        });
    }
}
class CollisionSystem extends System {
    update(dt) {
        const entities = this.scene.entities.filter((p) => p.hasAll(new Set([Collider, Position])));
        entities.forEach((entity) => {
            const myPosition = entity.get(Position);
            const myCollider = entity.get(Collider);
            myCollider.isColliding = false;
            const rect1 = Object.assign(Object.assign({}, myPosition), { w: myCollider.width, h: myCollider.height });
            entities
                .filter((p) => p !== entity)
                .forEach((other) => {
                const otherCollider = other.get(Collider);
                const otherPosition = other.get(Position);
                const rect2 = Object.assign(Object.assign({}, otherPosition), { w: otherCollider.width, h: otherCollider.height });
                // TODO: hmm, maybe set isColliding = false another place ?
                if (AABBCollision(rect1, rect2)) {
                    myCollider.isColliding = true;
                }
            });
        });
    }
}
class DebugSystem extends System {
    update(dt) {
        // this.scene.debug.set(`Coll (${entity.id}, ${other.id})`, coll.toString())
        let i = 1;
        for (const [key, value] of this.scene.debug) {
            context.fillStyle = "black";
            context.font = "12px monospace";
            context.fillText(`${key}: ${value}`, 20, i * 20);
            i++;
        }
    }
}
/** Init scene */
const scene = new Scene();
const player = new Entity(1);
player.add(new Position(200, 200));
player.add(new Velocity(0, 0));
player.add(new Shape(16, 24, "red"));
player.add(new Movable());
player.add(new Collider(16, 24));
scene.addEntity(player);
function createThing(id, x, y) {
    const thing = new Entity(id);
    const width = 20;
    const height = 20;
    // const width = randomBetween(10, 50)
    // const height = randomBetween(10, 50)
    // const x = randomBetween(0, canvas.width - width)
    // const y = randomBetween(0, canvas.height - height)
    thing.add(new Position(x, y));
    thing.add(new Shape(width, height));
    thing.add(new Collider(width, height));
    return thing;
}
scene.addEntity(createThing(2, 210, 210));
scene.addEntity(createThing(3, 225, 225));
scene.addSystem(new InputSystem(scene));
scene.addSystem(new MovementSystem(scene));
scene.addSystem(new Renderer(scene));
scene.addSystem(new CollisionSystem(scene));
scene.addSystem(new DebugSystem(scene));
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
