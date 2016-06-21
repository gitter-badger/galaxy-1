
/// <reference path="../typings/index.d.ts" />

import * as _ from "lodash"
import * as fs from "fs-promise"
import * as path from "path"
import * as vm from "vm"

import { IList } from "../interfaces/IList"
import { ISet } from "../interfaces/ISet"
import { Set } from "./Set"
import { IModuleLoader } from "../interfaces/IModuleLoader"
import { INamedSet } from "../interfaces/INamedSet"
import { NamedSet } from "./NamedSet"
import { IModuleResolver } from "../interfaces/IModuleResolver"

class ES6Module {
  name: string
  dependants: ISet<string>
  dependencies: ISet<string>
  exports: { [id: any]: any }
  constructor(name) {
    this.name = name
  }
  export(idOrObj: any, val?: any) {
    if (val === undefined && idOrObj instanceof Object)
      _.assign(this.exports, idOrObj)
    else
      this.exports[idOrObj] = val
  }
}

// purpusefully incomplete
interface ISystem {
  register(name, deps, wrapper)
  register(deps, wrapper) // extension for TypeScript
}

class ES5System implements ISystem {

  private context: any
  private externalLoader: IModuleLoader
  private resolver: IModuleResolver
  private modules: INamedSet<ES6Module> = new NamedSet<ES6Module>()

  constructor(moduleName: string, externalLoader: IModuleLoader, resolver: IModuleResolver) { 
    this.externalLoader = externalLoader
    this.resolver = resolver
    this.context = vm.createContext({
      System: this
    })
  }

  async _load(name: string) {
    const file = this.resolver.resolve(name)
    if (!(await fs.exists(file)))
      throw new Error(`no file found for ${name}\nFiles tried:\n - ${file}`)
    vm.runInContext(await fs.readFile(file), this.context)
  }

  register(name, deps, wrapper?) {
    return new Promise((accept, reject) => {
      const mod = new ES6Module(name) 
      Promise.all(deps.map(async (dep) => {
        if (dep.charAt(0) === '.') {
          mod.dependencies.add(dep)
          await this._load(dep) // dep will be added to the cache
        } else
          this.externalLoader.import(dep)
      }))
      wrapper(mod.export)
    })
  }
}

/**
 * Loads modules that were compiled using the ES5 module specification format.
 */
export class ES5ModuleLoader implements IModuleLoader {
  import(name: string) {

  }
  has(name: string) {

  }
}

