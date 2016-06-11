
/// <reference path="../typings/index.d.ts" />

import * as moment from "moment"
import * as chalk from "chalk"

import { CompilerError } from "./Compiler"
import { IConsole } from "./Console"

export class TerminalConsole implements Console {

  private log(msg: string) {
    console.log(`[${chalk.blue(moment().format('YYYY/M/D H:m:s'))}] ${msg}`)
  }

  logCompilerError(err: CompilerError) {
    // TODO: implement me
  }

  logException(err: Error) {
    // TODO: implement me
  }

  debug(msg: string) {
    this.log(msg)
  }

  info(msg: string) {
    this.log(chalk.green(msg))
  }

  warn(msg: string) {
    this.log(chalk.yellow(msg))
  }

  error(msg: string) {
    this.log(chalk.red(msg))
  }

}

