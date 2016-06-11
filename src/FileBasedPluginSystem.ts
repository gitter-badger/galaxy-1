
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />

import { injectable } from "inversify"

import * as fs from "fs"
import * as path from "path"

@injectable()
export class FileBasedPluginSystem {

  dir: string

  constructor(dir: string) {
    this.dir = dir
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

export const FileBasedPluginSystemProvider: IProviderCreator = (context) => {

}
