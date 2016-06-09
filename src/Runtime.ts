
/// <reference path="../typings/main.d.ts" />

import * as fs from "fs"
import * as path from "path"
import { EventEmitter } from "events"
import * as express from "express"
import * as createDebug from "debug"
import * as http from "http"

import ScriptContainer from "./ScriptContainer"
import { ScriptVersion } from "./ScriptRegistry"
import { mainScriptRegistry } from "./MainScriptRegistry"
import { Compiler } from "./Compiler"
import HandlebarsCompiler from "./HandlebarsCompiler"
import ViewContainer from "./ViewContainer"

const debug = createDebug('comet')

function guardedEmitter(emitter, event) {
  let readyCount = 0,
      listenerCount = 0
  return () => {
    ++listenerCount;
    return () => {
      ++readyCount
      if (readyCount == listenerCount)
        emitter.emit(event)
    }
  }
}

export default class CometPlatform extends EventEmitter { 

  sourcesDir: string
  appScripts: ScriptContainer
  appViews: ViewContainer
  cometViews: ViewContainer
  app: express.Router = express.Router()
  http: http.Server

  constructor(sourcesDir: string, scripts: ScriptContainer) {
    super()
    this.sourcesDir = sourcesDir
    this.appScripts = scripts
    this.appViews = new ViewContainer({
      scripts: scripts,
      partialsDir: path.join(sourcesDir, 'partials'),
      viewsDir: path.join(sourcesDir, 'views')
    })
    this.cometViews = new ViewContainer({
      scripts: ScriptContainer.fromJSON(path.join(__dirname, 'minisite', 'scripts.json')),
      partialsDir: path.join(path.dirname(__dirname), 'minisite', 'partials'),
      viewsDir: path.join(path.dirname(__dirname), 'minisite', 'views')
    })

    let tryEmit = guardedEmitter(this, 'ready')
    this.cometViews.on('ready', tryEmit())
    this.appViews.on('ready', tryEmit())
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

  spawnProcess() {
    let mainFile = path.join(this.sourcesDir, 'main.js')
    if (fs.existsSync(mainFile))
      require('node-dev')(mainFile, [], [])
    else
      try {
        this.runServer()
      } catch (e) {
        throw e;
      }
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

