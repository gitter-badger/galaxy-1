
import * as fs from "fs-promise"
import * as path from "path"

import { IModuleLoader } from "../interfaces/IModuleLoader"

export class ModuleInterpreter implements IModuleLoader {

  rootDir: string
  extensions = ['','.js', '.coffee', '.ts']

  private async getFilePath(name: string): Promise<string> {
    const files = []
    await Promise.all(this.extensions.map(async (ext) => {
      const file = path.resolve(this.rootDir, name+ext)
      if (await fs.exists(file))
        files.push(file)
    }))
    // FIXME: should return file prioritized on extension order
    return files[0]
  }

  constructor(rootDir: string) {
    this.rootDir = rootDir
    const loader = this
  }

  async importModule(name: string): Promise<any> {
    return require(await this.getFilePath(name))
  }

  hasModule(name: string) { 
    return this.getFilePath(name).then(path => !!path)
  }

}

