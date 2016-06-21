
/// <reference path="../typings/index.d.ts" />

import * as _ from "lodash"
import * as fs from "fs-promise"
import * as path from "path"
import * as vm from "vm"

import { ISet } from  "../interfaces/ISet"
import { IList } from "../interfaces/IList"
import { IModuleLoader } from "../interfaces/IModuleLoader"
import { INamedSet } from "../interfaces/INamedSet"
import { NamedSet } from "./NamedSet"

//class List<T> implements IList<T> {
  //elements: T[]
  //constructor(elements?: T[]) {
    //this.elements = elements || []
  //}
  //append(el: T) {
    //this.elements.push(el)
  //}
  //prepend(el: T) {
    //this.elements.unshift(el)
  //}
  //insert(index: number, el: T) {
    //if (index >= this.elements.length || index < 0)
      //throw new Error(`index out of bounds`)
    //this.elements.splice(index, 0, el)
  //}
  //shift() {
    //if (this.elements.length === 0)
      //throw new Error(`list does not contain any elements`)
    //return this.elements.shift()
  //}
  //pop() {
    //if (this.elements.length === 0)
      //throw new Error(`list does not contain any elements`)
    //return this.elements.pop()
  //}
  
//}

//class Set<T> implements ISet<T> {
  //elements: { [name: T]: boolean } 
  //add(element: T) {
    //if (this.elements[element])
      //throw new Error(`${element} already exists`)
    //this.elements[element] = true
  //}
  //remove(element: T) {
    //if (!this.elements[element])
      //throw new Error(`${element} not found`)
    //delete this.elements[element]
  //}
  //has(element: T) {
    //return !!this.elements[element]
  //}
//}

//class HashedList<T> implements IList<T> {
  //list: IList<T>
  //set: ISet<T> = new Set<T>()
  //constructor(list?: IList<T> | T[]) {
    //list = list || []
    //this.list = (list instanceof Array)
      //? new List<T>(list) : list
  //}
  //has(el: T) {
    //return this.set.has(el)
  //}
  //append(el: T) {
    //if (!this.set.has(el))
      //this.set.add(el)
  //}
  //prepend(el: T) {
    //if (!this.set.has(el))
      //this.set.add(el)
  //}
  //insert(index: number, el: T) {
    //if (!this.set.has(el))
      //this.set.add(el)
  //} 
  //pop() {
    //this.set.remove(el)
  //}
  //shift() {
    //this.set.remove(el)
  //}
//}
class ES6Module {
  name: string
  dependants: INamedSet<ES6Module> = new NamedSet<ES6Module>()
  dependencies: INamedSet<ES6Module>
  constructor(name, dependencies) {
    this.name = name
    this.dependencies = dependencies
  }
}

// purpusefully incomplete
interface ISystem {
  register(name, deps, wrapper)
  register(deps, wrapper) // extension for TypeScript
}

class ES5System implements ISystem {
  loader: IModuleLoader
  modules: INamedSet<ES6Module> = new NamedSet<ES6Module>()
  constructor(moduleName: string, loader: IModuleLoader) { 
    this.loader = loader
  }
  register(name, deps, wrapper?) {
    return new Promise((accept, reject) => {
      deps.forEach(dep => {
        this.loader.import(dep)
      })
      const mod = {}
      wrapper((id, val) => {
        mod[id] = val
      })
    })
  }
}

//const m = require('module');
//const Module = require('module').Module;
//const originalLoader = require('module')._load;

//function createSystem(directory: string) {


  //var seen = Object.create(null);
  //var internalRegistry = Object.create(null);
  //var externalRegistry = Object.create(null);

  //function ensuredExecute (name) {
     //var mod = internalRegistry[name];
     //if (mod && !seen[name]) {
       //seen[name] = true;
       //// one time operation to execute the module body
       //mod.execute();
     //}
     //return mod && mod.proxy;
  //}
  //function set (name, values) {
    //externalRegistry[name] = values;
  //}
  //function get (name) {
    //return externalRegistry[name] || ensuredExecute(name);
  //}
  //function has (name) {
    //return !!externalRegistry[name] || !!internalRegistry[name];
  //}



  //// exporting the System object
  //const System = {
    //set: set,
    //get: get,
    //has: has,
    //import: function(name) {
      //return new Promise(function (resolve, reject) {
        //var mod = patchedRequire(path.resolve(name));
        //return mod ? resolve(mod) : reject(new Error('Could not find module ' + name));
      //});
    //},
    //register: function(name, deps, wrapper) {
      //var mod,
        //externalDeps = [];
      //// creating a new module entry that will be added to the cache later on
      //mod = {
        //name: name,
        //setters: null,
        //proxy: Object.create(null),
        //deps: deps.map(function(dep) {
          //if (dep.charAt(0) !== '.') {
            //externalDeps.push(dep);
            //return dep;
          //}
          //var parts = dep.split('/'),
            //parentBase = name.split('/').slice(0, -1);
          //while (parts[0] === '.' || parts[0] === '..') {
            //if (parts.shift() === '..') {
              //parentBase.pop();
            //}
          //}
          //return parentBase.concat(parts).join('/');
        //}),
        //externalDeps: externalDeps,
        //// other modules that depends on this so we can push updates into those modules
        //dependants: [],
        //// method used to push updates of dependencies into the module body
        //update: function(moduleName, moduleObj) {
          //mod.setters[mod.deps.indexOf(moduleName)](moduleObj);
        //},
        //execute: wrapper
      //};
      //newEntry = mod;
    //}
  //};


  //var newEntry;

  //// monkey patching `require()` during a brief period of time
  //function patchedRequire(name) {
    //m._load = function patchedLoader(request, parent, isMain) {
      //var values, filename, cachedModule, metaModule, esModule;
      //newEntry = undefined;
      //values = originalLoader.apply(this, arguments);
      //if (newEntry) {
        //filename = Module._resolveFilename(request, parent);
        //cachedModule = Module._cache[filename];
        //if (cachedModule && !cachedModule._esModule) {
          //cachedModule._esModule = esModule = newEntry;
          //esModule.address = filename;
          //esModule.basePath = request.slice(0, -esModule.name.length);
          //esModule.parent = parent;
          //// collecting execute() and setters[]
          //metaModule = esModule.execute(function(identifier, value) {
            //values[identifier] = value;
            //esModule.lock = true; // locking down the updates on the module to avoid infinite loop
            //esModule.dependants.forEach(function(dependant) {
              //if (!dependant.lock) {
                //dependant.update(esModule.name, values);
              //}
            //});
            //esModule.lock = false;
            //if (!Object.getOwnPropertyDescriptor(esModule.proxy, identifier)) {
              //Object.defineProperty(esModule.proxy, identifier, {
                //enumerable: true,
                //get: function() {
                  //return values[identifier];
                //}
              //});
            //}
            //return value;
          //});
          //esModule.setters = metaModule.setters;
          //esModule.deps.forEach(function(dep) {
            //var imports = externalRegistry[dep],
              //depRequest, depFilename, depModule;
            //if (!imports) {
              //if (~esModule.externalDeps.indexOf(dep)) {
                //imports = require(Module._resolveFilename(dep, cachedModule));
              //} else {
                //depRequest = path.resolve(path.join(esModule.basePath, dep));
                //imports = require(depRequest);
                //depFilename = Module._resolveFilename(depRequest, cachedModule);
                //depModule = Module._cache[depFilename]._esModule;
                //if (depModule) {
                  //depModule.dependants.push(esModule);
                //}
              //}
            //}
            //esModule.update(dep, imports);
          //});
          //// executing the module body
          //metaModule.execute();
        //}
      //}
      //return values;
    //};
    //var mod = require(name);
    //// removing the patch
    //m._load = originalLoader;
    //return mod;
  //}

  //return System
//}


//class Module {

  //name: string

  //private setters: { [name: string]: Function } = {}
  //private proxy = {}
  //private deps: IList<string>
  //private externalDeps: ISet<string> = new Set<string>()
  //private dependants: ISet<string> = new Set<string>()
  //private executor: Function
  //private seen: boolean

  //constructor(name: string, executor: Function, deps?: string[]) {
    //this.name = name
    //this.executor = executor
    //this.deps =  new HashedList<string>(deps) || []
  //}

  //// other modules that depends on this so we can push updates into those modules
  //// method used to push updates of dependencies into the module body
  //update(moduleName, moduleObj) {
    //this.setters[moduleName](moduleObj);
  //}

  //ensuredExecute() {
    //if (!this.seen) {
      //this.seen = true
      //this.executor()
    //}
    //return this.proxy
  //}

  //addDependency(name: string) {
    //this.deps.add(name)
  //}

  //depends(name: string): boolean {
    //return this.deps.has(name)
  //}

  //removeDependency(name: string) {
    //this.deps.remove(name)
  //}

//}

/**
 * Loads modules that were compiled using the ES5 module specification format.
 */
export class ES5ModuleLoader implements IModuleLoader {

  moduleCache: { [path: string]: Module } = {}
  seen: { [name: string]: boolean } = {}
  externalRegistry: { [name: string]: any } = {}
  internalRegistry: { [name: string]: any } = {}

  rootDir: string
  context: any
  system: any

  private setModule(name, mod) {
    this.externalRegistry[name] = mod
  }

  private getModule(name: string) {
    if (this.externalRegistry[name])
      return this.externalRegistry[name]
    var mod = this.internalRegistry[name];
    if (mod && !this.seen[name]) {
      this.seen[name] = true;
      // one time operation to execute the module body
      mod.execute()
    }
    return mod && mod.proxy;
  }

  private hasModule(name) {
    return !!this.externalRegistry[name] || !!this.internalRegistry[name];
  }

  constructor(rootDir: string, context: any) {
    this.rootDir = rootDir
    this.system = createSystem(rootDir)
    const loader = this
    if (!context)
      context = vm.createContext()
    this.context = vm.createContext({
      System: this.system
    })
  }
  
  async has(name: string) {
    return _(name).startsWith('.')
      && await fs.exists(path.resolve(this.rootDir, name+'.js'))
  }

  async import(name: string) {
    if (!_(name).startsWith('.'))
      throw new Error(`not a path to an ES5 module`)
    const file = path.resolve(this.rootDir, name+'.js')
    if (this.moduleCache[file])
      return this.moduleCache[file]
    const script = await fs.readFile(file)
    const mod = vm.runInContext(script, this.context)
    
  }
}

