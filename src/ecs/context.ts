import throwIfNull from "./lib/throw-if-null.js"

export class Context {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D 

  constructor(width?: number, height?: number) {
    this.canvas = throwIfNull(
      document.body.querySelector<HTMLCanvasElement>("#canvas1"),
      "Canvas could not be found"
    )
    
    this.canvas.width = width ?? document.body.scrollWidth
    this.canvas.height = height ?? document.body.clientHeight
    
    this.context = throwIfNull(
      this.canvas.getContext("2d"),
      "Canvas context is missing!"
    )

  }
}
