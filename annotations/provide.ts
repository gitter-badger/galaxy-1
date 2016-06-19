
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />

import { IKernel } from "inversify"

export function createProvideAnnotation(kernel: IKernel) {
  // TODO: add generalized constraints
  return function provide(intf: Symbol, name?: string) {
    return (target) => {
      const binding = kernel.bind(intf).to(target)
      if (name)
        binding.whenTargetNamed(name)
      return target
    }
  }
}

