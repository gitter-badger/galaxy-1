
import * as fs from "fs-promise"
import * as path from "path"
import * as System from "systemjs"

import { IModuleLoader } from "../interfaces/IModuleLoader"

// TODO: might be worthwile not to depend on systemjs
export class ModuleInterpreter implements IModuleLoader {

  dir: string
  system: System
  extensions = ['.js', '.coffee', '.ts']

  private async getFilePath(name: string): Promise<string> {
    const files = []
    const p = path.resolve(this.dir, name)
    await Promise.all(this.extensions.map(async (ext) => {
      const file = p+ext
      if (await fs.access(file, fs.R_OK))
        files.push(file)
    }))
    // FIXME: should return file prioritized on extension order
    return files[0]
  }

  constructor() {
    this.system = new System.constructor()
    const loader = this
    this.system.locate = (load) => loader.getFilePath(load.name)
  }

  importModule(name: string): Promise<any> {
    return this.system.import(name)
  }

  hasModule(name: string) { 
    return this.getFilePath(name).then(path => !!path)
  }

}

