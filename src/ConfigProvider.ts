
/// <reference path="../typings/index.d.ts" />

import { EventEmitter } from "events"
import * as path from "path"
import * as fs from "fs"
import * as chokidar from "chokidar"
import * as _ from "lodash"

export interface ConfigStorage extends EventEmitter {
  get(name: string): Promise<any>
  set(name: string, value: any): Promise<void>
  push(name: string): Promise<void>
  member(name: string, value: any): Promise<boolean>
  unset(name: string): Promise<void>
}

function readJSON(filePath: string): Promise<any> {
  return new Promise((accept, reject) => {
    fs.readFile(filePath, (err, content) => {
      if (err)
        reject(err)
      else
        accept(JSON.parse(content.toString()))
    })
  })
}

function writeJSON(filePath: string, obj: any, spaces) {
  return new Promise((accept, reject) => {
    fs.writeFile(filePath, JSON.stringify(obj, null, spaces), (err) => {
      if (err)
        reject(err)
      else
        accept()
    })
  })
}

export class JSONConfigStorage extends EventEmitter implements ConfigStorage {

  // TODO: add typings for chokidar watcher 
  watcher: any

  filePath: string
  spaces: number

  /**
   * Cached properties, for fast access.
   */
  properties: { [name: string]: any }

  constructor(filePath: string, spaces?: number) {
    super()
    this.filePath = filePath
    this.spaces = spaces || 2
    this.properties = {}
  }

  private save() {
    return writeJSON(this.filePath, this.properties, this.spacing)
  }

  static load(filePath: string) { 
    const config = new JSONConfigStorage(filePath)
    return new Promise((accept, reject) => {
      const watcher = chokidar
        .watch(filePath)
        .on('add', async (p) => {
          config.properties = await readJSON(p)
          accept(config)
          _.forEach(config.properties, (value, key) => {
            config.emit('add', key, value)
          })
        })
        .on('change', async (p) => {
          const oldProperties = config.properties
              , newProperties = await readJSON(p) 
          config.properties = newProperties
          _.forEach(newProperties, (value, key) => {
            if (!oldProperties[key])
              config.emit('add', key, value)
            else if (oldProperties[key] != newProperties[key])
              config.emit('change', key, oldProperties[key], value)
          })
          _.forEach(oldProperties, (value, key) => {
            if (!newProperties[key])
              config.emit('delete', key, value)
          })
        })
      config.watcher = watcher
    })
  }

  get(name: string) {
    return Promise.resolve(this.properties[name])
  }

  async member(name: string, value: any) {
    const arr = this.properties[name]
    if (!arr)
      return false
    if (!(arr instanceof Array))
      throw new Error(`${name} is not an array`)
    return arr.indexOf(value) != -1
  }
  
  set(name: string, value: any): Promise<void> {
    const oldValue = this.properties[name]
    this.properties[name] = value
    this.emit('change', name, oldValue, value)
    return this.save()
  }

  unset(name: string) {
    const value = this.properties[name]
    delete this.properties[name]
    this.emit('delete', name, value)
    return this.save()
  }

  remove(name: string, value: any) {
    const arr = this.properties[name]
    if (!(arr instanceof Array))
      throw new Error(`${name} is not an array`)
    const idx = arr.indexOf(value)
    arr.splice(idx, 1)
    return this.save()
  }

  push(name: string, value: any) {
    if (!this.properties[name])
      this.properties[name] = []
    console.log(typeof(this.properties[name]))
    if (!(this.properties[name] instanceof Array))
      throw new Error(`config entry ${name} is not an array`)
    this.properties[name].push(value)
    return this.save()
  }

}

