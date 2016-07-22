
import * as _ from "lodash"

interface Node<T> {
  children: { [name: string]: Node<T> } 
  value?: T
}

export class SetMap<K, V> {

  rootNode: Node<K> = { children: {} }
  
  getNode(elements) {
    let node = this.rootNode
    while (elements.length > 0) {
      if (node.children[elements[0]] === undefined)
        return null
      node = node.children[elements[0]]
      elements.shift()
    }
    return node
  }

  has(set) {
    const elements = _.clone(set).sort()
        , node = this.getNode(elements)
    return node !== null && node.value !== undefined
  }

  get(set) {
    const elements = _.clone(set).sort()
        , node = this.getNode(elements)
    if (node === null)
      return undefined
    return node.value
  }

  set(set, value) {
    const elements = _.clone(set).sort()
    let node = this.rootNode
    while (elements.length > 0) {
      if (node.children[elements[0]] === undefined)
        node.children[elements[0]] = { children: {} }
      node = node.children[elements[0]]
      elements.shift()
    }
    node.value = value
  }

  // TODO: implement removing dangling empty nodes
  delete(set) {
    const elements = _.clone(set).sort()
        , node = this.getNode(elements)
    if (node !== null)
      delete node.value
  }

}

