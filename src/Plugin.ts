
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />

import * as path from "path"

import { IKernel } from "inversify"
import { promisify } from "bluebird"
import * as fs from "fs-promise"
import * as System from "systemjs"
import * as glob from "glob"
import * as _ from "lodash"

import { IModuleLoader } from "../interfaces/IModuleLoader"
import { NPMModuleLoader } from "./NPMModuleLoader"
import { DelegatingModuleLoader } from "./DelegatingModuleLoader"

const globAsync = promisify(glob)

export class Plugin {

  loader: IModuleLoader
  npmLoader: NPMModuleLoader
  dir: string

  constructor(dir: string, parentLoader: IModuleLoader) {

    this.dir = dir

    const loader = this.loader = new DelegatingModuleLoader()
    loader.addLoader(parentLoader)
    this.npmLoader = new NPMModuleLoader(this.dir)
    this.localLoader = new SystemJSLoader(this.dir)
    loader.addLoader(this.npmLoader)
  }

  async loadProviders(kernel: IKernel) { 
    const files = await globAsync(path.join(this.dir, 'entities/**/*.js'))
        , plugin = this
    return Promise.all(files.map(async (file) => {
      const mod = await plugin.loader.import(file)
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

