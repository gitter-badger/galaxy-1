
/// <reference path="../typings/index.d.ts" />

import * as _ from "lodash"
import * as fs from "fs-promise"
import * as path from "path"
import * as vm from "vm"
import { EventEmitter } from "events"

import { debug } from "./debug"
import { IList } from "../interfaces/IList"
import { ISet } from "../interfaces/ISet"
import { Set } from "./Set"
import { XQueue } from "./XQueue"
import { IModuleLoader } from "../interfaces/IModuleLoader"
import { INamedSet } from "../interfaces/INamedSet"
import { NamedSet } from "./NamedSet"
import { IModuleResolver } from "../interfaces/IModuleResolver"
import { IES5System } from "../interfaces/IES5System"

function interpretTemplate(template: string, context: { [name: string]: string }) {
  _.forEach(context, (value, key) => {
    template = template.replace('\{\{'+key+'\}\}', value)
  })
  return template
}

class ES6Module extends EventEmitter {

  name: string
  dependants: ISet<string> = new Set<string>()
  internalDependencies: ISet<string> = new Set<string>()
  // for if there are crazy people out there who export
  // a value with a non-primitive value as an identifier
  exports: { [id: any]: any } = {}

  constructor(name) {
    super()
    this.name = name
    debug(`Registering new module ${name}`)
    this.once('ready', () => {
      debug(`Module ${name} ready`)
    })
  }

  define(idOrObj: any, val?: any) {
    if (val === undefined && idOrObj instanceof Object)
      _.assign(this.exports, idOrObj)
    else
      this.exports[idOrObj] = val
  }

}

class IntegratedES5System implements IES5System extends EventEmitter {

  private context: any
  private externalLoader: IModuleLoader
  private resolver: IModuleResolver
  private modules: INamedSet<ES6Module> = new NamedSet<ES6Module>()
  private registrations: XQueue<ES6Module> = new XQueue<ES6Module>()
  private latestMod: ES6Module

  private wrappingTemplate: string = fs.readFileSync(path.join(__dirname, 'wrapper.js')).toString()

  constructor(externalLoader: IModuleLoader, resolver: IModuleResolver) {
    super()
    this.externalLoader = externalLoader
    this.resolver = resolver
    this.context = vm.createContext({
      System: this
    , console: console
    })
  }

  /**
   * Loads the module without executing it.
   */
  async _load(name: string): Promise<ES6Module> {
    const file = await this.resolver.resolve(name)
    if (!(await fs.exists(file)))
      throw new Error(`no file found for ${name}\nFiles tried:\n - ${file}`)
    const script = interpretTemplate(this.wrappingTemplate, {
      source: (await fs.readFile(file)).toString()
    , name: name // name.substring(name.lastIndexOf('/')+1)
    })
    vm.runInContext(script, this.context)
    return this.latestMod
  }

  localize(nameFromFile: string) {
    const parent = this
    return new class System {
      import(name: string) {
        return parent.import(name)
      }
      register(nameOrDeps, depsOrWrapper, wrapper?) {
        const name = wrapper ? nameOrDeps : nameFromFile
            , deps = wrapper ? depsOrWrapper : nameOrDeps
        wrapper = wrapper || depsOrWrapper
        parent.register(name, deps, wrapper)
      }
    }
  }

  import(name: string) {
    return new Promise((accept, reject) => {
      this._load(name)
        .then(mod => {
          mod.on('ready', () => {
            accept(mod.exports)
          })
        })
        .catch(reject)
    })
  }

  register(name, deps, wrapper?) {

    if (this.modules[name])
      throw new Error(`a module under the same name already exists: ${name}`)

    const mod = this.latestMod = new ES6Module(name) 
        , metaModule = wrapper(mod.define.bind(mod))
    this.modules[mod.name] = mod

    // load the dependencies
    const promisedDeps = Promise.all(deps.map(async (dep) => {
      if (dep.charAt(0) === '.') {
        mod.internalDependencies.add(dep)
        let depMod
        if (this.modules[dep])
          depMod = this.modules[dep]
        else
          depMod = await this._load(dep) // dep will be added to the cache
        depMod.dependants.add(mod.name)
        console.log(depMod)
        depMod.on('ready', () => {
          metaModule.setters[deps.indexOf(mod.name)](depMod.exports)
        })
        return depMod
      } else {
        this.externalLoader.import(dep)
        return false
      }
    }))

    promisedDeps
      .then(deps => {
        metaModule.execute()
        mod.emit('ready')
      })
      .catch(e => console.log(e.stack))
  }
}

export class ES5ModuleLoader implements IModuleLoader {
  system: IES5System
  resolver: IModuleResolver
  context: any
  constructor(externalLoader: IModuleLoader, internalResolver: IModuleResolver, context: any) {
    this.resolver = internalResolver 
    this.system = new IntegratedES5System(externalLoader, internalResolver)
    this.context = vm.createContext(_.defaults({
      System: this.system
    }, context))
  }
  import(name: string) {
    return this.system.import(name)
  }
  has(name: string) {
    return !!this.resolver.resolve(name)
  }
}

