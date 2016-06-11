
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />

import * as http from "http"
import { inject, injectable } from "inversify"
import * as express from "express"

import { IRunnable } from "./IRunnable"
import { INature } from "./INature"

class Listener implements IRunnable {

  http: http.Server

  constructor(app, port) {
    this.app = app
    this.port = port
  }

  start() {
    const listener = this
    return new Promise((accept, reject) => {
      listener.http = listener.app.listen(listener.port, () => {
        accept()
      })
      listener.http.on('error', e => {
        if (e.code == 'EADDRINUSE') 
          reject(e.code)
      })
    })
  }

  stop() { 
    this.http.close()
  }
}

@injectable()
export class HTTPNature implements INature {

  port: number

  constructor(@inject("HTTPPort") port: number) {
    this.port = port
  }

  getDefaultEntryPoint(): IRunnable {
    return new Listener(express(), this.port)
  }
}

