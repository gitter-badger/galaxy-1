
import { IConsole } from "./IConsole"

export interface IRunnable {
  start(console: IConsole): Promise<void>
  stop(): Promise<void>
}

