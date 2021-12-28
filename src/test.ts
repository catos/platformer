import { Component, Entity, Scene, System } from "./ecs/ecs2.js"
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

/** Init scene */

const scene = new Scene()

const player = new Entity()
player.add(new Position(100, 100))
player.add(new Velocity(0, 0))
player.add(new Shape(32, 32, "red"))
player.add(new Movable())

const thing = new Entity()
thing.add(new Position(256, 256))
thing.add(new Shape(64, 64))

scene.addEntity(player)
scene.addEntity(thing)
scene.addSystem(new InputSystem(scene))
scene.addSystem(new Renderer(scene))
scene.addSystem(new MovementSystem(scene))

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

loop(0)
