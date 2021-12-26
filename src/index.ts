import throwIfNull from "./lib/throw-if-null.js"
import Vector2 from "./lib/vector2.js"

import { Component, Entity, Scene, System } from "./ecs/index.js"

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

class Position extends Component {
  x: number
  y: number

  constructor(x: number, y: number) {
    super("position")
    this.x = x
    this.y = y
  }
}

class Velocity extends Component {
  speed: number
  vx: number
  vy: number

  constructor(speed: number, vx: number = 0, vy: number = 0) {
    super("velocity")
    this.speed = speed
    this.vx = vx
    this.vy = vy
  }
}

class BoxShape extends Component {
  width: number
  height: number

  constructor(width: number, height: number) {
    super("box-shape")
    this.width = width
    this.height = height
  }
}

class Movable extends Component {
  constructor() {
    super("movable")
  }
}

/** Entities */

class Player extends Entity {}

function createPlayer() {
  const player = new Player()

  player.components.push(new Position(100, 100))
  player.components.push(new Velocity(200))
  player.components.push(new BoxShape(16, 24))
  player.components.push(new Movable())

  return player
}

/** Systems */

class InputSystem extends System {
  private readonly keysPressed = new Set<string>()

  init() {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      this.keysPressed.add(e.key)
    })

    document.addEventListener("keyup", (e: KeyboardEvent) => {
      this.keysPressed.delete(e.key)
    })
  }

  execute() {
    // TODO: filter on entities with velocity
    this.scene.entities.forEach(entity => {
      const movable = entity.getComponent("movable") as Movable
      const velocity = entity.getComponent("velocity") as Velocity
      
      if (movable && velocity) {
        if (this.keysPressed.has("a")) {
          velocity.vx = -1
        } else if (this.keysPressed.has("d")) {
          velocity.vx = 1
        } else {
          velocity.vx = 0
        }

        if (this.keysPressed.has("w")) {
          velocity.vy = -1
        } else if (this.keysPressed.has("s")) {
          velocity.vy = 1
        } else {
          velocity.vy = 0
        }
      }
      
    })
  }
}

class MovementSystem extends System {
  execute(dt: number) {
    // TODO: filter on entities with velocity and position
    this.scene.entities.forEach(entity => {
      const velocity = entity.getComponent("velocity") as Velocity
      const position = entity.getComponent("position") as Position
      
      if (velocity && position) {
        position.x += velocity.vx * velocity.speed * dt
        position.y += velocity.vy * velocity.speed * dt
      }
      
    })
  }
}

class BoxShapeRenderer extends System {
  execute(dt: number) {
    // TODO: filter on entities with box-shape and position
    this.scene.entities.forEach(entity => {
      const position = entity.getComponent("position") as Position
      const boxShape = entity.getComponent("box-shape") as BoxShape

      if (position && boxShape) {
        context.fillStyle = "#ff0000"
        context.fillRect(position.x, position.y, boxShape.width, boxShape.height)
      }
      
    })
  }
}

/** Setup scene */

const scene = new Scene()
scene.systems.push(new InputSystem(scene))
scene.systems.push(new MovementSystem(scene))
scene.systems.push(new BoxShapeRenderer(scene))

const player = createPlayer()
scene.entities.push(player)

// TODO: init system in scene.regiser ?
scene.systems.forEach(system => {
  system.init()
})

/** Game loop */

let lastTime = 0
function loop(time: number) {
  const deltaTime = (time - lastTime) / 1000
  lastTime = time

  context.clearRect(0, 0, canvas.width, canvas.height)

  // ...
  scene.systems.forEach((system) => {
    system.execute(deltaTime)
  })

  requestAnimationFrame(loop)
}

loop(0)
