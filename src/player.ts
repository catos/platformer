export default class Player {
  x: number
  y: number
  width = 16
  height = 24
  speed = 200

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    
  }

  update(deltaTime: number) {
    // this.x += (this.speed * deltaTime)
    // this.y -= (this.speed * deltaTime)
  }
  
  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = "#ff0000"
    context.fillRect(this.x, this.y, this.width, this.height)
  }
}