
/// <reference path="../typings/index.d.ts" />

import * as path from "path"
import * as fs from "fs-promise"
import * as _ from "lodash"

import { IModuleLoader } from "../interfaces/IModuleLoader"

class NPMDependencyLoader implements IModuleLoader {

  modulesDir: string
  extensions: string[]
  loadedDependencies: { [name: string] : NPMPackageModuleLoader }

  constructor(modulesDir: string) { 
    this.modulesDir = modulesDir
    this.extensions = ['.js']
  }

  private async getEntryPoint(name: string): Promise<string> {
    const packageDir = path.join(this.modulesDir, name)
    const packageJSON = JSON.parse((await fs.readdir(path.join(packageDir, 'package.json'))).toString())
    return packageJSON.main || 'index' 
  }

  private async import(name: string): Promise<string> {
    if (this.loadedDependencies[name])
      return this.loadedDependencies[name]
    const packages = await fs.readdir(this.modulesDir)
    if (!_.find(packages, name))
      throw new Error(`module ${name} not found`)
    const packageDir = path.join(this.modulesDir, name)
    const loader = new DelegatingModuleLoader()
    loader.addLoader(this)
    loader.addLoader(new ModuleInterpreter(modulePath))
    this.loadedDependencies[name] = loader
    return loader
  }
  
  import (name: string) {
  }

}

class NPMModuleLoader implements IModuleLoader {

}
