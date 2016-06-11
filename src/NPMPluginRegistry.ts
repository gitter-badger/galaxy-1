
@injectable()
export class NPMPluginRegistry implements PluginRegistry { 

  prefix: string

  constructor(prefix: string) {

  }

  static open() {
    return new Promise((accept, reject) => {
      JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')).toString())
          .dependencies
          .filter(dependency => {
        return dependency.startsWith('comet-')
      })
    })
  }

}

