
import { CompilerError } from "./Compiler"

export interface IConsole {
  logCompilerError(err: CompilerError)
  logException(exn: Error)
  debug(msg: string)
  info(msg: string)
  warn(msg: string)
  error(msg: string)
}

