
import * as fs from "fs"

import { ScriptVersion, ScriptRegistry }  from "./ScriptRegistry"
import { mainScriptRegistry } from "./MainScriptRegistry"

export default class ScriptContainer {

  /**
   * The list of scripts installed by the end user.
   */
  scripts: { [name: string]: ScriptVersion }

  constructor(scripts) {
    this.scripts = scripts
  }

  toJSON(filePath: string) {
    fs.writeFileSync(filePath, JSON.stringify(this.scripts, null, 2))
  }

  static fromJSON(filePath: string, registry?: ScriptRegistry): ScriptContainer {
    registry = registry || mainScriptRegistry
    let scripts = require(filePath)
    return new ScriptContainer(scripts) 
  }
}

