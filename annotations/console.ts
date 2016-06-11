
export function console(name: string) {
  return (target) => {
    target.name = name
  }
}

