
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

import {
  createServiceAnnotation
, createAutoloadAnnotation,
, createLocalAnnotation,
, createPublicAnnotation,
, createProvideAnnotation
, createEntityAnnotation
, createDiscoverAnnotation
} from "./annotations"

function packageStem(name: string) {
  return name.substring(name.indexOf('/')+1)
}


export class Runtime extends EventEmitter {

  name: string
  componentsDir: string
  context: Object
  required: string[]
  globalName: string
  saveEnabled: boolean
  debug: (msg: string) => any

  components = new Map<string, Component>()
  services = new Map<string, Service>()
  entities = new Map<string, Galactic.ServiceExplorer>()
  targetToEntity = new Map<Function, Galactic.ServiceExplorer>()
  //discoverers = new Map<Function, Map<string | Symbol, {
    //arguments: { [pos: number]: string }
    //method: Function
  //}>>()
  serviceListeners = new Map<string, Map<Service>>()

  triggerServiceDiscovery(service) {
    if (this.serviceListeners.has(service.name)) {
      this.serviceListeners.get(service.name).forEach(listeningService => {
        listeningService.triggerServiceDiscovery(service)
      })
    }
  }

  addServiceListener(serviceName: string, triggerable) {
    if (!this.serviceListeners.has(serviceName))
      this.serviceListeners.set(serviceName, new Set())
    this.serviceListeners.get(serviceName).add(triggerable)
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
      for (const index of Object.keys(params))
        this.addServiceListener(params[index], service)
    })
    this.services.set(name, service)
    this.triggerServiceDiscovery(service)

    return service
  }

  // FIXME: implement me correctly
  addProvider(serviceName, target, component) {
    if (!this.providers.hasKey(serviceName))
      this.providers.addPair(serviceName, new Set())
    const providers = this.providers.getValue(serviceName)
    const provider = new Provider(serviceName, target, component)
    providers.add(provider)
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
    console.log('here')
    this.getService(name).forComponent(component)
  }

  hasService(name: string) {
    return this.services.has(name)
  }

  runInContext(script, options?) {
    vm.runInContext(script, this.context, options)
  }

  localize(componentName) {

    const component = this.getComponent(componentName)

    const resolve = (moduleName) => {
      if (typeof moduleName !== 'string')
        throw new Error(`module path must be a string; received ${moduleName}`)
      try {
        return require.resolve(moduleName)
      } catch(e) {
        return path.resolve(component.dir+'/node_modules/'+moduleName)
      }
    }

    const localized = {
      runtime: this
    , component: component
    , autoload: createAutoloadAnnotation(this, component)
    , local: createLocalAnnotation(this, component)
    , public: createPublicAnnotation(this, component)
    , entity: createEntityAnnotation(this, component)
    , service: createServiceAnnotation(this, component)
    , discover: createDiscoverAnnotation(this, component)
    , provide: createProvideAnnotation(this, component)
    , require: (moduleName) => require(resolve(moduleName))
    , module: {
        exports: {}
      }
    }
    localized.require.resolve = resolve
    return localized
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

    this.context = {
      Promise: Promise
    , Symbol: Symbol
    , require: require
    , console: console
    , platform: this
    }

    vm.createContext(this.context)

    this.debug = createDebug(options.name)
    this.runInContext(`require('source-map-support').install()`)

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

