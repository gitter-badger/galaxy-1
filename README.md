Galaxy
======

> A runtime for large JavaScript applications

:warning: This platform is still in its incubation phase

:memo: We are searching for people who can help mature this project. If you are interested, [file an issue](https://github.com/GalacticJS/galaxy/issues).

Galaxy enables you to build JavaScript applications which are entirely **pluggable**. We achieve this by introducing the concept of **services**, which can be consumed by components thoughout the application.

## How it works

Galactic applications are seperated into smaller **components**, which can be enabled and disabled individually. Components provide _services_ to the application, as follows:

```ts
@service("logger")
class LoggerService {
  log(msg: string) {
    console.log(`A message: ${msg}`)
  }
}
```

Now, the new service can be used by other services anywhere in your application. For example:

```ts
// interfaces; download this to your component
/// <reference path="logger.d.ts" />

@service("mycomplexservice")
class ComplexService {

  @discover("logger")
  logger: LoggerService

  doFoo() {
    this.logger.log('doing foo ...')
  }

}
```

Want to know more? Read our [full guide](https://github.com/GalacticJS/galaxy/wiki/Creating-a-platform) to learn everything about creating your own platform. 
