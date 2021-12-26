export class Scene {
  // TODO: register & unregister (and implement chaining?)
  systems: System[] = []
  entities: Entity[] = []
}

export abstract class System {
  protected readonly scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  init() {}
  abstract execute(deltaTime: number): void
}

export abstract class Entity {
  components: Component[] = []

  getComponent(name: string): Component | undefined {
    return this.components.find(p => p.name === name)
  }
}

export abstract class Component {
  name: string

  constructor(name: string) {
    this.name = name
  }
}
