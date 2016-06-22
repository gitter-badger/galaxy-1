
import { IComponent } from "../interfaces/IComponent"
import { IModuleLoader } from "../interfaces/IModuleLoader"
import { IApp } from "../interfaces/IApp"
import { INamedSet } from "../interfaces/INamedSet"
import { XNamedSet } from "../src/XNamedSet"

class AppLoader implements IModuleLoader {
  components: INamedSet<IComponent>
  constructor(components: INamedSet<IComponent>) {
    this.components = components
  }
  async has(name: string) {
    return this.components.has(name)
  }
  import(name: string) {
    return this.components.get(name).moduleLoader.import('./index')
  }
}

export class App implements IApp {
  loader: IModuleLoader
  components: XNamedSet<IComponent>
  constructor() {
    this.components = new XNamedSet<IComponent>()
    this.loader = new AppLoader(this.components)
  }
}

