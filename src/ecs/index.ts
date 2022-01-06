export class Component {}

type ComponentClass<T extends Component> = new (...args: any[]) => T

export class Entity {
  id: number
  private components = new Map<Function, Component>()

  constructor(id: number) {
    this.id = id
  }

  public add(component: Component): Entity {
    this.components.set(component.constructor, component)
    return this
  }

  public get<T extends Component>(componentClass: ComponentClass<T>): T {
    return this.components.get(componentClass) as T
  }

  // TODO: add convenient method for fetching multiple components
  // public getM<T extends Component>(css: ComponentClass<T>[]): T[] {
  //   return css.map((cs) => this.map.get(cs) as T)
  // }

  public has(componentClass: Function): boolean {
    return this.components.has(componentClass)
  }

  public hasAll(componentClasses: Iterable<Function>): boolean {
    for (let cls of componentClasses) {
      if (!this.components.has(cls)) {
        return false
      }
    }
    return true
  }

  public delete(componentClass: Function): void {
    this.components.delete(componentClass)
  }
}

export abstract class System {
  public scene!: Scene
  init(): void {}
  abstract update(dt: number): void
}

export class Scene {
  gravity = 40
  entities: Entity[] = []

  // TODO: create systems with components to monitor ? need to update systems alot ?
  // new Map<System, Set<Component>>()
  private systems: System[] = []

  public addEntity(entity: Entity): Scene {
    this.entities.push(entity)
    return this
  }

  // TODO: https://maxwellforbes.com/posts/typescript-ecs-implementation
  // public removeEntity(entity: Entity): Scene {
  //   this.entities.push(entity)
  //   return this
  // }

  // TODO: validate system, needs componentsRequired and more ?
  public addSystem(system: System): Scene {
    system.scene = this
    this.systems.push(system)
    return this
  }

  public init(): void {
    this.systems.forEach((system) => system.init())
  }

  public update(dt: number): void {
    this.systems.forEach((system) => system.update(dt))

    // TODO: https://maxwellforbes.com/posts/typescript-ecs-implementation
    // this.entitiesToDestroy.forEach(entity => )
  }
}
