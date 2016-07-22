
import * as _ from "lodash"

interface Node<T> {
  children: Node
  value: T
}

export class SetMap {

  rootNode = null
  
  getNode(elements) {
    if (this.rootNode === null)
      return null
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
    return this.getNode(elements) !== null
  }

  get(set) {
    const elements = _.clone(set).sort()
    const node = this.getNode(elements)
    if (node === null)
      return undefined
    return node.value
  }

  set(set, value) {
    if (this.rootNode === null)
      this.rootNode = { children: {} }
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

}

