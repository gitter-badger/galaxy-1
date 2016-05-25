
/// <reference path="../typings/main.d.ts" />

import * as express from "express"
import * as path from "path"
import { EventEmitter } from "events"
import * as chokidar from 'chokidar'
import { ScriptVersion } from "./ScriptRegistry"
import maiScriptRegistry from "./MainScriptRegistry"
import { Compiler } from "./Compiler"
import HandlebarsCompiler from "./HandlebarsCompiler"
import * as createDebug from "debug"

let debug = createDebug('comet')

function pureFileName(filePath: string) {
  return path.basename(filePath, path.extname(filePath))
}

export class ScriptContainer {

  installedScripts: { [name: string]: ScriptVersion }

  getTags(scriptName: string) {
    installedScripts[scriptName]
  }

  load(filePath: string, registry?: ScriptRegistry ) {
    registry = registry || mainScriptRegistry)
    let scripts = require(filePath)
  }
}

export class ViewContainer extends EventEmitter {

  scripts: ScriptContainer 

  compiledViews: { [name: string]: (context: any) => string } = {}
  viewCompiler: HandlebarsCompiler = new HandlebarsCompiler()

  partialsReady = false
  viewsReady = false

  constructor(scripts: ScriptsContainer, partialsDir: string, viewsDir: string) {
    super()

    let $this = this

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

  ready() {
    return new Promise((accept, reject) => {
      this.on('ready', accept)
      this.on('error', reject)
    })
  }

  render(viewPath: string, context?: any): string {
    let view = this.compiledViews[viewPath]
    if (view)
      return view(context)
    else
      throw new Error(`view '${viewPath}' not found`)
  }

  hasView(viewPath: string): boolean {
    return !!this.compiledViews[viewPath]
  }
}

class Website {
  scripts: ScriptContainer
  views: ViewContainer

  constructor(scripts, views) {
    this.scripts = scripts;
    this.views = views
  }
}

export default class CometPlatform { 

  appScripts: ScriptContainer
  appViews: ViewContainer
  cometViews: ViewContainer
  app: express.Router = express.Router()
  http: http.Server

  constructor(sourcesDir: string, scripts: ScriptContainer) {
    this.appScripts = scripts
    this.appViews = new ViewContainer(scripts, path.join(sourcesDir, 'partials'), path.join(sourcesDir, 'views'))
    this.cometViews = new ViewContainer(path.join(path.dirname(__dirname), 'minisite', 'partials'), path.join(path.dirname(__dirname), 'minisite', 'views'))
    let viewsReady

  }

  render(viewPath, context): string {
    if (this.appViews.hasView(viewPath))
      return this.appViews.render(viewPath, context)
    else 
      return this.cometViews.render('serverError')
  }

  addRoute(route, methodsOrCallback, callback?) {
    let methods = callback ? methodsOrCallback : "get"
    methods = typeof(methods) == 'string' ? methods.split(' ') : methods
    methods.forEach(method => {
      this.app[method](route, callback)
    })
  }

  runServer() {
    let $this = this
    let ex = express()
    ex.use(this.app)
    ex.get('/', (req, res, next) => {
      res.send($this.cometViews.render('splash'))
    })
    ex.use('/', (req, res, next) => {
      res.send($this.cometViews.render('serverError'))
    })
    this.http = ex.listen(() => {
      debug(`Server running on port ${$this.http.address().port}.`)
    })
  }
}

