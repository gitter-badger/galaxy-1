
import "reflect-metadata"
import { WrapperType } from "./common"
import { ServiceExplorer } from "./explorer"

export const KEY_DISCOVERERS = Symbol.for('exploring properties')
export const KEY_SPECIALS = Symbol.for('wrapper meta-information')

function assertNotSpecial(target) {
  if (Reflect.hasMetadata(KEY_SPECIALS, target)) {
    const special = Reflect.getMetadata(KEY_SPECIALS, target)
    switch (special.type) {
    case WrapperType.Service:
      throw new Error(`target has already a service defined`)
    case WrapperType.Provider:
      throw new Error(`target has already a provider defined`)
    case WrapperType.Entity:
      throw new Error(`target has already a entity provided`)
    default:
      throw new Error(`unknown special defined`)
    }
  }
}

function assertSpecial(target) {
  if (!Reflect.hasMetadata(KEY_SPECIALS, target))
    throw new Error(`target must be marked either as a service, provider, or entity`)
}

export function createServiceAnnotation(platform, component) {
  return (name) => {
    return (target) => {
      assertNotSpecial(target)
      ensureExplorerMapPresent(target)
      const metadata = Reflect.getMetadata(KEY_DISCOVERERS, target)
      const service = platform.addService(name, component, new ServiceExplorer(target, metadata))
      Reflect.defineMetadata(KEY_SPECIALS, {
        type: WrapperType.Service
      , object: service
      }, target)
    }
  }
}

export function createProvideAnnotation(platform, component) {
  return (serviceName) => {
    return (target) => {
      assertNotSpecial(target)
      const provider = platform.addProvider(target, component, serviceName) 
      Reflect.defineMetadata(KEY_SPECIALS, {
        type: WrapperType.Provider
      , object: provider
      }, target)
    }
  }
}

export function createEntityAnnotation(platform, component) {
  function createEntity(target, name?) {
    assertNotSpecial(target)
    ensureExplorerMapPresent(target)
    const metadata = Reflect.getMetadata(KEY_DISCOVERERS, target)
    const entity = platform.addEntity(component, new ServiceExplorer(target, metadata), name)
    Reflect.defineMetadata(KEY_SPECIALS, {
      type: WrapperType.Service
    , object: entity
    }, target)
  }
  return (targetOrEntityName) => {
    if (typeof targetOrEntityName === 'string') {
      return (target) => {
        createEntity(target, targetOrEntityName)
      }
    } else
      createEntity(targetOrEntityName)
  }
}

function ensureExplorerMapPresent(target) {
  if (!Reflect.hasMetadata(KEY_DISCOVERERS, target))
    Reflect.defineMetadata(KEY_DISCOVERERS, {
      keys: new Map()
    , methods: new Map()
    }, target)
}

export function createDiscoverAnnotation(platform, component) {
  return (name) => {
    return (target, key, index) => {
      ensureExplorerMapPresent(target.constructor)
      const metadata = Reflect.getMetadata(KEY_DISCOVERERS, target.constructor)
      if (index === undefined) {
        metadata.keys.set(key, name)
      } else {
        if (!metadata.methods.has(key)) 
          metadata.methods.set(key, {}) 
        const params = metadata.methods.get(key)
        params[index] = name
      }
    }
  }
}

export function createAutoloadAnnotation(platform, component) {
  return (target) => {
    assertSpecial(target)
    const wrapper = Reflect.getMetadata(KEY_SPECIALS, target)
    wrapper.object.setAutoload(true)
  }
}

export function createLocalAnnotation(platform, component) {
  return (target) => {
    console.log('localizing')
    assertSpecial(target)
    const wrapper = Reflect.getMetadata(KEY_SPECIALS, target)
    wrapper.object.setLocal()
  }
}

export function createPublicAnnotation(platform, component) {
  return (target) => {
    console.log('publicizing')
    assertSpecial(target)
    const special = Reflect.getMetadata(KEY_SPECIALS, target)
    special.object.setPublic()
  }
}

