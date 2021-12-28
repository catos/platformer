export class Component {}

type ComponentClass<T extends Component> = new (...args: any[]) => T

export class Entity {
  id: number
  private map = new Map<Function, Component>()

  constructor(id: number) {
    this.id = id
  }

  public add(component: Component): void {
    this.map.set(component.constructor, component)
  }

  public get<T extends Component>(componentClass: ComponentClass<T>): T {
    return this.map.get(componentClass) as T
  }

  // TODO: add convenient method for fetching multiple components
  // public getM<T extends Component>(css: ComponentClass<T>[]): T[] {
  //   return css.map((cs) => this.map.get(cs) as T)
  // }

  public has(componentClass: Function): boolean {
    return this.map.has(componentClass)
  }

  public hasAll(componentClasses: Iterable<Function>): boolean {
    for (let cls of componentClasses) {
      if (!this.map.has(cls)) {
        return false
      }
    }
    return true
  }

  public delete(componentClass: Function): void {
    this.map.delete(componentClass)
  }
}

export abstract class System {
  constructor(protected scene: Scene) {}
  abstract update(dt: number): void
}

export class Scene {
  
  debug: Map<string, string> = new Map()
  entities: Entity[] = []

  // TODO: create systems with components to monitor ? need to update systems alot ?
  // new Map<System, Set<Component>>()
  private systems: System[] = []

  // TODO: add validation ?
  public addEntity(entity: Entity) {
    this.entities.push(entity)
  }

  // TODO: validate system, needs componentsRequired and more ?
  public addSystem(system: System): void {
    this.systems.push(system)
  }

  public update(dt: number): void {
    this.systems.forEach((system) => system.update(dt))
  }
}
