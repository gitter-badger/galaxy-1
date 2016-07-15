
/// <reference path="typings/index.d.ts" />

import * as vm from "vm"
import * as _ from "lodash"
import * as fs from "fs"
import * as path from "path"
import { EventEmitter } from "events"
import { NamedSet } from "sync-containers"
import * as createDebug from "debug"

import {
  createServiceAnnotation,
  createProvideAnnotation,
  createDiscoverAnnotation
} from "./annotations"

function packageStem(name: string) {
  return name.substring(name.indexOf('/')+1)
}

function readJSON(file, def?) {
  if (fs.existsSync(file))
    return JSON.parse(fs.readFileSync(file).toString())
  if (def === undefined)
    throw new Error(`${file} not found`)
  return def
}

function resolveModule(name: string) {
  try {
    return require.resolve(name)
  } catch(e) {
    return null
  }
}

export class Service extends EventEmitter {

  component: Component
  name: string
  target: Function
  instance: Object | null = null
  providers: Set<Provider> = new Set<Provider>()

  constructor(name, target, component) {
    super()
    this.name = name
    this.component = component
    this.target = target
    this.instance = new target()
  }

  getInstance(component) {
    return this.instance.provide !== undefined
      ? this.instance.provide(component)
      : this.instance
  }

}

export class Provider {

  component: Component
  serviceName: string
  target: Function
  instance: Object | null = null

  constructor(serviceName, target, component) {
    this.serviceName = serviceName
    this.target = target
    this.component = component
  }

  getInstance(component) {
    if (this.instance === null)
      this.instance = new this.target()
    return this.instance
  }

}

export class Component extends EventEmitter {

  name: string
  dir: string
  enabledDate: Date
  loaded: boolean = false
  enabled: boolean = false
  dependencies: string[]
  runtime: Runtime
  exports: any
  required: boolean

  constructor(runtime: Runtime, name: string, dir: string, deps: string[], required: boolean) {
    super()
    this.required = required
    this.dependencies = deps
    this.runtime = runtime
    this.name = name
    this.dir = dir
  }

  loadSync() {
    const mainFile = require.resolve(this.dir)
    this.exports = this.run(mainFile)
    this.loaded = true
  }

  run(file: string) {
      return this.runtime.runInContext(`
  'use strict';
var _localized = ${this.runtime.globalName}.localize('${this.name}');
(function (module, require, ${this.runtime.globalName}, service, inject, discover) {
var exports = module.exports;
${fs.readFileSync(file).toString()}
})(_localized.module, _localized.require, _localized.runtime, _localized.service, _localized.inject, _localized.discover)`, { filename: file })
  }

  enable() {
    if (this.enabled)
      return
    for (const dep of this.dependencies)
      this.runtime.getComponent(dep).enable()
    if (!this.loaded)
      this.loadSync()
    this.enabled = true
    this.enabledDate = new Date()
    this.emit('enable')
  }

  disable() {
    if (this.required)
      throw new Error(`cannot disable core module`)
    if (!this.enabled)
      return
    this.enabled = false
    this.emit('disable')
  }

}

export class Runtime extends EventEmitter {

  componentsDir: string
  context: Object
  globalName: string
  debug: (msg: string) => any

  components = new NamedSet<Component>()
  services = new NamedSet<Service>()
  targetMap = new Map<Function, Service | Provider>()
  discoverers = new Map<Function, Map<string | Symbol, {
    arguments: { [pos: number]: string }
    method: Function
  }>>()

  findServiceFromPrototype = (proto) => {
    for (const pair of this.services) {
      const service = pair.value
      console.log(service.target.prototype, proto)
      if (service.target.prototype === proto)
        return service
    }
    return null
  }

  triggerServiceDiscovery(component) {
    const getargs = (spec) => {
      const args = {}
      for (const index of Object.keys(spec.arguments)) {
        if (!this.services.hasKey(spec.arguments[index]))
          return null
        args[index] = this.getServiceInstance(spec.arguments[index], component)
      }
      return _.values(args)
    }
    for (const pair of this.discoverers) {
      const service = this.findServiceFromPrototype(pair[0])
          , methods = pair[1]
      if (service === null)
        break
      const instance = service.instance
      console.log(instance)
      for (const pair of methods) {
        const key = pair[0]
            , spec = pair[1]
        if (spec.discovered)
          return
        if (Object.keys(spec.arguments).length !== instance[key].length)
          break
        const args = getargs(spec)
        if (args !== null) {
          instance[key].apply(instance, args)
          spec.discovered = true
        }
      }
    }
  }

  addService(name: string, target, component) {
    const service = new Service(name, target, component)
    this.services.addPair(name, service)
    this.triggerServiceDiscovery(component)


    //for (const pair of this.components) {
      //const component = pair.value
      //this.debug(`Running service discovery for ${component.name}`)
      //const packageJSON = readJSON(component.dir+'/package.json')
      //const discoveryDir = path.resolve(component.dir, packageJSON.discovery || 'lib/discovery')
      //const file = resolveModule(discoveryDir+'/'+name)
      //if (file !== null) {
        //this.debug(`Componnt '${component.name}' discovered '${name}'`)
        //component.run(file)   
      //}
    //}
  }

  addProvider(serviceName, target, component) {
    if (!this.providers.hasKey(serviceName))
      this.providers.addPair(serviceName, new Set())
    const providers = this.providers.getValue(serviceName)
    providers.add(new Provider(serviceName, target, component))
  }

  runInContext(script, options?) {
    vm.runInContext(script, this.context, options)
  }
  
  getService(name: string) {
    if (!this.services.hasKey(name))
      throw new Error(`service '${name}' not found`)
    return this.services.getValue(name)
  }

  getComponent(name: string) {
    if (!this.components.hasKey(name))
      throw new Error(`component '${name}' not found`)
    return this.components.getValue(name)
  }

  getServiceInstance(name, component) {
    if (name === 'component')
      return component
    if (name === 'platform')
      return this
    const service = this.getService(name)
    return service.instance.provide !== undefined
      ? service.instance.provide(component)
      : service.instance
  }

  localize(componentName) {
    const component = this.getComponent(componentName)
    return {
      service: createServiceAnnotation(this, component)
    , discover: createDiscoverAnnotation(this, component)
    , provide: createProvideAnnotation(this, component)
    , require: (moduleName) => {
        try {
          return require(moduleName)
        } catch(e) {
          return require(path.resolve(component.dir, 'node_modules/'+moduleName))
        }
      }
    , module: {
        exports: {}
      }
    }
  }

  saveEnabledComponents() {
    const enabled = []
    for (const pair of this.components) {
      const component = pair.value
      if (component.enabled)
        enabled.push(component.name)
    }
    fs.writeFileSync(this.componentsDir+'/enabled.json', JSON.stringify(enabled))
  }

  constructor(options) {

    super()

    if (!options || typeof options !== 'object')
      throw new Error(`options must be an object`)
    if (!options.componentsDir || !path.isAbsolute(options.componentsDir))
      throw new Error(`must specify an absolute components directory`)

    this.componentsDir = options.componentsDir
    this.globalName = options.globalName || 'runtime'

    this.context = {
      Promise: Promise
    , Symbol: Symbol
    , require: require
    , console: console
    , [this.globalName]: this
    }

    vm.createContext(this.context)

    this.debug = createDebug(options.name)
    this.runInContext(`require('source-map-support').install()`)

    this.importComponentsSync(options.componentsDir, options.required)

    _.forEach(readJSON(this.componentsDir+'/enabled.json', []), name => {
      this.getComponent(name).enable()
    })
  }

  importComponentsSync(dir: string, required) {
    fs.readdirSync(dir).forEach(file => {
      if (fs.statSync(dir+'/'+file).isDirectory())
        this.addComponent(dir+'/'+file, required)
    })
    required.forEach(name => this.getComponent(name).enable())
  }

  addComponent(dir: string, required: string[]) {


    const name = path.basename(dir)
        , isRequired = _.includes(required, name)
        , deps = readJSON(dir+'/dependencies.json', [])
        , component = new Component(this, name, dir, deps, isRequired)

    this.components.addPair(name, component)
    this.debug(`Component '${name}' added`)

    if (!isRequired) {
      component.on('enable', () => {
        this.saveEnabledComponents()
      })
      component.on('disable', () => {
        this.saveEnabledComponents()
      })
    }

    this.emit('add component', component)
  }

  async removeComponent(name: string) {
    const component = this.getComponent(name)
    await component.disable()
    this.components.removeKey(name)
    this.emit('remove component', component)
  }

}

