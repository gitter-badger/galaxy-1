
// should be compatible with Node's EventEmitter.
export interface IEventEmitter {
  on(name: string, callback: Function)
  once(name: string, callback: Function)
}

