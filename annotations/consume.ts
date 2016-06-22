
/// <reference path="../typings/index.d.ts" />

import { IApp } from "../interfaces/IApp"
import { IRuntime } from "../interfaces/IRuntime"

export function createConsumeAnnotation(app: IApp) {
  return function consume(service: Symbol) {
    return (target, propertyKey) => {
      if (!app.kernel.isBound(service))
        throw new Error(`requested service not found`)
      let providers = app.kernel.get(service)
      if (!(providers instanceof Array))
        providers = [providers]
      target[name] = providers
      return target 
    }
  }
}

