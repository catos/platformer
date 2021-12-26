export class Scene {
    constructor() {
        // TODO: register & unregister (and implement chaining?)
        this.systems = [];
        this.entities = [];
    }
}
export class System {
    constructor(scene) {
        this.scene = scene;
    }
    init() { }
}
export class Entity {
    constructor() {
        this.components = [];
    }
    getComponent(name) {
        return this.components.find(p => p.name === name);
    }
}
export class Component {
    constructor(name) {
        this.name = name;
    }
}
