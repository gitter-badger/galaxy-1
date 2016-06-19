
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />

import { IRuntime } from "../interfaces/IRuntime"

export function createProvideAnnotation(runtime: IRuntime) {
  // TODO: add generalized constraints
  return function provide(intf: Symbol, name?: string) {
    return (target) => {
      const binding = runtime.kernel.bind(intf).to(target)
      if (name)
        binding.whenTargetNamed(name)
      return target
    }
  }
}

