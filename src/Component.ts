
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />
/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />

import * as path from "path"

import { IKernel } from "inversify"
import { promisify } from "bluebird"
import * as fs from "fs-promise"
import * as System from "systemjs"
import * as glob from "glob"
import * as _ from "lodash"

import { IApp } from "../interfaces/IApp"
import { IComponent } from "../interfaces/IComponent"
import { IModuleLoader } from "../interfaces/IModuleLoader"
import { MuxModuleLoader } from "./MuxModuleLoader"
import { NPMPackageLoader } from "./NPMModuleLoader"
import { ES5ModuleLoader } from "./ES5ModuleLoader"
import { InternalLoader } from "./InternalLoader"
import { IRuntime } from "../interfaces/IRuntime"
import { RootDirResolver } from "./RootDirResolver"

const globAsync = promisify(glob)

export class Component implements IComponent {

  name: string
  loader: InternalLoader
  moduleLoader: IModuleLoader
  npmPackageLoader: NPMPackageLoader
  rootDir: string

  constructor(name: string, rootDir: string, runtime: IRuntime, app: IApp) {

    this.name = name
    this.rootDir = rootDir

    this.loader = new InternalLoader([
      ['env', runtime.loader],
      ['app', app.loader],
      ['npm', NPMPackageLoader.forPackage(rootDir)],
    ])
    this.moduleLoader = new ES5ModuleLoader(this.loader, new RootDirResolver(this.rootDir))
    this.loader.setLocalLoader(this.moduleLoader)

    //if (dependencies)
      //loader.addLoader(dependencies)
  }

  async loadProviders(kernel: IKernel) { 
    const files = await globAsync(path.join(this.rootDir, 'entities/**/*.js'))
        , plugin = this
    return Promise.all(files.map(async (file) => {
      const mod = await plugin.loader.importModule(path.relative(plugin.rootDir, file))
      _.forEach(mod, (prop, key) => {
        if (Reflect.hasMetadata("interface", prop)
            && Reflect.hasMetadata("name", prop)) {
          const intf = Reflect.getMetadata("interface", prop)
              , name = Reflect.getMetadata("name", prop)
          kernel
            .bind<any>(intf) // TODO: remove "any" if possible
            .to(prop)
            .whenTargetNamed(name)
        } else
          console.log(`Skipping ${name}: no properties found`)
      })
    }))
  }

}

