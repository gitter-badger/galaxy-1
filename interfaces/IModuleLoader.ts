
/// <reference path="../typings/index.d.ts" />

export interface IModuleLoader {
  importModule(name: string): Promise<any>
  hasModule(name: string): Promise<boolean>
}

