
export interface INamedSet<T> {
  add(name: string, value: T)
  clear()
  get(name: string)
  has(name: string)
  remove(name: string)
}

