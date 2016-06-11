
import { IRunnable } from "./IRunnable"
import { INamedSet } from "./NamedSet"

export interface INature {
  getEntryPoints(): INamedSet<IRunnable>
  getDefaultEntryPoint(): IRunnable
}

