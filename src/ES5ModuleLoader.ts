
import * as fs from "fs-promise"

/**
 * Loads modules that were compiled using the ES5 module specification format.
 */
export class ES5ModuleLoader {

  rootDir: string

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }
  
  async has(name: string) {
    return name.startsWith('.') && await fs.exists(path.join(this.rootDir, name+'.js'))
  }

  import(name: string) {
    
  }
}

