
import { INamedSet } from "./INamedSet"

export interface IEventedNamedSet<T> extends INamedSet<T> {
  /**
   * Emitted events:
   *
   * <ul>
   *   <li>add</li>
   *   <li>remove</li>
   * </ul>
   */
  on(event: string, callback: Function)
}
