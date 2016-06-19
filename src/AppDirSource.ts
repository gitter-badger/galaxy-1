
import * as fs from "fs-promise"
import * as path from "path"
import * as chokidar from "chokidar"
import { EventEmitter } from "events"

import { IApp } from "../interfaces/IApp"
import { App } from "./App"

export class AppDirSource extends EventEmitter {

  watcher: any

  constructor(set: IAppSet, rootDir: string) {
    super()
    this.watcher = chokidar
      .watch(path.join(rootDir, '*'))
      .on('all', async (event, path) => {
        const name = path.relative(rootDir, path)
        if (await fs.stat(path).isDirectory()) {
          set.add(name, new App(name, path))
        }
      })
  }

  close() {
    this.watcher.close()
  }

}

