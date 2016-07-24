Galaxy API
==========

```ts
import * as galactic from "galactic-runtime"
```

## class Runtime

```ts
class Platform extends galactic.Runtime {
  // overrides here
}
```

### constuctor()

Override the default constructor. Use this to enable components by default, or
connect to certain services at startup.

**Example: defining default enabled modules**

```ts
class Platform extends galactic.Runtime {
  constructor() {
    super({
      required: ["cli","logger","config","core"]
    })
  }
}
```

### onServicesAvailable(services, callback)

Fires callback whenever the requested services become available.

**Example: logging the default HTTP port from configuration**

```ts
platform.onServicesAvaialable(['logger','config'], () => {
  const logger = platform.getService('logger')
      , config = platform.getService('config')
  platform.getService('logger').log(config.get('http.port'))
})
```

### onceServicesAvailable(service, callback)

Fires callback once when the requested services have become avaiable.

### onServicesInstantated(services, callback)

Fires callback whenever the requested services have been instantiated.

See also the
[`@autoload`-annotation](http://github.com/GalacticJS/galaxy/wiki/Annotations)
for more information.

### onceServicesInstantiated(services, callback)

Fires callback once when the requested services have been instantiated.

### hasComponent(name)

Check if the runtime has the specified component. The component does not have
to be loaded yet.

**Example: checking if a component exists before instanciating it**

```ts
if (platform.hasComponent('extras')) {
  platform.getComponent('extras').enable()
}
```

### hasService(name)

Check if the runtime has registered the given service. The service does not
have to be instantiated or loaded yet.

### hasProviders(servcieName)

Check if there are any providers for the given service. The providers do not
have to be loaded for this method to return true.

### getComponent(name)

Return the component with the given name. The component may be in an unloaded or disabled state.

### getService(name)

Return the service for the given name. If the service is not found, an
error is thrown.

**Example: checking wether a service is autoloaded**

```ts
platform.onceServicesAvaialable(['project'], () => {
  const project = platform.getService('project')
  console.log(project.autoload ? 'service is autoloaded' : 'service is NOT autoloaded')
})
```

### getServiceInstance(serviceName, component)

Retrieve the specified service from the system. If service has not been loaded
yet, throws an error. Also throws an error if the dependencies of the service 
have not been met.

**Example: getting core services**

```ts
platform.onceServicesAvailable(['core'], () => {
  const coreServices = platform.getServiceInstance('core')

})
```


### saveEnabledComponents()

The default state saver. Will save the list of enabled components to a global directory.

### loadEnabledComponents()

The default state loaded. Loads the enabled components from a global directory.

