Plugins
=======

Plugins extend Comet's core functionality to provide some usefull new
functionality, such as TypeScript compilation, Dependency Injection (DI),
server-side rendering (SSR), and so on. Evidently, plugins can build further
upon other plugins, making complex behavior possible.

## Natures

Comet projects are based on _natures_, which can be best viewed as a set of 
**conventions**. This allows for any abritary plugin to quickly set up
defaults, adhering to the _convention over configuration_ principle.

## Compilers

A compiler does nothing but transform input to output. However, some
compilers can have more complex behavior, such as merging multiple files,
splitting files into smaller chunks, and so on.

