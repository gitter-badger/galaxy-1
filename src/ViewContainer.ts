
/// <reference path="../typings/main.d.ts" />

import * as path from "path"
import * as chokidar from 'chokidar'
import * as createDebug from "debug"

let debug = createDebug('comet')

import { EventEmitter } from "events"
import ScriptContainer from "./ScriptContainer"
import HandlebarsCompiler from "./HandlebarsCompiler"

function pureFileName(filePath: string) {
  return path.basename(filePath, path.extname(filePath))
}

export interface ViewContainerOptions { 
  scripts: ScriptContainer,
  partialsDir: string,
  viewsDir: string
}

export default class ViewContainer extends EventEmitter {

  scripts: ScriptContainer 
  compiledViews: { [name: string]: (context: any) => string } = {}
  viewCompiler: HandlebarsCompiler = new HandlebarsCompiler()

  partialsReady = false
  viewsReady = false

  constructor(options: ViewContainerOptions) {
    super()

    let $this = this
    let viewsDir = options.viewsDir
    let partialsDir = options.partialsDir

    function tryEmitReady() {
      if ($this.partialsReady && $this.viewsReady)
        $this.emit('ready')
    }

    chokidar.watch(viewsDir)
      .on('all', (event, filePath) => {
        let viewPath = path.join(path.dirname(path.relative(viewsDir, filePath)), pureFileName(filePath))
        switch(event) {
        case 'add':
          debug(`adding view '${viewPath}'`)
          $this.compiledViews[viewPath] = this.viewCompiler.compile(filePath)
          break
        case 'change':
          debug(`updating view '${viewPath}'`)
          $this.compiledViews[viewPath] = this.viewCompiler.compile(filePath)
          break
        case 'unlink':
          debug(`removing view '${viewPath}'`)
          delete $this.compiledViews[viewPath]
        }
      })
      .on('ready', () => {
        $this.viewsReady = true
        tryEmitReady()
      })

    chokidar.watch(partialsDir)
      .on('all', (event, filePath) => {
        let partialPath = path.join(path.dirname(path.relative(partialsDir, filePath)), pureFileName(filePath))
        switch(event) {
        case 'add':
          debug(`adding new partial '${partialPath}'`)
          this.viewCompiler.addPartial(partialPath, filePath)
          break
        case 'change':
          debug(`updating partial '${partialPath}'`)
          this.viewCompiler.updatePartial(partialPath, filePath)
          break
        case 'unlink':
          debug(`removing partial '${partialPath}'`)
          this.viewCompiler.removePartial(partialPath)
          break
        }
      })
      .on('ready', () => {
        $this.partialsReady = true
        tryEmitReady()
      })
  }

  /**
   * Render a view using the given context.
   */
  render(viewPath: string, context?: any): string {
    let view = this.compiledViews[viewPath]
    if (view)
      return view(context)
    else
      throw new Error(`view '${viewPath}' not found`)
  }

  /**
   * Check if the container has the given view.
   */
  hasView(viewPath: string): boolean {
    return !!this.compiledViews[viewPath]
  }

}


