
import { INamedSet } from "./NamedSet"

export interface CompilerError {
  code?: number
  line?: number
  column?: number
  message: string
  file?: string
}

export interface Compiler {
  compile(paths: INamedSet<string>): any
}

export interface CompilerConstructor {
  new(): Compiler
}

