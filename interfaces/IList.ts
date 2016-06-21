
export interface IList<T> {
  append(el: T)
  has(el: T)
  insert(index: number, el: T)
  pop()
  prepend(el: T)
  shift()
}

