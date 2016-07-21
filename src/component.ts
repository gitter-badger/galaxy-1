
/// <reference path="../interfaces.d.ts" />
/// <reference path="../typings/index.d.ts" />

import * as _ from "lodash"
import * as path from "path"
import * as fs from "fs"
import { EventEmitter } from "events"

import * as annotations from "./annotations"

export class Component extends EventEmitter {

  runtime: Galactic.Runtime
  name: string
  dir: string
  enabledDate: Date
  loaded: boolean = false
  manuallyToggled: boolean
  enabled: boolean = false
  locked = false
  dependencies: string[]
  exports: any
  required: boolean
  annotations: { [name: string]: Function }

  locals: { [name: string]: any }
  cached = new Map<string, Object>()

  constructor(runtime: Galactic.Runtime, name: string, dir: string, deps: string[], required: boolean) {
    super()
    this.required = required
    this.dependencies = deps
    this.runtime = runtime
    this.name = name
    this.dir = dir
    this.locals = _.mapValues(annotations, (createAnnotation) => {
      return createAnnotation(this.runtime, this)
    })
    _.assign(this.locals, {
      component: this
    })
  }

  loadSync() {
    const mainFile = require.resolve(this.dir)
    this.exports = this.run(mainFile)
    this.loaded = true
    this.emit('loaded')
  }

  run(file: string) {
    const exports = {}
    try {
      this.runtime.vm.runClosure(fs.readFileSync(file).toString(), this.locals, {
        filename: file
      , exports: exports
      })
      return { exports: exports }
    } catch(e) { 
      this.runtime.emit('error', e)
    }
  }

  markAsManuallyToggled(manually) {
    this.manuallyToggled = !!manually
  }

  enable() {
    if (this.locked)
      throw new Error(`cannot enable a locked component`)
    if (this.enabled)
      return
    for (const dep of this.dependencies)
      this.runtime.getComponent(dep).enable()
    if (!this.loaded)
      this.loadSync()
    this.enabled = true
    this.enabledDate = new Date()
    this.emit('enable')
  }

  disable() {
    if (this.required)
      throw new Error(`cannot disable core module`)
    if (this.locked)
      throw new Error(`cannot disable a locked component`)
    if (!this.enabled)
      return
    this.enabled = false
    this.emit('disable')
  }

}

