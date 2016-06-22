
/// <reference path="../typings/index.d.ts" />

import * as path from "path"
import * as fs from "fs-promise"
import * as _ from "lodash"

import { IModuleLoader } from "../interfaces/IModuleLoader"

/**
 * Mocks an NPM package at the specified directory.
 */
export class NPMModuleLoader implements IModuleLoader {

  rootDir: string
  extensions: string[]

  private async getFileFromModule(name: string) {
    const loader = this
        , files = []
    await Promise.all(this.extensions.map(async (ext) => {
      const file = path.resolve(loader.rootDir, name+ext)
      if (await fs.exists(file))
        files.push(file)
    }))
    return files.sort((a, b) => loader.extensions.indexOf(a) - loader.extensions.indexOf(b))
  }

  constructor(rootDir: string) {
    this.rootDir = rootDir
    this.extensions = ['.js']
  }

  has(name: string) {
  
  }

  import(name: string) {
     
  }
}

export class NPMPackageLoader implements IModuleLoader {

  modulesDir: string
  extensions: string[]
  loadedPackages: { [name: string]: NPMModuleLoader }

  constructor(modulesDir: string) { 
    this.modulesDir = modulesDir
  }

  private async getEntryPoint(name: string): Promise<string> {
    const packageDir = path.join(this.modulesDir, name)
    const packageJSON = JSON.parse((await fs.readdir(path.join(packageDir, 'package.json'))).toString())
    return packageJSON.main || 'index' 
  }

  private async getModuleLoader(name: string): Promise<NPMModuleLoader> {
    if (this.loadedPackages[name])
      return this.loadedPackages[name]
    const packages = await fs.readdir(this.modulesDir)
    if (!_.find(packages, name))
      throw new Error(`module ${name} not found`)
    const packageDir = path.join(this.modulesDir, name)
    const loader = new DelegatingModuleLoader()
    loader.addLoader(this)
    loader.addLoader(new NPMModuleLoader(packageDir))
    this.loadedPackages[name] = loader
    return loader
  }
 
  has(name: string) {
    return fs.exists(path.join(this.modulesDir, name))
  }

  async import(name: string) {
    const loader = await this.getModuleLoader(name)
    loader.import(await this.getEntryPoint(name))
  }

  static forPackage(dir: string) {
    return new NPMPackageLoader(path.join(dir, 'node_modules'))
  }

}

