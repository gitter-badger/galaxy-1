
import { CompilerConstructor } from "./Compiler"
import { NatureConstrcutor } from "./Nature"

export class Plugin {
  getCompilerConstructors(): CompilerConstructor[]
  getNatureConstructors(): NatureConstructor[]
}

export interface PluginProvider {
  getNature(name: string): Nature
  getAllSupportingCompilers()
}

export class FSPluginProvider {
  constructor(dir, watcher) {
    this.dir = dir
    this.watcher = watcher
  }
  static create(dir: string): FSPluginProvider {
    
  }
}

export class NPMPluginProvider { 

  constructor() {

  }

  static open() {
    return new Promise((accept, reject) => {
      JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')).toString())
          .dependencies
          .filter(dependency => {
        return dependency.startsWith('comet-')
      })
    })
  }

}

