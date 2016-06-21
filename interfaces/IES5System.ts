
/// <reference path="../typings/index.d.ts" />

export interface IES5System {
  register(name: string, deps: string[], wrapper)
  register(deps: string[], wrapper)
  import(name: string): Promise<any>
}

