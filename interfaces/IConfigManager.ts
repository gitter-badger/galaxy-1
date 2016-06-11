
/// <reference path="../typings/index.d.ts" />

import { EventEmitter } from "events"

export interface ConfigManager extends EventEmitter {
  subscribe(pattern: string, callback: (path: string, value: any) => void)
  get(name: string): Promise<any>
  set(name: string, value: any): Promise<void>
  push(name: string): Promise<void>
  member(name: string, value: any): Promise<boolean>
  unset(name: string): Promise<void>
}

