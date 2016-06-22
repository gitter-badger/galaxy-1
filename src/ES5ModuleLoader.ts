
/// <reference path="../typings/index.d.ts" />

import * as _ from "lodash"
import * as fs from "fs-promise"
import * as path from "path"
import * as vm from "vm"
import { EventEmitter } from "events"
import * as createDebug from "debug"

import { IList } from "../interfaces/IList"
import { ISet } from "../interfaces/ISet"
import { Set } from "./Set"
import { XQueue } from "./XQueue"
import { IModuleLoader } from "../interfaces/IModuleLoader"
import { INamedSet } from "../interfaces/INamedSet"
import { NamedSet } from "./NamedSet"
import { IModuleResolver } from "../interfaces/IModuleResolver"
import { IES5System } from "../interfaces/IES5System"

const debug = createDebug("comet:modules")

function compileTemplate(template: string, context: { [name: string]: string }) {
  _.forEach(context, (value, key) => {
    template = template.replace('\{\{'+key+'\}\}', value)
  })
  return template
}

class ES6Module extends EventEmitter {
  name: string
  dependants: ISet<string>
  internalDependencies: ISet<string>
  // for if there are crazy people out there who export
  // a value with a non-primitive value as an identifier
  exports: { [id: any]: any } 
  setters: INamedSet<Function> = new NamedSet<Function>()
  private execute: Function
  constructor(name) {
    super()
    this.name = name
    debug(`Registering new module ${name}`)
    this.once('ready', () => {
      debug(`Module ${name} ready`)
    })
  }
  setExecutor(execute: Function) {
    this.execute = execute
  }
  export(idOrObj: any, val?: any) {
    if (val === undefined && idOrObj instanceof Object)
      _.assign(this.exports, idOrObj)
    else
      this.exports[idOrObj] = val
  }
  ensuredExecute() {
    if (!this.execute)
      throw new Error(`module not ready`)
  }
}

class IntegratedES5System implements IES5System {

  private context: any
  private externalLoader: IModuleLoader
  private resolver: IModuleResolver
  private modulesCache: INamedSet<ES6Module> = new NamedSet<ES6Module>()
  private registrations: XQueue<ES6Module> = new XQueue<ES6Module>()

  private wrappingTemplate: string = fs.readFileSync(path.join(__dirname, 'wrapper.js')).toString()

  constructor(externalLoader: IModuleLoader, resolver: IModuleResolver) {
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
    const script = compileTemplate(this.wrappingTemplate, {
      source: (await fs.readFile(file)).toString()
    , name: name // name.substring(name.lastIndexOf('/')+1)
    })
    vm.runInContext(script, this.context)
    return new Promise<ES6Module>((accept, reject) => {
      this.registrations.once('push', mod => {
        accept(mod)
      })
    })
  }

  localize(nameFromFile: string) {
    const parent = this
    return new class System {
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
  register(nameOrDeps, depsOrWrapper, wrapper?) {

    const name = wrapper ? nameOrDeps : this.currentFileName
        , deps = wrapper ? depsOrWrapper : nameOrDeps
    wrapper = wrapper || depsOrWrapper

    const mod = new ES6Module(name) 
        , metaModule = wrapper(mod.export)
    mod.setExecutor(metaModule.execute)
    metaModule.setters.forEach((setter, index) => {
      const dep = deps[index]
      if (!dep)
        throw new Error(`invalid module format: setter-dependency mismatch`)
      mod.setters.add(dep, setter)
    })
    this.modulesCache[mod.name] = mod

    // load the dependencies
    const promisedDeps = Promise.all(deps.map(async (dep) => {
      debug(`Module ${name} requests '${dep}' to be present.`)
      if (dep.charAt(0) === '.') {
        mod.internalDependencies.add(dep)
        let depMod
        if (this.modulesCache[dep])
          depMod = this.modulesCache[dep]
        else
          depMod = await this._load(dep) // dep will be added to the cache
        depMod.dependants.add(mod.name)
        return depMod
      } else {
        this.externalLoader.import(dep)
        return false
      }
    }))
    console.log(metaModule)
    promisedDeps.then(deps => {
      mod.ensuredExecute()
      mod.emit('ready')
    })
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

