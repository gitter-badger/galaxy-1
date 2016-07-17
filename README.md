Galaxy
======

> A runtime for large JavaScript applications

:warning: This platform is still in its incubation phase

:memo: We are searching for people who can help mature this project. If you are interested, [file an issue](https://github.com/GalacticJS/galaxy/issues).

Galaxy enables you to build JavaScript applications which are entirely
**pluggable**. We achieve this by introducing the concept of **services**,
which can be consumed by components thoughout the application.

## Build your own platform

Galaxy provides the tools you need to build your very own pluggable platform. Some of the features:

 - Lazy loading of services
 - DI-ish framework
 - Meta-API included

### Galactic components

Galaxy comes packed with a growing list of usefull components, such as
[a fully-featured logger](http://github.com/GalacticJS/galactic-logger) and
[an advanded CLI tool](http://github.com/GalacticJS/galactic-commands). This makes
creating and extending a new platform extremely fast and easy.

## How it works

Galactic applications are seperated into smaller **components**, which can be
enabled and disabled individually, either programmatically, though a (yet to be
completed) web interface, or via the CLI. Components provide _services_ to the
application, as follows:

```ts
@service("logger")
class LoggerService {
  log(msg: string) {
    console.log(`A message: ${msg}`)
  }

  constructor() {
    console.log('Logger service initialized!')
  }
}
```

From now on, the new service can be used by other services and anywhere in your application. For example:

```ts
// interfaces; download this to your component
/// <reference path="logger.d.ts" />

@service("animal")
class AnimalService {

  @discover("logger")
  logger: LoggerService
  
  eat(food) {
    this.logger.log('Yum yum. I ate a ${food.name}.')
  }

}
```

Want to know more? Read our [full guide](https://github.com/GalacticJS/galaxy/wiki/Services)
which goes through all of the various features of the runtime.
