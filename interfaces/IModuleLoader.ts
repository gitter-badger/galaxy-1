
/// <reference path="../typings/index.d.ts" />

export interface IModuleLoader {
  import(name: string): Promise<any>
  has(name: string): Promise<boolean>
}

