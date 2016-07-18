
/// <reference path="typings/index.d.ts" />

import { EventEmitter } from "events"
import { Component } from "./component"
import { ServiceExplorer } from "./explorer"

// TODO: add isInstanciated()-method
export class Service extends EventEmitter {

  runtime: Galactic.Runtime
  component: Component
  name: string
  explorer: ServiceExplorer
  instance: Object | null = null

  autoload: boolean = false

  componentInstances = new Map<string, Object>()
  dependants = new Set<string>()
  providers = new Set<Provider>()
  serviceListeners = new Map<string | Symbol, {
    [index: number]: string
  }[]>()

  setAutoload(autoload: boolean) {
    if (this.autoload !== autoload) {
      this.autoload = autoload
      if (autoload && this.explorer.isInstanciable(this.runtime))
        this.getSelf()
    }
  }

  triggerServiceDiscovery(service) {
    if (this.instance === null
        && this.explorer.isInstanciable(this.runtime)
        && this.autoload === true)
      this.getSelf()
    if (this.instance !== null) {
      //}
    }
  }

  tryDiscoverPluggable() {
    const methods = this.explorer.metadata.methods
    methods.forEach((params, key) => {
      const methodDependenciesMet = () => {
        for (const index of Object.keys(params))
          if (!this.runtime.hasService(params[index]))
            return false
        return true
      }
      if (methodDependenciesMet()) {
        const args = []
        for (const index of Object.keys(params))
          args.push(this.runtime.getServiceInstance(params[index], this.component))
        this.instance[key].apply(this.instance, args)
      }
    })
  }
  
  registerProvider(provider) {
    if (this.instance === null)
      throw new Error(`service not ready to recieve providers`)
    if (typeof this.instance.registerProvider === 'function')
      this.instance.registerProvider(provider)
    else
      this.runtime.emit('skipped provider registration', provider)
  }

  unregisterProvider(provider) {
    if (this.instance === null)
      throw new Error(`service not ready to recieve providers`)
    if (typeof this.instance.unregisterProvider === 'function')
      this.instance.unregisterProvider(provider)
    else
      this.runtime.emit('skipped provider deregistration', provider)
  }

  triggerServiceInstanciationDiscovery(service) {
    if (this.instance !== null)
      this.tryDiscoverPluggable()
  }

  selfInstanciable() {
    return this.explorer.serviceDependenciesMet(this.runtime)
  }

  constructor(runtime, name, component, explorer) {
    super()
    this.runtime = runtime
    this.name = name
    this.component = component
    this.explorer = explorer
  }

  getSelf() {
    if (this.instance === null) {
      this.instance = this.explorer.createInstance(this.runtime, this.component, [])
      this.runtime.triggerServiceInstanciationDiscovery(this)
      this.tryDiscoverPluggable()
      this.emit('loaded')
      this.runtime.emit('service loaded', this)
    }
    return this.instance
  }

  forComponent(component, runtime) {
    const service = this.getSelf()
    if (this.instance.provide !== undefined) {
      if (!this.componentInstances.has(component.name))
        this.componentInstances.set(component.name, this.instance.provide(component))
      return this.componentInstances.get(component.name)
    } else 
      return this.instance
  }
}

export class Provider {

  runtime: Galactic.Runtime
  component: Component
  serviceName: string
  instance: Object | null = null
  explorer: ServiceExplorer
  arguments: IArguments

  constructor(runtime, serviceName, component, explorer, data) {
    this.runtime = runtime
    this.serviceName = serviceName
    this.explorer = explorer
    this.component = component
    this.arguments = data
  }

  getInstance() {
    console.log('here')
    if (this.instance === null)
      this.instance = this.explorer.createInstance(this.runtime, this.component, [])
    return this.instance
  }

}

