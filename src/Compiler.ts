
/**
 * A compiler converts a given file to another representation
 * that is closer to the system's hardware.
 */
export interface Compiler {
  /**
   * Compile the content residing on the given path.
   */
  compile(path: string): any
}

/**
 * A compiler that delegates its compilation step to several other compilers
 * based on the file information.
 */
export class DelegatingCompiler {
  
}
