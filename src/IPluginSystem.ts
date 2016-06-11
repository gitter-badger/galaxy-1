
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />

import { Kernel } from "inversify";

export interface IPluginSystem {
  list(): Promise<string[]>
  getKernel(name: string): Promise<Kernel>
}
