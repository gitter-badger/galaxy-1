
import { IApp } from "../interfaces/IApp"
import { IModuleLoader } from "../interfaces/IModuleLoader"

function tryLoaders(name: string, loaders: Iterator<IModuleLoader>) {
  return new Promise((accept, reject) => {
    function checkLoader() {
      const current = loaders.next()
      if (current.done) {
        reject(new Error(`no module loader found for '${name}'`))
        return
      }
      const loader = current.value
      loader.has(name)
        .then(has => {
          if (has)
            accept(loader)
          else
            checkLoader()
        })
        .catch(e => {
          console.log(e.stack)
          checkLoader()
        })
    }
    checkLoader()
  })
}

export class InternalLoader implements IModuleLoader {

  loaders: Map<string, IModuleLoader>
  localLoader: IModuleLoader

  constructor(loaders, localLoader?) {
    this.loaders = new Map(loaders)
    this.localLoader = localLoader
  }

  setLocalLoader(loader: IModuleLoader) {
    this.localLoader = loader
  }

  async getLoader(name: string) {
    if (name.indexOf(':') !== -1) {
      const chunks = name.split(':')
      if (chunks.length > 2)
        throw new Error(`${name} has an invalid module name syntax`)
      const loader = this.loaders[chunks[0]]
      if (!loader)
        throw new Error(`unknown module source: ${chunks[0]}`)
      return loader
    }
    if (name.charAt(0) === '.')
      return this.localLoader
    return tryLoaders(name, this.loaders.values())
  }

  has(name: string) {
    return this.getLoader(name).then(loader => !!loader)
  }

  import(name: string) {
    return this.getLoader(name).then(loader => loader.import(name))
  }

}
