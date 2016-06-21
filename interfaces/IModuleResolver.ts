
export interface IModuleResolver {
  resolve(name: string): Promise<string>
}

