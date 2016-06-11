
export interface INamedSet<T> {
  has(name: string)
  get(name: string)
  add(name: string, value: T)
  remove(name: string)
  clear()
}

