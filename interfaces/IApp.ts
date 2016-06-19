
import { IModuleLoader } from "./IModuleLoader"

export interface IApp {
  name: string
  getModuleLoader(): IModuleLoader
}

