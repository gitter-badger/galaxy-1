
/// <reference path="../typings/main.d.ts" />

import { Readable } from "stream"
import * as path from "path"
import * as fs from "fs"
import * as url from "url"
import * as request from "request"
import * as crypto from 'crypto'
import * as semver from 'semver'
import * as _ from 'lodash'

export type ScriptVersion = string
export type ScriptVersionRange = string
export type URL = string

export interface Resource {
  integrity: string;
  url: string;
}

export interface ScriptSource {
  versions: [ScriptVersion | ScriptVersionRange],
  mapping: { [fileName: string]: string | {
      name: string,
      integrity?: string
    }
  }
}

function findMatchingVersion(ranges, version, versionsKey = 'versions') { 
  return ranges.filter(obj =>
    _.reduce(ranges, (res, range) => res || semver.satisfies(range[versionsKey], version))
  )
}

function calculateIntegrity(stream: Readable, algo: "sha256" | "sha384" | "sha512"  = 'sha384'): Promise<string> {
  return new Promise((accept, reject) => {
    let hash = crypto.createHash(algo)
    stream
      .on('data', hash.update)
      .on('error', reject)
      .on('end', () => accept(algo+'-'+hash))
  })
}

export default class ScriptRegistry {

  cacheDir: string

  private scripts: [{
    name: string,
    versions: [ScriptVersion],
    parent?: string,
    resources: [{
      versions: [ScriptVersion | ScriptVersionRange]
      resources: [Resource]
    }],
    sources: [{
    }]
  }]

  constructor(scripts, options?) {
    options = options || {}
    if (!options.cacheDir)
      throw new Error('must supply a cache dir')
    this.cacheDir = options.cacheDir
    this.scripts = scripts
  }

  getVersions(scriptName: string): [ScriptVersion] {
    let script = _.find(this.scripts, { name: scriptName })
    if (!script)
      throw new Error(`script ${scriptName} not found`)
    return (script.parent)
      ? this.getVersions(script.parent) // FIXME: we don't check for loops
      : script.versions
  }

  getResources(scriptName: string, scriptVersion: ScriptVersion): [Resource] {
    let script = _.find(this.scripts, { name: scriptName })
    if (!script)
      throw new Error(`script ${scriptName} not found`)
    if (!_.find(this.getVersions(scriptName), version => semver.eq(version, scriptVersion)))
      throw new Error(`script ${scriptName} has no version ${scriptVersion}`)
    let resources = findMatchingVersion(script.resources, scriptVersion)
    if (resources.length == 0)
      throw new Error(`script ${scriptName} has no resources defined for ${scriptVersion}`)
    return resources[0].resources
  }

  getSources(scriptName: string, scriptVersion: ScriptVersion) {
    let script = _.find(this.scripts, { name: scriptName })
    if (!script)
      throw new Error(`script ${scriptName} not found`)
    if (!_.find(script.versions, version => semver.eq(version, scriptVersion)))
      throw new Error(`script ${scriptName} has no version ${scriptVersion}`)
    let sources = findMatchingVersion(script.sources, scriptVersion)
    if (sources.length == 0)
      throw new Error(`script ${scriptName} has no remote sources for ${scriptVersion}`)
    return sources.map(source => {
      return {
        name: source.name,
        mapping: source.mapping.mapValues(file => {
          if (typeof(file) == 'string')
            file = { name: file }
          return {
            url: url.resolve(source.base, file.name),
            integrity: file.integrity
          }
        })
      }
    })
  }

  static fromJSON(file: string) {
    return new ScriptRegistry(require(file))
  }

}

