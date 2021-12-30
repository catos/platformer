import { Component, Entity, Scene, System } from "./ecs/index.js"
import { AABBCollision, Rectangle } from "./lib/aabbcollision.js"
import { randomBetween } from "./lib/random.js"
import throwIfNull from "./lib/throw-if-null.js"
import Vector2 from "./lib/vector2.js"

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

/** Types and enums */

export enum Sides {
  NONE = 0,
  TOP = 1,
  BOTTOM = 2,
  LEFT = 3,
  RIGHT = 4,
}

/** Components */

class Position implements Component {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class Velocity implements Component {
  speed = 100
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class Movable implements Component {}

class BoxCollider implements Component {
  size: Vector2
  // TODO: offset: Vector2
  collision: Sides

  constructor(size: Vector2) {
    this.size = size
    this.collision = Sides.NONE
  }
}

class Shape implements Component {
  constructor(
    public width: number,
    public height: number,
    public color: string = "gray"
  ) {}
}

/** Systems */

class MovementSystem extends System {
  public update(dt: number): void {
    const entities = this.scene.entities.filter((p) =>
      p.hasAll(new Set<Function>([Position, Velocity]))
    )

    entities.forEach((entity) => {
      const position = entity.get(Position)
      const velocity = entity.get(Velocity)

      position.x += velocity.x * velocity.speed * dt
      position.y += velocity.y * velocity.speed * dt
    })
  }
}

class Renderer extends System {
  public update(dt: number): void {
    this.scene.entities
      // TODO: simplify filter ? p.hasAll([Position, Shape])
      .filter((p) => p.hasAll(new Set<Function>([Position, Shape])))
      .forEach((entity) => {
        const position = entity.get(Position)
        const shape = entity.get(Shape)

        context.fillStyle = shape.color
        context.fillRect(position.x, position.y, shape.width, shape.height)

        if (entity.has(BoxCollider)) {
          const collider = entity.get(BoxCollider)

          if (collider.collision) {
            context.strokeStyle = "#0000ff"
            context.lineWidth = 2
            context.strokeRect(
              position.x,
              position.y,
              collider.size.x,
              collider.size.y
            )
          }
        }
      })
  }
}

class InputSystem extends System {
  private readonly keysPressed = new Set<string>()

  constructor(scene: Scene) {
    super(scene)

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      this.keysPressed.add(e.key)
    })

    document.addEventListener("keyup", (e: KeyboardEvent) => {
      this.keysPressed.delete(e.key)
    })
  }

  // TODO: move logic outside update (it is laggy?), run in event-handler ?
  update() {
    this.scene.entities
      .filter((p) => p.hasAll(new Set<Function>([Position, Movable])))
      .forEach((entity) => {
        const velocity = entity.get(Velocity)
        if (velocity) {
          if (this.keysPressed.has("a")) {
            velocity.x = -1
          } else if (this.keysPressed.has("d")) {
            velocity.x = 1
          } else {
            velocity.x = 0
          }

          if (this.keysPressed.has("w")) {
            velocity.y = -1
          } else if (this.keysPressed.has("s")) {
            velocity.y = 1
          } else {
            velocity.y = 0
          }
        }
      })
  }
}

class CollisionSystem extends System {
  checkCollision(entity: Entity, others: Entity[]) {
    const ep = entity.get(Position)
    const ec = entity.get(BoxCollider)
    ec.collision = Sides.NONE

    const rect1: Rectangle = {
      x: ep.x,
      y: ep.y,
      w: ec.size.x,
      h: ec.size.y,
    }

    others.forEach((other) => {
      const op = other.get(Position)
      const oc = other.get(BoxCollider)
      // oc.collision = Sides.NONE

      const rect2: Rectangle = {
        x: op.x,
        y: op.y,
        w: oc.size.x,
        h: oc.size.y,
      }

      if (AABBCollision(rect1, rect2)) {
        ec.collision = Sides.LEFT
        // oc.collision = Sides.LEFT
        return true
      }
    })

    return false
  }

  update(dt: number): void {
    const entities = this.scene.entities.filter((p) =>
      p.hasAll(new Set<Function>([BoxCollider, Position]))
    )

    entities.forEach((entity) => {
      const ep = entity.get(Position)
      const ec = entity.get(BoxCollider)
      ec.collision = Sides.NONE

      const rect1: Rectangle = {
        x: ep.x,
        y: ep.y,
        w: ec.size.x,
        h: ec.size.y,
      }

      entities
        .filter((p) => p !== entity)
        .forEach((other) => {
          const op = other.get(Position)
          const oc = other.get(BoxCollider)

          const rect2: Rectangle = {
            x: op.x,
            y: op.y,
            w: oc.size.x,
            h: oc.size.y,
          }

          // Check for collision
          const others = this.scene.entities.filter(
            (p) =>
              p !== entity &&
              p.hasAll(new Set<Function>([Position, BoxCollider]))
          )

          if (this.checkCollision(entity, others)) {
            console.log(`collision between ${entity.id} and someone...`)
          }
        })
    })
  }
}

class DebugInfo extends System {
  debug: Map<string, string> = new Map()

  update(dt: number) {
    scene.entities.forEach((entity, index) => {
      const position = entity.get(Position)

      this.debug.set(
        `#${entity.id} position`,
        `x=${Math.round(position.x)}, y=${Math.round(position.y)}`
      )

      const boxCollider = entity.get(BoxCollider)
      this.debug.set(
        `#${entity.id} collision`,
        boxCollider.collision.toString()
      )

      if (entity.has(Velocity)) {
        const velocity = entity.get(Velocity)
        this.debug.set(
          `#${entity.id} velocity`,
          `x=${Math.round(velocity.x)}, y=${Math.round(velocity.y)}`
        )
      }
    })

    let lineHeight = 18

    context.fillStyle = "#33333366"
    context.fillRect(0, 0, canvas.width, this.debug.size * lineHeight + 10)

    context.fillStyle = "#000000"
    context.font = "14px monospace"

    let index = 1
    this.debug.forEach((value, key) => {
      context.fillText(`${key}: ${value}`, 10, lineHeight * index)

      index++
    })
  }
}

/** Init scene */

const scene = new Scene()

const player = new Entity(1)

const x = 200
const y = 200
const width = 16
const height = 24
const size = new Vector2(width, height)

player.add(new Position(x, y))
player.add(new Velocity(0, 0))
player.add(new Shape(width, height, "red"))
player.add(new Movable())
player.add(new BoxCollider(size))
scene.addEntity(player)

function createThing(id: number, x: number, y: number) {
  const thing = new Entity(id)

  const width = 20
  const height = 20
  const size = new Vector2(width, height)

  thing.add(new Position(x, y))
  thing.add(new Shape(width, height))
  thing.add(new BoxCollider(size))

  // if (randomBetween(0, 3) === 3) {
  //   thing.add(new Velocity(1, 0))
  // }

  return thing
}

scene.addEntity(createThing(2, 210, 210))
scene.addEntity(createThing(3, 225, 225))
scene.addEntity(createThing(4, 225, 325))
scene.addEntity(createThing(4, 325, 425))

scene.addSystem(new InputSystem(scene))
scene.addSystem(new MovementSystem(scene))
scene.addSystem(new Renderer(scene))
scene.addSystem(new CollisionSystem(scene))
scene.addSystem(new DebugInfo(scene))

/** Tests */

// ...

/** Game loop */

let lastTime = 0
function loop(time: number) {
  const deltaTime = (time - lastTime) / 1000
  lastTime = time

  context.clearRect(0, 0, canvas.width, canvas.height)

  scene.update(deltaTime)

  requestAnimationFrame(loop)
}

loop(0)
