
/// <reference path="../typings/index.d.ts" />

import * as System from "systemjs"

class Plugin {

  loader: System
  dir: string

  constructor(dir: string) {

    this.dir = dir

    const loader = this.loader = new System.constructor()

    const oldnormalize = loader.normalize
    loader.normalize = (load) => {
      console.log(load)
      return oldnormalize.call(loader, load)
    
    }

    const oldlocate = loader.locate
    loader.locate = (load) => {
      console.log(`Locating ${load.name} ...`)
      return oldlocate.call(loader, load)
    }

  }

  async loadProviders(kernel: IKernel) { 
    const files = await globAsync(path.join(this.dir, 'entities/**/*.js'))
        , plugin = this
    return Promise.all(files.map(async (file) => {
      const mod = await plugin.loader.import(file)
      _.forEach(mod, (prop, key) => {
        if (Reflect.hasMetadata("interface", prop)
            && Reflect.hasMetadata("name", prop)) {
          const intf = Reflect.getMetadata("interface", prop)
              , name = Reflect.getMetadata("name", prop)
          kernel
            .bind<any>(intf) // TODO: remove "any" if possible
            .to(prop)
            .whenTargetNamed(name)
        } else
          console.log(`Skipping ${name}: no properties found`)
      })
    }))
  }
}

