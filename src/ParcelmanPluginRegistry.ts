
import { PluginRegistry } from "./PluginRegistry"

/// <reference path="node_modules/inversify-dts/inversify/inversify.d.ts" />

import { inject, injectable } from "inversify"

import * as parcelman from "parcelman-client"

@injectable()
export class ParcelmanPluginRegistry implements PluginRegistry {

  constructor(@inject("parcelman.PackageRegistry") client: parcelman.PackageRegistry) {

  }
}

