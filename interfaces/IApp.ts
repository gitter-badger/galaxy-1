
import { INamedSet } from "./INamedSet"
import { IComponent } from "./IComponent"
import { IModuleLoader } from "./IModuleLoader"

export interface IApp {
  loader: IModuleLoader
  components: INamedSet<IComponent>
}

