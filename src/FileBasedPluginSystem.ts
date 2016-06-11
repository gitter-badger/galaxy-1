
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />

import * as fs from "fs"
import * as path from "path"

import { injectable, IKernel, Kernel } from "inversify"
import * as glob from "glob"
import * as _ from "lodash"
import "reflect-metadata"
import { promisify } from "bluebird"

import { Plugin } from "./Plugin"
import { INatureProvider } from "../interfaces/INatureProvider"

const readdirAsync = promisify(fs.readdir)

const globAsync = promisify(glob)

@injectable()
export class FileBasedPluginSystem implements IPluginSystem {

  dir: string
  kernel: IKernel

  constructor(dir: string) {
    this.dir = dir
    this.kernel = new Kernel()
  }

  async loadAll(): Promise<Plugin> {
    const system = this
    const dirs = (await readdirAsync(this.dir))
      .map(file => path.join(system.dir, file))
      .filter(file => fs.statSync(file).isDirectory())
    return dirs.map(dir => new Plugin(dir))
  }

  list(): Promise<string[]> { 
    const plugins = this
    return new Promise((accept, reject) => {
      fs.readdir(plugins.dir, (err, files) => {
        if (err)
          reject(err)
        else
          accept(files.filter(file => fs.statSync(path.join(plugins.dir, file)).isDirectory()))
      })
    })
  }

}

