
/// <reference path="../typings/index.d.ts" />

import * as stream from "stream"

import { INamedSet } from "../interfaces/INamedSet.ts"

export class NamedSet<T> implements INamedSet<T> {
  elements: { [name: string]: T }
  has(name: string) {
    return !!this.elements[name]
  }
  get(name: string) {
    const res = this.elements[name]
    if (!res)
      throw new Error(`${name} not found`)
    return res
  }
  add(name: string, value: T) {
    if (this.has(name))
      throw new Error(`${name} already exists`)
    this.elements[name] = value
  }
  remove(name: string) {
    if (!this.elements[name])
      throw new Error(`${name} does not exist`)
    delete this.elements[name]
  }
  clear() {
    this.elements = {}
  }
  filter(predicate: (string) => boolean) { 
    const parent = this
    return new class implements INamedSet<T> {
      has(name: string) {
        return predicate(name) && parent.has(name)
      }
      get(name: string) {
        if (!predicate(name))
          throw new Error(`${name} does not exist`)
        return parent.get(name)
      }
      add(name: string) {
        if (!predicate(name))
          throw new Error(`${name} is not satisfied by predicate`)
        parent.add(name)
      }
      remove(name: string) {
        if (!predicate(name))
          throw new Error(`${name} is not satisfied by predicate`)
        parent.remove(name)
      }
      list(): stream.Readable {
      }
      clear(){
        throw new Error(`not yet implemented`)
      }
    }
  }
}

