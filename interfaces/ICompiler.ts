
import { INamedSet } from "./INamedSet"

export interface CompilerError {
  code?: number
  line?: number
  column?: number
  message: string
  file?: string
}

export interface ICompiler {
  compile(paths: INamedSet<string>): any
}

