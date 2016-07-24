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

### onServicesAvailable(services, callback)

Fires callback whenever the requested services become available.

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

### getServiceInstance(serviceName)

Retrieve the specified service from the system. If service has not been loaded
yet, throws an error. Also throws an error if the dependencies of the service 
have not been met.

### saveEnabledComponents()

The default state saver. Will save the list of enabled components to a global directory.

### loadEnabledComponents()

The default state loaded. Loads the enabled components from a global directory.

