
function newCall(Cls, args) {
  //function F() {
    //return cls.apply(this, args);
  //}
  //F.prototype = cls.prototype;
  //return new F()
  return new (Function.prototype.bind.apply(Cls, args));
}

export interface ExplorerMetadata {
  keys: Map<string | Symbol, string>
  constructor: IArguments
  methods: Map<string | Symbol, { [index: string]: string }>
}

export class ServiceExplorer {

  metadata: ExplorerMetadata
  target: Function
  keysCreated: boolean = false

  constructor(target, metadata: ExplorerMetadata) {
    this.metadata = metadata
    this.target = target
  }

  getPluggableServices(): Set<string> {
    const optional = new Set()
    for (const pair of this.metadata.methods) {
      for (const serviceName of pair[1])
        optional.add(serviceName)
    }
    return optional
  }

  tryInstanciate(runtime, component, args) {
    if (!this.serviceDependenciesMet(runtime))
      return null
    return this.createInstance(runtime, component, args)
  }

  // TODO: add constructor support
  getRequiredServices(): Set<string> {
    const required = new Set()
    for (const pair of this.metadata.keys)
      required.add(required, pair[1])
  }

  getMissingServices(runtime): Set<string> {
    const missing = new Set()
    for (const pair of this.metadata.keys)
      if (!runtime.hasService(pair[1]))
        missing.add(pair[1])
    return missing
  }

  // TODO: add constructor support
  isInstanciable(runtime) {
    for (const pair of this.metadata.keys) 
      if (!runtime.hasService(pair[1]))
        return false
    return true
  }

  // TODO: add constructor support
  createInstance(runtime, component, args) {
    if (!this.keysCreated)
      this.metadata.keys.forEach((serviceName, key) => {
        const service = runtime.getServiceInstance(serviceName, component)
        Object.defineProperty(this.target.prototype, key, {
          get: () => {
            return service
          } 
        })
       })
    var instance = newCall(this.target, args)
    return instance
  }

}

