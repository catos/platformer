import Player from "./player"

const throwIfNull = <T>(value: T | null, failureMessage: string) => {
  if (value === null) {
    throw new Error(failureMessage)
  }

  return value
}

const canvas = throwIfNull(
  document.body.querySelector<HTMLCanvasElement>("#canvas1"),
  "Canvas could not be found"
)

const context = throwIfNull(
  canvas.getContext("2d"),
  "Canvas context is missing!"
)

// ---------------------------------------------

const player = new Player(canvas.width / 2 - 50, canvas.height - 50)

// ---------------------------------------------

let lastTime = 0
function loop(time: number) {
  const deltaTime = (time - lastTime) / 1000
  lastTime = time

  context.clearRect(0, 0, canvas.width, canvas.height)

  
  // ...
  player.update(deltaTime)
  player.draw(context)

  requestAnimationFrame(loop)
}

// loop(0)

