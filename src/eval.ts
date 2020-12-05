import { Env } from "./env"
import { Err, Ok, Result } from "./result"
import { isBool, isNil, isNum, isSym, SExpr } from "./sexpr"

export type EvalResult = Result<SExpr, string>

export function evalSExpr(sexpr: SExpr, env: Env): EvalResult {
  if (isNil(sexpr) || isBool(sexpr) || isNum(sexpr)) {
    return new Ok(sexpr)
  } else if (isSym(sexpr)) {
    const value = env.lookup(sexpr)
    return value !== undefined
      ? new Ok(value)
      : new Err(`${sexpr} is not defined`)
  } else {
    throw new Error("not implemented")
  }
}
