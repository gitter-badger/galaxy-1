
import * as _ from "lodash"

import { IModuleLoader } from "../interfaces/IModuleLoader"

export class DelegatingModuleLoader implements IModuleLoader {
  loaders: IModuleLoader[]
  addLoader(loader: IModuleLoader) {
    this.loaders.push(loader)
  }
  removeLoader(loader: IModuleLoader) {
    const idx = _.findIndex(this.loaders, loader)
    if (idx === -1)
      throw new Error(`loader not found`)
    this.loaders.splice(idx, 1)
  }

  async hasModule(name: string) { 
    return _.reduce(await Promise.all(this.loaders.map(loader => loader.hasModule(name))), (res, has) => res || has)
  }

  async importModule(name: string) {
    const matchedLoaders = []
    await Promise.all(this.loaders.map(
      async (loader) =>  {
        if (await loader.hasModule(name))
          matchedLoaders.push(loader)
      })
     )
    if (matchedLoaders.length == 0)
      throw new Error(`module ${name} not found`)
    else if (matchedLoaders.length > 1)
      throw new Error(`${name} is an ambigious module`)
    return matchedLoaders[0].importModule(name)
  }

}

