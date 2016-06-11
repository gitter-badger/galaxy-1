

export function nature(name: string) {
  return (target, key, descriptor) => {
    target.name = name
  }
}

