import { Context } from "../ecs/context.js"
import { Component, Entity, Scene, System } from "../ecs/index.js"
import { clamp } from "../ecs/lib/clamp.js"
import { Rectangle, Sides } from "../ecs/lib/rectangle.js"
import Vector from "../ecs/lib/vector2.js"
import Timer from "../ecs/timer.js"

/** Canvas */
const { canvas, context } = new Context()

/** Components */

class Transform implements Component {
  position: Vector
  size: Vector

  constructor(position: Vector = Vector.ZERO, size: Vector) {
    this.position = position
    this.size = size
  }
}

class Velocity implements Component {
  speed: number
  velocity: Vector

  constructor(velocity: Vector = Vector.ZERO, speed: number = 50) {
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
  offset: Vector
  collision: Sides

  constructor(size: Vector) {
    this.offset = new Vector(4, 4)
    this.size = size
    this.collision = Sides.NONE
  }
}

class Shape implements Component {
  color: string
  constructor(color: string = "gray") {
    this.color = color
  }
}

class Jump implements Component {
  // jumpPressedTimer: number
  onGroundTimer: number
  canJump: boolean
  count: number
  maxCount: number
  // duration: number
  velocity: number
  // engagedTime: number
  // speedBoost: number // velocity.x can improve jump!

  constructor() {
    // this.jumpPressedTimer = 0
    this.onGroundTimer = 0
    this.canJump = false
    this.count = 0
    this.maxCount = 2

    // this.duration = 0.3
    this.velocity = 600
    // this.engagedTime = 0
    // this.speedBoost = 0.3
  }
}

/** Systems */

class ShapeRenderer extends System {
  public update(dt: number): void {
    context.clearRect(0, 0, canvas.width, canvas.height)

    this.scene.entities
      // TODO: simplify filter ? p.hasAll([Position, Shape])
      .filter((p) => p.hasAll(new Set<Function>([Transform, Shape])))
      .forEach((entity) => {
        const { position, size } = entity.get(Transform)
        const { color } = entity.get(Shape)

        context.fillStyle = color
        context.fillRect(position.x, position.y, size.x, size.y)
      })
  }
}

class CollisionRenderer extends System {
  public update(dt: number): void {
    this.scene.entities
      .filter((p) => p.hasAll(new Set<Function>([Transform, BoxCollider])))
      .forEach((entity) => {
        const { position } = entity.get(Transform)
        const { collision, size } = entity.get(BoxCollider)
        if (collision !== Sides.NONE) {
          context.fillStyle = "rgba(0, 0, 0, 0.5)"
          context.fillRect(position.x, position.y, size.x, size.y)
        }
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
      .filter((p) => p.hasAll(new Set<Function>([Transform, Velocity])))
      .forEach((entity) => {
        const { position } = entity.get(Transform)
        const { speed, velocity } = entity.get(Velocity)

        if (entity.has(Input)) {
          const input = entity.get(Input)

          if (input.left) {
            velocity.x -= speed
          }

          if (input.right) {
            velocity.x += speed
          }
        }

        velocity.y += this.scene.gravity

        // Drag
        velocity.x *= 0.85

        // Clamp
        velocity.x = clamp(velocity.x, -750, 750)
        velocity.y = clamp(velocity.y, -750, 750)

        // Round x to zero
        if (velocity.x < 0.2 && velocity.x > -0.2) {
          velocity.x = 0
        }

        position.x += velocity.x * dt
        position.y += velocity.y * dt
      })
  }
}

class JumpSystem extends System {
  update(dt: number): void {
    this.scene.entities
      .filter((p) => p.hasAll(new Set<Function>([Velocity, Jump])))
      .forEach((entity) => {
        const { velocity } = entity.get(Velocity)
        const { collision } = entity.get(BoxCollider)
        const jump = entity.get(Jump)

        if (collision === Sides.BOTTOM) {
          jump.count = 0
          jump.onGroundTimer = 0.1
        } else {
          jump.onGroundTimer -= dt
        }

        jump.canJump = jump.onGroundTimer > 0 || jump.count < jump.maxCount// TODO: later ... maybe || isClimbing

        if (entity.has(Input)) {
          const input = entity.get(Input)
          if (input.up && jump.canJump) {
            jump.count++
            velocity.y = -jump.velocity
          }
        }
      })
  }
}

class PhysicsSystem extends System {
  checkCollision(entity: Entity) {
    if (entity.has(BoxCollider)) {
      const entityTransform = entity.get(Transform)
      const entityCollider = entity.get(BoxCollider)
      const entityRectangle = new Rectangle(
        entityTransform.position,
        entityCollider.size
      )
      entityCollider.collision = Sides.NONE

      const others = this.scene.entities.filter(
        (p) =>
          p !== entity && p.hasAll(new Set<Function>([Transform, BoxCollider]))
      )
      others.forEach((other) => {
        const otherTransform = other.get(Transform)
        const otherCollider = other.get(BoxCollider)
        const otherRectangle = new Rectangle(
          otherTransform.position,
          otherCollider.size
        )

        otherCollider.collision = Sides.NONE
        const side = otherRectangle.collidesWith(entityRectangle)
        if (side !== Sides.NONE) {
          entityCollider.collision = side

          const { velocity } = entity.get(Velocity)
          if (side === Sides.LEFT) {
            otherCollider.collision = Sides.RIGHT
            entityTransform.position.x =
              otherTransform.position.x + otherCollider.size.x
            velocity.x = 0
          } else if (side === Sides.RIGHT) {
            otherCollider.collision = Sides.LEFT
            entityTransform.position.x =
              otherTransform.position.x - entityCollider.size.x
            velocity.x = 0
          } else if (side === Sides.TOP) {
            otherCollider.collision = Sides.BOTTOM
            entityTransform.position.y =
              otherTransform.position.y + otherCollider.size.y
            velocity.y = 0
          } else if (side === Sides.BOTTOM) {
            otherCollider.collision = Sides.TOP
            entityTransform.position.y =
              otherTransform.position.y - entityCollider.size.y
            velocity.y = 0
          }
        }
      })
    }
  }

  update(): void {
    const entities = this.scene.entities.filter((p) =>
      p.hasAll(new Set<Function>([BoxCollider, Transform, Velocity]))
    )

    entities.forEach((entity) => this.checkCollision(entity))
  }
}

class DebugInfo extends System {
  debug: string[] = []

  update(dt: number) {
    const player = this.scene.entities.find((p) => p.id === 1)
    if (!player) return

    const { position } = player.get(Transform)

    context.font = "14px monospace"
    context.fillStyle = "#000000"
    context.textAlign = "left"
    context.textBaseline = "top"
    context.fillText(`position: x=${position.x}, y=${position.y}`, 20, 20)

    const { velocity, speed } = player.get(Velocity)
    context.fillText(`velocity: x=${velocity.x}, y=${velocity.y}`, 20, 40)
    context.fillText(`speed: ${speed}`, 20, 60)
    
    const {collision } = player.get(BoxCollider)
    context.fillText(`collision: ${collision}`, 20, 80)

    const jump = player.get(Jump)
    context.fillText(`jump: canJump=${jump.canJump}, count=${jump.count}, maxCount=${jump.maxCount}, onGroundTimer=${jump.onGroundTimer}`, 20, 100)

    // this.scene.entities.forEach((entity, i) => {
    //   const { collision } = entity.get(BoxCollider)
    //   context.fillText(
    //     `#${entity.id} collision: ${collision.toString()}`,
    //     20,
    //     80 + i * 20
    //   )
    // })

    this.scene.entities
      .filter((p) => p.hasAll(new Set<Function>([Transform, Shape])))
      .forEach((entity) => {
        const { position, size } = entity.get(Transform)

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
  .addSystem(new JumpSystem())
  .addSystem(new MovementSystem())
  .addSystem(new PhysicsSystem())
  .addSystem(new ShapeRenderer())
  .addSystem(new CollisionRenderer())
  .addSystem(new DebugInfo())

function createPlayer() {
  const player = new Entity(1)
  player
    .add(new Transform(new Vector(64 * 10, 64 * 9), new Vector(32, 32)))
    .add(new Velocity())
    .add(new Shape("blue"))
    .add(new Input())
    .add(new BoxCollider(new Vector(24, 24)))
    .add(new Jump())
  return player
}

function createBox(id: number, position: Vector, size: Vector) {
  const thing = new Entity(id)

  thing.add(new Transform(position, size))
  thing.add(new Shape("green"))
  thing.add(new BoxCollider(size))

  return thing
}

scene.addEntity(createPlayer())

scene
  .addEntity(createBox(3, new Vector(64 * 5, 64 * 7), new Vector(64 * 4, 64)))
  .addEntity(createBox(4, new Vector(64 * 11, 64 * 9), new Vector(64, 64)))
  .addEntity(createBox(5, new Vector(64 * 13, 64 * 8.5), new Vector(64, 64 * 1.5)))
  .addEntity(createBox(6, new Vector(64 * 15, 64 * 8), new Vector(64, 64 * 2)))
  .addEntity(createBox(7, new Vector(64 * 2, 64 * 9), new Vector(64, 64)))
  .addEntity(createBox(2, new Vector(64, 64 * 10), new Vector(64 * 16, 64)))

scene.init()

/** Game loop */

const timer = new Timer((dt: number) => {
  scene.update(dt)
})
timer.start()
