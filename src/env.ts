import { SExpr } from "./sexpr"

export class Env {
  private map: Map<string, SExpr>
  private parent: Env | null

  constructor(parent: Env | null) {
    this.map = new Map<string, SExpr>()
    this.parent = parent
  }

  define = (name: string, value: SExpr): void => {
    this.map.set(name, value)
  }

  lookup = (name: string): SExpr | undefined => {
    const value = this.map.get(name)
    if (value !== undefined) {
      return value
    }

    return this.parent !== null ? this.parent.lookup(name) : undefined
  }
}
