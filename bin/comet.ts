#!/usr/bin/env NODE

/// <reference path="../typings/index.d.ts" />
require('source-map-support').install()

import * as _ from "lodash"
import * as path from "path"
import * as fs from "fs-extra"
import * as readline from "readline"
import * as minimist from "minimist"
import * as chalk from "chalk"
import * as BPromise from "bluebird"

import { Config, JSONConfigStorage } from "../lib/ConfigProvider"
import { Runtime } from "../lib/Runtime"
import { TerminalConsole } from "../lib/TerminalConsole"
import { FSPluginProvider } from "../lib/Plugin"

const terminal = new TerminalConsole()

const argv = minimist(process.argv.splice(2))

const workingDir = argv['working-dir'] ? path.resolve(process.cwd(), argv['working-dir']) : process.cwd()
let cometDir = argv['comet-dir'] ? path.resolve(workingDir, argv['comet-dir']) : require('parent-search')(workingDir, '.comet')
const sourcesDir = argv['sources-dir'] ? path.resolve(workingDir, argv['sources-dir']) : path.dirname(cometDir)

function getLocalConfig(): Promise<Config> {
  return JSONConfigStorage.load(path.join(cometDir, 'environment.json'))
}

function hasComet() {
  return cometDir != null && fs.existsSync(cometDir)
}

function createAndRunProject() {
  let fs = require('fs-extra')
  cometDir = cometDir || path.resolve(workingDir, '.comet')
  fs.mkdirp(cometDir)
  const runtime = new Runtime({
    sourcesDir: sourcesDir
  })
  runtime.start()
}


function runServices() {
  terminal.debug('Loading configuration ...')
  const config = new JSONConfigStorage(path.join(cometDir, 'environment.json'))
  const runtime = new Runtime(sourcesDir, {
    console: terminal
  , nature: 'bin'
  })
  runtime.start()
}

const aliases = {
  "exit": "quit"
, "q": "quit"
, "natures": "nature list"
}

const commands = {
  "quit": () => {
    console.log('Bye.')
    process.exit()
  }
, "config": {
    "get": async (argv) => {
      const config = await getLocalConfig()
      console.log(await config.get(argv._[0]))
    }
  }
, "nature": {
    "list": async () => {
      const config = await getLocalConfig()
      const natures = (await config.get("natures")) || []
      if (natures.length == 0)
        console.log(chalk.red('No natures added yet.'))
      else
        natures.forEach(natureName => {
          console.log(natureName)
        })
    }
  , "add": async (argv) => {
      const config = await getLocalConfig()
      if (argv._.length == 0)
        throw new Error(`no natures given`)
      if (argv._.length > 1)
        throw new Error(`too much argument`)
      const nature = argv._[0]
      if (await config.member("natures", nature))
        console.log(chalk.red(`Nature already exists.`))
      else {
        await config.push('natures', nature)
        console.log(chalk.green(`Nature '${nature}' added.`))
      }
      
    }
  , "remove": async (argv) => {
      const config = await getLocalConfig()
      while (argv._.length > 0) {
        const nature = argv._[0]
        if (!(await config.member('natures', nature)))
          console.log(chalk.red(`Nature '${nature}' not found.`))
        else {
          await config.remove('natures', nature)
          console.log(chalk.green(`Removed nature '${nature}'.`))
        }
        argv._.shift()
      }
    }
  }
, "plugin": {
    "list": async () => {
      const config = new JSONConfigStorage(path.join(cometDir, 'environment.json'))
      const plugins = FSPluginProvider.open(config.get("pluginsDir") || path.join(__dirname, "..", "plugins"))
  , }
    "add": async () => {
      throw new Error('only local packages are supported at this moment')
    }
  , "remove": async () => {
      throw new Error('only local packages are supported at this moment')
    }
  }
}

async function processCommandLine(argv) {
  let spec = commands
  while (argv._[0] && spec && typeof(spec) !== 'function') {
    const command = argv._[0]
    spec = spec[command] 
    argv._.shift()
  }
  if (!spec)
    throw new Error(`command not found`)
  if (typeof(spec) === 'object')
    _.forEach(spec, (cmd, key) => {
      console.log(` - ${key}`)
    })
  else
    return spec(argv)
}

async function processArgs() {
  const commandName = argv._[0]
      , args = argv._.splice(1)
      , rl = readline.createInterface({
        input: process.stdin
      , output: process.stdout
      })
  console.log('Welcome to Comet.')
  function ask() { 
    rl.question("> ", async (line) => {
      try {
        await processCommandLine(minimist(line.split(' ')))
      } catch(e) {
        console.log(chalk.red(`Error: ${e.message}`))
      }
      ask()
    })
  }
  ask()
}

processArgs().catch(e => { console.log(e) })
