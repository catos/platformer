import { Component, Entity, Scene, System } from "../ecs/index.js"
import { Rectangle, Sides } from "../ecs/lib/rectangle.js"
import throwIfNull from "../ecs/lib/throw-if-null.js"
import Vector from "../ecs/lib/vector2.js"
import Timer from "../ecs/timer.js"

/** Canvas */

const canvas = throwIfNull(
  document.body.querySelector<HTMLCanvasElement>("#canvas1"),
  "Canvas could not be found"
)

canvas.width = document.body.scrollWidth
canvas.height = document.body.clientHeight

const context = throwIfNull(
  canvas.getContext("2d"),
  "Canvas context is missing!"
)

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
  collision: boolean

  constructor(size: Vector) {
    this.size = size
    this.collision = false
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
          const collider = entity.get(BoxCollider)
          if (collider.collision) {
            color = "purple"
          }
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

        // Round x to zero
        if (velocity.x < 0.2 && velocity.x > -0.2) {
          velocity.x = 0
        }
      })
  }
}

class CollisionSystem extends System {
  // checkCollision(entity: Entity) {
  //   const others = this.scene.entities.filter(
  //     (p) =>
  //       p !== entity && p.hasAll(new Set<Function>([Position, BoxCollider]))
  //   )

  //   const ep = entity.get(Position)
  //   const ec = entity.get(BoxCollider)
  //   ec.collision = Sides.NONE

  //   const rect1 = new Rectangle(new Vector(ep.x, ep.y), ec.size)

  //   others.forEach((other) => {
  //     const op = other.get(Position)
  //     const oc = other.get(BoxCollider)

  //     const rect2 = new Rectangle(new Vector(op.x, op.y), oc.size)

  //     if (rect1.intersects(rect2)) {
  //       if (entity.has(Velocity)) {
  //         const { velocity } = entity.get(Velocity)
  //         if (velocity.x > 0) {
  //           ec.collision = Sides.RIGHT
  //         } else if (velocity.x < 0) {
  //           ec.collision = Sides.LEFT
  //         } else if (velocity.y > 0) {
  //           ec.collision = Sides.BOTTOM
  //         } else if (velocity.y < 0) {
  //           ec.collision = Sides.TOP
  //         }
  //       } else {
  //         // TODO: not sure what to do here
  //         ec.collision = Sides.RIGHT
  //       }
  //     }
  //   })
  // }

  update(): void {
    const entities = this.scene.entities.filter((p) =>
      p.hasAll(new Set<Function>([BoxCollider, Position]))
    )

    // Check collision
    entities.forEach((entity) => {
      if (entity.has(BoxCollider)) {
        const others = this.scene.entities.filter(
          (p) =>
            p !== entity && p.hasAll(new Set<Function>([Position, BoxCollider]))
        )

        const { position: ep } = entity.get(Position)
        const ec = entity.get(BoxCollider)
        ec.collision = false

        const entityRectangle = new Rectangle(ep, ec.size)

        others.forEach((other) => {
          const { position: op } = other.get(Position)
          const oc = other.get(BoxCollider)
          oc.collision = false

          const otherRectangle = new Rectangle(op, oc.size)
          const side = otherRectangle.collidesWith(entityRectangle)
          if (side !== Sides.NONE) {
            ec.collision = true
            oc.collision = true

            if (entity.has(Velocity)) {
              const { velocity } = entity.get(Velocity)
              if (side === Sides.LEFT) {
                ep.x = op.x + oc.size.x
              } else if (side === Sides.RIGHT) {
                ep.x = op.x - ec.size.x
              } else if (side === Sides.TOP) {
                ep.y = op.y + oc.size.y
                velocity.y = 0
              } else if (side === Sides.BOTTOM) {
                ep.y = op.y - ec.size.y
                velocity.y = 0
              }
            }
          }
        })
      }
    })
  }
}

class DebugInfo extends System {
  debug: string[] = []

  update(dt: number) {
    const player = scene.entities.find((p) => p.id === 1)
    if (!player) return

    const { position } = player.get(Position)

    context.fillStyle = "#000000"
    context.font = "14px monospace"
    context.fillText(`position: x=${position.x}, y=${position.y}`, 10, 20)

    const boxCollider = player.get(BoxCollider)
    context.fillText(`collision: ${boxCollider.collision.toString()}`, 10, 40)

    const { velocity } = player.get(Velocity)
    context.fillText(`velocity: x=${velocity.x}, y=${velocity.y}`, 10, 60)

    const input = player.get(Input)
    context.fillText(
      `input: left=${input.left.toString()}, right=${input.right.toString()}, up=${input.up.toString()}, down=${input.down.toString()},`,
      10,
      80
    )
  }
}

/** Scene */

const scene = new Scene()
scene.addSystem(new InputSystem())
scene.addSystem(new MovementSystem())
scene.addSystem(new CollisionSystem())
scene.addSystem(new ShapeRenderer())
scene.addSystem(new DebugInfo())

const player = new Entity(1)
const size = new Vector(32, 32)
player.add(new Position(new Vector(600, 100)))
player.add(new Velocity())
player.add(new Shape(size, "blue"))
player.add(new Input())
player.add(new BoxCollider(size))
scene.addEntity(player)

const boxes = []
function createBox(position: Vector, size: Vector) {
  const id = boxes.length
  const thing = new Entity(id)

  thing.add(new Position(position))
  thing.add(new Shape(size, "green"))
  thing.add(new BoxCollider(size))

  return thing
}

scene
  .addEntity(createBox(new Vector(64, 64 * 6), new Vector(64 * 14, 64)))
  .addEntity(createBox(new Vector(64 * 5, 64 * 3), new Vector(64 * 4, 64)))
  .addEntity(createBox(new Vector(64 * 12, 64 * 5), new Vector(64, 64)))
  .addEntity(createBox(new Vector(64 * 2, 64 * 5), new Vector(64, 64)))

scene.init()

/** Tests */

/** Game loop */

const timer = new Timer((dt: number) => {
  scene.update(dt)
})

timer.start()
