import { Component, Entity, Scene, System } from "./ecs/ecs2.js"
import { AABBCollision, Rectangle } from "./lib/aabbcollision.js"
import { randomBetween } from "./lib/random.js"
import throwIfNull from "./lib/throw-if-null.js"

/** Canvas */

const canvas = throwIfNull(
  document.body.querySelector<HTMLCanvasElement>("#canvas1"),
  "Canvas could not be found"
)

canvas.width = 800
canvas.height = 600

const context = throwIfNull(
  canvas.getContext("2d"),
  "Canvas context is missing!"
)

/** Components */

class Position implements Component {
  constructor(public x: number, public y: number) {}
}

class Velocity implements Component {
  speed = 200
  constructor(public x: number, public y: number) {}
}

class Movable implements Component {}

class Collider implements Component {
  constructor(
    public width: number,
    public height: number,
    public isColliding: boolean = false
  ) {}
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
    this.scene.entities
      .filter((p) => p.hasAll(new Set<Function>([Velocity])))
      .forEach((entity) => {
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

        if (entity.has(Collider)) {
          const collider = entity.get(Collider)

          if (collider.isColliding) {
            context.strokeStyle = "#FFFF00"
            context.lineWidth = 2
            context.strokeRect(position.x, position.y, collider.width, collider.height)
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
  update(dt: number): void {
    const entities = this.scene.entities.filter((p) =>
      p.hasAll(new Set<Function>([Collider, Position]))
    )

    entities.forEach((entity) => {
      const myCollider = entity.get(Collider)
      const myPosition = entity.get(Position)
      const rect1: Rectangle = {
        ...myPosition,
        w: myCollider.width,
        h: myCollider.height,
      }

      entities
        .filter((p) => p !== entity)
        .forEach((other) => {
          const otherCollider = other.get(Collider)
          const otherPosition = other.get(Position)

          const rect2: Rectangle = {
            ...otherPosition,
            w: otherCollider.width,
            h: otherCollider.height,
          }

          // TODO: hmm, maybe set isColliding = false another place ?
          if (AABBCollision(rect1, rect2)) {
            myCollider.isColliding = true
          } else {
            myCollider.isColliding = false
          }
        })
    })
  }
}

/** Init scene */

const scene = new Scene()

const player = new Entity()
player.add(new Position(100, 100))
player.add(new Velocity(0, 0))
player.add(new Shape(32, 32, "red"))
player.add(new Movable())
player.add(new Collider(32, 32))
scene.addEntity(player)

function createThing() {
  const thing = new Entity()
  
  const width = randomBetween(10, 50)
  const height = randomBetween(10, 50)
  const x = randomBetween(0, canvas.width - width)
  const y = randomBetween(0, canvas.height - height)

  console.log(x, y, width, height);
  
  thing.add(new Position(x, y))
  thing.add(new Shape(width, height))
  thing.add(new Collider(width, height))
  return thing
}

scene.addEntity(createThing())
scene.addEntity(createThing())
scene.addEntity(createThing())
scene.addEntity(createThing())

scene.addSystem(new InputSystem(scene))
scene.addSystem(new Renderer(scene))
scene.addSystem(new MovementSystem(scene))
scene.addSystem(new CollisionSystem(scene))

/** Tests */

const test = scene.entities.filter((p) =>
  p.hasAll(new Set<Function>([Position]))
)
console.log(test)

/** Game loop */

let lastTime = 0
function loop(time: number) {
  const deltaTime = (time - lastTime) / 1000
  lastTime = time

  context.clearRect(0, 0, canvas.width, canvas.height)

  scene.update(deltaTime)

  requestAnimationFrame(loop)
}

// loop(0)
