
/// <reference path="../typings/index.ts" />

import { NamedSet } from "./NamedSet"

class File {
  source: any
  path: string | Buffer
}

export type FileSet = NamedSet<File>

