
import * as _ from "lodash"
import * as fs from "fs-promise"
import * as System from "systemjs"
import * as path from "path"
import { IModuleLoader } from "../interfaces/IModuleLoader"

// TODO: remove if deemed unnecessary
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

export class AppModuleLoader implements IModuleLoader {

  rootDir: string
  extensions: string[] = ['.js']

  constructor(rootDir: string) {
    if (!path.isAbsolute(rootDir))
      throw new Error(`path to modules folder must be absolute`)
    this.rootDir = rootDir
  }

  private async getFiles(name: string) {
    const fullPath = path.resolve(this.rootDir, name)
        , fileName = path.basename(name)
        , existingExts = []
    console.log(fullPath)
    await Promise.all(this.extensions.map(async (ext) => {
      console.log(fullPath+ext)
      if (await fs.exists(fullPath+ext))
        existingExts.push(ext)
    }))
    console.log(existingExts)
    return this.extensions
      .filter(ext => _.includes(existingExts, ext))
      .map(ext => fullPath+ext)
  }

  async import(name: string) {
    const candidateFiles = await this.getFiles(name)
    if (candidateFiles.length === 0)
      throw new Error(`module ${name} not found`)
    return System.import(candidateFiles[0])
  }

  async has(name: string) {
    return System.has(path.resolve(this.rootDir, name))
  }
}

