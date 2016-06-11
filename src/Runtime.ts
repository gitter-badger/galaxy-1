
/// <reference path="../typings/index.d.ts" />

import * as path from "path"
import * as fs from "fs"

import { NamedSet } from "./NamedSet"
import { Nature } from "./Nature"
import { PluginProvider } from "./Plugin"

export interface RuntimeOptions {
  sourcesDir: string
  console: Console
}

export class Runtime {

  console: Console
  sourcesDir: string

  constructor(options) {
    this.sourcesDir = options.sourcesDir
    this.console = options.console
    this.pluginLoader = options.pluginLoader
  }

  getNatures() {
    
  }

  start() {
    this.getNatures().map(nature => {
      nature.getDefaultEntryPoint().run(console)
    })
  }
}

