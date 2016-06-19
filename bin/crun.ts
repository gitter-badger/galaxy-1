#!/usr/bin/env NODE

/// <reference path="../typings/index.d.ts" />

import * as path from "path"
import { IApp } from "../interfaces/IApp"
import { EventedNamedSet } from "../src/EventedNamedSet"
import { AppDirWatcher } from "../src/AppDirSource"
import { Runtime } from "../src/Runtime"
import { AppDirSet } from "../src/AppDirSet"
import * as minimist from "minimist"

const argv = minimist(process.argv.slice(2))

if (!argv._[0])
  throw new Error(`must specify a directory`)

const apps = new EventedNamedSet<IApp>()
const watcher = AppDirWatcher(apps, path.resolve(argv._[0]))

const runtime = new Runtime({
  apps: apps 
})


