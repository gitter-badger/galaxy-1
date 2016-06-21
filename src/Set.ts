
import { ISet } from "../interfaces/ISet"

export class Set<T> implements ISet<T> {
  elements: { [element: T]: boolean }
  add(el: T) {
    this.elements[el] = true
  }
  remove(el: T) {
    delete this.elements[el]
  }
  has(el: T) {
    return !!this.elements[el]
  }
}

