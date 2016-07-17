
/// <reference path="interfaces.d.ts" />
/// <reference path="typings/index.d.ts" />

import * as fs from "fs"
import { EventEmitter } from "events"

export class Component extends EventEmitter {

  runtime: Galactic.Runtime
  name: string
  dir: string
  enabledDate: Date
  loaded: boolean = false
  manuallyEnabled: boolean
  enabled: boolean = false
  locked = false
  dependencies: string[]
  exports: any
  required: boolean

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
  }

  run(file: string) {
      return this.runtime.runInContext(`
  'use strict';
var _localized = platform.localize('${this.name}');
(function (module, require, platform, service, entity, discover, component, autoload, local, extern) {
var exports = module.exports;\n
${fs.readFileSync(file).toString()}
})(_localized.module, _localized.require, _localized.runtime, _localized.service, _localized.entity, _localized.discover, _localized.component, _localized.autoload, _localized.local, _localized.export)`, { filename: file })
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

