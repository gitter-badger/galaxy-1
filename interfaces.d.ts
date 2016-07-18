

/// <reference path="typings/index.d.ts" />

declare namespace Galactic {

  export interface Service {
    
  }

  export interface Runtime extends NodeJS.EventEmitter {
    getComponent(name: string): Component
    getService(name: string): Service
    createEntity(name: string, ...args)
    getProviders(serviceName: string)
  }

  export interface Component {
    name: string
    loaded: boolean
    enabled: boolean
    locked: boolean
  }

}
