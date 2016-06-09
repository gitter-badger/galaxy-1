
import * as path from "path"
import ScriptRegistry from "./ScriptRegistry"

export let mainScriptRegistry = ScriptRegistry.fromJSON(path.join(__dirname, '../scripts.json'))

