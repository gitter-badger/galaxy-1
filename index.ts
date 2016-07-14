
/// <reference path="typings/index.d.ts" />

import * as vm from "vm"
import * as _ from "lodash"
import * as fs from "fs"
import * as path from "path"
import { EventEmitter } from "events"
import { NamedSet } from "sync-containers"
import * as createDebug from "debug"

function packageStem(name: string) {
  return name.substring(name.indexOf('/')+1)
}

export interface Service {
  component: Component
  name: string
  target: Function
}

export class Component extends EventEmitter {

  name: string
  dir: string
  loaded: boolean
  enabled: boolean = false
  runtime: Runtime

  constructor(runtime: Runtime, name: string, dir: string) {
    super()
    this.runtime = runtime
    this.name = name
    this.dir = dir
  }

  loadSync() {
    const mainFile = require.resolve(this.dir)
    this.exports = this.runtime.runInContext(`
'use strict';
var _localized = ${this.runtime.globalName}.localize('${this.name}');
(function (module, require, ${this.runtime.globalName}, service, consume) {
var exports = module.exports;
${fs.readFileSync(mainFile).toString()}
})(_localized.module, _localized.require, _localized.runtime, _localized.service, _localized.consume)`, { filename: mainFile })
  }

  enable() {
    if (this.enabled)
      return
    if (!this.loaded)
      this.loadSync()
    this.enabled = true
    this.emit('enable')
  }

  disable() {
    if (!this.enabled)
      return
    this.emit('disable')
  }

}

export class Runtime extends EventEmitter {

  components = new NamedSet<Component>()
  context: Object
  globalName: string
  services: Service[] = []

  addService(name: string, target, component) {
    this.services.push({
      target: target
    , instance: new target() // empty constructor assumed
    , name: name
    , component
    })
  }

  runInContext(script, options?) {
    vm.runInContext(script, this.context, options)
  }
  
  getService(name: string) {
    const service = _.find(this.services, { name: name })
    if (service === undefined)
      throw new Error(`service '${name}' not found`)
    return service
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
    const component = this.components.getValue(componentName)
    return {
      service: (name) => {
        return (target) => {
          this.addService(name, target, component)
        }
      }
    , consume: (serviceName) => {
        return (target, propertyKey) => {
          target[propertyKey] = this.getServiceInstance(serviceName, component)
        }
      }
    , require: (moduleName) => {
        try {
          return require(moduleName)
        } catch(e) {
          return require(path.resolve(component.dir, '/node_modules/'+moduleName))
        }
      }
    , module: {
        exports: {}
      }
    }
  }

  constructor(options) {
    super()
    if (!options || typeof options !== 'object')
      throw new Error(`options must be an object`)
    if (!options.componentsDir || !path.isAbsolute(options.componentsDir))
      throw new Error(`must specify an absolute components directory`)
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
    this.importComponentsSync(options.componentsDir)
  }

  getComponent(name: string) {
    if (!this.components.hasKey(name))
      throw new Error(`component '${name}' not found`)
    return this.components.getValue(name)
  }

  importComponentsSync(dir: string) {
    fs.readdirSync(dir).forEach(file => {
      this.addComponent(dir+'/'+file)
    })
  }

  addComponent(dir: string) {
    const name = path.basename(dir)
    const component = new Component(this, name, dir)
    this.components.addPair(name, component)
    this.debug(`Component '${name}' added`)
    this.emit('add component', component)
  }

  async removeComponent(name: string) {
    const component = this.components.getValue(name)
    await component.disable()
    this.components.removeKey(name)
    this.emit('remove component', component)
  }

}

