
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />
/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />

import { inject } from "inversify"

import { INamedSet } from "../interfaces/INamedSet"
import { INature } from "../interfaces/INature"
import { IConsole } from "../interfaces/IConsole"

export interface RuntimeOptions {
  sourcesDir: string
}

export class Runtime {

  sourcesDir: string

  @inject("INature")
  natures: INature[]

  @inject("IConsole")
  consoles: IConsole[]

  constructor() {
    this.sourcesDir = options.sourcesDir
  }

}

