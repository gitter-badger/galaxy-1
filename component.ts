
/// <reference path="interfaces.d.ts" />
/// <reference path="typings/index.d.ts" />

import * as path from "path"
import * as fs from "fs"
import { EventEmitter } from "events"

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

  cached = new Map<string, Object>()

  constructor(runtime: Runtime, name: string, dir: string, deps: string[], required: boolean) {
    super()
    this.required = required
    this.dependencies = deps
    this.runtime = runtime
    this.name = name
    this.dir = dir
  }

  loadSync() {
    const mainFile = require.resolve(this.dir)
    this.exports = this.run(mainFile)
    this.loaded = true
    this.emit('loaded')
  }

  run(file: string) {
    this.currentModuleExports = {}
    const res = this.runtime.runInContext(`
  'use strict';
var _localized = platform.localize('${file}', '${this.name}');
(function (module, require, platform, service, entity, discover, component, autoload, local, extern, provide) {
var exports = module.exports;\n
${fs.readFileSync(file).toString()}
})(_localized.module, _localized.require, _localized.runtime, _localized.service, _localized.entity, _localized.discover, _localized.component, _localized.autoload, _localized.local, _localized.export, _localized.provide)`, {
      filename: file
    })
    const exports = this.currentModuleExports
    this.currentModuleExports = null
    return {
      result: res
    , exports: exports
    }
  }

  require(file) {
    if (!path.isAbsolute(file))
      throw new Error(`path must be an absolute path`)
    if (this.cached.has(file))
      return this.cached.get(file)
    return this.run(file).exports
  }

  markAsManuallyToggled(manually) {
    this.manuallyToggled = manually
  }

  enable(manually?) {
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

