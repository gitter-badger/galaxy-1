
declare namespace Galactic {

  export interface Service {
    
  }

  export interface Runtime {
    getComponent(name: string): Component
    getService(name: string): Service
    createEntity(name: string, ...args)
  }

  export interface Component {
    name: string
    loaded: boolean
    enabled: boolean
    locked: boolean
  }

}
