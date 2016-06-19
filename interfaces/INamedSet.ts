
export interface INamedSet<T> {

  has(name: string)

  get(name: string)

  add(name: string, value: T)

  remove(name: string)

  /**
   * Emitted events:
   *
   * <ul>
   *   <li>add</li>
   *   <li>remove</li>
   * </ul>
   */
  on(event: string, callback: Function)

  clear()
}

