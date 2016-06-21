
import * as System from "systemjs"
import * as path from "path"
import { IModuleLoader } from "../interfaces/IModuleLoader"

export class SystemJSLoader extends System.constructor() implements IModuleLoader {
  system: any // FIXME: add typings
  constructor(rootDir: string) {
    super()
    if (!path.isAbsolute(rootDir))
      throw new Error(`path to modules folder must be absolute`)
    this.config({ 
      baseURL: rootDir
    })
  }
}

