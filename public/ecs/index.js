export class Component {
}
export class Entity {
    constructor(id) {
        this.components = new Map();
        this.id = id;
    }
    add(component) {
        this.components.set(component.constructor, component);
    }
    get(componentClass) {
        return this.components.get(componentClass);
    }
    // TODO: add convenient method for fetching multiple components
    // public getM<T extends Component>(css: ComponentClass<T>[]): T[] {
    //   return css.map((cs) => this.map.get(cs) as T)
    // }
    has(componentClass) {
        return this.components.has(componentClass);
    }
    hasAll(componentClasses) {
        for (let cls of componentClasses) {
            if (!this.components.has(cls)) {
                return false;
            }
        }
        return true;
    }
    delete(componentClass) {
        this.components.delete(componentClass);
    }
}
export class System {
    constructor(scene) {
        this.scene = scene;
    }
}
export class Scene {
    constructor() {
        this.gravity = 2;
        this.entities = [];
        // TODO: create systems with components to monitor ? need to update systems alot ?
        // new Map<System, Set<Component>>()
        this.systems = [];
    }
    // TODO: add validation ?
    addEntity(entity) {
        this.entities.push(entity);
    }
    // TODO: validate system, needs componentsRequired and more ?
    addSystem(system) {
        this.systems.push(system);
    }
    update(dt) {
        this.systems.forEach((system) => system.update(dt));
    }
}
