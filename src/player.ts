export default class Player {
  x: number
  y: number
  speed = 200

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  update(deltaTime: number) {
    this.x += (this.speed * deltaTime)
    this.y -= (this.speed * deltaTime)
  }
  
  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = "#aaccee"
    context.fillRect(this.x, this.y, 100, 100)
  }
}