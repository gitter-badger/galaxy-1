
/// <reference path="../typings/index.d.ts" />

export interface IRunnable {
  start(): Promise<void>
  stop(): Promise<void>
}

