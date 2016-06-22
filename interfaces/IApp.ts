
import { INamedSet } from "./INamedSet"
import { IComponent } from "./IComponent"
import { IModuleLoader } from "./IModuleLoader"

export interface IApp extends INamedSet<IComponent> {
  loader: IModuleLoader
}

