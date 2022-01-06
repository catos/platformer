import { Context } from "../ecs/context.js"
import { Component, Entity, Scene, System } from "../ecs/index.js"
import { Rectangle, Sides } from "../ecs/lib/rectangle.js"
import Vector from "../ecs/lib/vector2.js"
import Timer from "../ecs/timer.js"

/** Canvas */
const { canvas, context } = new Context()

/** Components */

class Position implements Component {
  position: Vector

  constructor(position: Vector = Vector.ZERO) {
    this.position = position
  }
}

class Velocity implements Component {
  speed: number
  velocity: Vector

  constructor(velocity: Vector = Vector.ZERO, speed: number = 60) {
    this.velocity = velocity
    this.speed = speed
  }
}

class Input implements Component {
  left: boolean = false
  right: boolean = false
  up: boolean = false
  down: boolean = false
}

class BoxCollider implements Component {
  size: Vector
  // TODO: offset: Vector
  collision: Sides

  constructor(size: Vector) {
    this.size = size
    this.collision = Sides.NONE
  }
}

class Shape implements Component {
  size: Vector
  color: string
  constructor(size: Vector, color: string = "gray") {
    this.size = size
    this.color = color
  }
}

/** Systems */

class ShapeRenderer extends System {
  public update(dt: number): void {
    context.clearRect(0, 0, canvas.width, canvas.height)

    this.scene.entities
      // TODO: simplify filter ? p.hasAll([Position, Shape])
      .filter((p) => p.hasAll(new Set<Function>([Position, Shape])))
      .forEach((entity) => {
        const { position } = entity.get(Position)
        const shape = entity.get(Shape)

        let color = shape.color
        if (entity.has(BoxCollider)) {
          const { collision } = entity.get(BoxCollider)
          if (collision !== Sides.NONE) {
            color = "purple"
          }
          // console.log(`entity ${entity.id}, color: ${color}`);
        }

        context.fillStyle = color
        context.fillRect(position.x, position.y, shape.size.x, shape.size.y)
      })
  }
}

class InputSystem extends System {
  private keyState: { [key: string]: boolean } = {}

  init() {
    const keyHandler = (e: KeyboardEvent) => {
      this.keyState[e.key] = e.type === "keydown"
    }

    document.addEventListener("keydown", keyHandler)
    document.addEventListener("keyup", keyHandler)
  }

  update() {
    this.scene.entities
      .filter((p) => p.has(Input))
      .forEach((entity) => {
        const input = entity.get(Input)
        input.left = Boolean(this.keyState["a"])
        input.right = Boolean(this.keyState["d"])
        input.up = Boolean(this.keyState["w"])
        input.down = Boolean(this.keyState["s"])
      })
  }
}

class MovementSystem extends System {
  public update(dt: number): void {
    this.scene.entities
      .filter((p) => p.hasAll(new Set<Function>([Position, Velocity])))
      .forEach((entity) => {
        const { position } = entity.get(Position)
        const { speed, velocity } = entity.get(Velocity)

        if (entity.has(Input)) {
          const input = entity.get(Input)

          if (input.left) {
            velocity.x = -5
          }

          if (input.right) {
            velocity.x = 5
          }

          if (input.up) {
            velocity.y = -500
          }
        }

        velocity.y += this.scene.gravity

        position.x += velocity.x * speed * dt
        position.y += velocity.y * dt

        velocity.x *= 0.8

        // TODO: clamp velocities

        // Round x to zero
        if (velocity.x < 0.2 && velocity.x > -0.2) {
          velocity.x = 0
        }
      })
  }
}

class CollisionSystem extends System {
  // TODO: refactor code below
  checkCollision(entity: Entity) {
    if (entity.has(BoxCollider)) {
      const { position: ep } = entity.get(Position)
      const ec = entity.get(BoxCollider)
      const entityRectangle = new Rectangle(ep, ec.size)

      const others = this.scene.entities.filter(
        (p) =>
          p !== entity && p.hasAll(new Set<Function>([Position, BoxCollider]))
      )
      others.forEach((other) => {
        const { position: op } = other.get(Position)
        const oc = other.get(BoxCollider)
        const otherRectangle = new Rectangle(op, oc.size)

        oc.collision = Sides.NONE
        const side = otherRectangle.collidesWith(entityRectangle)
        if (side !== Sides.NONE) {
          ec.collision = side

          const { velocity } = entity.get(Velocity)
          if (side === Sides.LEFT) {
            oc.collision = Sides.RIGHT
            ep.x = op.x + oc.size.x
            velocity.x = 0
          } else if (side === Sides.RIGHT) {
            oc.collision = Sides.LEFT
            ep.x = op.x - ec.size.x
            velocity.x = 0
          } else if (side === Sides.TOP) {
            oc.collision = Sides.BOTTOM
            ep.y = op.y + oc.size.y
            velocity.y = 0
          } else if (side === Sides.BOTTOM) {
            oc.collision = Sides.TOP
            ep.y = op.y - ec.size.y
            velocity.y = 0
          }
        }
      })
    }
  }

  update(): void {
    const entities = this.scene.entities.filter((p) =>
      p.hasAll(new Set<Function>([BoxCollider, Position, Velocity]))
    )

    entities.forEach((entity) => this.checkCollision(entity))
  }
}

// TODO: F3 to toggle debug
class DebugInfo extends System {
  debug: string[] = []

  update(dt: number) {
    const player = this.scene.entities.find((p) => p.id === 1)
    if (!player) return

    const { position } = player.get(Position)

    context.font = "14px monospace"
    context.fillStyle = "#000000"
    context.textAlign = "left"
    context.textBaseline = "top"
    context.fillText(`position: x=${position.x}, y=${position.y}`, 10, 20)

    const boxCollider = player.get(BoxCollider)
    context.fillText(`collision: ${boxCollider.collision.toString()}`, 10, 40)

    const { velocity } = player.get(Velocity)
    context.fillText(`velocity: x=${velocity.x}, y=${velocity.y}`, 10, 60)

    const nonPlayers = this.scene.entities
      .filter((p) => p.id !== 1)
      .forEach((entity, i) => {
        const { collision } = entity.get(BoxCollider)
        context.fillText(`collision: ${collision.toString()}`, 10, 80 + i * 20)
      })

    this.scene.entities
      .filter((p) => p.hasAll(new Set<Function>([Position, Shape])))
      .forEach((entity) => {
        const { position } = entity.get(Position)
        const { size } = entity.get(Shape)

        context.font = "14px monospace"
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillStyle = "white"
        const x = position.x + size.x / 2
        const y = position.y + size.y / 2
        context.fillText(`${entity.id}`, x, y)
      })
  }
}

/** Scene */

const scene = new Scene()
scene
  .addSystem(new InputSystem())
  .addSystem(new MovementSystem())
  .addSystem(new CollisionSystem())
  .addSystem(new ShapeRenderer())
  .addSystem(new DebugInfo())

const player = new Entity(1)
const size = new Vector(32, 32)
player
  .add(new Position(new Vector(600, 100)))
  .add(new Velocity())
  .add(new Shape(size, "blue"))
  .add(new Input())
  .add(new BoxCollider(size))
scene.addEntity(player)

function createBox(id: number, position: Vector, size: Vector) {
  const thing = new Entity(id)

  thing.add(new Position(position))
  thing.add(new Shape(size, "green"))
  thing.add(new BoxCollider(size))

  return thing
}

scene
  // .addEntity(createBox(2, new Vector(64, 64 * 6), new Vector(64 * 7, 64)))
  // .addEntity(
  //   createBox(3, new Vector(64 * 8, 64 * 6 - 32), new Vector(64 * 7, 64))
  // )
  .addEntity(createBox(2, new Vector(64, 64 * 6), new Vector(64 * 14, 64)))
  .addEntity(createBox(3, new Vector(64 * 5, 64 * 3), new Vector(64 * 4, 64)))
  .addEntity(createBox(4, new Vector(64 * 12, 64 * 5), new Vector(64, 64)))
  .addEntity(createBox(5, new Vector(64 * 2, 64 * 5), new Vector(64, 64)))

scene.init()

/** Tests */

/** Game loop */

const timer = new Timer((dt: number) => {
  scene.update(dt)
})

timer.start()
