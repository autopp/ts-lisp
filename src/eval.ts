import { Env } from "./env"
import { isBool, isNil, isNum, SExpr } from "./sexpr"

class EvalError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export function evalSExpr(sexpr: SExpr, env: Env): SExpr {
  if (isNil(sexpr) || isBool(sexpr) || isNum(sexpr)) {
    return sexpr
  } else {
    throw new Error("not implemented")
  }
}
