
/// <reference path="../typings/main.d.ts" />

import * as fs from "fs"
import * as Handlebars from "handlebars"
import { Compiler } from "./Compiler"

export default class HandlebarsCompiler implements Compiler {

  private hbs

  constructor() {
    this.hbs = Handlebars.create()
  }

  addPartial(name, filePath) {
    this.hbs.registerPartial(name, fs.readFileSync(filePath).toString())
  }
  updatePartial(name, filePath) {
    if (this.hbs.partials[name])
      this.hbs.unregisterPartial(name)
    this.hbs.registerPartial(name, fs.readFileSync(filePath).toString())
  }
  removePartial(name) {
    this.hbs.unregisterPartial(name)
  }

  compile(filePath: string): (context: any) => string {
    return this.hbs.compile(fs.readFileSync(filePath).toString())
  }
}

