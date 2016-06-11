
/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />

export function provides(intf: string, name: string) {
  if (!name)
    throw new Error(`no name given for interface instanciation`)
  return (target) => {
    if (Reflect.hasMetadata("interface", target))
      throw new Error(`${target} already has an interface defined`)
    Reflect.defineMetadata("interface", intf, target)
    Reflect.defineMetadata("name", name, target)
    return target
  }
}

