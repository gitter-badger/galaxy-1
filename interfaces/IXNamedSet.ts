
import { IEventEmitter } from "./IEventEmitter"  
import { INamedSet } from "./INamedSet"

/**
 * Emitted events:
 *
 * <ul>
 *   <li>add</li>
 *   <li>remove</li>
 * </ul>
 */
export interface IXNamedSet<T> extends IEventEmitter, INamedSet<T> {
  // Nothing to see here
}
