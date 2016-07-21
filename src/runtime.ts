
/// <reference path="typings/index.d.ts" />

import * as vm from "vm"
import * as _ from "lodash"
import * as fs from "fs"
import * as path from "path"
import { EventEmitter } from "events"
import { NamedSet } from "sync-containers"
import * as createDebug from "debug"
import { readJSON, resolveModule } from "./common"
import { Service, Provider } from "./service"
import { Component } from "./component"
import { WrapperType } from "./common"
import { NodeVM } from "vm-plus"

function packageStem(name: string) {
  return name.substring(name.indexOf('/')+1)
}


export class Runtime extends EventEmitter {

  name: string
  componentsDir: string
  context: Object
  vm: VM
  required: string[]
  globalName: string
  saveEnabled: boolean
  debug: (msg: string) => any

  require: NodeRequireVMPlugin

  components = new Map<string, Component>()
  services = new Map<string, Service>()
  entities = new Map<string, Galactic.ServiceExplorer>()
  targetToEntity = new Map<Function, Galactic.ServiceExplorer>()
  //discoverers = new Map<Function, Map<string | Symbol, {
    //arguments: { [pos: number]: string }
    //method: Function
  //}>>()
  serviceListeners = new Map<string, Set<Service>>()
  serviceInstanciationListeners = new Map<string, Set<Service>>()
  providers = new Map<string, Set<Provider>>()

  /**
   * Notifies all service listeners that a new service became available,
   * which could get instanciated.
   */
  triggerServiceDiscovery(service) {
    const listeners = this.serviceListeners.get(service.name)
    if (listeners !== undefined) {
      listeners.forEach(listeningService => {
        listeningService.triggerServiceDiscovery(service)
      })
    }
  }

  /**
   * Notifies all service instanciation listeners that a service has been
   * instanciated.
   */
  triggerServiceInstanciationDiscovery(service) {

    const providers = this.providers.get(service.name)
    if (providers !== undefined) {
      providers.forEach(provider => {
        service.registerProvider(provider)
      })
    }

    const listeners = this.serviceInstanciationListeners.get(service.name)
    if (listeners !== undefined) {
      listeners.forEach(listeningService => {
        listeningService.triggerServiceInstanciationDiscovery(service)
      })
    }
  }

  addServiceListener(serviceName: string, triggerable) {
    if (!this.serviceListeners.has(serviceName))
      this.serviceListeners.set(serviceName, new Set())
    this.serviceListeners.get(serviceName).add(triggerable)
  }

  addServiceInstanciationListener(serviceName: string, triggerable) {
    if (!this.serviceInstanciationListeners.has(serviceName))
      this.serviceInstanciationListeners.set(serviceName, new Set())
    this.serviceInstanciationListeners.get(serviceName).add(triggerable)
  }

  // TODO: add constructor support
  addService(name: string, component, explorer) {

    if (this.services.has(name))
      throw new Error(`service name '${name}' already taken`)

    const service = new Service(this, name, component, explorer)

    explorer.metadata.keys.forEach((serviceName, key) => {
      if (this.hasService(serviceName))
        service.triggerServiceDiscovery(this.getService(serviceName))
      this.addServiceListener(serviceName, service)
    })
    explorer.metadata.methods.forEach((params, key) => {
      for (const index of Object.keys(params)) {
        this.addServiceInstanciationListener(params[index], service)
      }
    })
    this.services.set(name, service)
    this.triggerServiceDiscovery(service)
    this.services.forEach(serviceToCheck => {
      if (serviceToCheck.instance !== null)
        service.triggerServiceInstanciationDiscovery(serviceToCheck)
    })

    return service
  }

  addProvider(serviceName, component, explorer, args) {
    if (!this.providers.has(serviceName))
      this.providers.set(serviceName, new Set())
    const providers = this.providers.get(serviceName)
    const provider = new Provider(this, serviceName, component, explorer, args)
    providers.add(provider)
    const service = this.services.get(serviceName)
    if (service !== undefined && service.instance !== null)
      service.registerProvider(provider)
    return provider
  }

  addEntity(component, explorer, name) {
    this.targetToEntity.set(explorer.target, explorer)
    if (name !== undefined) {
      if (this.entities.has(name))
        throw new Error(`entity name '${name}' already taken`)
      this.entities.set(name, explorer)
    }
  }

  createEntity(targetOrEntityName) {
    function create(explorer) {
      if (explorer === undefined)
        throw new Error(`entity '${name}' not found`)
      explorer.createInstance(platform,
        Object.keys(arguments).slice(1))
    }
    if (typeof targetOrEntityName === 'string')
      create(this.entities.get(targetOrEntityNAme))
    else
      create(this.targetToEntity.get(targetOrEntityName))
  }


  getComponent(name: string) {
    const component = this.components.get(name)
    if (component === undefined)
      throw new Error(`component '${name}' not found`)
    return component
  }

  getEntity(name: string) {
    const entity = this.entities.get(name)
    if (entity === undefined)
      throw new Error(`entity not found`)
    return entity
  }

  getService(name: string) {
    const service = this.services.get(name)
    if (service === undefined)
      throw new Error(`service '${name}' not found`)
    return service
  }

  getServiceInstance(name: string, component) {
    return this.getService(name).forComponent(component)
  }

  hasService(name: string) {
    return this.services.has(name)
  }

  /**
   * Fetches only those components that have been manually enabled,
   * i.e. the user typed the name in a terminal or clicked on it in
   * a web interface.
   */
  // FIXME: I must exclude indirect dependencies
  getManuallyEnabledComponents() {
    const enabled = []
    for (const pair of this.components) {
      const component = pair.value
      if (component.enabled)
        enabled.push(component.name)
    }
    return enabled
  }

  saveEnabledComponents() {
    if (this.saveEnabled === true) {
      fs.writeFile(this.componentsDir+'/enabled.json', this.getManuallyEnabledComponents())
    }
  }

  constructor(options) {

    super()

    if (!options || typeof options !== 'object')
      throw new Error(`options must be an object`)
    if (!options.componentsDir || !path.isAbsolute(options.componentsDir))
      throw new Error(`must specify an absolute components directory`)

    this.name = options.name
    this.componentsDir = options.componentsDir
    this.required = options.required
    this.saveEnabled = options.saveEnabled === undefined ? false : options.saveEnabled

    this.vm = new NodeVM({
      context: {
        platform: this
      }
    })
    this.vm.on('error', e => {
      console.log(e.stack)
      this.emit('error', e)
    })
  
    this.debug = createDebug(options.name)

    this.importComponentsSync(options.componentsDir)

    _.forEach(readJSON(this.componentsDir+'/enabled.json', []), name => {
      this.getComponent(name).enable()
    })
  }

  importComponentsSync(dir: string) {
    fs.readdirSync(dir).forEach(file => {
      if (fs.statSync(dir+'/'+file).isDirectory())
        this.addComponent(dir+'/'+file)
    })
    this.required.forEach(name => this.getComponent(name).enable())
  }

  isRequired(name: string) {
    return _.includes(this.required, name)
  }

  addComponent(dir: string) {

    const name = path.basename(dir)
    
    if (this.components.has(name))
      throw new Error(`component name '${name}' already taken`)

    const isRequired = this.isRequired(name)
        , deps = readJSON(dir+'/dependencies.json', [])
        , component = new Component(this, name, dir, deps, isRequired)

    this.components.set(name, component)
    this.debug(`Component '${name}' added`)

    this.emit('add component', component)
  }

  async removeComponent(name: string) {
    const component = this.getComponent(name)
    await component.disable()
    this.components.removeKey(name)
    this.emit('remove component', component)
  }

}

