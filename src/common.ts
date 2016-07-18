
import * as fs from "fs"

export enum WrapperType {
  Service,
  Entity,
  Provider
}

export function resolveModule(name: string) {
  try {
    return require.resolve(name)
  } catch(e) {
    return null
  }
}

export function readJSON(file, def?) {
  if (fs.existsSync(file))
    return JSON.parse(fs.readFileSync(file).toString())
  if (def === undefined)
    throw new Error(`${file} not found`)
  return def
}

export function writeJSON(file, val) {
  fs.writeFileSync(file, JSON.stringify(val))
}

