
/// <reference path="interfaces.d.ts" />

declare const platform: Galactic.Platform
declare const component: Galactic.Component

type EntityFuncAnn = (name: string) => any

declare const service: (name: string) => any
declare const provider: (name: string) => any
declare const entity: any | EntityFuncAnn
declare const discover: (name: string) => any

